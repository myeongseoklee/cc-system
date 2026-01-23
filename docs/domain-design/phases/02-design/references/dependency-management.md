# 의존성 관리

> "좋은 설계란 의존성을 적절히 관리하는 설계다."

---

## 결합도 (Coupling)

**결합도는 한 요소가 다른 요소를 알고 있는 정도**

### 결합도의 종류 (약함 → 강함)

```typescript
// 1. 추상 결합 (가장 약함) - 인터페이스에만 의존
class PaymentService {
  constructor(private readonly gateway: PaymentGateway) {} // 인터페이스
}

// 2. 구체 결합 - 구체 클래스에 의존
class PaymentService {
  constructor(private readonly gateway: TossPaymentGateway) {} // 구체 클래스
}

// 3. 내용 결합 (가장 강함) - 내부 구현에 직접 접근
class PaymentService {
  process(gateway: TossPaymentGateway): void {
    gateway.internalState = 'processing'; // 내부 상태 직접 변경
  }
}
```

### 낮은 결합도 달성

```typescript
// ✅ 1. 인터페이스에 의존
interface OrderRepository {
  save(order: Order): Promise<Order>;
  findById(id: string): Promise<Order | null>;
}

// ✅ 2. 의존성 주입
class CreateOrderUseCase {
  constructor(private readonly repository: OrderRepository) {}
}

// ✅ 3. 구체 클래스에 직접 의존하지 않음
// ❌ const repository = new MySQLOrderRepository();
// ✅ 외부에서 주입
```

---

## 응집도 (Cohesion)

**응집도는 한 모듈 내의 요소들이 얼마나 관련되어 있는지**

### 응집도의 종류 (낮음 → 높음)

```typescript
// 1. 우연적 응집 (가장 낮음) - 관련 없는 것들의 모음
class Utils {
  formatDate() {}
  calculateTax() {}
  sendEmail() {}
  parseJSON() {}
}

// 2. 논리적 응집 - 논리적으로 분류된 것들
class DataProcessor {
  processOrder() {}
  processPayment() {}
  processShipping() {}
}

// 3. 기능적 응집 (가장 높음) - 단일 책임 수행
class OrderProcessor {
  validate(order: Order): ValidationResult {}
  calculate(order: Order): Money {}
  process(order: Order): ProcessedOrder {}
}
```

### 높은 응집도 달성

```typescript
// ✅ 변경의 이유가 하나인 클래스
class Money {
  // 오직 금액 계산에 관한 책임만
  plus(other: Money): Money {}
  minus(other: Money): Money {}
  multiply(ratio: number): Money {}
}

// ✅ 함께 변경되는 것들을 모아라
class OrderSummary {
  // 주문 요약 데이터에 관한 것들만
  readonly subtotal: Money;
  readonly discount: Money;

  getTotal(): Money {
    return this.subtotal.minus(this.discount);
  }
}
```

---

## 디미터 법칙 (Law of Demeter)

> "오직 하나의 점(.)만 사용하라" - 최소 지식 원칙

**메서드 내에서 다음 객체의 메서드만 호출:**
1. this 객체
2. 메서드의 매개변수
3. this의 속성
4. 메서드 내에서 생성된 객체

```typescript
// ❌ 디미터 법칙 위반 (기차 충돌)
class PaymentService {
  process(order: Order): void {
    const balance = order.getCustomer().getWallet().getBalance();
    // ...
  }
}

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

## 명령-쿼리 분리 (CQS)

> "질문을 하는 것이 답을 수정해서는 안 된다."

- **명령(Command)**: 상태를 변경하지만 값을 반환하지 않음
- **쿼리(Query)**: 값을 반환하지만 상태를 변경하지 않음

```typescript
// ❌ 명령과 쿼리 혼합
class Stack<T> {
  pop(): T {  // 상태 변경 + 값 반환
    const item = this.items[this.items.length - 1];
    this.items.length--;
    return item;
  }
}

// ✅ 명령과 쿼리 분리
class Stack<T> {
  peek(): T { return this.items[this.items.length - 1]; }  // 쿼리
  remove(): void { this.items.length--; }                   // 명령
}

// ✅ 실무에서의 CQS
class OrderService {
  findOrder(id: string): Order { ... }       // 쿼리: 조회만
  cancelOrder(id: string): void { ... }      // 명령: 상태 변경만
}
```

---

## 계약에 의한 설계

- **사전조건**: 메서드 호출 전 클라이언트가 보장해야 할 조건
- **사후조건**: 메서드 실행 후 서버가 보장해야 할 조건
- **불변식**: 항상 참이어야 하는 조건

```typescript
class Money {
  constructor(amount: number) {
    // 사전조건: 음수 금액 불가
    if (amount < 0) {
      throw new Error('금액은 음수일 수 없습니다');
    }
    this.amount = new Decimal(amount);
  }

  // 사후조건: 결과는 항상 Money 타입
  plus(other: Money): Money {
    return new Money(this.amount.plus(other.amount).toNumber());
  }
}
```

---

## 체크리스트

- [ ] 인터페이스에 의존하는가? (낮은 결합도)
- [ ] 관련 책임만 모여있는가? (높은 응집도)
- [ ] 디미터 법칙을 준수하는가?
- [ ] 명령과 쿼리가 분리되었는가?
- [ ] 사전/사후 조건이 명확한가?
