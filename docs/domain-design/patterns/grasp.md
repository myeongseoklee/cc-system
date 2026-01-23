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

```typescript
// ❌ Anemic Domain Model: 도메인 객체가 데이터만 보유
class Order {
  public customerId: string;
  public items: OrderItem[];
  public status: string;
  public createdAt: Date;
  // getter/setter만 있고 로직 없음
}

// 로직이 Service에 분산
class OrderService {
  calculateTotal(order: Order): Money { ... }
  canCancel(order: Order): boolean { ... }
  applyDiscount(order: Order, discount: Discount): void { ... }
}
```

```typescript
// ❌ Feature Envy: 다른 객체의 데이터를 과도하게 사용
class ReportGenerator {
  generateOrderReport(order: Order): Report {
    // Order의 내부 데이터를 과도하게 참조
    const customerName = order.getCustomer().getName();
    const customerEmail = order.getCustomer().getEmail();
    const customerPhone = order.getCustomer().getPhone();
    const total = order.getItems().reduce((sum, item) =>
      sum + item.getPrice() * item.getQuantity(), 0);
    const discount = order.getDiscount().getPercent() * total;
    // ... Order가 해야 할 일을 ReportGenerator가 수행
  }
}
```

```typescript
// ❌ God Class: 모든 로직이 한 곳에 집중
class OrderManager {
  // 주문 관련
  createOrder() {}
  cancelOrder() {}
  updateOrder() {}

  // 결제 관련
  processPayment() {}
  refundPayment() {}

  // 배송 관련
  scheduleDelivery() {}
  trackDelivery() {}

  // 알림 관련
  sendOrderConfirmation() {}
  sendShippingNotification() {}

  // 리포트 관련
  generateDailyReport() {}
  generateMonthlyReport() {}
}
```

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

```typescript
// 적용 전: getter로 데이터를 꺼내 외부에서 처리
class ShippingCalculator {
  calculate(order: Order): Money {
    const weight = order.getItems().reduce(
      (total, item) => total + item.getProduct().getWeight() * item.getQuantity(),
      0
    );
    const destination = order.getShippingAddress().getZipCode();
    return this.calculateByWeightAndDestination(weight, destination);
  }
}

// 적용 후: 정보를 가진 객체가 직접 계산
class Order {
  getTotalWeight(): number {
    return this.items.reduce(
      (total, item) => total + item.getTotalWeight(),
      0
    );
  }
}

class OrderItem {
  getTotalWeight(): number {
    return this.product.getWeight() * this.quantity;
  }
}

class ShippingCalculator {
  calculate(order: Order): Money {
    const weight = order.getTotalWeight();  // Tell, Don't Ask
    const destination = order.getDestinationZipCode();
    return this.calculateByWeightAndDestination(weight, destination);
  }
}
```

### 주의사항

- **정보 전문가 ≠ 모든 정보를 한 객체에**: 관련 정보만 모음
- **기술적 책임은 예외**: DB 저장, 이메일 발송 등은 Pure Fabrication으로
- **도메인 객체가 Infrastructure에 의존하면 안 됨**

```typescript
// ❌ 도메인 객체가 Infrastructure에 의존
class Order {
  private readonly emailService: EmailService;
  private readonly database: Database;

  complete(): void {
    this.status = OrderStatus.COMPLETED;
    this.database.save(this);  // Infrastructure 의존
    this.emailService.send(this.customer.email, 'Order completed');  // Infrastructure 의존
  }
}

// ✅ 도메인 객체는 순수하게, 기술적 책임은 분리
class Order {
  complete(): void {
    this.status = OrderStatus.COMPLETED;
    this.events.push(new OrderCompletedEvent(this.orderId));
  }
}

// 기술적 책임은 Pure Fabrication으로
class OrderCompletedHandler {
  constructor(
    private readonly repository: OrderRepository,
    private readonly emailService: EmailService,
  ) {}

  handle(event: OrderCompletedEvent): void {
    const order = this.repository.findById(event.orderId);
    this.repository.save(order);
    this.emailService.sendOrderCompletedEmail(order.customer.email);
  }
}
```

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

```typescript
// ❌ 잘못된 생성 책임 할당: 관련 없는 객체가 생성
class ReportService {
  generateOrderReport(orderId: string): Report {
    // ReportService가 OrderItem을 생성할 이유가 없음
    const item = new OrderItem(product, quantity);
    // ...
  }
}

// ❌ 생성 코드 중복
class OrderController {
  createOrder(request: Request): Response {
    const item = new OrderItem(request.product, request.quantity);  // 중복 1
    // ...
  }
}

class CartService {
  addToCart(product: Product, quantity: number): void {
    const item = new OrderItem(product, quantity);  // 중복 2
    // ...
  }
}
```

### 해결책 (Solution)

**BCIA 원칙** - 아래 조건 중 하나라도 만족하면 B가 A를 생성:

| 조건 | 설명 | 코드 예시 |
|------|------|----------|
| **B contains A** | B가 A를 포함한다 (합성 관계) | Order가 OrderItem 포함 |
| **B records A** | B가 A를 기록한다 | Log가 LogEntry 기록 |
| **B closely uses A** | B가 A를 긴밀하게 사용한다 | Parser가 Token 생성 |
| **B has Initializing data for A** | B가 A 초기화에 필요한 데이터를 가진다 | Customer가 Address 생성 |

```typescript
// ✅ B contains A: Order가 OrderItem을 포함 → Order가 생성
class Order {
  private readonly items: OrderItem[] = [];

  addItem(product: Product, quantity: number): void {
    const item = new OrderItem(product, quantity);
    this.items.push(item);
  }
}
```

