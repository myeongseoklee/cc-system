---
name: tdd-new-feature
description: 신규 기능 TDD 개발. 요구사항 → 테스트로 변환 → 경계값/예외 식별 → Red-Green-Refactor. 테스트 문법은 jest-unit-test 참조.
---

# 신규 기능 TDD

## 관련 스킬
- `jest-unit-test`: 테스트 문법
- `tdd-legacy-codebase`: 레거시 테스트

## 흐름

```
요구사항 → 테스트 목록 → Red-Green-Refactor 반복
```

## 1단계: 요구사항 → 테스트 목록

코드 전에 테스트 목록 먼저

### 테스트 목록 도출
[references/test-list-example.md](references/test-list-example.md)

### 제외 기준
**2단계 체크**:
1. 우리 코드? → ❌ 제외 (외부 라이브러리)
2. 비즈니스 로직 OR 복잡도? → 둘 다 ❌ 제외

### 포함 기준
- ✅ 입력 → 출력 변환
- ✅ 조건부 분기
- ✅ 경계값
- ❌ 구현 방법
- ❌ 중간 과정

## 2단계: 우선순위

| 복잡도 | 중요도 | 우선순위 |
|--------|--------|---------|
| 높음 | 높음 | ⭐⭐⭐ |
| 낮음 | 높음 | ⭐⭐ |
| 높음 | 낮음 | ⭐ |

## 3단계: Red-Green-Refactor

[references/tdd-cycle.md](references/tdd-cycle.md)

## 4단계: 접근법

### Outside-In
UI/API → 내부 레이어

### Inside-Out
핵심 로직 → 외부 레이어

## 상세 가이드

- [테스트 목록 예제](references/test-list-example.md)
- [TDD 사이클](references/tdd-cycle.md)
- [우선순위 매트릭스](references/priority-matrix.md)
