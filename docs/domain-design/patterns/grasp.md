# GRASP 패턴

> General Responsibility Assignment Software Patterns
> 책임 할당의 기본 가이드라인

---

## 서문: 원칙 vs 패턴

| 구분 | 성격 | 예시 |
|------|------|------|
| **원칙 (Principle)** | 반드시 지켜야 함 - 위반 시 명확한 문제 발생 | SOLID, DRY, Hollywood, IoC |
| **패턴 (Pattern)** | 지키면 좋음 - 상황에 따른 가이드라인 | GRASP 9개 패턴 |

**GRASP는 "규칙"이 아닌 "가이드라인"입니다.**

- 모든 상황에 맹목적으로 적용하면 오히려 복잡해질 수 있음
- 트레이드오프를 이해하고 상황에 맞게 적용
- "왜 이렇게 설계했는가?"에 대한 근거로 활용

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

**가장 중요한 패턴** - 다른 모든 패턴의 기반

### 문제 (Problem)

정보를 가진 객체와 행동하는 객체가 분리되면:
- **Anemic Domain Model**: 도메인 객체가 데이터만 가지고 로직은 Service에 있음
- **Feature Envy**: 다른 객체의 데이터를 과도하게 사용
- **God Class**: 모든 로직이 한 곳에 집중

### 해결책 (Solution)

