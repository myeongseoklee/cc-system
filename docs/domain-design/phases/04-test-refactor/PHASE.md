# Phase 4: 테스트 & 리팩토링

> "테스트를 먼저 작성하고, 최소한의 코드로 통과시킨 후, 리팩토링하라."

---

## 목표

- TDD 사이클 (Red-Green-Refactor) 적용
- 코드 냄새 감지 및 제거
- 중복 제거 및 구조 개선
- 테스트 통과 유지하며 리팩토링

---

## 순서

```
1. Red: 실패하는 테스트 작성
   ↓
2. Green: 최소한의 코드로 테스트 통과
   ↓
3. Refactor: 코드 개선 (테스트 통과 유지)
   ↓
4. 반복
   ↓
5. 다음 Phase로 이동
```

---

## 핵심 원칙

### Red-Green-Refactor

```
┌──────────────────────────────────────────────────┐
│                                                  │
│    ┌─────────┐      ┌─────────┐      ┌─────────┐│
│    │   RED   │ ───► │  GREEN  │ ───► │REFACTOR ││
│    │  (실패) │      │  (통과) │      │  (개선) ││
│    └─────────┘      └─────────┘      └─────────┘│
│         ▲                                  │    │
│         └──────────────────────────────────┘    │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 코드 냄새 (Code Smells)

| 냄새 | 설명 | 해결책 |
|------|------|--------|
| 긴 메서드 | 20줄 이상의 메서드 | 메서드 추출 |
| 중복 코드 | 비슷한 코드 반복 | 템플릿 메서드, 전략 패턴 |
| 조건문 | 타입에 따른 분기 | 다형성으로 대체 |
| 기차 충돌 | a.b.c.d() 연쇄 호출 | 디미터 법칙 적용 |
| 과도한 Getter | 내부 상태 노출 | 메서드로 캡슐화 |

### 리팩토링 원칙

1. **테스트 통과 유지**: 리팩토링 중에도 테스트는 항상 통과해야 함
2. **작은 단계로 진행**: 한 번에 하나씩 변경
3. **기능 변경 없음**: 동작은 그대로, 구조만 개선

---

## 상세 가이드

| 주제 | 설명 | 링크 |
|------|------|------|
| TDD 사이클 | Red-Green-Refactor 상세 | [tdd-cycle.md](./references/tdd-cycle.md) |
| 리팩토링 패턴 | 코드 냄새별 해결책 | [refactoring-patterns.md](./references/refactoring-patterns.md) |
| 테스트 체크리스트 | 테스트 작성 가이드 | [test-checklist.md](./references/test-checklist.md) |

---

## 예시: TDD로 Money 구현

### 1. Red: 실패하는 테스트

```typescript
describe('Money', () => {
  it('두 금액을 더할 수 있다', () => {
    const money1 = new Money(1000);
    const money2 = new Money(500);

    const result = money1.plus(money2);

    expect(result.toNumber()).toBe(1500);
  });
});
```

### 2. Green: 최소한의 코드

```typescript
class Money {
  constructor(private readonly amount: number) {}

  plus(other: Money): Money {
    return new Money(this.amount + other.amount);
  }

  toNumber(): number {
    return this.amount;
  }
}
```

### 3. Refactor: Decimal 적용

```typescript
class Money {
  private readonly amount: Decimal;

  constructor(amount: number) {
    this.amount = new Decimal(amount);
  }

  plus(other: Money): Money {
    return new Money(this.amount.plus(other.amount).toNumber());
  }

  toNumber(): number {
    return this.amount.toNumber();
  }
}
```

### 4. 반복: 다음 테스트

```typescript
it('음수 금액은 생성할 수 없다', () => {
  expect(() => new Money(-1000)).toThrow('금액은 음수일 수 없습니다');
});
```

---

## 리팩토링 예시

### 긴 메서드 → 메서드 추출

```typescript
// 🔴 Before
class Order {
  toJSON() {
    // 100줄의 코드...
  }
}

// ✅ After
class Order {
  toJSON() {
    return {
      ...this.extractOrderInfo(),
      ...this.extractItemsInfo(),
      ...this.extractPricingInfo(),
    };
  }

  private extractOrderInfo() { ... }
  private extractItemsInfo() { ... }
  private extractPricingInfo() { ... }
}
```

### 조건문 → 다형성

```typescript
// 🔴 Before
function calculateDiscount(discountType: string, amount: Money): Money {
  if (discountType === 'PERCENT') {
    return amount.multiply(0.1);
  } else if (discountType === 'AMOUNT') {
    return Money.of(1000);
  }
  return Money.zero();
}

// ✅ After
interface DiscountPolicy {
  applyDiscount(amount: Money): Money;
}

class PercentDiscountPolicy implements DiscountPolicy { ... }
class AmountDiscountPolicy implements DiscountPolicy { ... }
```

### 5. 다음 단계

테스트/리팩토링 완료 → [Phase 5: 검증](../05-verification/PHASE.md)으로 이동

---

## 체크리스트

- [ ] 테스트를 먼저 작성했는가?
- [ ] 테스트가 모두 통과하는가?
- [ ] 중복 코드가 없는가?
- [ ] 조건문을 다형성으로 변경했는가?
- [ ] 긴 메서드를 추출했는가?
- [ ] 기존 기능이 유지되는가?
