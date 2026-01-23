# 리팩토링 패턴

> "코드 냄새를 감지하고, 테스트 통과 상태에서 개선하라."

---

## 코드 냄새 (Code Smells)

| 냄새 | 증상 | 해결책 |
|------|------|--------|
| 긴 메서드 | 20줄 이상 | 메서드 추출 |
| 중복 코드 | 비슷한 코드 반복 | 템플릿 메서드, 전략 패턴 |
| 조건문 | 타입에 따른 분기 | 다형성으로 대체 |
| 기차 충돌 | a.b.c.d() 연쇄 | 디미터 법칙 적용 |
| 과도한 Getter | 내부 노출 | 메서드로 캡슐화 |
| 신 클래스 | 너무 많은 책임 | 책임 분리 |
| Feature Envy | 다른 객체 데이터 사용 | 메서드 이동 |

---

## 리팩토링 기법

### 1. 메서드 추출 (Extract Method)

긴 메서드를 작은 메서드로 분리

```typescript
// 🔴 Before: 긴 메서드
class Order {
  toJSON() {
    // 메타데이터 추출
    const orderId = this.orderId;
    const customerId = this.customerId;
    const orderDate = this.orderDate.toString();

    // 항목 정보 추출
    const items = this.items.map(item => item.toJSON());

    // 가격 정보 추출
    const subtotal = this.calculateSubtotal().toNumber();
    const discount = this.discountPolicy.applyDiscount(this.calculateSubtotal()).toNumber();

    return {
      orderId, customerId, orderDate,
      items,
      subtotal,
      discount,
    };
  }
}

// ✅ After: 메서드 추출
class Order {
  toJSON() {
    return {
      ...this.extractMetadata(),
      ...this.extractItemsInfo(),
      ...this.extractPricingInfo(),
    };
  }

  private extractMetadata() {
    return {
      orderId: this.orderId,
      customerId: this.customerId,
      orderDate: this.orderDate.toString(),
    };
  }

  private extractItemsInfo() {
    return {
      items: this.items.map(item => item.toJSON()),
    };
  }

  private extractPricingInfo() {
    const subtotal = this.calculateSubtotal();
    return {
      subtotal: subtotal.toNumber(),
      total: this.discountPolicy.applyDiscount(subtotal).toNumber(),
    };
  }
}
```

### 2. 조건문을 다형성으로 대체

타입에 따른 분기를 다형성으로 해결

```typescript
// 🔴 Before: 조건문
function calculateDiscount(discountType: string, amount: Money): Money {
  if (discountType === 'PERCENT') {
    return amount.multiply(0.1);
  } else if (discountType === 'AMOUNT') {
    return Money.of(1000);
  }
  throw new Error('Unknown discount type');
}

// ✅ After: 다형성
interface DiscountPolicy {
  applyDiscount(amount: Money): Money;
}

class PercentDiscountPolicy implements DiscountPolicy {
  applyDiscount(amount: Money): Money {
    return amount.multiply(1 - this.percent / 100);
  }
}

class AmountDiscountPolicy implements DiscountPolicy {
  applyDiscount(amount: Money): Money {
    return amount.minus(this.discountAmount);
  }
}

// 사용: 조건문 없이 다형성으로
const policy: DiscountPolicy = getDiscountPolicy(discountType);
const total = policy.applyDiscount(subtotal);
```

### 3. 중복 제거 (전략 패턴)

비슷한 로직을 전략 패턴으로 통합

```typescript
// 🔴 Before: 중복
class PercentDiscountPolicy {
  calculateDiscount(amount: Money): Money {
    return amount.multiply(this.percent / 100);
  }
}

class AmountDiscountPolicy {
  calculateDiscount(amount: Money): Money {
    return this.discountAmount;
  }
}

// ✅ After: 전략 패턴으로 중복 제거
interface DiscountStrategy {
  calculateDiscount(amount: Money): Money;
}

class PercentDiscountStrategy implements DiscountStrategy {
  constructor(private readonly percent: number) {}

  calculateDiscount(amount: Money): Money {
    return amount.multiply(this.percent / 100);
  }
}

class Order {
  constructor(private readonly discountStrategy: DiscountStrategy) {}

  calculateTotal(): Money {
    const subtotal = this.calculateSubtotal();
    const discount = this.discountStrategy.calculateDiscount(subtotal);
    return subtotal.minus(discount);
  }
}
```

### 4. 기차 충돌 제거 (디미터 법칙)

연쇄 호출을 메시지 위임으로 해결

```typescript
// 🔴 Before: 기차 충돌
class PaymentService {
  process(order: Order): void {
    const balance = order.getCustomer().getWallet().getBalance();
    if (balance.isLessThan(order.getTotal())) {
      throw new InsufficientBalanceError();
    }
  }
}

// ✅ After: 디미터 법칙 준수
class Order {
  canBePaidBy(customer: Customer): boolean {
    return customer.canPay(this.total);
  }
}

class Customer {
  canPay(amount: Money): boolean {
    return this.wallet.hasEnoughBalance(amount);
  }
}

class PaymentService {
  process(order: Order, customer: Customer): void {
    if (!order.canBePaidBy(customer)) {
      throw new InsufficientBalanceError();
    }
  }
}
```

### 5. Getter를 메서드로 대체

내부 노출을 캡슐화

```typescript
// 🔴 Before: Getter로 내부 노출
class OrderSummary {
  getSubtotal(): Money { return this.subtotal; }
  getDiscount(): Money { return this.discount; }
}

// 외부에서 계산
const total = summary.getSubtotal().minus(summary.getDiscount());

// ✅ After: 메서드로 캡슐화
class OrderSummary {
  getTotal(): Money {
    return this.subtotal.minus(this.discount);
  }
}

// 객체에게 시킴
const total = summary.getTotal();
```

---

## 리팩토링 원칙

1. **테스트 통과 유지**: 리팩토링 중에도 테스트는 항상 통과
2. **작은 단계로 진행**: 한 번에 하나씩 변경
3. **기능 변경 없음**: 동작은 그대로, 구조만 개선
4. **커밋 자주**: 안전하게 되돌릴 수 있도록

---

## 체크리스트

- [ ] 코드 냄새를 식별했는가?
- [ ] 리팩토링 전에 테스트가 통과하는가?
- [ ] 작은 단계로 진행했는가?
- [ ] 리팩토링 후에도 테스트가 통과하는가?
- [ ] 기능이 변경되지 않았는가?
