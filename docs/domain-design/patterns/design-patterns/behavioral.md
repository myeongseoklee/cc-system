# 행위 패턴 (Behavioral Patterns)

> 객체 간 책임 분배와 알고리즘 캡슐화

---

## 1. Strategy 패턴 ⭐

> "알고리즘을 캡슐화하여 런타임에 교체 가능하게 하라"

**가장 중요한 패턴** - GRASP의 다형성, OCP의 핵심 구현

### 문제 (Problem)

알고리즘이 조건문으로 분기되면:
- 새 알고리즘 추가 시 기존 코드 수정 (OCP 위반)
- 알고리즘 로직이 클라이언트에 노출
- 테스트하기 어려움

```typescript
// ❌ 조건문으로 알고리즘 분기
class PaymentService {
  processPayment(order: Order, method: string): void {
    if (method === 'CARD') {
      // 카드 결제 로직 50줄...
    } else if (method === 'BANK') {
      // 계좌이체 로직 40줄...
    } else if (method === 'KAKAO') {
      // 카카오페이 로직 60줄...
    } else if (method === 'NAVER') {  // 새 결제 수단 추가 시 수정
      // 네이버페이 로직...
    }
  }
}
```

### 해결책 (Solution)

**알고리즘을 인터페이스로 추상화하고 구현체로 분리:**

```typescript
// ✅ Strategy 패턴 적용
interface PaymentStrategy {
  pay(amount: Money): Promise<PaymentResult>;
  getLabel(): string;
}

class CardPaymentStrategy implements PaymentStrategy {
  constructor(private readonly cardGateway: CardGateway) {}

  async pay(amount: Money): Promise<PaymentResult> {
    const result = await this.cardGateway.charge(amount);
    return { success: result.approved, transactionId: result.id };
  }

  getLabel(): string {
    return '신용카드';
  }
}

class BankTransferStrategy implements PaymentStrategy {
  constructor(private readonly bankGateway: BankGateway) {}

  async pay(amount: Money): Promise<PaymentResult> {
    const result = await this.bankGateway.transfer(amount);
    return { success: result.completed, transactionId: result.id };
  }

  getLabel(): string {
    return '계좌이체';
  }
}

class KakaoPayStrategy implements PaymentStrategy {
  constructor(private readonly kakaoClient: KakaoPayClient) {}

  async pay(amount: Money): Promise<PaymentResult> {
    const result = await this.kakaoClient.pay(amount);
    return { success: result.status === 'SUCCESS', transactionId: result.tid };
  }

  getLabel(): string {
    return '카카오페이';
  }
}

// 새 결제 수단 추가: 기존 코드 수정 없이 확장
class NaverPayStrategy implements PaymentStrategy {
  async pay(amount: Money): Promise<PaymentResult> { ... }
  getLabel(): string { return '네이버페이'; }
}
```

### Context: 전략을 사용하는 클래스

```typescript
class PaymentService {
  // 전략을 외부에서 주입받음
  constructor(private paymentStrategy: PaymentStrategy) {}

  // 전략 교체 가능
  setStrategy(strategy: PaymentStrategy): void {
    this.paymentStrategy = strategy;
  }

  async processPayment(order: Order): Promise<PaymentResult> {
    // 어떤 전략이든 동일한 방식으로 호출
    return this.paymentStrategy.pay(order.total);
  }
}

// 사용 예시
const cardStrategy = new CardPaymentStrategy(cardGateway);
const kakaoStrategy = new KakaoPayStrategy(kakaoClient);

const paymentService = new PaymentService(cardStrategy);
await paymentService.processPayment(order);

// 런타임에 전략 변경
paymentService.setStrategy(kakaoStrategy);
await paymentService.processPayment(order);
```

### 실무 적용 예시

#### 할인 정책