```typescript
// ✅ B records A: Log가 LogEntry를 기록 → Log가 생성
class Log {
  private readonly entries: LogEntry[] = [];

  addEntry(level: LogLevel, message: string): void {
    const entry = new LogEntry(level, message, new Date());
    this.entries.push(entry);
  }
}
```

```typescript
// ✅ B closely uses A: Parser가 Token을 긴밀하게 사용 → Parser가 생성
class Parser {
  parse(input: string): AST {
    const tokens: Token[] = [];
    for (const char of input) {
      const token = new Token(this.tokenize(char));
      tokens.push(token);
    }
    return this.buildAST(tokens);
  }
}
```

```typescript
// ✅ B has Initializing data for A: Customer가 Address 초기화 데이터 보유 → Customer가 생성
class Customer {
  private addresses: Address[] = [];

  addAddress(street: string, city: string, zipCode: string): void {
    const address = new Address(street, city, zipCode, this.id);
    this.addresses.push(address);
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
// ✅ 단순 생성 → Creator 패턴 사용
class Order {
  addItem(product: Product, quantity: number): void {
    const item = new OrderItem(product, quantity);  // 단순 생성
    this.items.push(item);
  }
}

// ✅ 복잡한 조립 로직 → Factory 분리
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

// ✅ 생성 조건에 따른 다른 타입 → Factory 분리
class NotificationFactory {
  create(type: NotificationType, content: string): Notification {
    switch (type) {
      case NotificationType.EMAIL:
        return new EmailNotification(content);
      case NotificationType.SMS:
        return new SMSNotification(content);
      case NotificationType.PUSH:
        return new PushNotification(content);
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
  }
}

// ✅ 외부 의존성 필요 → Factory 분리
class UserFactory {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async create(request: CreateUserRequest): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      throw new DuplicateEmailError(request.email);
    }
    const hashedPassword = await this.passwordHasher.hash(request.password);
    return new User({
      email: request.email,
      password: hashedPassword,
      role: request.role ?? UserRole.MEMBER,
    });
  }
}
```

### 주의사항

- **Factory 과용 주의**: 단순 생성에 Factory는 오버엔지니어링
- **생성자 복잡도 관리**: 생성자 파라미터가 4개 이상이면 Factory 고려
- **순환 참조 주의**: Creator 패턴이 순환 의존을 만들 수 있음

```typescript
// ❌ 순환 참조 위험
class Order {
  constructor(private readonly customer: Customer) {}
}

class Customer {
  createOrder(): Order {
    return new Order(this);  // Customer → Order
  }
}

// Order도 Customer를 생성하면 순환 참조

// ✅ Factory로 순환 참조 해결
class OrderFactory {
  create(customer: Customer, items: OrderItem[]): Order {
    return new Order({ customerId: customer.id, items });
  }
}
```

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

```typescript
// ❌ UI와 비즈니스 로직 결합
class OrderButton {
  onClick(): void {
    // UI 컴포넌트가 직접 비즈니스 로직 수행
    const order = new Order(this.items);
    const total = order.calculateTotal();
    const tax = total * 0.1;

    // DB 직접 접근
    database.query('INSERT INTO orders...');

    // 이메일 직접 발송
    emailService.send(customer.email, 'Order confirmed');
  }
}
```

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

// ✅ 올바르게 분리된 Controller
class OrderController {
  constructor(private readonly createOrderUseCase: CreateOrderUseCase) {}

  async createOrder(request: Request): Promise<Response> {
    // Controller는 변환과 위임만 담당
    const dto = CreateOrderDTO.fromRequest(request);
    const result = await this.createOrderUseCase.execute(dto);
    return Response.ok(OrderResponseDTO.from(result));
  }
}
```

### 언제 적용하는가?

- UI 레이어에서 비즈니스 로직을 분리할 때
- 동일한 유스케이스가 여러 UI(Web, API, CLI)에서 사용될 때
- 테스트 가능한 비즈니스 로직이 필요할 때

```typescript
// ✅ 동일한 UseCase를 여러 UI에서 재사용
class CreateOrderUseCase {
  async execute(request: CreateOrderRequest): Promise<Order> {
    // 비즈니스 로직
  }
}

// Web Controller
class WebOrderController {
  constructor(private readonly useCase: CreateOrderUseCase) {}

  async handleSubmit(formData: FormData): Promise<void> {
    const request = this.mapFormToRequest(formData);
    await this.useCase.execute(request);
  }
}

// REST API Controller
class ApiOrderController {
  constructor(private readonly useCase: CreateOrderUseCase) {}

  @Post('/orders')
  async create(@Body() dto: CreateOrderDTO): Promise<OrderResponse> {
    return this.useCase.execute(dto);
  }
}

// CLI Controller
class CliOrderController {
  constructor(private readonly useCase: CreateOrderUseCase) {}

  async handleCommand(args: string[]): Promise<void> {
    const request = this.parseArgs(args);
    await this.useCase.execute(request);
  }
}
```

### 주의사항

- **Controller는 조율자(Coordinator)**: 직접 로직 수행 X
- **입출력 변환만 담당**: DTO ↔ Domain 변환
- **트랜잭션 경계 관리**: 필요시 Controller에서

```typescript
// ✅ Controller의 역할: 조율, 변환, 트랜잭션 경계
class OrderController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly transactionManager: TransactionManager,
  ) {}

  async createOrder(request: Request): Promise<Response> {
    // 1. 입력 변환
    const dto = CreateOrderDTO.fromRequest(request);

    // 2. 트랜잭션 경계 관리
    const result = await this.transactionManager.runInTransaction(async () => {
      return this.createOrderUseCase.execute(dto);
    });

    // 3. 출력 변환
    return Response.ok(OrderResponseDTO.from(result));
  }
}
```

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

#### 1. 내용 결합 (Content Coupling) - 최악

다른 모듈의 내부를 직접 접근/수정

```typescript
// ❌ 내용 결합: 다른 객체의 private 필드 직접 접근
class OrderService {
  calculateTotal(order: Order): Money {
    // Order의 내부 구현에 직접 접근
    return (order as any)._items.reduce(
      (sum: number, item: any) => sum + item._price * item._quantity,
      0
    );
  }
}

