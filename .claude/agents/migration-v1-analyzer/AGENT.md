---
name: v1-analyzer
description: v1 레거시 코드 정적 분석. req/res 패턴, 메모리 필터링, Repository 비즈니스 로직 검출, v2 마이그레이션 설계 자료 생성
tools:
  - Read
  - Glob
  - Grep
  - Bash
model: sonnet
---

# v1 레거시 분석 에이전트

v1 레거시 코드를 정적 분석하여 v2 마이그레이션을 위한 구조적 정보를 추출합니다.

## 입력

```typescript
{
  domainName: "tag",           // 분석 대상 도메인
  v1BasePath?: "...",          // 선택 (기본: .../src/modules/domain)
}
```

## 출력

```
/tmp/migration/{domainName}/v1-analysis.json
```

형식: [templates/v1-analysis.json.template](templates/v1-analysis.json.template)

## 핵심 분석 대상

1. **req/res 직접 접근**: API 계층 강결합
2. **메모리 필터링**: DB 전체 조회 후 JS 필터링 (성능)
3. **Repository 비즈니스 로직** ⭐: Repository 내부 검증/중복체크 (v2 금지)
4. **수동 트랜잭션**: try-catch-finally 반복
5. **타입 불안전**: any 타입, 런타임 검증 없음

상세: [references/anti-patterns.md](references/anti-patterns.md)

## 워크플로우

1. **API 엔드포인트 탐색** ⭐
   - Glob: `"src/pages/api/**/*{domainName}*.ts"`
   - Grep: `"{domainName}"` in `path:src/pages/api`
   - API가 없으면 경고 메시지 출력
   - 각 API 파일의 HTTP method 식별 (get/post/put/delete)
   - API 경로와 domain 함수 매핑

2. **파일 탐색**
   - Glob: `"src/modules/domain/{domainName}/**/*.ts"`

3. **함수 추출**
   - service/index.ts의 모든 export 함수

4. **안티패턴 검출**
   - 5가지 패턴 Grep 검색

5. ⭐ **AST 기반 참조 분석** (NEW)
   - **스크립트**: `scripts/find-references.ts` 사용 (에이전트 내장)
   - 각 v1 함수별로 find-references.ts 실행
   - 실행 예시: `npx ts-node scripts/find-references.ts . selectTagListBySearchText tag`
   - 병렬 실행: `parallel -j 4` (성능 최적화, 선택)
   - 결과 파싱 및 v1-analysis.json 통합
   - Category 자동 분류 (api/service/internal/test/database)
   - **출력**: functions[].references 필드 채움

6. ⭐ **@databases 함수 의존성 추적** (NEW)
   - v1 service에서 호출하는 @databases 함수 추출
   - Grep: `"from '@databases/"` in service 파일
   - 각 @databases 함수별로 find-references.ts 실행
   - 전체 도메인에서 사용 중인 횟수 카운트
   - **출력**: databaseDependencies 필드 채움

7. **비즈니스 로직 추출**
   - 검증/변환/필터링/집계로 분류

8. **의존성 분석**
   - SP, 테이블, 다른 도메인

9. **복잡도 평가**
   - LOW/MEDIUM/HIGH/CRITICAL

10. **출력**
    - `/tmp/migration/{domainName}/v1-analysis.json`

상세: [references/workflow-details.md](references/workflow-details.md)

복잡도 기준: [references/complexity-guide.md](references/complexity-guide.md)

## 검증 체크리스트

### Phase 1 (기본 분석 - 항상 실행)
- [ ] **API 엔드포인트 탐색 완료 ⭐** (없으면 경고)
- [ ] API 경로 → domain 함수 매핑 완료
- [ ] 모든 export 함수 분석 완료
- [ ] 안티패턴 5가지 검사 완료
- [ ] **Repository 비즈니스 로직 검출 ⭐**
- [ ] DB 의존성 식별 (SP 목록)
- [ ] 비즈니스 로직 분류 완료
- [ ] 복잡도 평가 완료

### Phase 2 (AST 분석 - scripts/find-references.ts 사용)
- [ ] ⭐ **AST 참조 분석 완료** (scripts/find-references.ts 실행)
- [ ] functions[].references 필드 채워짐
- [ ] callGraph.edges 생성됨
- [ ] ⭐ **@databases 의존성 추적 완료**
- [ ] databaseDependencies.functionsUsed 채워짐
- [ ] databaseDependencies.crossDomainUsage 채워짐

### 최종
- [ ] JSON 파싱 가능
- [ ] 출력 파일 저장 완료 (`/tmp/migration/{domainName}/v1-analysis.json`)

## 다음 단계

1. v1-analysis.json 경로 알림
2. **v1-api-integration-test-writer** 에이전트로 전달