```typescript
interface DiscountPolicy {
  calculateDiscount(order: Order): Money;
}

class PercentDiscount implements DiscountPolicy {
  constructor(private readonly percent: number) {}

  calculateDiscount(order: Order): Money {
    return order.total.multiply(this.percent / 100);
  }
}

class AmountDiscount implements DiscountPolicy {
  constructor(private readonly amount: Money) {}

  calculateDiscount(order: Order): Money {
    return this.amount;
  }
}

class TieredDiscount implements DiscountPolicy {
  calculateDiscount(order: Order): Money {
    if (order.total.isGreaterThan(Money.of(100000))) {
      return order.total.multiply(0.15);
    } else if (order.total.isGreaterThan(Money.of(50000))) {
      return order.total.multiply(0.10);
    }
    return Money.zero();
  }
}

// 복합 할인 (Composite + Strategy)
class CompositeDiscount implements DiscountPolicy {
  constructor(private readonly policies: DiscountPolicy[]) {}

  calculateDiscount(order: Order): Money {
    return this.policies.reduce(
      (total, policy) => total.plus(policy.calculateDiscount(order)),
      Money.zero()
    );
  }
}
```

#### 정렬 전략

```typescript
interface SortStrategy<T> {
  sort(items: T[]): T[];
}

class PriceLowToHigh implements SortStrategy<Product> {
  sort(items: Product[]): Product[] {
    return [...items].sort((a, b) => a.price.compare(b.price));
  }
}

class PriceHighToLow implements SortStrategy<Product> {
  sort(items: Product[]): Product[] {
    return [...items].sort((a, b) => b.price.compare(a.price));
  }
}

class NewestFirst implements SortStrategy<Product> {
  sort(items: Product[]): Product[] {
    return [...items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

class PopularitySort implements SortStrategy<Product> {
  sort(items: Product[]): Product[] {
    return [...items].sort((a, b) => b.salesCount - a.salesCount);
  }
}

// Context
class ProductCatalog {
  constructor(private sortStrategy: SortStrategy<Product>) {}

  setSortStrategy(strategy: SortStrategy<Product>): void {
    this.sortStrategy = strategy;
  }

  getProducts(): Product[] {
    const products = this.repository.findAll();
    return this.sortStrategy.sort(products);
  }
}
```

#### 검증 전략

```typescript
interface ValidationStrategy {
  validate(value: string): ValidationResult;
}

class EmailValidation implements ValidationStrategy {
  validate(value: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value)
      ? { valid: true }
      : { valid: false, message: '유효한 이메일 형식이 아닙니다' };
  }
}

class PhoneValidation implements ValidationStrategy {
  validate(value: string): ValidationResult {
    const phoneRegex = /^01[0-9]-\d{3,4}-\d{4}$/;
    return phoneRegex.test(value)
      ? { valid: true }
      : { valid: false, message: '유효한 전화번호 형식이 아닙니다' };
  }
}

class PasswordValidation implements ValidationStrategy {
  validate(value: string): ValidationResult {
    if (value.length < 8) {
      return { valid: false, message: '비밀번호는 8자 이상이어야 합니다' };
    }
    if (!/[A-Z]/.test(value)) {
      return { valid: false, message: '대문자를 포함해야 합니다' };
    }
    if (!/[0-9]/.test(value)) {
      return { valid: false, message: '숫자를 포함해야 합니다' };
    }
    return { valid: true };
  }
}

// 사용
class FormValidator {
  private strategies: Map<string, ValidationStrategy> = new Map();

  addValidation(field: string, strategy: ValidationStrategy): void {
    this.strategies.set(field, strategy);
  }

  validate(data: Record<string, string>): ValidationResult[] {
    return Array.from(this.strategies.entries()).map(([field, strategy]) => ({
      field,
      ...strategy.validate(data[field] ?? ''),
    }));
  }
}
```

### Strategy vs 조건문

| 상황 | 조건문 | Strategy |
|------|--------|----------|
| 알고리즘 수 | 2-3개, 고정 | 3개 이상, 확장 가능 |
| 변경 빈도 | 거의 없음 | 자주 변경/추가 |
| 복잡도 | 단순 | 알고리즘별 복잡 |
| 테스트 | 통합 테스트 | 개별 단위 테스트 |