// ✅ 개선: public 인터페이스 사용
class OrderService {
  calculateTotal(order: Order): Money {
    return order.calculateTotal();  // 캡슐화된 메서드 호출
  }
}
```

#### 2. 공통 결합 (Common Coupling)

전역 데이터 공유

```typescript
// ❌ 공통 결합: 전역 변수/싱글턴 공유
const globalConfig = {
  taxRate: 0.1,
  discountRate: 0.05,
};

class OrderCalculator {
  calculate(amount: number): number {
    return amount * (1 + globalConfig.taxRate);  // 전역 의존
  }
}

class DiscountService {
  apply(amount: number): number {
    return amount * (1 - globalConfig.discountRate);  // 같은 전역 의존
  }
}

// ✅ 개선: 의존성 주입
class OrderCalculator {
  constructor(private readonly taxRate: number) {}

  calculate(amount: number): number {
    return amount * (1 + this.taxRate);
  }
}
```

#### 3. 외부 결합 (External Coupling)

외부 데이터 형식/프로토콜에 의존

```typescript
// ❌ 외부 결합: 특정 파일 형식에 직접 의존
class ReportGenerator {
  generate(data: OrderData): void {
    // CSV 형식에 직접 결합
    const csv = `${data.id},${data.amount},${data.date}\n`;
    fs.writeFileSync('report.csv', csv);
  }
}

// ✅ 개선: 형식을 추상화
interface ReportFormatter {
  format(data: OrderData): string;
  getExtension(): string;
}

class CsvFormatter implements ReportFormatter {
  format(data: OrderData): string {
    return `${data.id},${data.amount},${data.date}\n`;
  }
  getExtension(): string { return 'csv'; }
}

class JsonFormatter implements ReportFormatter {
  format(data: OrderData): string {
    return JSON.stringify(data);
  }
  getExtension(): string { return 'json'; }
}

class ReportGenerator {
  constructor(private readonly formatter: ReportFormatter) {}

  generate(data: OrderData): void {
    const content = this.formatter.format(data);
    fs.writeFileSync(`report.${this.formatter.getExtension()}`, content);
  }
}
```

#### 4. 제어 결합 (Control Coupling)

제어 플래그로 동작 변경

```typescript
// ❌ 제어 결합: 플래그로 동작 제어
class UserService {
  getUser(id: string, isAdmin: boolean, includeDeleted: boolean): User {
    let query = 'SELECT * FROM users WHERE id = ?';
    if (isAdmin) {
      query += ' AND role = "admin"';
    }
    if (includeDeleted) {
      query += ' OR deleted = true';
    }
    // ...
  }
}

// ✅ 개선: 별도 메서드로 분리
class UserService {
  getUser(id: string): User {
    return this.repository.findById(id);
  }

  getAdmin(id: string): User {
    return this.repository.findAdminById(id);
  }

  getUserIncludingDeleted(id: string): User {
    return this.repository.findByIdIncludingDeleted(id);
  }
}
```

#### 5. 스탬프 결합 (Stamp Coupling)

필요 이상의 데이터 전달

```typescript
// ❌ 스탬프 결합: 전체 객체 전달 (일부만 사용)
class EmailService {
  sendWelcomeEmail(user: User): void {
    // User의 email만 필요한데 전체 User 객체 전달
    this.send(user.email, 'Welcome!');
  }
}

// ✅ 개선: 필요한 데이터만 전달
class EmailService {
  sendWelcomeEmail(email: string): void {
    this.send(email, 'Welcome!');
  }
}

// 또는 인터페이스로 필요한 부분만 정의
interface HasEmail {
  email: string;
}

class EmailService {
  sendWelcomeEmail(recipient: HasEmail): void {
    this.send(recipient.email, 'Welcome!');
  }
}
```

#### 6. 데이터 결합 (Data Coupling) - 가장 좋음

필요한 데이터만 전달

```typescript
// ✅ 데이터 결합: 필요한 기본 타입만 전달
class TaxCalculator {
  calculate(amount: number, taxRate: number): number {
    return amount * taxRate;
  }
}

class ShippingCalculator {
  calculate(weight: number, distance: number): number {
    return weight * distance * 0.01;
  }
}
```

### 전체 예시: 높은 결합도 → 낮은 결합도

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

```typescript
// 예시: OrderService의 결합도 분석
class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,   // 의존 1
    private readonly paymentService: PaymentService,     // 의존 2
    private readonly notificationService: NotificationService, // 의존 3
  ) {}
}

// Fan-out = 3 (3개 모듈에 의존)
// Fan-in = ? (OrderService를 사용하는 모듈 수)
// Instability = Fan-out / (Fan-in + Fan-out)
```

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

#### 1. 기능적 응집 (Functional Cohesion) - 가장 좋음

단일 기능 수행, 모든 요소가 하나의 목표에 기여

```typescript
// ✅ 기능적 응집: 세금 계산이라는 단일 기능
class TaxCalculator {
  private readonly taxRates: Map<string, number>;

  constructor(taxRates: Map<string, number>) {
    this.taxRates = taxRates;
  }

  calculate(amount: Money, region: string): Money {
    const rate = this.getTaxRate(region);
    return amount.multiply(rate);
  }