**데이터와 행동을 함께 두라** (Tell, Don't Ask)

```typescript
// ❌ Ask: 데이터를 꺼내서 외부에서 계산 (Anemic Domain)
class OrderService {
  calculateOrderTotal(order: Order): Money {
    let total = Money.zero();
    order.getItems().forEach((item) => {
      total = total.plus(item.getPrice().multiply(item.getQuantity()));
    });
    return total;
  }
}

// ✅ Tell: 정보를 가진 객체가 직접 계산 (Rich Domain)
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

### 언제 적용하는가?

- 새로운 책임을 할당할 때 **첫 번째로 고려**
- getter로 데이터를 꺼내 외부에서 처리하는 코드가 보일 때
- "이 로직이 어디에 있어야 하지?" 고민될 때

### 주의사항

- **정보 전문가 ≠ 모든 정보를 한 객체에**: 관련 정보만 모음
- **기술적 책임은 예외**: DB 저장, 이메일 발송 등은 Pure Fabrication으로
- **도메인 객체가 Infrastructure에 의존하면 안 됨**

### 관련 패턴

- **Tell, Don't Ask**: 정보 전문가의 실천 원칙
- **Anemic Domain Model (안티패턴)**: 정보 전문가 위반의 전형적 결과
- **High Cohesion**: 정보 전문가 적용 시 자연스럽게 달성

---

## 2. 창조자 (Creator)

> "다음 조건을 만족하는 객체에게 생성 책임을 할당하라."

### 문제 (Problem)

객체 생성 책임이 잘못 할당되면:
- 불필요한 결합도 증가
- 객체 생성 코드 중복
- 생성 로직 변경 시 여러 곳 수정

### 해결책 (Solution)

**BCIA 원칙** - 아래 조건 중 하나라도 만족하면 B가 A를 생성:

| 조건 | 설명 |
|------|------|
| **B contains A** | B가 A를 포함한다 (합성 관계) |
| **B records A** | B가 A를 기록한다 |
| **B closely uses A** | B가 A를 긴밀하게 사용한다 |
| **B has Initializing data for A** | B가 A 초기화에 필요한 데이터를 가진다 |

```typescript
// ✅ Order가 OrderItem을 포함 → Order가 생성
class Order {
  private readonly items: OrderItem[] = [];

  addItem(product: Product, quantity: number): void {
    const item = new OrderItem(product, quantity);
    this.items.push(item);
  }
}
```

### 언제 Factory로 분리하는가?

| 상황 | Creator | Factory |
|------|---------|---------|
| 단순 생성 | ✅ | |
| 복잡한 조립 로직 | | ✅ |
| 생성 조건에 따른 다른 타입 | | ✅ |
| 외부 의존성 필요 (DB 조회 등) | | ✅ |
| 테스트에서 생성 제어 필요 | | ✅ |

```typescript
// ✅ 복잡한 생성 → Factory 분리
class OrderFactory {
  constructor(
    private readonly discountPolicyResolver: DiscountPolicyResolver,
    private readonly taxCalculator: TaxCalculator,
  ) {}

  create(request: CreateOrderRequest): Order {
    const discountPolicy = this.discountPolicyResolver.resolve(request.customerId);
    const items = request.items.map(item => new OrderItem(item.product, item.quantity));
    return new Order({ items, discountPolicy, taxCalculator: this.taxCalculator });
  }
}
```

### 주의사항

- **Factory 과용 주의**: 단순 생성에 Factory는 오버엔지니어링
- **생성자 복잡도 관리**: 생성자 파라미터가 4개 이상이면 Factory 고려
- **순환 참조 주의**: Creator 패턴이 순환 의존을 만들 수 있음

### 관련 패턴

- **Factory Pattern**: Creator의 복잡한 경우 대안
- **Low Coupling**: Factory 분리는 결합도를 낮춤
- **Pure Fabrication**: Factory 자체가 순수 가공물

---

## 3. 컨트롤러 (Controller)

> "시스템 이벤트를 처리할 객체를 선택하라."

### 문제 (Problem)

시스템 이벤트 처리가 잘못 설계되면:
- **비대한 Controller**: 모든 로직이 Controller에 집중
- **UI와 비즈니스 로직 결합**: 재사용 불가
- **테스트 어려움**: 외부 의존성과 결합

### 해결책 (Solution)

**두 가지 Controller 스타일:**

| 스타일 | 용도 | 예시 |
|--------|------|------|
| **Use Case Controller** | 특정 시나리오 담당 | `CreateOrderUseCase` |
| **Facade Controller** | 관련 유스케이스 묶음 | `OrderFacade` |

```typescript
// ✅ Use Case Controller: 단일 시나리오에 집중
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

// ✅ Facade Controller: 관련 유스케이스 통합
class OrderFacade {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
    private readonly getOrderUseCase: GetOrderUseCase,
  ) {}

  createOrder(request): Promise<Order> {
    return this.createOrderUseCase.execute(request);
  }

  cancelOrder(orderId): Promise<void> {
    return this.cancelOrderUseCase.execute(orderId);
  }

  getOrder(orderId): Promise<OrderDTO> {
    return this.getOrderUseCase.execute(orderId);
  }
}
```

### 비대한 Controller 징후 (Anti-pattern)

```typescript
// ❌ 비대한 Controller
class OrderController {
  async createOrder(request: Request): Promise<Response> {
    // 검증 로직 (→ Validator로 분리)
    if (!request.customerId) throw new Error('...');

    // 비즈니스 로직 (→ Domain/UseCase로 분리)
    const discount = this.calculateDiscount(request);
    const tax = this.calculateTax(request);

    // 영속성 로직 (→ Repository로 분리)
    await this.database.query('INSERT INTO ...');

    // 알림 로직 (→ NotificationService로 분리)
    await this.emailService.send(...);

    return response;
  }
}
```

### 언제 적용하는가?

- UI 레이어에서 비즈니스 로직을 분리할 때
- 동일한 유스케이스가 여러 UI(Web, API, CLI)에서 사용될 때
- 테스트 가능한 비즈니스 로직이 필요할 때

### 주의사항

- **Controller는 조율자(Coordinator)**: 직접 로직 수행 X
- **입출력 변환만 담당**: DTO ↔ Domain 변환
- **트랜잭션 경계 관리**: 필요시 Controller에서

### 관련 패턴

- **Facade Pattern**: Facade Controller의 원형
- **High Cohesion**: Controller가 비대해지면 응집도 저하
- **SRP (SOLID)**: Controller의 단일 책임

---

## 4. 낮은 결합도 (Low Coupling)

> "불필요한 의존성을 제거하여 변경의 영향을 줄여라."

### 문제 (Problem)

결합도가 높으면:
- 한 모듈 변경 시 연쇄적 수정 필요
- 테스트 시 과도한 Mock 필요
- 재사용 어려움

### 해결책 (Solution)

**결합도 종류 (나쁜 순서):**

| 종류 | 설명 | 예시 |
|------|------|------|
| **내용 결합** | 다른 모듈 내부 직접 접근 | `obj._privateField` |
| **공통 결합** | 전역 데이터 공유 | 전역 변수, 싱글턴 남용 |
| **외부 결합** | 외부 데이터 형식 공유 | 동일 파일 포맷 의존 |
| **제어 결합** | 제어 플래그 전달 | `process(data, isAdmin)` |
| **스탬프 결합** | 필요 이상의 데이터 전달 | 전체 객체 전달 |
| **데이터 결합** | 필요한 데이터만 전달 | 기본 타입 파라미터 ✅ |

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
    private readonly notifier: Notifier,  // 인터페이스
  ) {}

  processPayment(order: Order): void {
    const tax = this.taxCalculator.calculate(order);
    this.notifier.notify(order.getCustomer());
  }
}
```