### 관련 패턴

- **Template Method**: Strategy는 전체 알고리즘 교체, Template Method는 일부 단계 교체
- **State**: State는 상태에 따라 전략이 자동 전환
- **Factory**: 전략 객체 생성에 Factory 활용

---

## 2. Template Method 패턴 ⭐

> "알고리즘의 골격을 정의하고, 일부 단계를 서브클래스에서 재정의하게 하라"

**Hollywood Principle의 대표적 구현** - "Don't call us, we'll call you"

### 문제 (Problem)

유사한 알고리즘이 여러 클래스에 중복되면:
- 공통 로직 중복
- 한 곳 수정 시 모든 곳 수정 필요
- 알고리즘 순서 보장 어려움

```typescript
// ❌ 유사한 알고리즘 중복
class PDFReportGenerator {
  generate(data: ReportData): void {
    // 1. 데이터 검증 (공통)
    if (!data.title) throw new Error('Title required');

    // 2. 헤더 생성 (PDF 방식)
    const header = this.createPDFHeader(data.title);

    // 3. 본문 생성 (PDF 방식)
    const body = this.createPDFBody(data.content);

    // 4. 푸터 생성 (공통)
    const footer = `Generated at ${new Date().toISOString()}`;

    // 5. 파일 저장 (PDF 방식)
    this.savePDF(header + body + footer);
  }
}

class ExcelReportGenerator {
  generate(data: ReportData): void {
    // 1. 데이터 검증 (공통) - 중복!
    if (!data.title) throw new Error('Title required');

    // 2. 헤더 생성 (Excel 방식)
    const header = this.createExcelHeader(data.title);

    // 3. 본문 생성 (Excel 방식)
    const body = this.createExcelBody(data.content);

    // 4. 푸터 생성 (공통) - 중복!
    const footer = `Generated at ${new Date().toISOString()}`;

    // 5. 파일 저장 (Excel 방식)
    this.saveExcel(header, body, footer);
  }
}
```

### 해결책 (Solution)

**추상 클래스에서 알고리즘 골격 정의, 변하는 부분만 서브클래스에서 구현:**

```typescript
// ✅ Template Method 패턴 적용
abstract class ReportGenerator {
  // Template Method: 알고리즘 골격 정의 (final 개념)
  generate(data: ReportData): void {
    this.validateData(data);           // 공통 단계
    const header = this.createHeader(data.title);  // 추상 단계
    const body = this.createBody(data.content);    // 추상 단계
    const footer = this.createFooter();            // 공통 단계 (Hook으로 재정의 가능)
    this.save(header, body, footer);               // 추상 단계
  }

  // 공통 단계: 서브클래스에서 변경 불가
  private validateData(data: ReportData): void {
    if (!data.title) throw new Error('Title required');
    if (!data.content) throw new Error('Content required');
  }

  // 추상 단계: 서브클래스에서 반드시 구현
  protected abstract createHeader(title: string): string;
  protected abstract createBody(content: string): string;
  protected abstract save(header: string, body: string, footer: string): void;

  // Hook: 서브클래스에서 선택적으로 재정의
  protected createFooter(): string {
    return `Generated at ${new Date().toISOString()}`;
  }
}

// 구체 클래스: 변하는 부분만 구현
class PDFReportGenerator extends ReportGenerator {
  protected createHeader(title: string): string {
    return `<pdf-header>${title}</pdf-header>`;
  }

  protected createBody(content: string): string {
    return `<pdf-body>${content}</pdf-body>`;
  }

  protected save(header: string, body: string, footer: string): void {
    const pdfContent = header + body + footer;
    fs.writeFileSync('report.pdf', this.convertToPDF(pdfContent));
  }

  private convertToPDF(content: string): Buffer {
    // PDF 변환 로직
    return Buffer.from(content);
  }
}

class ExcelReportGenerator extends ReportGenerator {
  protected createHeader(title: string): string {
    return `EXCEL_HEADER:${title}`;
  }

  protected createBody(content: string): string {
    return `EXCEL_BODY:${content}`;
  }

  protected save(header: string, body: string, footer: string): void {
    const workbook = this.createWorkbook(header, body, footer);
    workbook.save('report.xlsx');
  }

  // Hook 재정의
  protected createFooter(): string {
    return `Excel Report - ${new Date().toLocaleDateString()}`;
  }

  private createWorkbook(header: string, body: string, footer: string): Workbook {
    // Excel 워크북 생성 로직
  }
}

class HTMLReportGenerator extends ReportGenerator {
  protected createHeader(title: string): string {
    return `<html><head><title>${title}</title></head><body><h1>${title}</h1>`;
  }

  protected createBody(content: string): string {
    return `<div class="content">${content}</div>`;
  }

  protected save(header: string, body: string, footer: string): void {
    const html = header + body + `<footer>${footer}</footer></body></html>`;
    fs.writeFileSync('report.html', html);
  }
}
```