  private getTaxRate(region: string): number {
    return this.taxRates.get(region) ?? 0.1;
  }
}
```

#### 2. 순차적 응집 (Sequential Cohesion)

한 요소의 출력이 다음 요소의 입력

```typescript
// ✅ 순차적 응집: 파이프라인 처리
class OrderProcessor {
  process(rawOrder: RawOrderData): ProcessedOrder {
    const validated = this.validate(rawOrder);        // 검증 →
    const enriched = this.enrich(validated);          // 보강 →
    const calculated = this.calculateTotals(enriched); // 계산 →
    return this.finalize(calculated);                 // 완료
  }

  private validate(data: RawOrderData): ValidatedOrder { ... }
  private enrich(order: ValidatedOrder): EnrichedOrder { ... }
  private calculateTotals(order: EnrichedOrder): CalculatedOrder { ... }
  private finalize(order: CalculatedOrder): ProcessedOrder { ... }
}
```

#### 3. 통신적 응집 (Communicational Cohesion)

같은 데이터를 사용하는 요소들

```typescript
// ✅ 통신적 응집: 같은 Order 데이터를 다루는 메서드들
class OrderReporter {
  constructor(private readonly order: Order) {}

  getSummary(): string {
    return `Order ${this.order.id}: ${this.order.items.length} items`;
  }

  getTotal(): Money {
    return this.order.calculateTotal();
  }

  getItemList(): string[] {
    return this.order.items.map(item => item.name);
  }
}
```

#### 4. 절차적 응집 (Procedural Cohesion)

특정 순서로 실행되어야 하는 요소들

```typescript
// ✅ 절차적 응집: 특정 순서의 초기화 절차
class ApplicationInitializer {
  async initialize(): Promise<void> {
    await this.loadConfiguration();  // 1. 설정 로드
    await this.connectDatabase();    // 2. DB 연결
    await this.startServer();        // 3. 서버 시작
    await this.registerRoutes();     // 4. 라우트 등록
  }

  private async loadConfiguration(): Promise<void> { ... }
  private async connectDatabase(): Promise<void> { ... }
  private async startServer(): Promise<void> { ... }
  private async registerRoutes(): Promise<void> { ... }
}
```

#### 5. 시간적 응집 (Temporal Cohesion)

같은 시점에 실행되는 요소들

```typescript
// ⚠️ 시간적 응집: 시작 시점에 실행되는 것들
class StartupHandler {
  onStartup(): void {
    this.clearTempFiles();      // 관련 없지만 시작 시 실행
    this.initializeCache();     // 관련 없지만 시작 시 실행
    this.sendStartupMetrics();  // 관련 없지만 시작 시 실행
    this.warmupConnections();   // 관련 없지만 시작 시 실행
  }
}

// ✅ 개선: 각각 분리하고 이벤트로 연결
class StartupEventHandler {
  constructor(
    private readonly tempFileCleaner: TempFileCleaner,
    private readonly cacheInitializer: CacheInitializer,
    private readonly metricsReporter: MetricsReporter,
    private readonly connectionWarmer: ConnectionWarmer,
  ) {}

  onStartup(): void {
    this.tempFileCleaner.clean();
    this.cacheInitializer.initialize();
    this.metricsReporter.sendStartupMetrics();
    this.connectionWarmer.warmup();
  }
}
```

#### 6. 논리적 응집 (Logical Cohesion) - 나쁨

논리적으로 분류되었지만 실제로 관련 없음

```typescript
// ❌ 논리적 응집: "유틸리티"라는 논리적 분류
class Utils {
  static formatDate(date: Date): string { ... }
  static calculateDistance(a: Point, b: Point): number { ... }
  static validateEmail(email: string): boolean { ... }
  static compressImage(image: Buffer): Buffer { ... }
  static parseJson(json: string): object { ... }
}

// ✅ 개선: 관련 기능별로 분리
class DateFormatter {
  static format(date: Date): string { ... }
}

class GeometryCalculator {
  static calculateDistance(a: Point, b: Point): number { ... }
}

class EmailValidator {
  static validate(email: string): boolean { ... }
}

class ImageProcessor {
  static compress(image: Buffer): Buffer { ... }
}
```

#### 7. 우연적 응집 (Coincidental Cohesion) - 최악

아무 관련 없는 요소들의 모음

```typescript
// ❌ 우연적 응집: 관련 없는 기능들의 모음
class Miscellaneous {
  printReport(): void { ... }
  connectToDatabase(): void { ... }
  sendEmail(): void { ... }
  calculateTax(): number { ... }
  uploadFile(): void { ... }
}

// ✅ 개선: 각각 독립된 클래스로 분리
class ReportPrinter { ... }
class DatabaseConnector { ... }
class EmailSender { ... }
class TaxCalculator { ... }
class FileUploader { ... }
```

### 전체 예시: 낮은 응집도 → 높은 응집도

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

```typescript
// LCOM 분석 예시
class LowCohesion {
  private fieldA: string;
  private fieldB: number;
  private fieldC: boolean;

  methodUsingA(): void { console.log(this.fieldA); }  // fieldA만 사용
  methodUsingB(): void { console.log(this.fieldB); }  // fieldB만 사용
  methodUsingC(): void { console.log(this.fieldC); }  // fieldC만 사용
  // LCOM 높음 → 3개 클래스로 분리 권장
}

class HighCohesion {
  private items: Item[];
  private total: Money;

  addItem(item: Item): void {
    this.items.push(item);
    this.total = this.calculateTotal();
  }
  removeItem(item: Item): void {
    this.items = this.items.filter(i => i !== item);
    this.total = this.calculateTotal();
  }
  calculateTotal(): Money {
    return this.items.reduce((sum, item) => sum.plus(item.price), Money.zero());
  }
  // LCOM 낮음 → 모든 메서드가 items와 total 사용
}
```

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

```typescript
// ❌ 직접 결합: 구현 변경 시 모든 클라이언트 수정 필요
class OrderService {
  constructor(private readonly gmailService: GmailService) {}

