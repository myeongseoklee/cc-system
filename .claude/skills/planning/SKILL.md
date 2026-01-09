---
name: planning
description: 기능 구현 전 작업 계획 수립. 요구사항 분석 → 스킬 선택 → 테스트 목록 → 변경 파일 파악. 모든 구현 전 필수 참조.
---

# 작업 계획 수립

## 워크플로우

```
요구사항 → 분석 → 스킬 선택 → 테스트 목록 → 변경 파일 → 작업 계획
```

## Phase 1: 요구사항 분석

### 기능 유형
신규 / 수정 / 삭제 / 리팩토링

### 영향 범위
```markdown
- [ ] DB 스키마
- [ ] SP
- [ ] Backend API
- [ ] Frontend UI
- [ ] 타입 정의
```

### 기존 코드 탐색
유사 기능 패턴 → 재사용 가능 요소 파악

## Phase 2: 스킬 선택

| 상황 | 스킬 |
|------|------|
| BE v2 신규 | `backend-v2-feature` |
| BE v1→v2 | `backend-v1-to-v2-migration` |
| BE 리팩토링 | `backend-refactoring` |
| FE 신규 | `frontend-feature` |
| 레거시 테스트 | `tdd-legacy-codebase` |
| 테스트 문법 | `jest-unit-test` |

복합 작업: DB/SP → BE → FE 순서

## Phase 3: 테스트 목록

**필수**: `tdd-new-feature` 스킬 참조

```markdown
### Backend
□ [정상] 기본 시나리오
□ [경계] 경계값
□ [예외] 에러

### Frontend
□ [Hook] 상태 관리
□ [컴포넌트] 렌더링/인터랙션
```

## Phase 4: 변경 파일

[references/file-checklist.md](references/file-checklist.md) 참조

## Phase 5: 작업 계획

[references/plan-template.md](references/plan-template.md) 참조

### 원칙
1. DB → BE → FE
2. 테스트 먼저
3. 한 레이어씩

## 출력 형식

```markdown
# {기능} 작업 계획

## 요구사항
{요약}

## 영향 범위
DB/BE/FE: {있음/없음}

## 스킬
1. {스킬} - {이유}

## 테스트 목록
{목록}

## 변경 파일
{목록}

## 순서
1. {작업}
```

## 상세 가이드

- [스킬 선택 매트릭스](references/skill-matrix.md)
- [테스트 목록 예제](references/test-examples.md)
- [파일 체크리스트](references/file-checklist.md)
- [작업 계획 템플릿](references/plan-template.md)