### 실무 적용 예시

#### 데이터 처리 파이프라인

```typescript
abstract class DataProcessor<TInput, TOutput> {
  // Template Method
  process(input: TInput): TOutput {
    this.log('Processing started');
    const validated = this.validate(input);
    const transformed = this.transform(validated);
    const result = this.postProcess(transformed);
    this.log('Processing completed');
    return result;
  }

  // 공통 단계
  private log(message: string): void {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  // 추상 단계
  protected abstract validate(input: TInput): TInput;
  protected abstract transform(input: TInput): TOutput;

  // Hook (선택적 재정의)
  protected postProcess(output: TOutput): TOutput {
    return output;  // 기본: 아무것도 안 함
  }
}

class CSVToJSONProcessor extends DataProcessor<string, object[]> {
  protected validate(input: string): string {
    if (!input.trim()) throw new Error('Empty CSV');
    return input;
  }

  protected transform(input: string): object[] {
    const lines = input.split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
      const values = line.split(',');
      return headers.reduce((obj, header, i) => {
        obj[header] = values[i];
        return obj;
      }, {} as Record<string, string>);
    });
  }
}

class XMLToJSONProcessor extends DataProcessor<string, object> {
  protected validate(input: string): string {
    if (!input.startsWith('<?xml')) throw new Error('Invalid XML');
    return input;
  }

  protected transform(input: string): object {
    return this.parseXML(input);
  }

  protected postProcess(output: object): object {
    // XML 특유의 후처리
    return this.removeNamespaces(output);
  }

  private parseXML(xml: string): object { ... }
  private removeNamespaces(obj: object): object { ... }
}
```

#### HTTP 요청 처리

```typescript
abstract class BaseHttpHandler {
  // Template Method
  async handle(request: Request): Promise<Response> {
    try {
      await this.authenticate(request);
      await this.authorize(request);
      const validated = await this.validateRequest(request);
      const result = await this.processRequest(validated);
      return this.createSuccessResponse(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // 공통 단계
  private async authenticate(request: Request): Promise<void> {
    const token = request.headers.authorization;
    if (!token) throw new UnauthorizedError();
    await this.authService.validateToken(token);
  }

  // 추상 단계
  protected abstract authorize(request: Request): Promise<void>;
  protected abstract validateRequest(request: Request): Promise<any>;
  protected abstract processRequest(data: any): Promise<any>;

  // Hook
  protected createSuccessResponse(data: any): Response {
    return Response.ok(data);
  }

  protected handleError(error: Error): Response {
    if (error instanceof ValidationError) {
      return Response.badRequest(error.message);
    }
    return Response.internalError('Something went wrong');
  }
}

class CreateOrderHandler extends BaseHttpHandler {
  protected async authorize(request: Request): Promise<void> {
    const user = request.user;
    if (!user.hasPermission('orders:create')) {
      throw new ForbiddenError();
    }
  }

  protected async validateRequest(request: Request): Promise<CreateOrderDTO> {
    return CreateOrderDTO.fromRequest(request);
  }

  protected async processRequest(dto: CreateOrderDTO): Promise<Order> {
    return this.orderService.create(dto);
  }

  protected createSuccessResponse(order: Order): Response {
    return Response.created(OrderResponseDTO.from(order));
  }
}

class GetOrderHandler extends BaseHttpHandler {
  protected async authorize(request: Request): Promise<void> {
    // 모든 인증된 사용자 허용
  }

  protected async validateRequest(request: Request): Promise<string> {
    const orderId = request.params.id;
    if (!orderId) throw new ValidationError('Order ID required');
    return orderId;
  }

  protected async processRequest(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');
    return order;
  }
}
```