### 결합도 측정 방법

- **Fan-out**: 이 모듈이 의존하는 모듈 수 (낮을수록 좋음)
- **Fan-in**: 이 모듈에 의존하는 모듈 수 (높으면 핵심 모듈)
- **Instability**: Fan-out / (Fan-in + Fan-out) (0에 가까울수록 안정)

### 주의사항

- **결합도 0은 불가능**: 적절한 결합은 필요
- **간접 참조 과용 주의**: 모든 것을 인터페이스화하면 복잡도 증가
- **안정된 모듈에 의존**: 자주 변하는 모듈에 의존 피하기

### 관련 패턴

- **DIP (SOLID)**: 추상화에 의존하여 결합도 낮춤
- **Indirection**: 간접 참조로 결합도 관리
- **IoC**: 의존성 역전으로 결합도 제어

---

## 5. 높은 응집도 (High Cohesion)

> "관련 있는 책임만 모아서 객체의 복잡도를 낮춰라."

### 문제 (Problem)

응집도가 낮으면:
- 이해하기 어려움 (여러 개념이 섞임)
- 재사용 어려움 (필요 없는 기능도 함께 가져옴)
- 변경 시 예상치 못한 영향

### 해결책 (Solution)

**응집도 종류 (좋은 순서):**

| 종류 | 설명 | 예시 |
|------|------|------|
| **기능적 응집** | 단일 기능 수행 | `TaxCalculator.calculate()` ✅ |
| **순차적 응집** | 출력이 다음 입력 | 파이프라인 처리 |
| **통신적 응집** | 같은 데이터 사용 | 같은 레코드 처리 |
| **절차적 응집** | 특정 순서 실행 | 초기화 루틴 |
| **시간적 응집** | 같은 시점 실행 | 시작/종료 처리 |
| **논리적 응집** | 논리적으로 분류됨 | Utils, Helpers ❌ |
| **우연적 응집** | 관련 없는 기능들 | 아무 관련 없음 ❌ |

