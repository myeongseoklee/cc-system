---
name: tdd-legacy-codebase
description: 레거시 코드에 테스트 추가. 테스트 없는 기존 코드를 안전하게 개선.
---

# 레거시 코드 TDD

## 관련 스킬
- `jest-unit-test`: 테스트 문법
- `backend-refactoring`: 리팩토링 패턴

## 전략

### 1. Characterization Test
현재 동작을 테스트로 고정

### 2. Seam 찾기
테스트 가능한 경계 식별

### 3. 의존성 끊기
Mock/Fake로 의존성 제거

### 4. 점진적 개선
작은 단위로 리팩토링

## 흐름
```
현재 동작 테스트 → Refactor → 새 테스트 추가
```

상세: [references/legacy-strategies.md](references/legacy-strategies.md)