  notifyCustomer(order: Order): void {
    this.gmailService.sendEmail(
      order.customer.email,
      'Order Confirmed',
      `Your order ${order.id} has been confirmed.`
    );
  }
}

// Gmail에서 SendGrid로 변경하면 OrderService 수정 필요
```

### 해결책 (Solution)

**중간 객체(인터페이스)를 통한 간접 결합:**

```typescript
// ✅ 간접 참조: 인터페이스를 통한 간접 결합
interface NotificationService {
  send(message: Message): Promise<void>;
}

class GmailNotificationService implements NotificationService {
  async send(message: Message): Promise<void> {
    await this.gmailClient.sendEmail(message.to, message.subject, message.body);
  }
}

class SlackNotificationService implements NotificationService {
  async send(message: Message): Promise<void> {
    await this.slackClient.postMessage(message.channel, message.body);
  }
}

class OrderService {
  constructor(private readonly notifier: NotificationService) {}  // 인터페이스에 의존

  async notifyCustomer(order: Order): void {
    await this.notifier.send({
      to: order.customer.email,
      subject: 'Order Confirmed',
      body: `Your order ${order.id} has been confirmed.`,
    });
  }
}
```

### 간접 참조의 형태

#### 1. 인터페이스 (Interface)

계약으로 분리

```typescript
// ✅ 인터페이스: Repository 패턴
interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
  delete(id: string): Promise<void>;
}

class MySQLOrderRepository implements OrderRepository {
  async findById(id: string): Promise<Order | null> {
    const row = await this.db.query('SELECT * FROM orders WHERE id = ?', [id]);
    return row ? OrderMapper.toDomain(row) : null;
  }
  async save(order: Order): Promise<void> { ... }
  async delete(id: string): Promise<void> { ... }
}

class MongoOrderRepository implements OrderRepository {
  async findById(id: string): Promise<Order | null> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? OrderMapper.toDomain(doc) : null;
  }
  async save(order: Order): Promise<void> { ... }
  async delete(id: string): Promise<void> { ... }
}
```

#### 2. 어댑터 (Adapter)

호환성 제공

```typescript
// ✅ 어댑터: 레거시 시스템 호환
interface PaymentGateway {
  charge(amount: Money, card: CardInfo): Promise<PaymentResult>;
}

// 레거시 시스템의 다른 인터페이스
class LegacyPaymentSystem {
  processPayment(
    amountInCents: number,
    cardNumber: string,
    expiry: string,
    cvv: string
  ): { success: boolean; transactionId: string } {
    // 레거시 구현
  }
}

// 어댑터: 새 인터페이스를 레거시에 맞춤
class LegacyPaymentAdapter implements PaymentGateway {
  constructor(private readonly legacy: LegacyPaymentSystem) {}

  async charge(amount: Money, card: CardInfo): Promise<PaymentResult> {
    const result = this.legacy.processPayment(
      amount.toCents(),
      card.number,
      card.expiry,
      card.cvv
    );
    return {
      success: result.success,
      transactionId: result.transactionId,
    };
  }
}
```

#### 3. 파사드 (Facade)

복잡성 숨김

```typescript
// ✅ 파사드: 복잡한 하위 시스템을 단순화
class PaymentFacade {
  constructor(
    private readonly validator: CardValidator,
    private readonly fraudDetector: FraudDetector,
    private readonly gateway: PaymentGateway,
    private readonly notifier: NotificationService,
    private readonly logger: Logger,
  ) {}

  async processPayment(order: Order, card: CardInfo): Promise<PaymentResult> {
    // 복잡한 과정을 단순한 인터페이스로 제공
    this.logger.log('Payment started', { orderId: order.id });

    const isValid = await this.validator.validate(card);
    if (!isValid) {
      throw new InvalidCardError();
    }

    const isFraud = await this.fraudDetector.check(order, card);
    if (isFraud) {
      throw new FraudDetectedError();
    }

    const result = await this.gateway.charge(order.total, card);

    await this.notifier.send({
      to: order.customer.email,
      subject: 'Payment Confirmed',
      body: `Payment of ${order.total} confirmed.`,
    });

    this.logger.log('Payment completed', { orderId: order.id, result });
    return result;
  }
}

// 클라이언트는 단순하게 사용
const result = await paymentFacade.processPayment(order, card);
```

#### 4. 프록시 (Proxy)

접근 제어

```typescript
// ✅ 프록시: 캐싱, 지연 로딩, 접근 제어
interface ProductRepository {
  findById(id: string): Promise<Product>;
}

class ProductRepositoryImpl implements ProductRepository {
  async findById(id: string): Promise<Product> {
    // 실제 DB 조회 (느림)
    return await this.db.query('SELECT * FROM products WHERE id = ?', [id]);
  }
}

// 캐싱 프록시
class CachingProductRepository implements ProductRepository {
  private cache = new Map<string, Product>();

  constructor(private readonly repository: ProductRepository) {}

  async findById(id: string): Promise<Product> {
    if (this.cache.has(id)) {
      return this.cache.get(id)!;  // 캐시에서 반환
    }

    const product = await this.repository.findById(id);
    this.cache.set(id, product);
    return product;
  }
}

// 접근 제어 프록시
class AuthorizedProductRepository implements ProductRepository {
  constructor(
    private readonly repository: ProductRepository,
    private readonly authService: AuthService,
  ) {}

  async findById(id: string): Promise<Product> {
    if (!this.authService.hasPermission('products:read')) {
      throw new UnauthorizedError();
    }
    return this.repository.findById(id);
  }
}
```

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

```typescript
// ❌ 과도한 간접 참조
interface StringProvider {
  getString(): string;
}

