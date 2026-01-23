# 객체지향 핵심 개념

> 조영호의 "오브젝트", "객체지향의 사실과 오해" 기반

---

## 1. 객체는 상태와 행동을 함께 가진다

> "객체는 상태를 가지며, 상태를 변경할 수 있는 행동을 가진다."

- **상태(State)만** 있는 것은 자료구조
- **행동(Behavior)만** 있는 것은 함수
- **객체 = 상태 + 행동**

```typescript
// ✅ 상태와 행동을 함께 가짐
class Money {
  private readonly amount: Decimal;

  constructor(amount: number) {
    this.amount = new Decimal(amount);
  }

  // 행동: 객체 스스로 계산
  plus(other: Money): Money {
    return new Money(this.amount.plus(other.amount));
  }

  multiply(ratio: number): Money {
    return new Money(this.amount.times(ratio));
  }
}

// ❌ 상태만 있는 자료구조
class MoneyData {
  amount: number;
}

// 행동이 외부에 분산됨
function addMoney(a: MoneyData, b: MoneyData): MoneyData {
  return { amount: a.amount + b.amount };
}
```

---

## 2. 책임, 역할, 협력

> "객체지향 설계의 핵심은 협력, 책임, 역할을 어떻게 구성하는가이다."

### 책임 (Responsibility)

객체가 **무엇을 알고 있는가** (아는 것) + **무엇을 하는가** (하는 것)

```typescript
class PercentDiscountPolicy {
  // 아는 것: 할인율, 대상 금액
  private readonly percent: number;

  // 하는 것: 할인 금액 계산
  applyDiscount(amount: Money): Money {
    return amount.multiply(1 - this.percent / 100);
  }

  getDiscountAmount(amount: Money): Money {
    return amount.multiply(this.percent / 100);
  }
}
```

### 역할 (Role)

**대체 가능한 책임의 집합**

```typescript
// 역할: 할인 정책 책임
interface DiscountPolicy {
  getName(): string;
  applyDiscount(amount: Money): Money;
}

// 역할을 수행하는 객체들 (대체 가능)
class PercentDiscountPolicy implements DiscountPolicy {}
class AmountDiscountPolicy implements DiscountPolicy {}
class TieredDiscountPolicy implements DiscountPolicy {}
```

### 협력 (Collaboration)

**객체들이 메시지를 주고받으며 문제를 해결하는 과정**

```typescript
class Order {
  private readonly items: OrderItem[];
  private readonly discountPolicy: DiscountPolicy;

  calculateTotal(): Money {
    // 1. 모든 항목에게 금액 계산 메시지 전송
    const subtotal = this.items.reduce(
      (total, item) => total.plus(item.calculateAmount()),
      Money.zero()
    );

    // 2. 할인 정책에게 할인 적용 메시지 전송
    return this.discountPolicy.applyDiscount(subtotal);
  }
}
```

---

## 3. 메시지가 객체를 선택한다

> "객체가 메시지를 선택하는 것이 아니라, 메시지가 객체를 선택한다."

**설계 순서:**
1. **메시지 먼저 정의** (무엇을 해야 하는가?)
2. **그 메시지를 처리할 객체 선택** (누가 할 수 있는가?)
3. **객체에 메서드 구현**

```typescript
// 1. 메시지 정의: "할인을 적용하라"
interface DiscountPolicy {
  applyDiscount(amount: Money): Money; // 메시지
}

// 2. 메시지를 처리할 객체들
class PercentDiscountPolicy implements DiscountPolicy {
  applyDiscount(amount: Money): Money {
    return amount.multiply(1 - this.percent / 100);
  }
}

// 3. 메시지를 사용하는 클라이언트
class Order {
  calculateTotal(): Money {
    const subtotal = this.calculateSubtotal();
    // 다형성: 메시지만 보내면 각 객체가 알아서 처리
    return this.discountPolicy.applyDiscount(subtotal);
  }
}
```

---

