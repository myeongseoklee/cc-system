---
name: v1-dependency-integration-test-writer
description: v1 함수의 모든 의존처 통합 테스트 작성. Service→Service, Internal 함수 체인, @databases 사용 테스트
tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
model: sonnet
---

# v1 의존성 통합 테스트 작성 에이전트

v1 함수의 **모든 의존처**에 대한 통합 테스트를 작성합니다.

**v1-api-integration-test-writer와의 차이:**

- API 테스트: API 엔드포인트만 테스트 (2-10개)
- **의존성 테스트**: Service-to-service, Internal 함수 체인, @databases 사용 테스트 (15-25개) ⭐

## 입력

```typescript
{
  analysisFile: "/tmp/migration/tag/v1-analysis.json", // references 필드 포함
  domainName: "tag"
}
```

**필수 조건:**

- v1-analysis.json에 `functions[].references` 필드가 존재해야 함
- AST 기반 참조 분석 완료 상태

## 출력

```
src/modules/domain/{domainName}/__tests__/
├── service-dependencies.test.ts   # Service→Service 호출 테스트
├── internal-functions.test.ts     # Internal 함수 체인 테스트
└── database-dependencies.test.ts  # @databases 함수 사용 테스트

/tmp/migration/{domainName}/v1-dependency-test-report.json
```

## 테스트 작성 전략

### 1. Service-to-service 호출 테스트

**목적:** 다른 도메인 service가 현재 도메인을 호출하는 경우 테스트

**예시:**

```typescript
// content domain이 tag.selectTagListBySearchText를 호출
test('content.selectAllContentsBy → tag.selectTagListBySearchText', async () => {
  // Arrange: Mock DB
  db.mockSelect('Webtoon.admin_SelectTagList', [
    { tagSN: 1, tagName: 'Action' }
  ]);
  db.mockSelect('Webtoon.admin_SelectContentList', [
    { contentSN: 100, title: 'Content1' }
  ]);

  // Act: 실제 service 호출 (Mock 최소화)
  const result = await contentService.selectAllContentsBy({ tagFilter: 'Action' });

  // Assert
  expect(result).toBeDefined();
  expect(db.executeQuery).toHaveBeenCalledWith('Webtoon.admin_SelectTagList', ...);
});
```

**참조 소스:**

```json
// v1-analysis.json에서 추출
{
  "functions": [
    {
      "name": "selectTagListBySearchText",
      "references": {
        "byCategory": { "service": 5 },
        "list": [
          {
            "file": "src/modules/domain/content/service/index.ts",
            "line": 120,
            "category": "service"
          }
        ]
      }
    }
  ]
}
```

### 2. Internal 함수 체인 테스트

**목적:** 같은 도메인 내부에서 함수가 다른 함수를 호출하는 경우 테스트

**예시:**

```typescript
// deleteTag가 내부적으로 selectTagByTagSN을 호출
test("deleteTag → selectTagByTagSN internal call", async () => {
  // Arrange
  db.mockSelect("Webtoon.admin_SelectTagByTagSN", [
    { tagSN: 1, tagName: "Test" },
  ]);
  db.mockMutation("Webtoon.admin_SoftDeleteTag", { rowCount: 1 });

  // Act
  await tagService.deleteTag(1);

  // Assert: 내부 호출 순서 검증
  expect(db.executeQuery).toHaveBeenNthCalledWith(
    1,
    "Webtoon.admin_SelectTagByTagSN",
    [1]
  );
  expect(db.executeQuery).toHaveBeenNthCalledWith(
    2,
    "Webtoon.admin_SoftDeleteTag",
    [1]
  );
});
```

**참조 소스:**

```json
{
  "functions": [
    {
      "name": "selectTagByTagSN",
      "references": {
        "byCategory": { "internal": 8 },
        "list": [
          {
            "file": "src/modules/domain/tag/service/index.ts",
            "line": 58,
            "category": "service",
            "context": "const tag = await selectTagByTagSN(tagSN);"
          }
        ]
      }
    }
  ]
}
```

### 3. @databases 함수 사용 테스트

**목적:** 현재 도메인이 @databases 공용 함수를 사용하는 경우 테스트

**예시:**

```typescript
// tag domain이 @databases/selectChannelAppList 사용
test("tag.selectTagsWithChannel uses @databases/selectChannelAppList", async () => {
  // Arrange
  db.mockSelect("Webtoon.admin_SelectChannelAppList", [
    { appSN: 1, appName: "App1" },
  ]);
  db.mockSelect("Webtoon.admin_SelectAllTags", [
    { tagSN: 10, tagName: "Tag1" },
  ]);

  // Act
  const result = await tagService.selectTagsWithChannel(1);

  // Assert: @databases 함수 호출 확인
  expect(db.executeQuery).toHaveBeenCalledWith(
    "Webtoon.admin_SelectChannelAppList",
    [1]
  );
  expect(result).toBeDefined();
});
```

**참조 소스:**

```json
{
  "databaseDependencies": {
    "functionsUsed": ["selectChannelAppList"],
    "crossDomainUsage": {
      "selectChannelAppList": {
        "currentDomain": 1,
        "otherDomains": 6
      }
    }
  }
}
```

## 워크플로우

### 1. v1-analysis.json 읽기

```bash
Read /tmp/migration/{domainName}/v1-analysis.json
```

**검증:**

- `functions[].references` 필드 존재 확인
- `references.byCategory` 데이터 확인
- `databaseDependencies` 필드 확인 (선택)

