---
name: api-connector
description: API 연결. v2 도메인을 실제 API 라우트에 연결 (replace/new-route/parallel 전략)
tools:
  - Read
  - Write
  - Edit
model: haiku
---

# API 연결 에이전트

v2 도메인을 실제 API 라우트에 연결합니다.

## 입력

```typescript
{
  domainName: "content",
  strategy: "replace"  // replace / new-route / parallel
}
```

## 출력

`/tmp/migration/{domainName}/api-connection-report.json`

## 연결 전략

- **Strategy A (replace)**: v1 API 유지, 내부만 v2로 교체 (권장)
- **Strategy B (new-route)**: v2 전용 API 생성 (`/api/v2/...`)
- **Strategy C (parallel)**: v1/v2 동시 실행 + 결과 비교

상세: [references/connection-strategies.md](references/connection-strategies.md)

## 작업 흐름

### 1. v1 API 라우트 찾기
```bash
Glob "src/pages/api/{domainName}/**/*.ts"
```

### 2. 전략별 연결

**replace 전략:**
```typescript
// v1 import 제거
// import domain from '@modules/domain/{domainName}';

// v2 import 추가
import service from '@modules/domain_v2/{domainName}/service';

// handler 수정
const result = await service.selectList(dto);
```

**new-route 전략:**
새 파일 생성: `src/pages/api/v2/{domainName}/index.ts`

템플릿: [templates/api-route.template.ts](templates/api-route.template.ts)

### 3. 테스트 실행
```bash
npm test -- src/pages/api/{domainName}/__tests__/*.api.test.ts
```

## 검증 체크리스트

- [ ] API 라우트 수정/생성 완료
- [ ] v2 Service import 완료
- [ ] 통합 테스트 통과
- [ ] 리포트 생성 완료

## 다음 단계

리포트 알림 → new-route인 경우 **frontend-api-updater**, 아니면 **v1-code-cleaner**