#### 테스트 프레임워크

```typescript
abstract class TestCase {
  // Template Method
  run(): TestResult {
    try {
      this.setUp();
      this.runTest();
      return { passed: true };
    } catch (error) {
      return { passed: false, error };
    } finally {
      this.tearDown();
    }
  }

  // Hook: 선택적 재정의
  protected setUp(): void {
    // 기본: 아무것도 안 함
  }

  protected tearDown(): void {
    // 기본: 아무것도 안 함
  }

  // 추상 단계: 반드시 구현
  protected abstract runTest(): void;
}

class OrderServiceTest extends TestCase {
  private orderService: OrderService;
  private mockRepository: MockOrderRepository;

  protected setUp(): void {
    this.mockRepository = new MockOrderRepository();
    this.orderService = new OrderService(this.mockRepository);
  }

  protected runTest(): void {
    // Given
    const request = { customerId: '123', items: [{ productId: 'P1', quantity: 2 }] };

    // When
    const order = this.orderService.create(request);

    // Then
    assert(order.id !== undefined);
    assert(order.items.length === 1);
  }

  protected tearDown(): void {
    this.mockRepository.clear();
  }
}
```

### Template Method vs Strategy

| 관점 | Template Method | Strategy |
|------|-----------------|----------|
| **구조** | 상속 (is-a) | 합성 (has-a) |
| **교체 단위** | 알고리즘 일부 단계 | 전체 알고리즘 |
| **교체 시점** | 컴파일 타임 | 런타임 |
| **유연성** | 낮음 (상속 고정) | 높음 (동적 교체) |
| **사용 상황** | 알고리즘 골격 고정, 일부만 변경 | 알고리즘 전체 교체 필요 |

```typescript
// Template Method: 골격 고정, 일부 단계만 변경
abstract class OrderProcessor {
  process(order: Order): void {
    this.validate(order);      // 고정
    this.calculateTotal(order); // 고정
    this.applyDiscount(order);  // 변하는 부분
    this.save(order);          // 고정
  }

  protected abstract applyDiscount(order: Order): void;
}

// Strategy: 할인 전체 로직 교체
class OrderProcessor {
  constructor(private discountStrategy: DiscountStrategy) {}

  process(order: Order): void {
    this.validate(order);
    this.calculateTotal(order);
    order.discount = this.discountStrategy.calculate(order); // 전략 교체 가능
    this.save(order);
  }
}
```

### 관련 패턴

- **Strategy**: 알고리즘 전체를 교체할 때 사용
- **Factory Method**: Template Method의 특수 형태 (객체 생성 단계가 추상)
- **Hook**: Template Method 내의 선택적 확장 지점

---

## 3. Observer 패턴

> "객체 상태 변경 시 의존 객체들에게 자동 통지하라"

**이벤트 기반 아키텍처의 기초**

### 문제 (Problem)

상태 변경을 직접 통지하면:
- Subject가 모든 Observer를 알아야 함 (높은 결합도)
- Observer 추가/제거 시 Subject 수정 필요
- 순환 의존 발생 가능