class SimpleStringProvider implements StringProvider {
  getString(): string {
    return "Hello";  // 단순한 문자열에 불필요한 추상화
  }
}

// ✅ 직접 사용
const greeting = "Hello";
```

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

// 같은 조건문이 여러 곳에 분산
function getDiscountLabel(order: Order): string {
  if (order.type === 'PERCENT') {
    return '10% 할인';
  } else if (order.type === 'AMOUNT') {
    return '1,000원 할인';
  } else if (order.type === 'TIERED') {  // 또 수정 필요
    return '등급별 할인';
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
  getLabel(): string;
}

class PercentDiscountPolicy implements DiscountPolicy {
  constructor(private readonly percent: number) {}

  applyDiscount(amount: Money): Money {
    return amount.multiply(1 - this.percent / 100);
  }

  getLabel(): string {
    return `${this.percent}% 할인`;
  }
}

class AmountDiscountPolicy implements DiscountPolicy {
  constructor(private readonly discountAmount: Money) {}

  applyDiscount(amount: Money): Money {
    return amount.minus(this.discountAmount);
  }

  getLabel(): string {
    return `${this.discountAmount.format()} 할인`;
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

  getLabel(): string {
    return '등급별 할인';
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

  getDiscountLabel(): string {
    return this.discountPolicy.getLabel();
  }
}
```

### 다형성 적용 신호

- `if/else` 또는 `switch`가 타입을 검사할 때
- 동일한 조건문이 여러 곳에 반복될 때
- 새 타입 추가 시 여러 파일 수정이 필요할 때

```typescript
// ❌ 다형성 적용 신호: switch 문이 타입 검사
function processNotification(notification: Notification): void {
  switch (notification.type) {
    case 'EMAIL':
      sendEmail(notification.recipient, notification.content);
      break;
    case 'SMS':
      sendSMS(notification.phone, notification.content);
      break;
    case 'PUSH':
      sendPush(notification.deviceId, notification.content);
      break;
  }
}

// ✅ 다형성으로 개선
interface Notification {
  send(): Promise<void>;
}

class EmailNotification implements Notification {
  constructor(
    private readonly recipient: string,
    private readonly content: string,
  ) {}

  async send(): Promise<void> {
    await emailService.send(this.recipient, this.content);
  }
}

class SMSNotification implements Notification {
  constructor(
    private readonly phone: string,
    private readonly content: string,
  ) {}

  async send(): Promise<void> {
    await smsService.send(this.phone, this.content);
  }
}

class PushNotification implements Notification {
  constructor(
    private readonly deviceId: string,
    private readonly content: string,
  ) {}

  async send(): Promise<void> {
    await pushService.send(this.deviceId, this.content);
  }
}

// 클라이언트 코드
async function processNotification(notification: Notification): Promise<void> {
  await notification.send();  // 다형성으로 분기 없이 처리
}
```

### 주의사항

- **조건문이 항상 나쁜 것은 아님**: 단순하고 변하지 않는 조건은 그대로
- **과도한 클래스 폭발**: 타입이 너무 많으면 다른 방법 고려
- **타입 수가 고정적이면**: 다형성보다 조건문이 나을 수 있음

```typescript
// ✅ 조건문이 적절한 경우: 단순하고 변하지 않는 조건
function isWeekend(day: DayOfWeek): boolean {
  return day === DayOfWeek.SATURDAY || day === DayOfWeek.SUNDAY;
}

// ❌ 과도한 다형성: 불필요한 클래스 폭발
interface Day {
  isWeekend(): boolean;
}

class Monday implements Day { isWeekend() { return false; } }
class Tuesday implements Day { isWeekend() { return false; } }
class Wednesday implements Day { isWeekend() { return false; } }
class Thursday implements Day { isWeekend() { return false; } }
class Friday implements Day { isWeekend() { return false; } }
class Saturday implements Day { isWeekend() { return true; } }
class Sunday implements Day { isWeekend() { return true; } }
```

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

```typescript
// ❌ 정보 전문가만 따르면 도메인에 기술적 책임이 섞임
class Order {
  private readonly database: Database;
  private readonly emailService: EmailService;

  save(): void {
    this.database.query('INSERT INTO orders...', this.toData());
  }

  sendConfirmation(): void {
    this.emailService.send(this.customer.email, 'Order confirmed');
  }
}
```

### 해결책 (Solution)

**도메인에 없는 기술적 객체를 만들어 책임 분리:**

| 순수 가공물 | 책임 | 특징 |
|------------|------|------|
| **Repository** | 영속성 관리 | 도메인 ↔ DB 변환 |
| **Service** | 도메인 횡단 로직 | 여러 도메인 조율 |
| **Mapper** | 데이터 변환 | Entity ↔ DTO |
| **Factory** | 복잡한 객체 생성 | 생성 로직 캡슐화 |
| **Specification** | 복잡한 조건 | 조건 재사용 |

#### Repository: 영속성 관리

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

  async findByCustomerId(customerId: string): Promise<Order[]> {
    const rows = await this.database.executeQuery(
      'SP_Order_SelectByCustomer',
      [customerId]
    );
    return rows.map(OrderMapper.toDomain);
  }
}
```

#### Mapper: 데이터 변환

```typescript
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
      items: entity.items.map(ItemMapper.toDTO),
    };
  }

  static toData(entity: Order): OrderData {
    return {
      order_id: entity.orderId.toString(),
      customer_id: entity.customerId.toString(),
      status: entity.status.toCode(),
      created_at: entity.createdAt.toISOString(),
    };
  }
}