```typescript
// ❌ 낮은 응집도: 관련 없는 책임들 (논리적/우연적)
class OrderManager {
  createOrder() {}      // 주문 생성
  calculateTax() {}     // 세금 계산
  sendEmail() {}        // 이메일 발송
  generateReport() {}   // 리포트 생성
  validateCreditCard() {} // 카드 검증
}

// ✅ 높은 응집도: 관련 책임만 모음 (기능적)
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

### 응집도 측정 지표

- **LCOM (Lack of Cohesion of Methods)**: 메서드 간 공유 필드 비율
  - LCOM = 0: 완벽한 응집 (모든 메서드가 모든 필드 사용)
  - LCOM 높음: 클래스 분리 필요
- **단일 책임 테스트**: "이 클래스의 책임을 한 문장으로 설명할 수 있는가?"

### 주의사항

- **과도한 분리 주의**: 너무 작은 클래스는 오히려 이해 어려움
- **Utils/Helpers 경계**: 관련 없는 함수 모음은 낮은 응집
- **응집도 vs 편의성**: 때때로 실용적 타협 필요

### 관련 패턴

- **SRP (SOLID)**: 높은 응집도의 다른 표현
- **Information Expert**: 관련 정보와 행동을 함께 두면 응집도 증가
- **Low Coupling**: 응집도가 높으면 자연스럽게 결합도 낮아짐

---

## 6. 간접 참조 (Indirection)

> "두 객체 사이의 직접 결합을 피하기 위해 중간 객체를 도입하라."

### 문제 (Problem)

직접 결합의 문제:
- 구현 변경 시 클라이언트도 변경
- 테스트 시 실제 구현 필요
- 대체 구현으로 교체 어려움

### 해결책 (Solution)

**중간 객체(인터페이스)를 통한 간접 결합:**

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

### 간접 참조의 형태

| 형태 | 설명 | 예시 |
|------|------|------|
| **인터페이스** | 계약으로 분리 | `Repository` interface |
| **어댑터** | 호환성 제공 | `LegacySystemAdapter` |
| **파사드** | 복잡성 숨김 | `PaymentFacade` |
| **프록시** | 접근 제어 | `CachingProxy` |

### 트레이드오프: 복잡도 vs 유연성

| | 직접 결합 | 간접 참조 |
|---|---|---|
| **이해 용이성** | ✅ 쉬움 | ❌ 추적 필요 |
| **유연성** | ❌ 경직 | ✅ 교체 가능 |
| **테스트 용이성** | ❌ 어려움 | ✅ Mock 가능 |
| **코드량** | ✅ 적음 | ❌ 더 많음 |

### 언제 적용하는가?

- 구현이 변경될 가능성이 있을 때
- 테스트에서 대체 구현이 필요할 때
- 외부 시스템과 연동할 때

### 주의사항

- **"All problems can be solved by adding another level of indirection, except too many levels of indirection"**
- 간접 참조를 추가할 때마다 복잡도 증가
- 명확한 이유 없이 추가하지 말 것

### 관련 패턴

- **Adapter, Facade, Proxy**: 간접 참조의 구체적 형태
- **Low Coupling**: 간접 참조의 목적
- **Protected Variations**: 변경 보호를 위한 간접 참조

---

## 7. 다형성 (Polymorphism)

> "타입에 따라 다르게 동작해야 할 때, 조건문 대신 다형성을 사용하라."

### 문제 (Problem)

조건문으로 타입을 분기하면:
- 새 타입 추가 시 모든 조건문 수정 필요 (OCP 위반)
- 타입별 로직이 여러 곳에 분산
- 조건문 누락 가능성

```typescript
// ❌ 조건문으로 타입 분기
function calculateDiscount(order: Order): Money {
  if (order.type === 'PERCENT') {
    return order.amount.multiply(0.1);
  } else if (order.type === 'AMOUNT') {
    return Money.of(1000);
  } else if (order.type === 'TIERED') {  // 새 타입 추가 시 수정
    return order.amount.isGreaterThan(Money.of(100000))
      ? order.amount.multiply(0.15)
      : order.amount.multiply(0.05);
  }
  throw new Error('Unknown type');
}
```

### 해결책 (Solution)

**인터페이스 + 구현체로 타입별 동작 분리:**

```typescript
// ✅ 다형성으로 해결
interface DiscountPolicy {
  applyDiscount(amount: Money): Money;
}

class PercentDiscountPolicy implements DiscountPolicy {
  constructor(private readonly percent: number) {}

