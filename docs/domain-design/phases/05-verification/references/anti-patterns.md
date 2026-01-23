# 안티패턴

> "피해야 할 설계 패턴을 알면 좋은 설계를 할 수 있다."

---

## 빈약한 도메인 모델 (Anemic Domain Model)

**문제:**
- 객체가 상태만 가지고 행동이 없음
- 비즈니스 로직이 서비스 레이어에 분산됨

```typescript
// ❌ 빈약한 도메인 모델
class OrderData {
  subtotal: number;
  discount: number;
  // 행동 없음 (getter/setter만)
}

class OrderService {
  calculateTotal(data: OrderData): number {
    return data.subtotal - data.discount;
  }

  applyPromotion(data: OrderData): number {
    return data.subtotal * 0.9;
  }
}
```

**해결책:**

```typescript
// ✅ 풍부한 도메인 모델
class OrderSummary {
  constructor(
    readonly subtotal: Money,
    readonly discount: Money,
  ) {}

  getTotal(): Money {
    return this.subtotal.minus(this.discount);
  }
}

class Order {
  calculateTotal(): Money {
    return this.summary.getTotal();
  }
}
```

---

## 과도한 Getter/Setter

**문제:**
- 캡슐화 위반
- Tell, Don't Ask 위반

```typescript
// ❌ 과도한 Getter
class OrderSummary {
  getSubtotal(): Money { return this.subtotal; }
  getDiscount(): Money { return this.discount; }
}

// 외부에서 계산
const total = summary.getSubtotal().minus(summary.getDiscount());
```

**해결책:**

```typescript
// ✅ 메서드로 캡슐화
class OrderSummary {
  getTotal(): Money {
    return this.subtotal.minus(this.discount);
  }
}

// 객체에게 시킴
const total = summary.getTotal();
```

---

## 신 클래스 (God Class)

**문제:**
- 하나의 클래스가 너무 많은 책임
- 단일 책임 원칙 위반

```typescript
// ❌ 신 클래스
class OrderManager {
  calculateTotal() {}
  saveToDatabase() {}
  sendEmail() {}
  generateReport() {}
  exportToExcel() {}
  validateData() {}
  transformData() {}
  // ... 수십 개의 메서드
}
```

**해결책:**

```typescript
// ✅ 책임 분리
class OrderCalculator {
  calculateTotal() {}
}

class OrderRepository {
  save() {}
}

class NotificationService {
  sendEmail() {}
}

class ReportGenerator {
  generate() {}
}
```

---

## 기차 충돌 (Train Wreck)

**문제:**
- 디미터 법칙 위반
- a.b.c.d() 같은 연쇄 호출

```typescript
// ❌ 기차 충돌
class PaymentService {
  process(order: Order): void {
    const balance = order.getCustomer().getWallet().getBalance();
    if (balance.isLessThan(order.getTotal())) {
      throw new InsufficientBalanceError();
    }
  }
}
```

**해결책:**

```typescript
// ✅ 디미터 법칙 준수
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

---

## Feature Envy

**문제:**
- 메서드가 자신의 데이터보다 다른 객체의 데이터를 더 많이 사용

```typescript
// ❌ Feature Envy
class ReportGenerator {
  generateOrderReport(order: Order): string {
    // Order의 데이터를 과도하게 사용
    const customer = order.getCustomerName();
    const total = order.getTotal();
    const items = order.getItems();
    const discount = order.getDiscount();
    const tax = order.getTax();
    // ... Order 데이터로 리포트 생성
  }
}
```

**해결책:**

```typescript
// ✅ 메서드를 데이터가 있는 클래스로 이동
class Order {
  generateReport(): string {
    // Order 자신이 리포트 생성
    return `${this.customerName}: ${this.total}원`;
  }
}
```

---

## 과도한 조건문

**문제:**
- 타입에 따른 분기가 여러 곳에 산재

```typescript
// ❌ 과도한 조건문
function calculateDiscount(policy: string, amount: Money): Money {
  if (policy === 'PERCENT') {
    return amount.multiply(0.1);
  } else if (policy === 'AMOUNT') {
    return Money.of(1000);
  } else if (policy === 'TIERED') {
    return amount.isGreaterThan(Money.of(100000))
      ? amount.multiply(0.15)
      : amount.multiply(0.05);
  }
  throw new Error('Unknown type');
}

function getLabel(policy: string): string {
  if (policy === 'PERCENT') {
    return '퍼센트 할인';
  } else if (policy === 'AMOUNT') {
    return '정액 할인';
  } else if (policy === 'TIERED') {
    return '단계별 할인';
  }
  throw new Error('Unknown type');
}
```

**해결책:**

```typescript
// ✅ 다형성으로 해결
interface DiscountPolicy {
  applyDiscount(amount: Money): Money;
  getName(): string;
}

class PercentDiscountPolicy implements DiscountPolicy {
  applyDiscount(amount: Money): Money { return amount.multiply(0.1); }
  getName(): string { return '퍼센트 할인'; }
}

class AmountDiscountPolicy implements DiscountPolicy {
  applyDiscount(amount: Money): Money { return Money.of(1000); }
  getName(): string { return '정액 할인'; }
}
```

---

## 안티패턴 체크리스트

- [ ] 상태만 있고 행동이 없는 클래스가 있는가? (빈약한 도메인 모델)
- [ ] Getter로 내부 상태를 과도하게 노출하는가?
- [ ] 한 클래스에 너무 많은 책임이 있는가? (신 클래스)
- [ ] a.b.c.d() 같은 연쇄 호출이 있는가? (기차 충돌)
- [ ] 다른 객체의 데이터를 과도하게 사용하는 메서드가 있는가? (Feature Envy)
- [ ] 타입에 따른 분기가 여러 곳에 있는가? (과도한 조건문)