class ItemMapper {
  static toDomain(row: ItemRow): OrderItem {
    return new OrderItem({
      productId: ProductId.of(row.product_id),
      quantity: row.quantity,
      price: Money.of(row.price),
    });
  }

  static toDTO(entity: OrderItem): OrderItemDTO {
    return {
      productId: entity.productId.toString(),
      quantity: entity.quantity,
      price: entity.price.toNumber(),
    };
  }
}
```

#### Service: 도메인 횡단 로직

```typescript
// ✅ Service: 여러 도메인을 조율하는 응용 서비스
class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
    private readonly paymentGateway: PaymentGateway,
    private readonly notificationService: NotificationService,
  ) {}

  async createOrder(request: CreateOrderRequest): Promise<Order> {
    // 여러 도메인 조율
    const products = await this.productRepository.findByIds(request.productIds);
    const order = Order.create(request.customerId, products);

    await this.paymentGateway.charge(order.total, request.paymentInfo);
    await this.orderRepository.save(order);
    await this.notificationService.sendOrderConfirmation(order);

    return order;
  }
}
```

#### Factory: 복잡한 객체 생성

```typescript
// ✅ Factory: 복잡한 생성 로직 캡슐화
class OrderFactory {
  constructor(
    private readonly discountPolicyResolver: DiscountPolicyResolver,
    private readonly shippingCalculator: ShippingCalculator,
  ) {}

  create(request: CreateOrderRequest): Order {
    const items = request.items.map(item => new OrderItem(item));
    const discountPolicy = this.discountPolicyResolver.resolve(request.customerId);
    const shippingFee = this.shippingCalculator.calculate(items, request.address);

    return new Order({
      items,
      discountPolicy,
      shippingFee,
      customerId: request.customerId,
    });
  }
}
```

#### Specification: 복잡한 조건 캡슐화

```typescript
// ✅ Specification: 복잡한 조건 캡슐화
class HighValueOrderSpecification {
  constructor(private readonly threshold: Money) {}

  isSatisfiedBy(order: Order): boolean {
    return order.calculateTotal().isGreaterThan(this.threshold);
  }
}

class RecentOrderSpecification {
  constructor(private readonly days: number) {}

  isSatisfiedBy(order: Order): boolean {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.days);
    return order.createdAt >= cutoff;
  }
}

// Specification 조합
class CompositeSpecification<T> {
  constructor(private readonly specs: Specification<T>[]) {}

  and(spec: Specification<T>): CompositeSpecification<T> {
    return new CompositeSpecification([...this.specs, spec]);
  }

  isSatisfiedBy(item: T): boolean {
    return this.specs.every(spec => spec.isSatisfiedBy(item));
  }
}

// 사용 예시
const highValueRecentOrders = new CompositeSpecification([
  new HighValueOrderSpecification(Money.of(100000)),
  new RecentOrderSpecification(30),
]);

const eligibleOrders = orders.filter(order => highValueRecentOrders.isSatisfiedBy(order));
```

### 언제 적용하는가?

- 도메인 객체에 기술적 책임을 넣으면 안 될 때
- 정보 전문가 적용 시 응집도가 낮아질 때
- 재사용 가능한 기술적 컴포넌트가 필요할 때

### 주의사항

- **남용 시 도메인 빈약**: 모든 로직이 Service로 가면 Anemic Domain
- **적절한 균형**: 도메인 로직은 도메인에, 기술적 로직만 분리
- **이름에 도메인 의미 포함 금지**: `OrderPersistenceService` (X) → `OrderRepository` (O)

```typescript
// ❌ 남용: 도메인 로직까지 Service에
class OrderService {
  calculateTotal(order: Order): Money {
    // 이건 Order가 해야 할 일
    return order.items.reduce(
      (sum, item) => sum.plus(item.price.multiply(item.quantity)),
      Money.zero()
    );
  }
}

// ✅ 적절한 균형: 도메인 로직은 도메인에
class Order {
  calculateTotal(): Money {
    return this.items.reduce(
      (sum, item) => sum.plus(item.calculateAmount()),
      Money.zero()
    );
  }
}

// Service는 조율만
class OrderService {
  async checkout(order: Order): Promise<void> {
    const total = order.calculateTotal();  // 도메인에 위임
    await this.paymentGateway.charge(total);  // 기술적 책임
  }
}
```

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

```typescript
// ❌ 변경 가능한 부분이 직접 노출
class OrderService {
  async processPayment(order: Order): Promise<void> {
    // Stripe API에 직접 결합
    const stripe = new Stripe(process.env.STRIPE_KEY);
    await stripe.charges.create({
      amount: order.total.toCents(),
      currency: 'krw',
      source: order.paymentToken,
    });
  }
}

// 결제 시스템을 PayPal로 변경하면 OrderService 수정 필요
```

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

### 변경 예측 포인트별 코드 예시

#### 1. 외부 시스템 - Adapter/Gateway

```typescript
// ✅ 외부 결제 시스템 변경 보호
interface PaymentGateway {
  charge(amount: Money, token: string): Promise<PaymentResult>;
  refund(transactionId: string, amount: Money): Promise<RefundResult>;
}

class StripeGateway implements PaymentGateway {
  private readonly stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_KEY);
  }

  async charge(amount: Money, token: string): Promise<PaymentResult> {
    const result = await this.stripe.charges.create({
      amount: amount.toCents(),
      currency: 'krw',
      source: token,
    });
    return { transactionId: result.id, success: true };
  }

  async refund(transactionId: string, amount: Money): Promise<RefundResult> {
    await this.stripe.refunds.create({
      charge: transactionId,
      amount: amount.toCents(),
    });
    return { success: true };
  }
}