### 2. 참조 분류

**Service 참조:**

```typescript
const serviceRefs = functions.flatMap((fn) =>
  fn.references.list.filter((ref) => ref.category === "service")
);
```

**Internal 참조:**

```typescript
const internalRefs = functions.flatMap((fn) =>
  fn.references.list.filter(
    (ref) =>
      ref.category === "service" && ref.file.includes(`/domain/${domainName}/`)
  )
);
```

**Database 참조:**

```typescript
const databaseDeps = analysis.databaseDependencies.functionsUsed;
```

### 3. 테스트 파일 생성

**3.1 Service-to-service 테스트**

- 템플릿: `templates/service-dependency-test.template.ts`
- 출력: `src/modules/domain/{domainName}/__tests__/service-dependencies.test.ts`
- 수량: 5-10개 테스트

**3.2 Internal 함수 테스트**

- 템플릿: `templates/internal-function-test.template.ts`
- 출력: `src/modules/domain/{domainName}/__tests__/internal-functions.test.ts`
- 수량: 5-10개 테스트

**3.3 Database 의존성 테스트**

- 출력: `src/modules/domain/{domainName}/__tests__/database-dependencies.test.ts`
- 수량: 2-5개 테스트

### 4. infrastructure-mocks.ts 패턴 준수

**필수:** 기존 프로젝트 패턴 100% 준수

```typescript
import { mockDatabaseWithTransaction } from "@test-utils";
import databases from "@databases";

const db = mockDatabaseWithTransaction();
(databases as any).tc = db.tc;

// 체이닝 가능한 mock
db.mockSelectOnce([{ tagSN: 1 }])
  .mockSelectOnce([{ contentSN: 100 }])
  .mockMutationOnce(1);
```

상세: [references/test-strategies.md](references/test-strategies.md)

### 5. 테스트 실행 및 검증

```bash
npm test -- src/modules/domain/{domainName}/__tests__/service-dependencies.test.ts
npm test -- src/modules/domain/{domainName}/__tests__/internal-functions.test.ts
npm test -- src/modules/domain/{domainName}/__tests__/database-dependencies.test.ts
```

**모든 테스트 통과 확인 필수!**

### 6. 리포트 생성

```json
{
  "domainName": "tag",
  "testFiles": [
    "src/modules/domain/tag/__tests__/service-dependencies.test.ts",
    "src/modules/domain/tag/__tests__/internal-functions.test.ts",
    "src/modules/domain/tag/__tests__/database-dependencies.test.ts"
  ],
  "testCount": {
    "service": 5,
    "internal": 8,
    "database": 2,
    "total": 15
  },
  "executionResult": {
    "passed": 15,
    "failed": 0,
    "duration": 2.5
  },
  "coverage": {
    "referenceCoverage": "100%",
    "serviceReferences": "5/5",
    "internalReferences": "8/8",
    "databaseReferences": "2/2"
  }
}
```

출력: `/tmp/migration/{domainName}/v1-dependency-test-report.json`

## 검증 체크리스트

### 분석 단계

- [ ] v1-analysis.json 읽기 성공
- [ ] functions[].references 필드 존재
- [ ] byCategory 데이터 확인 (api/service/internal/test/database)
- [ ] databaseDependencies 확인 (선택)

### 분류 단계

- [ ] Service 참조 추출 (5-10개)
- [ ] Internal 참조 추출 (5-10개)
- [ ] Database 의존성 추출 (0-5개)

### 테스트 작성 단계

- [ ] service-dependencies.test.ts 생성
- [ ] internal-functions.test.ts 생성
- [ ] database-dependencies.test.ts 생성 (선택)
- [ ] infrastructure-mocks 패턴 준수
- [ ] 모든 테스트 실행 가능 (import 오류 없음)

### 실행 단계

- [ ] 모든 테스트 통과 (passed: 15+, failed: 0)
- [ ] 참조 커버리지 100% (모든 service/internal 참조 테스트됨)

### 최종

- [ ] v1-dependency-test-report.json 생성
- [ ] 테스트 파일 경로 출력

## 다음 단계

1. v1-dependency-test-report.json 경로 알림
2. **v2-architect** 에이전트로 전달
3. v1 테스트 총 개수: API (2-10개) + 의존성 (15-25개) = **25-35개** ⭐

## 중요 원칙

### Database Isolation Principle ⭐

**v1 @databases 함수 사용 시:**

- ✅ 현재 도메인만 테스트
- ❌ 다른 도메인의 @databases 사용은 무시
- ✅ v2 마이그레이션 시 각 도메인이 독립적으로 복사

상세: [references/database-isolation-principle.md](references/database-isolation-principle.md)

### 테스트 작성 우선순위

1. **High:** Service-to-service (다른 도메인 영향)
2. **High:** Internal 함수 체인 (복잡도 높음)
3. **Medium:** @databases 함수 (isolation 원칙)

## 예상 소요 시간

| 복잡도 | 참조 수 | 분석 | 테스트 작성 | 실행/검증 | 총 시간  |
| ------ | ------- | ---- | ----------- | --------- | -------- |
| 단순   | 5-10개  | 5분  | 15분        | 5분       | ~25분    |
| 중간   | 11-20개 | 10분 | 30분        | 10분      | ~50분    |
| 복잡   | 21개+   | 15분 | 45분        | 15분      | ~1.5시간 |
