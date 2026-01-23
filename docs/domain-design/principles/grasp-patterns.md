# GRASP 패턴

> General Responsibility Assignment Software Patterns
> 책임 할당의 기본 원칙

---

## 개요

| 패턴 | 핵심 질문 |
|------|-----------|
| 정보 전문가 | "이 책임을 수행할 정보를 누가 가지고 있는가?" |
| 창조자 | "이 객체를 누가 생성해야 하는가?" |
| 낮은 결합도 | "불필요한 의존성이 있는가?" |
| 높은 응집도 | "관련 있는 책임만 모여있는가?" |
| 컨트롤러 | "시스템 이벤트를 누가 처리하는가?" |
| 다형성 | "조건문을 대체할 수 있는가?" |
| 순수 가공물 | "도메인에 없지만 필요한 객체는?" |
| 간접 참조 | "직접 결합을 피해야 하는가?" |
| 변경 보호 | "변경이 예상되는가?" |

---

## 1. 정보 전문가 (Information Expert)

> "책임을 수행하는 데 필요한 정보를 가장 많이 알고 있는 객체에게 책임을 할당하라."

**가장 중요한 패턴**

```typescript
// ❌ 정보를 가진 객체가 아닌 외부에서 계산
class OrderService {
  calculateOrderTotal(order: Order): Money {
    let total = Money.zero();
    order.getItems().forEach((item) => {
      total = total.plus(item.getPrice().multiply(item.getQuantity()));
    });
    return total;
  }
}

// ✅ 정보를 가진 객체가 직접 계산
class Order {
  private readonly items: OrderItem[];

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

  calculateAmount(): Money {
    return this.price.multiply(this.quantity);
  }
}
```

---

## 2. 창조자 (Creator)

> "다음 조건을 만족하는 객체에게 생성 책임을 할당하라."

**조건:**
- B가 A를 포함하거나 집합으로 가진다
- B가 A를 기록한다
- B가 A를 긴밀하게 사용한다
- B가 A의 초기화 데이터를 가진다

```typescript
// ✅ Order가 OrderItem을 포함 → Order가 생성
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

## 3. 낮은 결합도 (Low Coupling)

> "불필요한 의존성을 제거하여 변경의 영향을 줄여라."

```typescript
// ❌ 높은 결합도: 구체 클래스에 직접 의존
class PaymentService {
  processPayment(order: Order): void {
    const calculator = new TaxCalculator();  // 구체 클래스 생성
    const notifier = new EmailNotifier();    // 구체 클래스 생성
  }
}

// ✅ 낮은 결합도: 인터페이스에 의존, 의존성 주입
class PaymentService {
  constructor(
    private readonly taxCalculator: TaxCalculator,
    private readonly notifier: Notifier,
  ) {}

  processPayment(order: Order): void {
    const tax = this.taxCalculator.calculate(order);
    this.notifier.notify(order.getCustomer());
  }
}
```

---

## 4. 높은 응집도 (High Cohesion)

> "관련 있는 책임만 모아서 객체의 복잡도를 낮춰라."

```typescript
// ❌ 낮은 응집도: 관련 없는 책임들
class OrderManager {
  createOrder() {}
  calculateTax() {}
  sendEmail() {}
  generateReport() {}
  validateCreditCard() {}
}

// ✅ 높은 응집도: 관련 책임만 모음
class OrderService {
  createOrder() {}
  cancelOrder() {}
  getOrderStatus() {}
}

class TaxCalculator {
  calculate() {}
  applyDiscount() {}
}

class NotificationService {
  sendEmail() {}
  sendSMS() {}
}
```

---

## 5. 컨트롤러 (Controller)

> "시스템 이벤트를 처리할 객체를 선택하라."

```typescript
// ✅ Use Case 컨트롤러: 특정 유스케이스를 담당
class CreateOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly paymentService: PaymentService,
  ) {}

  async execute(request: CreateOrderRequest): Promise<Order> {
    const order = Order.create(request);
    await this.paymentService.process(order);
    return this.orderRepository.save(order);
  }
}

