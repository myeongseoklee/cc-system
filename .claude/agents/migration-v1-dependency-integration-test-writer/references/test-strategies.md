# 의존성 테스트 전략 가이드

## 개요

v1 함수의 모든 의존처를 테스트하여 마이그레이션 후 orphaned 참조가 발생하지 않도록 합니다.

## 테스트 카테고리

### 1. Service-to-service 테스트

**정의:** 다른 도메인이 현재 도메인을 호출하는 경우

**예시:**
```typescript
// content domain → tag domain 호출
import contentService from '@modules/domain/content/service';
import tagService from '@modules/domain/tag/service';

describe('content → tag service calls', () => {
  test('selectAllContentsBy → selectTagListBySearchText', async () => {
    // Arrange: Mock DB for both domains
    db.mockSelectOnce([{ tagSN: 1, tagName: 'Action' }])  // tag
      .mockSelectOnce([{ contentSN: 100, title: 'Test' }]); // content

    // Act: Call content service (which internally calls tag service)
    const result = await contentService.selectAllContentsBy({
      tagFilter: 'Action'
    });

    // Assert: Verify both services were called
    expect(db.executeQuery).toHaveBeenNthCalledWith(1,
      'Webtoon.admin_SelectTagList',
      expect.any(Array)
    );
    expect(result).toBeDefined();
  });
});
```

**v1-analysis.json 소스:**
```json
{
  "functions": [{
    "name": "selectTagListBySearchText",
    "references": {
      "byCategory": { "service": 5 },
      "list": [
        {
          "file": "src/modules/domain/content/service/index.ts",
          "line": 120,
          "category": "service",
          "context": "const tags = await tag.service.selectTagListBySearchText(...);"
        }
      ]
    }
  }]
}
```

### 2. Internal 함수 체인 테스트

**정의:** 같은 도메인 내에서 함수가 다른 함수를 호출하는 경우

**예시:**
```typescript
describe('tag internal function chains', () => {
  test('deleteTag calls selectTagByTagSN internally', async () => {
    // Arrange: Mock internal function calls
    db.mockSelectOnce([{ tagSN: 1, tagName: 'Test', useYN: 'Y' }])
      .mockMutationOnce(1);

    // Act
    await tagService.deleteTag(1);

    // Assert: Verify call order
    expect(db.executeQuery).toHaveBeenNthCalledWith(1,
      'Webtoon.admin_SelectTagByTagSN',
      [1]
    );
    expect(db.executeQuery).toHaveBeenNthCalledWith(2,
      'Webtoon.admin_SoftDeleteTag',
      [1]
    );
  });

  test('updateTag validates tag exists first', async () => {
    // Arrange
    db.mockSelectOnce([{ tagSN: 1, tagName: 'Old' }])
      .mockMutationOnce(1);

    // Act
    await tagService.updateTag({ tagSN: 1, tag: 'New' });

    // Assert: Validation happened before update
    expect(db.executeQuery).toHaveBeenCalledTimes(2);
  });
});
```

**v1-analysis.json 소스:**
```json
{
  "callGraph": {
    "edges": [
      {
        "from": "deleteTag",
        "to": "selectTagByTagSN",
        "type": "internal-call"
      },
      {
        "from": "updateTag",
        "to": "selectTagByTagSN",
        "type": "internal-call"
      }
    ]
  }
}
```

### 3. @databases 함수 사용 테스트

**정의:** 현재 도메인이 @databases 공용 함수를 사용하는 경우

**예시:**
```typescript
import { selectChannelAppList } from '@databases/tc/common';

describe('tag → @databases dependencies', () => {
  test('selectTagsWithChannel uses selectChannelAppList', async () => {
    // Arrange: Mock @databases function
    db.mockSelectOnce([{ appSN: 1, appName: 'App1' }])  // @databases
      .mockSelectOnce([{ tagSN: 10, tagName: 'Tag1' }]); // tag

    // Act
    const result = await tagService.selectTagsWithChannel(1);

    // Assert: @databases function called
    expect(db.executeQuery).toHaveBeenCalledWith(
      'Webtoon.admin_SelectChannelAppList',
      [1]
    );
    expect(result.apps).toBeDefined();
    expect(result.tags).toBeDefined();
  });
});
```

**v1-analysis.json 소스:**
```json
{
  "databaseDependencies": {
    "functionsUsed": ["selectChannelAppList"],
    "crossDomainUsage": {
      "selectChannelAppList": {
        "totalReferences": 7,
        "currentDomain": 1,
        "otherDomains": 6
      }
    }
  }
}
```

## Mock 전략

### mockDatabaseWithTransaction 사용

**기본 패턴:**
```typescript
import { mockDatabaseWithTransaction } from '@test-utils';
import databases from '@databases';

describe('Test suite', () => {
  let db: ReturnType<typeof mockDatabaseWithTransaction>;

  beforeEach(() => {
    db = mockDatabaseWithTransaction();
    (databases as any).tc = db.tc;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('test case', async () => {
    // Use db.mockSelectOnce, db.mockMutationOnce, etc.
  });
});
```

### 체이닝 패턴

**여러 DB 호출 순서대로 mock:**
```typescript
db.mockSelectOnce([{ tagSN: 1 }])    // 1st call
  .mockSelectOnce([{ contentSN: 100 }]) // 2nd call
  .mockMutationOnce(1)               // 3rd call
  .mockMutationOnce(1);              // 4th call

await service.complexOperation();

expect(db.executeQuery).toHaveBeenCalledTimes(4);
```