```typescript
// ❌ 직접 통지: 높은 결합도
class Order {
  complete(): void {
    this.status = OrderStatus.COMPLETED;

    // Order가 모든 Observer를 직접 알아야 함
    this.emailService.sendOrderCompletedEmail(this);
    this.smsService.sendOrderCompletedSMS(this);
    this.inventoryService.reduceStock(this);
    this.analyticsService.trackOrderCompleted(this);
    // 새 Observer 추가 시 Order 수정 필요
  }
}
```

### 해결책 (Solution)

**Subject가 Observer 인터페이스만 알고, 이벤트 발행:**

```typescript
// ✅ Observer 패턴 적용
interface OrderObserver {
  onOrderCompleted(order: Order): void;
}

class Order {
  private observers: OrderObserver[] = [];

  addObserver(observer: OrderObserver): void {
    this.observers.push(observer);
  }

  removeObserver(observer: OrderObserver): void {
    this.observers = this.observers.filter(o => o !== observer);
  }

  complete(): void {
    this.status = OrderStatus.COMPLETED;
    this.notifyObservers();  // 모든 Observer에게 통지
  }

  private notifyObservers(): void {
    this.observers.forEach(observer => observer.onOrderCompleted(this));
  }
}

// Observer 구현
class EmailNotificationObserver implements OrderObserver {
  constructor(private readonly emailService: EmailService) {}

  onOrderCompleted(order: Order): void {
    this.emailService.sendOrderCompletedEmail(order.customer.email, order);
  }
}

class InventoryObserver implements OrderObserver {
  constructor(private readonly inventoryService: InventoryService) {}

  onOrderCompleted(order: Order): void {
    order.items.forEach(item => {
      this.inventoryService.reduceStock(item.productId, item.quantity);
    });
  }
}

class AnalyticsObserver implements OrderObserver {
  constructor(private readonly analyticsService: AnalyticsService) {}

  onOrderCompleted(order: Order): void {
    this.analyticsService.track('order_completed', {
      orderId: order.id,
      total: order.total.toNumber(),
    });
  }
}

// 사용
const order = new Order();
order.addObserver(new EmailNotificationObserver(emailService));
order.addObserver(new InventoryObserver(inventoryService));
order.addObserver(new AnalyticsObserver(analyticsService));

order.complete();  // 모든 Observer에게 자동 통지
```

### 이벤트 기반 구현 (더 느슨한 결합)

```typescript
// 이벤트 정의
class OrderCompletedEvent {
  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly items: OrderItem[],
    public readonly total: Money,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

// 이벤트 버스
class EventBus {
  private handlers: Map<string, Function[]> = new Map();

  subscribe<T>(eventType: string, handler: (event: T) => void): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
  }

  publish<T>(eventType: string, event: T): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.forEach(handler => handler(event));
  }
}

// 도메인 객체: 이벤트만 발행
class Order {
  private domainEvents: DomainEvent[] = [];

  complete(): void {
    this.status = OrderStatus.COMPLETED;
    this.domainEvents.push(new OrderCompletedEvent(
      this.id,
      this.customerId,
      this.items,
      this.total,
    ));
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }
}

// 핸들러 등록 (인프라 레이어)
eventBus.subscribe<OrderCompletedEvent>('OrderCompleted', async (event) => {
  await emailService.sendOrderCompletedEmail(event.customerId, event);
});

eventBus.subscribe<OrderCompletedEvent>('OrderCompleted', async (event) => {
  await inventoryService.reduceStock(event.items);
});

eventBus.subscribe<OrderCompletedEvent>('OrderCompleted', async (event) => {
  await analyticsService.track('order_completed', event);
});
```

### 관련 패턴

- **Mediator**: Observer가 너무 많을 때 중재자로 관리
- **Event Sourcing**: 모든 상태 변경을 이벤트로 저장

---

## 4. Command 패턴

> "요청을 객체로 캡슐화하여 매개변수화, 큐잉, 로깅, 실행취소를 지원하라"

### 문제 (Problem)