// ✅ Facade 컨트롤러: 관련 유스케이스들을 묶음
class OrderFacade {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
  ) {}

  createOrder(request): Promise<Order> {
    return this.createOrderUseCase.execute(request);
  }

  cancelOrder(orderId): Promise<void> {
    return this.cancelOrderUseCase.execute(orderId);
  }
}
```

---

## 6. 다형성 (Polymorphism)

> "타입에 따라 다르게 동작해야 할 때, 조건문 대신 다형성을 사용하라."

```typescript
// ❌ 조건문으로 타입 분기
function calculateDiscount(order: Order): Money {
  if (order.type === 'PERCENT') {
    return order.amount.multiply(0.1);
  } else if (order.type === 'AMOUNT') {
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
    private readonly amount: Money,
    private readonly discountPolicy: DiscountPolicy,
  ) {}

  calculateTotal(): Money {
    return this.discountPolicy.applyDiscount(this.amount);
  }
}
```

---

## 7. 순수 가공물 (Pure Fabrication)

> "도메인 개념이 아니지만 높은 응집도와 낮은 결합도를 위해 인위적으로 만든 객체."

```typescript
// ✅ Repository: 도메인 개념 X, 기술적 책임
class OrderRepository {
  async findById(orderId: string): Promise<Order> {
    return (await database.executeQuery('SP_Order_Select', [orderId])).rows[0];
  }
}

// ✅ Mapper: Entity ↔ DTO 변환
class OrderMapper {
  static toDTO(entity: Order): OrderDTO {
    return {
      orderId: entity.orderId,
      total: entity.calculateTotal().toNumber(),
      ...
    };
  }
}
```

---

## 8. 간접 참조 (Indirection)

> "두 객체 사이의 직접 결합을 피하기 위해 중간 객체를 도입하라."

```typescript
// ❌ 직접 결합
class OrderService {
  constructor(private readonly emailService: GmailService) {}
}

// ✅ 간접 참조: 인터페이스를 통한 간접 결합
interface NotificationService {
  send(message: Message): Promise<void>;
}

class GmailNotificationService implements NotificationService { ... }
class SlackNotificationService implements NotificationService { ... }

class OrderService {
  constructor(private readonly notifier: NotificationService) {}
}
```

---

## 9. 변경 보호 (Protected Variations)

> "변경이 예상되는 지점을 인터페이스 뒤로 숨겨라."

```typescript
// ✅ 할인 정책이 변경될 수 있음 → 인터페이스로 보호
interface DiscountPolicy {
  applyDiscount(amount: Money): Money;
}

// 현재 정책
class PercentDiscountPolicy implements DiscountPolicy {
  applyDiscount(amount: Money): Money {
    return amount.multiply(1 - this.percent / 100);
  }
}

// 미래에 추가될 정책 (기존 코드 수정 없이 확장)
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

## GRASP 적용 체크리스트

| 패턴 | 체크 항목 |
|------|----------|
| 정보 전문가 | 정보를 가진 객체가 책임을 가지는가? |
| 창조자 | 생성 책임이 적절한 객체에 있는가? |
| 낮은 결합도 | 인터페이스에 의존하는가? |
| 높은 응집도 | 관련 책임만 모여있는가? |
| 컨트롤러 | 시스템 이벤트를 처리하는 객체가 있는가? |
| 다형성 | 조건문이 다형성으로 대체되었는가? |
| 순수 가공물 | 기술적 책임이 분리되었는가? |
| 간접 참조 | 직접 결합이 인터페이스로 분리되었는가? |
| 변경 보호 | 변경 지점이 인터페이스로 보호되었는가? |

---

## 참고

- Craig Larman, "Applying UML and Patterns"
- 조영호, "오브젝트"
