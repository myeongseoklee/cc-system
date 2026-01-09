---
name: backend-v2-feature
description: domain_v2/ 신규 기능 TDD 개발. 요구사항 → 테스트 → API/Service/UseCase/Repository/DTO/SP 구현.
---

# Backend v2 신규 기능 (TDD)

## 관련 문서
- 아키텍처: `src/modules/domain_v2/CLAUDE.md`
- API: `src/pages/api/CLAUDE.md`
- SP: `scripts/sp/CLAUDE.md`

## 관련 스킬
- `tdd-new-feature`: TDD 방법론
- `jest-unit-test`: 테스트 문법
- `api-integration-test`: API 통합 테스트

## 개발 흐름

```
요구사항 → 테스트 목록 → TDD 사이클 → API Integration → REST Client E2E
                       ↓
           Red → Green → Refactor
```

## Phase 1: 분석 & 설계

### 요구사항
1. 기능 / 도메인
2. DB 작업 (Select/Insert/Update/Delete)
3. 의존성 (다른 도메인)

### 테스트 목록 (필수!)
코드 전에 테스트 먼저
[references/test-list-example.md](references/test-list-example.md)

### 기존 패턴
동일 도메인의 기존 코드 확인

## Phase 2: TDD 구현

**순서**: UseCase 테스트 → UseCase → Repository → SP → Service → DTO → API

### UseCase TDD
[references/usecase-tdd.md](references/usecase-tdd.md)

### Repository
[references/repository-pattern.md](references/repository-pattern.md)

### SP 작성
[references/sp-guide.md](references/sp-guide.md)

### Service (테스트 X)
```typescript
const entityService = {
  getList: async (query) => {
    const usecase = new SelectEntityListUseCase(entityRepository);
    return await usecase.exec(query);
  }
};
```

### DTO
타입 정의만

### API Route
```typescript
export default withApiHandler(async (req, res) => {
  const data = await entityService.getList(req.query);
  res.status(200).json(data);
});
```

## Phase 3: API Integration Test
[references/api-integration-test.md](references/api-integration-test.md)

## Phase 4: REST Client E2E
[references/rest-client.md](references/rest-client.md)

## 체크리스트

### TDD
- [ ] 테스트 목록 먼저
- [ ] UseCase 테스트 → 구현
- [ ] 모든 테스트 통과

### 레이어
- [ ] UseCase (로직)
- [ ] Repository (DB 연결)
- [ ] SP (쿼리)
- [ ] Service (UseCase 호출)
- [ ] DTO (타입)
- [ ] API (라우트)

### 테스트
- [ ] UseCase 단위 테스트
- [ ] API 통합 테스트
- [ ] REST Client E2E

## 상세 가이드

- [UseCase TDD 예제](references/usecase-tdd.md)
- [Repository 패턴](references/repository-pattern.md)
- [SP 작성 가이드](references/sp-guide.md)
- [API 통합 테스트](references/api-integration-test.md)
- [REST Client 작성](references/rest-client.md)
- [테스트 목록 예제](references/test-list-example.md)