요청을 직접 실행하면:
- 요청 기록/취소 불가
- 요청 지연 실행 어려움
- 요청 조합 어려움

### 해결책 (Solution)

```typescript
// Command 인터페이스
interface Command {
  execute(): Promise<void>;
  undo(): Promise<void>;
}

// 구체 Command
class CreateOrderCommand implements Command {
  private createdOrder?: Order;

  constructor(
    private readonly orderService: OrderService,
    private readonly request: CreateOrderRequest,
  ) {}

  async execute(): Promise<void> {
    this.createdOrder = await this.orderService.create(this.request);
  }

  async undo(): Promise<void> {
    if (this.createdOrder) {
      await this.orderService.cancel(this.createdOrder.id);
    }
  }
}

class UpdateOrderCommand implements Command {
  private previousState?: Order;

  constructor(
    private readonly orderService: OrderService,
    private readonly orderId: string,
    private readonly updates: Partial<Order>,
  ) {}

  async execute(): Promise<void> {
    this.previousState = await this.orderService.findById(this.orderId);
    await this.orderService.update(this.orderId, this.updates);
  }

  async undo(): Promise<void> {
    if (this.previousState) {
      await this.orderService.update(this.orderId, this.previousState);
    }
  }
}

// Command Invoker (실행, 기록, 취소 관리)
class CommandInvoker {
  private history: Command[] = [];

  async execute(command: Command): Promise<void> {
    await command.execute();
    this.history.push(command);
  }

  async undo(): Promise<void> {
    const command = this.history.pop();
    if (command) {
      await command.undo();
    }
  }

  async undoAll(): Promise<void> {
    while (this.history.length > 0) {
      await this.undo();
    }
  }
}

// 사용
const invoker = new CommandInvoker();

await invoker.execute(new CreateOrderCommand(orderService, request));
await invoker.execute(new UpdateOrderCommand(orderService, orderId, { status: 'processing' }));

// 마지막 명령 취소
await invoker.undo();

// 모든 명령 취소
await invoker.undoAll();
```

### 실무 적용: 트랜잭션 스크립트

```typescript
// 복합 Command
class CheckoutCommand implements Command {
  private commands: Command[] = [];

  constructor(
    private readonly cart: Cart,
    private readonly paymentInfo: PaymentInfo,
    private readonly services: {
      orderService: OrderService;
      paymentService: PaymentService;
      inventoryService: InventoryService;
    },
  ) {}

  async execute(): Promise<void> {
    const { orderService, paymentService, inventoryService } = this.services;

    // 1. 주문 생성
    const createOrder = new CreateOrderCommand(orderService, this.cart);
    await createOrder.execute();
    this.commands.push(createOrder);

    // 2. 결제 처리
    const processPayment = new ProcessPaymentCommand(
      paymentService,
      createOrder.getOrder(),
      this.paymentInfo,
    );
    await processPayment.execute();
    this.commands.push(processPayment);

    // 3. 재고 차감
    const reduceInventory = new ReduceInventoryCommand(
      inventoryService,
      this.cart.items,
    );
    await reduceInventory.execute();
    this.commands.push(reduceInventory);
  }

  async undo(): Promise<void> {
    // 역순으로 취소
    for (const command of [...this.commands].reverse()) {
      await command.undo();
    }
  }
}
```

---

## 5. State 패턴

> "상태에 따라 객체의 행동을 변경하라"

**상태 전이 로직을 객체로 캡슐화**

### 문제 (Problem)

상태에 따른 분기가 곳곳에 퍼지면:
- 조건문 중복
- 상태 전이 규칙 파악 어려움
- 새 상태 추가 시 모든 곳 수정