### Transaction Mock

```typescript
test('transaction operations', async () => {
  db.mockSelectOnce([{ status: 'READY' }])
    .mockMutationOnce(1)
    .mockMutationOnce(1);

  await service.operationWithTransaction();

  expect(db.transactionManager.commitTransaction).toHaveBeenCalled();
});
```

## 테스트 작성 가이드라인

### 1. AAA 패턴 준수

```typescript
test('description', async () => {
  // Arrange: Setup mocks
  db.mockSelectOnce([...]);

  // Act: Execute function
  const result = await service.function();

  // Assert: Verify behavior
  expect(result).toBeDefined();
  expect(db.executeQuery).toHaveBeenCalled();
});
```

### 2. 실제 Service 호출

**❌ 나쁜 예:**
```typescript
// Service를 mock하면 의존성 테스트 의미 없음
const mockTagService = { selectTagList: jest.fn() };
```

**✅ 좋은 예:**
```typescript
// 실제 service 호출, DB만 mock
import tagService from '@modules/domain/tag/service';
db.mockSelectOnce([...]);
await tagService.selectTagList(...);
```

### 3. Mock 최소화

**원칙:** Infrastructure(DB, S3, Redis)만 mock

```typescript
// ✅ Infrastructure mock
db.mockSelectOnce([...]);

// ✅ 실제 service 호출
await contentService.selectAll();
await tagService.selectList();

// ❌ Service mock (금지)
jest.mock('@modules/domain/tag/service');
```

### 4. 호출 순서 검증

**Internal 함수 체인:**
```typescript
test('function call order', async () => {
  db.mockSelectOnce([...])
    .mockMutationOnce(1);

  await service.complexOperation();

  // Verify order
  expect(db.executeQuery).toHaveBeenNthCalledWith(1, 'SelectSP', ...);
  expect(db.executeQuery).toHaveBeenNthCalledWith(2, 'UpdateSP', ...);
});
```

## 에러 케이스 테스트

### 1. 의존 함수 실패

```typescript
test('handles dependency failure', async () => {
  // Arrange: Tag service fails
  db.mockSelectOnce([]); // Empty result

  // Act & Assert
  await expect(
    contentService.selectByTag(999)
  ).rejects.toThrow('Tag not found');
});
```

### 2. Internal 함수 체인 중단

```typescript
test('rollback on internal failure', async () => {
  db.mockSelectOnce([{ tagSN: 1 }])
    .mockMutationOnce(0); // Mutation fails

  await expect(
    tagService.deleteTag(1)
  ).rejects.toThrow();

  expect(db.transactionManager.rollbackTransaction).toHaveBeenCalled();
});
```

## 커버리지 목표

### Service-to-service
- **목표:** 모든 cross-domain 참조 100% 커버
- **방법:** v1-analysis.json의 `references.byCategory.service` 전체 테스트

### Internal 함수
- **목표:** 주요 함수 체인 80% 커버
- **우선순위:** 복잡한 체인, 트랜잭션 포함 함수

### @databases
- **목표:** 현재 도메인 사용처 100% 커버
- **제외:** 다른 도메인의 @databases 사용 (isolation 원칙)

## 참조 추출 방법

### v1-analysis.json 파싱

```typescript
// Service references
const serviceRefs = analysis.functions.flatMap(fn =>
  fn.references.list.filter(ref =>
    ref.category === 'service' &&
    !ref.file.includes(`/domain/${domainName}/`)
  )
);

// Internal references
const internalRefs = analysis.functions.flatMap(fn =>
  fn.references.list.filter(ref =>
    ref.category === 'service' &&
    ref.file.includes(`/domain/${domainName}/`)
  )
);

// Database dependencies
const databaseDeps = analysis.databaseDependencies?.functionsUsed || [];
```

### 테스트 생성

```typescript
serviceRefs.forEach(ref => {
  // Generate test for each service-to-service call
  const testCase = generateServiceDependencyTest(ref);
  writeTestFile(testCase);
});
```

## 검증 방법

### 1. 모든 테스트 실행

```bash
npm test -- src/modules/domain/{domain}/__tests__/service-dependencies.test.ts
npm test -- src/modules/domain/{domain}/__tests__/internal-functions.test.ts
npm test -- src/modules/domain/{domain}/__tests__/database-dependencies.test.ts
```

### 2. 커버리지 확인

```bash
npm test -- --coverage --collectCoverageFrom="src/modules/domain/{domain}/service/**"
```

**목표:**
- Service-to-service: 100%
- Internal: 80%+
- @databases: 100%

### 3. 참조 완전성

```typescript
// v1-analysis.json 참조 수 = 작성된 테스트 수
const totalRefs = serviceRefs.length + internalRefs.length + databaseDeps.length;
const testCount = /* count tests */;
assert(testCount >= totalRefs * 0.8); // 80% 이상
```

## 다음 단계

이 테스트들은 v1 baseline을 확보합니다:
1. v2 마이그레이션 시 동일한 시나리오로 v2 테스트 작성
2. v1 ↔ v2 기능 동등성 검증
3. 마이그레이션 완료 후 orphaned 참조 0개 보장