class PayPalGateway implements PaymentGateway {
  async charge(amount: Money, token: string): Promise<PaymentResult> {
    // PayPal 구현
  }
  async refund(transactionId: string, amount: Money): Promise<RefundResult> {
    // PayPal 구현
  }
}

// 결제 시스템 변경해도 OrderService는 수정 불필요
class OrderService {
  constructor(private readonly paymentGateway: PaymentGateway) {}

  async processPayment(order: Order): Promise<void> {
    await this.paymentGateway.charge(order.total, order.paymentToken);
  }
}
```

#### 2. 비즈니스 규칙 - Strategy/Policy

```typescript
// ✅ 배송비 계산 규칙 변경 보호
interface ShippingPolicy {
  calculate(items: OrderItem[], destination: Address): Money;
}

class WeightBasedShipping implements ShippingPolicy {
  calculate(items: OrderItem[], destination: Address): Money {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    return Money.of(totalWeight * 100);  // 100원/g
  }
}

class ZoneBasedShipping implements ShippingPolicy {
  calculate(items: OrderItem[], destination: Address): Money {
    const zone = this.getZone(destination);
    const baseFee = this.getBaseFee(zone);
    return Money.of(baseFee);
  }

  private getZone(address: Address): number { ... }
  private getBaseFee(zone: number): number { ... }
}

class FreeShippingPolicy implements ShippingPolicy {
  calculate(items: OrderItem[], destination: Address): Money {
    return Money.zero();
  }
}

// 배송 정책 변경해도 Order는 수정 불필요
class Order {
  constructor(private readonly shippingPolicy: ShippingPolicy) {}

  calculateShipping(): Money {
    return this.shippingPolicy.calculate(this.items, this.shippingAddress);
  }
}
```

#### 3. 데이터 저장소 - Repository

```typescript
// ✅ 데이터베이스 변경 보호
interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
}

class MySQLOrderRepository implements OrderRepository {
  async findById(id: string): Promise<Order | null> {
    const row = await this.mysql.query('SELECT * FROM orders WHERE id = ?', [id]);
    return row ? OrderMapper.toDomain(row) : null;
  }

  async save(order: Order): Promise<void> {
    await this.mysql.query('INSERT INTO orders...', OrderMapper.toData(order));
  }
}

class MongoOrderRepository implements OrderRepository {
  async findById(id: string): Promise<Order | null> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? OrderMapper.toDomain(doc) : null;
  }

  async save(order: Order): Promise<void> {
    await this.collection.insertOne(OrderMapper.toData(order));
  }
}

class RedisOrderRepository implements OrderRepository {
  // 캐시용 구현
  async findById(id: string): Promise<Order | null> {
    const json = await this.redis.get(`order:${id}`);
    return json ? OrderMapper.fromJson(json) : null;
  }

  async save(order: Order): Promise<void> {
    await this.redis.set(`order:${order.id}`, OrderMapper.toJson(order));
  }
}
```

#### 4. 알림 채널 - Notification Interface

```typescript
// ✅ 알림 채널 변경 보호
interface NotificationChannel {
  send(recipient: string, message: string): Promise<void>;
}

class EmailChannel implements NotificationChannel {
  async send(recipient: string, message: string): Promise<void> {
    await this.emailService.send({
      to: recipient,
      subject: 'Notification',
      body: message,
    });
  }
}

class SMSChannel implements NotificationChannel {
  async send(recipient: string, message: string): Promise<void> {
    await this.smsService.send(recipient, message);
  }
}

class PushChannel implements NotificationChannel {
  async send(recipient: string, message: string): Promise<void> {
    await this.pushService.send(recipient, { body: message });
  }
}

class SlackChannel implements NotificationChannel {
  async send(recipient: string, message: string): Promise<void> {
    await this.slackClient.postMessage({ channel: recipient, text: message });
  }
}

// 알림 채널 변경/추가해도 NotificationService는 수정 불필요
class NotificationService {
  constructor(private readonly channels: NotificationChannel[]) {}

  async notify(recipient: string, message: string): Promise<void> {
    await Promise.all(
      this.channels.map(channel => channel.send(recipient, message))
    );
  }
}
```

#### 5. 인증 방식 - Auth Provider

```typescript
// ✅ 인증 방식 변경 보호
interface AuthProvider {
  authenticate(credentials: Credentials): Promise<AuthResult>;
  validateToken(token: string): Promise<User | null>;
}

class JWTAuthProvider implements AuthProvider {
  async authenticate(credentials: Credentials): Promise<AuthResult> {
    const user = await this.userRepository.findByEmail(credentials.email);
    if (!user || !this.verifyPassword(credentials.password, user.password)) {
      throw new InvalidCredentialsError();
    }
    const token = jwt.sign({ userId: user.id }, this.secret);
    return { token, user };
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, this.secret);
      return this.userRepository.findById(decoded.userId);
    } catch {
      return null;
    }
  }
}

class OAuthProvider implements AuthProvider {
  async authenticate(credentials: Credentials): Promise<AuthResult> {
    const oauthResult = await this.oauthClient.authenticate(credentials.code);
    const user = await this.findOrCreateUser(oauthResult);
    return { token: oauthResult.accessToken, user };
  }

  async validateToken(token: string): Promise<User | null> {
    const oauthUser = await this.oauthClient.validateToken(token);
    return oauthUser ? this.userRepository.findByOAuthId(oauthUser.id) : null;
  }
}

// 인증 방식 변경해도 AuthMiddleware는 수정 불필요
class AuthMiddleware {
  constructor(private readonly authProvider: AuthProvider) {}

  async authenticate(request: Request): Promise<User> {
    const token = request.headers.authorization;
    const user = await this.authProvider.validateToken(token);
    if (!user) throw new UnauthorizedError();
    return user;
  }
}
```

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