```typescript
// ❌ 상태 조건문 분산
class Order {
  private status: string;

  ship(): void {
    if (this.status === 'PENDING') {
      throw new Error('결제가 완료되지 않았습니다');
    } else if (this.status === 'PAID') {
      this.status = 'SHIPPED';
    } else if (this.status === 'SHIPPED') {
      throw new Error('이미 배송되었습니다');
    } else if (this.status === 'DELIVERED') {
      throw new Error('이미 배송 완료되었습니다');
    } else if (this.status === 'CANCELLED') {
      throw new Error('취소된 주문입니다');
    }
  }

  cancel(): void {
    if (this.status === 'PENDING') {
      this.status = 'CANCELLED';
    } else if (this.status === 'PAID') {
      this.status = 'CANCELLED';
      this.refund();
    } else if (this.status === 'SHIPPED') {
      throw new Error('배송 중에는 취소할 수 없습니다');
    }
    // ... 더 많은 조건문
  }
}
```

### 해결책 (Solution)

```typescript
// ✅ State 패턴 적용
interface OrderState {
  pay(order: Order): void;
  ship(order: Order): void;
  deliver(order: Order): void;
  cancel(order: Order): void;
}

class PendingState implements OrderState {
  pay(order: Order): void {
    // 결제 처리
    order.setState(new PaidState());
  }

  ship(order: Order): void {
    throw new Error('결제가 완료되지 않았습니다');
  }

  deliver(order: Order): void {
    throw new Error('결제가 완료되지 않았습니다');
  }

  cancel(order: Order): void {
    order.setState(new CancelledState());
  }
}

class PaidState implements OrderState {
  pay(order: Order): void {
    throw new Error('이미 결제되었습니다');
  }

  ship(order: Order): void {
    order.setState(new ShippedState());
  }

  deliver(order: Order): void {
    throw new Error('배송 전입니다');
  }

  cancel(order: Order): void {
    order.refund();
    order.setState(new CancelledState());
  }
}

class ShippedState implements OrderState {
  pay(order: Order): void {
    throw new Error('이미 결제되었습니다');
  }

  ship(order: Order): void {
    throw new Error('이미 배송 중입니다');
  }

  deliver(order: Order): void {
    order.setState(new DeliveredState());
  }

  cancel(order: Order): void {
    throw new Error('배송 중에는 취소할 수 없습니다');
  }
}

class DeliveredState implements OrderState {
  pay(order: Order): void {
    throw new Error('이미 배송 완료되었습니다');
  }

  ship(order: Order): void {
    throw new Error('이미 배송 완료되었습니다');
  }

  deliver(order: Order): void {
    throw new Error('이미 배송 완료되었습니다');
  }

  cancel(order: Order): void {
    throw new Error('배송 완료 후에는 취소할 수 없습니다. 반품을 요청하세요.');
  }
}

class CancelledState implements OrderState {
  pay(order: Order): void {
    throw new Error('취소된 주문입니다');
  }

  ship(order: Order): void {
    throw new Error('취소된 주문입니다');
  }

  deliver(order: Order): void {
    throw new Error('취소된 주문입니다');
  }

  cancel(order: Order): void {
    throw new Error('이미 취소되었습니다');
  }
}

// Context
class Order {
  private state: OrderState = new PendingState();

  setState(state: OrderState): void {
    this.state = state;
  }

  pay(): void {
    this.state.pay(this);
  }

  ship(): void {
    this.state.ship(this);
  }

  deliver(): void {
    this.state.deliver(this);
  }

  cancel(): void {
    this.state.cancel(this);
  }

  refund(): void {
    // 환불 처리
  }
}

// 사용
const order = new Order();
order.pay();     // PENDING → PAID
order.ship();    // PAID → SHIPPED
order.deliver(); // SHIPPED → DELIVERED
order.cancel();  // Error: 배송 완료 후에는 취소할 수 없습니다
```

### State vs Strategy

| 관점 | State | Strategy |
|------|-------|----------|
| **상태 전이** | 상태가 다음 상태를 결정 | 외부에서 전략 교체 |
| **인식 범위** | State가 Context 알 수 있음 | Strategy는 Context 모름 |
| **목적** | 상태별 행동 분리 | 알고리즘 교체 |