## 4. 자율적인 객체

> "객체는 자율적이어야 한다. 스스로 결정하고 책임을 진다."

### Tell, Don't Ask

- 객체에게 "어떻게 하라"고 지시하지 말고
- **"무엇을 하라"고 요청**하라

```typescript
// ❌ Ask: 묻고, 외부에서 계산
class PaymentService {
  calculateDiscount(order: Order): number {
    const subtotal = order.getSubtotal(); // 물어봄
    return subtotal.times(0.1).toNumber(); // 외부에서 계산
  }
}

// ✅ Tell: 시키고, 객체가 스스로 계산
class Order {
  private readonly discountPolicy: DiscountPolicy;

  calculateTotal(): Money {
    // 스스로 결정하고 계산
    const subtotal = this.calculateSubtotal();
    return this.discountPolicy.applyDiscount(subtotal);
  }
}

class PaymentService {
  processPayment(order: Order): Money {
    // 그냥 시키기만 함
    return order.calculateTotal();
  }
}
```

---

## 5. 캡슐화

> "변경될 수 있는 것을 숨겨라."

### 목표

- 외부에서 내부 구현을 알 수 없게
- 내부 변경이 외부에 영향을 주지 않게

### 적용 방법

**1. private 필드**

```typescript
class Money {
  private readonly amount: Decimal; // 구현을 숨김

  plus(other: Money): Money {
    return new Money(this.amount.plus(other.amount));
  }
}
```

**2. 인터페이스 분리**

```typescript
interface DiscountPolicy {
  applyDiscount(amount: Money): Money;
}

class Order {
  constructor(
    private readonly discountPolicy: DiscountPolicy, // 인터페이스에 의존
  ) {}
}
```

**3. Getter 최소화**

```typescript
// ❌ Getter로 내부 노출
class OrderSummary {
  getSubtotal(): Money { return this.subtotal; }
  getDiscount(): Money { return this.discount; }
}
const total = summary.getSubtotal().minus(summary.getDiscount());

// ✅ 메서드로 캡슐화
class OrderSummary {
  getTotal(): Money {
    return this.subtotal.minus(this.discount);
  }
}
const total = summary.getTotal();
```

---

## 6. 추상화

> "공통 책임을 추출하여 개념을 단순화하라."

```typescript
// ✅ 공통 책임 추출
interface DiscountPolicy {
  // 모든 할인 정책이 해야 하는 공통 책임
  getName(): string;
  applyDiscount(amount: Money): Money;
}

// 각 정책은 자신만의 방식으로 구현
class PercentDiscountPolicy implements DiscountPolicy { ... }
class AmountDiscountPolicy implements DiscountPolicy { ... }

// 클라이언트는 추상화를 통해 단순하게 사용
class Order {
  calculateTotal(): Money {
    const subtotal = this.calculateSubtotal();
    // 구체 클래스 몰라도 됨
    return this.discountPolicy.applyDiscount(subtotal);
  }
}
```

---

## 7. 다형성

> "역할(인터페이스)을 통해 대체 가능성을 확보하라."

```typescript
// 1. 역할 정의
interface DiscountPolicy {
  applyDiscount(amount: Money): Money;
}

// 2. 다양한 구현
class PercentDiscountPolicy implements DiscountPolicy {
  applyDiscount(amount: Money): Money {
    return amount.multiply(1 - this.percent / 100);
  }
}

class TieredDiscountPolicy implements DiscountPolicy {
  applyDiscount(amount: Money): Money {
    if (amount.isGreaterThan(Money.of(100000))) {
      return amount.multiply(0.85); // 15% 할인
    }
    return amount.multiply(0.95); // 5% 할인
  }
}

// 3. 런타임에 교체 가능
const order1 = new Order(items, new PercentDiscountPolicy(10));
const order2 = new Order(items, new TieredDiscountPolicy());
```

---

## 참고

- 조영호, "오브젝트"
- 조영호, "객체지향의 사실과 오해"