  applyDiscount(amount: Money): Money {
    return amount.multiply(1 - this.percent / 100);
  }
}

class AmountDiscountPolicy implements DiscountPolicy {
  constructor(private readonly discountAmount: Money) {}

  applyDiscount(amount: Money): Money {
    return amount.minus(this.discountAmount);
  }
}

// 새 타입 추가: 기존 코드 수정 없이 확장
class TieredDiscountPolicy implements DiscountPolicy {
  applyDiscount(amount: Money): Money {
    if (amount.isGreaterThan(Money.of(100000))) {
      return amount.multiply(0.85);
    }
    return amount.multiply(0.95);
  }
}

// 클라이언트 코드는 변경 없음
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

### 다형성 적용 신호

- `if/else` 또는 `switch`가 타입을 검사할 때
- 동일한 조건문이 여러 곳에 반복될 때
- 새 타입 추가 시 여러 파일 수정이 필요할 때

### 주의사항

- **조건문이 항상 나쁜 것은 아님**: 단순하고 변하지 않는 조건은 그대로
- **과도한 클래스 폭발**: 타입이 너무 많으면 다른 방법 고려
- **타입 수가 고정적이면**: 다형성보다 조건문이 나을 수 있음

### 관련 패턴

- **Strategy Pattern**: 다형성의 대표적 구현
- **OCP (SOLID)**: 다형성으로 OCP 달성
- **Protected Variations**: 다형성으로 변경 보호

---

## 8. 순수 가공물 (Pure Fabrication)

> "도메인 개념이 아니지만 높은 응집도와 낮은 결합도를 위해 인위적으로 만든 객체."

### 문제 (Problem)

정보 전문가만 따르면:
- 도메인 객체에 기술적 책임이 섞임 (DB 접근, 외부 API 등)
- 도메인 순수성 훼손
- 테스트 어려움 (Infrastructure 의존)

### 해결책 (Solution)

**도메인에 없는 기술적 객체를 만들어 책임 분리:**

| 순수 가공물 | 책임 | 특징 |
|------------|------|------|
| **Repository** | 영속성 관리 | 도메인 ↔ DB 변환 |
| **Service** | 도메인 횡단 로직 | 여러 도메인 조율 |
| **Mapper** | 데이터 변환 | Entity ↔ DTO |
| **Factory** | 복잡한 객체 생성 | 생성 로직 캡슐화 |
| **Specification** | 복잡한 조건 | 조건 재사용 |

```typescript
// ✅ Repository: 도메인 개념 X, 기술적 책임
class OrderRepository {
  constructor(private readonly database: Database) {}

  async findById(orderId: string): Promise<Order | null> {
    const row = await this.database.executeQuery('SP_Order_Select', [orderId]);
    return row ? OrderMapper.toDomain(row) : null;
  }

  async save(order: Order): Promise<void> {
    const data = OrderMapper.toData(order);
    await this.database.executeQuery('SP_Order_Save', [data]);
  }
}

// ✅ Mapper: Entity ↔ DTO 변환
class OrderMapper {
  static toDomain(row: OrderRow): Order {
    return new Order({
      orderId: OrderId.of(row.order_id),
      items: row.items.map(ItemMapper.toDomain),
      status: OrderStatus.from(row.status),
    });
  }

  static toDTO(entity: Order): OrderDTO {
    return {
      orderId: entity.orderId.toString(),
      total: entity.calculateTotal().toNumber(),
      status: entity.status.toString(),
    };
  }
}

// ✅ Specification: 복잡한 조건 캡슐화
class HighValueOrderSpecification {
  constructor(private readonly threshold: Money) {}

  isSatisfiedBy(order: Order): boolean {
    return order.calculateTotal().isGreaterThan(this.threshold);
  }
}
```

### 언제 적용하는가?

- 도메인 객체에 기술적 책임을 넣으면 안 될 때
- 정보 전문가 적용 시 응집도가 낮아질 때
- 재사용 가능한 기술적 컴포넌트가 필요할 때

