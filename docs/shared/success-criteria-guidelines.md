# 성공 기준 작성 가이드라인

> 측정 가능하고 검증 가능한 성공 기준을 작성하는 방법

---

## 개요

성공 기준은 두 가지 범주로 나뉩니다:

| 범주 | 설명 | 실행 주체 |
|------|------|----------|
| **자동 검증** | 명령어로 실행 가능한 검증 | 에이전트/CI |
| **수동 검증** | 인간의 판단이 필요한 검증 | 개발자/QA |

---

## 자동 검증 (Automated Verification)

에이전트나 CI 시스템이 실행할 수 있는 검증

### 좋은 예시

```markdown
#### Automated Verification:
- [ ] Database migration runs successfully: `make migrate`
- [ ] All unit tests pass: `go test ./...`
- [ ] No linting errors: `golangci-lint run`
- [ ] Type checking passes: `npm run typecheck`
- [ ] API endpoint returns 200: `curl localhost:8080/api/new-endpoint`
- [ ] Integration tests pass: `make test-integration`
```

### 가이드라인

- ✅ 실행 가능한 명령어 포함 (`make`, `npm run`, `go test` 등)
- ✅ 가능하면 `make` 명령 사용 (일관성, 이식성)
- ✅ 구체적인 검증 대상 명시
- ❌ 모호한 표현 ("잘 동작함", "에러 없음")

---

## 수동 검증 (Manual Verification)

인간의 판단이 필요한 검증

### 좋은 예시

```markdown
#### Manual Verification:
- [ ] New feature appears correctly in the UI
- [ ] Performance is acceptable with 1000+ items
- [ ] Error messages are user-friendly
- [ ] Feature works correctly on mobile devices
- [ ] Edge case handling verified manually
```

### 가이드라인

- ✅ 구체적인 검증 시나리오 제공
- ✅ 숫자가 있다면 명시 (1000+ items, 3초 이내 등)
- ✅ 대상 환경 명시 (mobile, specific browser 등)
- ❌ 자동화 가능한 항목을 여기에 넣지 말 것

---

## Phase별 성공 기준 템플릿

```markdown
## Phase N: [단계명]

### Overview
[이 단계가 달성하는 목표]

### Changes Required:
[변경 사항]

### Success Criteria:

#### Automated Verification:
- [ ] [검증 항목]: `실행 명령어`
- [ ] [검증 항목]: `실행 명령어`

#### Manual Verification:
- [ ] [검증 항목]
- [ ] [검증 항목]

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.
```

---

## 체크리스트

성공 기준 작성 시 확인:

- [ ] 자동/수동 검증이 명확히 구분되었는가?
- [ ] 자동 검증에는 실행 가능한 명령어가 있는가?
- [ ] 수동 검증은 구체적인 시나리오인가?
- [ ] 모호한 표현이 없는가?
- [ ] Phase 완료 후 검증 절차가 명시되었는가?

---

## 관련 문서

- [Create Plan 프롬프트](../context-engineering/create-plan.md) - 구현 계획 작성 프로세스
