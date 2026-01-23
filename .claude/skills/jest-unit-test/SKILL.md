---
name: jest-unit-test
description: Jest 유닛 테스트 작성. 테스트 문법, Mock/Fake/Spy, 비동기, 헬퍼. TDD 방법론은 tdd-new-feature 참조.
---

# Jest Unit Test

> 심화: [ADVANCED.md](ADVANCED.md)

## 관련 스킬
- `tdd-new-feature`: TDD 방법론
- `tdd-legacy-codebase`: 레거시 테스트

## 체크리스트

### 무엇을 테스트?
- [ ] 관찰 가능한 동작 (private 제외)
- [ ] 복잡도 × 중요도 높음
- [ ] 단위 테스트 가능

### 우선순위
| 복잡도 | 중요도 | 우선순위 |
|--------|--------|---------|
| 높음 | 높음 | ⭐⭐⭐ |
| 낮음 | 높음 | ⭐⭐ |
| 높음 | 낮음 | ⭐ |
| 낮음 | 낮음 | 생략 |

### 테스트 금지 🚫
1. Passthrough (단순 전달)
2. Framework/Library 동작
3. Stub 호출 검증

## 테스트 문법

[references/test-syntax.md](references/test-syntax.md)

## Mock 전략

### Fake vs Mock vs Spy
[references/test-doubles.md](references/test-doubles.md)

### 선택 기준
- 상태 검증 → Fake
- 호출 검증 → Mock
- 기존 코드 → Spy

## 비동기 테스트

```typescript
test('async', async () => {
  const result = await asyncFunc();
  expect(result).toBe('done');
});
```

## Matcher

[references/matchers.md](references/matchers.md)

## 상세 가이드

- [테스트 문법](references/test-syntax.md)
- [Test Doubles](references/test-doubles.md)
- [Matchers](references/matchers.md)
- [심화](ADVANCED.md)
