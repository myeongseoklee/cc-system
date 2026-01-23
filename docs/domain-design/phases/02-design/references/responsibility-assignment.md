# 책임 할당 (GRASP)

> "책임을 수행하는 데 필요한 정보를 가장 많이 알고 있는 객체에게 책임을 할당하라."

---

## GRASP 패턴 요약

| 패턴 | 핵심 질문 | 적용 |
|------|-----------|------|
| 정보 전문가 | 누가 정보를 가지고 있는가? | 정보를 가진 객체에 책임 할당 |
| 창조자 | 누가 이 객체를 생성해야 하는가? | 포함/사용/초기화 데이터를 가진 객체 |
| 낮은 결합도 | 의존성을 줄일 수 있는가? | 인터페이스에 의존, DI |
| 높은 응집도 | 관련 책임만 모여있는가? | 책임 분리 |
| 다형성 | 조건문을 대체할 수 있는가? | 타입별 분기 → 다형성 |
| 순수 가공물 | 도메인에 없지만 필요한 객체? | Repository, Factory, Service |
| 간접 참조 | 직접 결합을 피해야 하는가? | 인터페이스 도입 |
| 변경 보호 | 변경이 예상되는가? | 인터페이스로 보호 |
| 컨트롤러 | 시스템 이벤트를 누가 처리? | UseCase, Facade |

---

## 정보 전문가 (Information Expert)

**가장 중요한 패턴**: 필요한 정보를 가진 객체에 책임을 할당

```typescript
// ❌ 정보를 가진 객체가 아닌 외부에서 계산
class OrderService {
  calculateOrderTotal(order: Order): Money {
    let total = Money.zero();
    // order의 내부 정보를 꺼내서 외부에서 계산
    order.getItems().forEach((item) => {
      total = total.plus(item.getPrice().multiply(item.getQuantity()));
    });
    return total;
  }
}

// ✅ 정보를 가진 객체가 직접 계산
class Order {
  private readonly items: OrderItem[];

  // Order가 items 정보를 가지고 있으므로 직접 계산
  calculateTotal(): Money {
    return this.items.reduce(
      (total, item) => total.plus(item.calculateAmount()),
      Money.zero(),
    );
  }
}

class OrderItem {
  private readonly price: Money;
  private readonly quantity: number;

  // OrderItem이 price, quantity 정보를 가지고 있으므로 직접 계산
  calculateAmount(): Money {
    return this.price.multiply(this.quantity);
  }
}
```

---

## 창조자 (Creator)

**객체 생성 책임**: 다음 조건을 만족하는 객체에게 할당

- B가 A를 포함하거나 집합으로 가진다
- B가 A를 기록한다
- B가 A를 긴밀하게 사용한다
- B가 A의 초기화 데이터를 가진다

```typescript
// ✅ Order가 OrderItem을 포함하므로 Order가 생성
class Order {
  private readonly items: OrderItem[] = [];

  addItem(product: Product, quantity: number): void {
    const item = new OrderItem(product, quantity);
    this.items.push(item);
  }
}

// ✅ 복잡한 생성은 Factory로 분리
class OrderFactory {
  static create(rawData: RawData): Order {
    const items = rawData.items.map(item => new OrderItem(...));
    return new Order({ items, discountPolicy: ... });
  }
}
```

---

## 다형성 (Polymorphism)

**조건문을 다형성으로 대체**

```typescript
// ❌ 조건문으로 타입 분기
function calculateDiscount(order: Order): Money {
  if (order.discountType === 'PERCENT') {
    return order.subtotal.multiply(0.1);
  } else if (order.discountType === 'AMOUNT') {
    return Money.of(1000);
  }
  throw new Error('Unknown type');
}

// ✅ 다형성으로 해결
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

class Order {
  constructor(
    private readonly subtotal: Money,
    private readonly discountPolicy: DiscountPolicy,
  ) {}

  calculateTotal(): Money {
    return this.discountPolicy.applyDiscount(this.subtotal);
  }
}
```

---

## 변경 보호 (Protected Variations)

**변경이 예상되는 지점을 인터페이스로 보호**

```typescript
// ✅ 할인 정책이 변경될 수 있으므로 인터페이스로 보호
interface DiscountPolicy {
  applyDiscount(amount: Money): Money;
}

// 현재 정책
class PercentDiscountPolicy implements DiscountPolicy {
  applyDiscount(amount: Money): Money {
    return amount.multiply(1 - this.percent / 100);
  }
}

// 미래에 추가될 수 있는 정책 (기존 코드 수정 없이 확장)
class TieredDiscountPolicy implements DiscountPolicy {
  applyDiscount(amount: Money): Money {
    if (amount.isGreaterThan(Money.of(100000))) {
      return amount.multiply(0.85); // 15% 할인
    }
    return amount.multiply(0.95); // 5% 할인
  }
}

// 클라이언트는 변경으로부터 보호됨
class Order {
  constructor(private readonly discountPolicy: DiscountPolicy) {}

  calculateTotal(): Money {
    return this.discountPolicy.applyDiscount(this.subtotal);
  }
}
```

---

## 책임 할당 체크리스트

- [ ] 정보 전문가에게 책임을 할당했는가?
- [ ] 객체 생성 책임이 적절한 창조자에게 있는가?
- [ ] 조건문을 다형성으로 대체할 수 있는가?
- [ ] 변경이 예상되는 지점을 인터페이스로 보호했는가?
- [ ] 결합도는 낮고 응집도는 높은가?

---

## 다음 단계

책임 할당 완료 → [인터페이스 설계](./interface-design.md)로 이동