### 주의사항

- **남용 시 도메인 빈약**: 모든 로직이 Service로 가면 Anemic Domain
- **적절한 균형**: 도메인 로직은 도메인에, 기술적 로직만 분리
- **이름에 도메인 의미 포함 금지**: `OrderPersistenceService` (X) → `OrderRepository` (O)

### 관련 패턴

- **Repository Pattern**: 순수 가공물의 대표 예
- **Information Expert**: 순수 가공물은 정보 전문가의 예외
- **High Cohesion**: 순수 가공물의 목적

---

## 9. 변경 보호 (Protected Variations)

> "변경이 예상되는 지점을 인터페이스 뒤로 숨겨라."

### 문제 (Problem)

변경 가능한 부분이 직접 노출되면:
- 변경 시 연쇄적 수정 필요
- 변경 영향 범위 예측 어려움
- 시스템 경직화

### 해결책 (Solution)

**인터페이스로 변경 지점 캡슐화:**

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
      return amount.multiply(0.85);
    }
    return amount.multiply(0.95);
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

### 변경 예측 포인트

| 영역 | 변경 가능성 높음 | 보호 방법 |
|------|-----------------|----------|
| **외부 시스템** | API, 데이터 형식 | Adapter/Gateway |
| **비즈니스 규칙** | 할인, 정책, 검증 | Strategy/Policy |
| **데이터 저장소** | DB, 캐시 | Repository |
| **알림 채널** | Email, SMS, Push | Notification Interface |
| **인증 방식** | OAuth, JWT | Auth Provider |

### 과도한 추상화 주의

```typescript
// ❌ 과도한 추상화: 변하지 않는 것까지 추상화
interface StringFormatter {
  format(str: string): string;
}

class SimpleStringFormatter implements StringFormatter {
  format(str: string): string {
    return str.trim();  // trim()이 변할 일이 있는가?
  }
}

// ✅ 변하지 않는 것은 직접 사용
const trimmed = str.trim();
```

### 변경 예측 기준

**추상화해야 할 때:**
- 요구사항에서 "나중에 바뀔 수 있다"고 언급
- 외부 시스템과 연동
- 비즈니스 규칙 (정책, 할인, 검증 등)
- 과거에 실제로 변경된 이력

**직접 사용해도 될 때:**
- 언어/프레임워크 기본 기능
- 매우 안정적인 라이브러리
- 내부 유틸리티
- 변경 이력이 없고 예측도 안 되는 것

### 주의사항

- **"모든 것을 추상화"는 안티패턴**: 복잡도만 증가
- **YAGNI**: 실제 필요할 때까지 추상화 미루기
- **변경 예측은 어려움**: 과거 변경 이력을 참고

### 관련 패턴

- **OCP (SOLID)**: 변경 보호의 다른 표현
- **Polymorphism**: 변경 보호 구현 방법
- **Indirection**: 변경 보호를 위한 간접 참조

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

## 패턴 간 관계

```
┌─────────────────────────────────────────────────────────────────┐
│                        GRASP 패턴 관계도                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Information Expert ──────────────► High Cohesion             │
│         │                                  │                    │
│         │ 예외                             │ 달성                │
│         ▼                                  ▼                    │
│   Pure Fabrication ─────────────────► Low Coupling             │
│                                            │                    │
│                                            │ 방법                │
│                                            ▼                    │
│   Protected Variations ◄───────────── Indirection              │
│         │                                  │                    │
│         │ 구현                             │ 구현                │
│         ▼                                  ▼                    │
│     Polymorphism ◄──────────────────── Controller              │
│                                                                 │
│   Creator: 객체 생성 책임의 독립적 가이드                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 참고

- Craig Larman, "Applying UML and Patterns"
- 조영호, "오브젝트"
- Martin Fowler, "Patterns of Enterprise Application Architecture"
