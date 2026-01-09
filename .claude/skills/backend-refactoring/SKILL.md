---
name: backend-refactoring
description: Backend 리팩토링. 동작 변경 없이 구조 개선. 테스트로 안전망 확보 후 점진적 개선.
---

# Backend 리팩토링

## 원칙
1. 동작 불변
2. 테스트 먼저
3. 작은 단계

## 흐름
```
테스트 작성 → Refactor → 테스트 통과 확인
```

## 리팩토링 패턴

### 함수 추출
긴 함수 → 작은 함수들

### 중복 제거
복사-붙여넣기 → 공통 함수

### 조건문 단순화
복잡한 if → 명확한 조건

### 네이밍 개선
모호한 이름 → 명확한 의미

상세: [references/refactoring-patterns.md](references/refactoring-patterns.md)
