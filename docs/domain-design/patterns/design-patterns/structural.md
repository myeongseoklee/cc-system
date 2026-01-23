# 구조 패턴 (Structural Patterns)

> 객체 합성으로 새 기능 구현

---

## 1. Adapter 패턴

> "호환되지 않는 인터페이스를 호환되게 변환하라"

### 문제 (Problem)

외부 라이브러리나 레거시 시스템의 인터페이스가 현재 시스템과 다를 때:
- 직접 의존하면 교체 어려움
- 인터페이스 불일치로 사용 불가

### 해결책 (Solution)

```typescript
// 기존 인터페이스 (Target)
interface PaymentGateway {
  charge(amount: Money, token: string): Promise<PaymentResult>;
}

// 레거시 시스템 (Adaptee)
class LegacyPaymentSystem {
  processPayment(amountInCents: number, cardNumber: string): LegacyResult {
    // 레거시 로직
  }
}

// Adapter
class LegacyPaymentAdapter implements PaymentGateway {
  constructor(private readonly legacy: LegacyPaymentSystem) {}

  async charge(amount: Money, token: string): Promise<PaymentResult> {
    // 새 인터페이스 → 레거시 형식 변환
    const legacyResult = this.legacy.processPayment(
      amount.toCents(),
      this.tokenToCardNumber(token),
    );

    // 레거시 결과 → 새 인터페이스 형식 변환
    return {
      success: legacyResult.statusCode === 0,
      transactionId: legacyResult.txId,
      message: legacyResult.statusMessage,
    };
  }

  private tokenToCardNumber(token: string): string {
    // 토큰을 카드번호로 변환
  }
}

// 사용: 클라이언트는 Adapter인지 모름
class OrderService {
  constructor(private readonly paymentGateway: PaymentGateway) {}

  async checkout(order: Order): Promise<void> {
    await this.paymentGateway.charge(order.total, order.paymentToken);
  }
}

const orderService = new OrderService(
  new LegacyPaymentAdapter(legacySystem)
);
```

### 실무 적용 예시

#### 외부 API Adapter

```typescript
// Target: 우리 시스템의 인터페이스
interface EmailService {
  send(to: string, subject: string, body: string): Promise<void>;
}

// Adaptee: SendGrid API
class SendGridClient {
  sendEmail(message: {
    to: { email: string }[];
    subject: string;
    content: { type: string; value: string }[];
  }): Promise<SendGridResponse> {
    // SendGrid 고유 API
  }
}

// Adapter
class SendGridAdapter implements EmailService {
  constructor(private readonly client: SendGridClient) {}

  async send(to: string, subject: string, body: string): Promise<void> {
    await this.client.sendEmail({
      to: [{ email: to }],
      subject,
      content: [{ type: 'text/html', value: body }],
    });
  }
}

// 다른 서비스로 교체 가능
class MailgunAdapter implements EmailService {
  constructor(private readonly client: MailgunClient) {}

  async send(to: string, subject: string, body: string): Promise<void> {
    await this.client.messages.create(this.domain, {
      to,
      subject,
      html: body,
    });
  }
}
```

#### 데이터 포맷 Adapter

```typescript
// Target
interface UserData {
  id: string;
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
}

// Adaptee: 외부 시스템의 데이터 형식
interface ExternalUserData {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
}

// Adapter
class ExternalUserAdapter {
  static toUserData(external: ExternalUserData): UserData {
    return {
      id: String(external.user_id),
      fullName: `${external.first_name} ${external.last_name}`,
      emailAddress: external.email,
      phoneNumber: external.phone ?? '',
    };
  }

  static toExternalFormat(user: UserData): ExternalUserData {
    const [firstName, ...rest] = user.fullName.split(' ');
    return {
      user_id: parseInt(user.id, 10),
      first_name: firstName,
      last_name: rest.join(' '),
      email: user.emailAddress,
      phone: user.phoneNumber || null,
    };
  }
}
```

### Adapter vs Facade

| 관점 | Adapter | Facade |
|------|---------|--------|
| **목적** | 인터페이스 변환 | 복잡도 숨김 |
| **대상** | 단일 인터페이스 | 여러 서브시스템 |
| **변환** | 1:1 매핑 | 여러 호출 조합 |

---

## 2. Decorator 패턴

> "객체에 동적으로 새로운 책임을 추가하라"

### 문제 (Problem)

기능을 추가할 때 상속을 사용하면:
- 클래스 폭발 (조합이 많아지면 클래스 급증)
- 런타임에 기능 추가/제거 불가
- 기능 조합 순서 변경 어려움

### 해결책 (Solution)

```typescript
// Component 인터페이스
interface Coffee {
  getDescription(): string;
  getCost(): number;
}

// 기본 구현
class Espresso implements Coffee {
  getDescription(): string {
    return '에스프레소';
  }

  getCost(): number {
    return 3000;
  }
}

class Americano implements Coffee {
  getDescription(): string {
    return '아메리카노';
  }

  getCost(): number {
    return 4000;
  }
}

// Decorator 베이스
abstract class CoffeeDecorator implements Coffee {
  constructor(protected readonly coffee: Coffee) {}

  getDescription(): string {
    return this.coffee.getDescription();
  }

  getCost(): number {
    return this.coffee.getCost();
  }
}

// 구체 Decorator
class MilkDecorator extends CoffeeDecorator {
  getDescription(): string {
    return `${this.coffee.getDescription()} + 우유`;
  }

  getCost(): number {
    return this.coffee.getCost() + 500;
  }
}

class ShotDecorator extends CoffeeDecorator {
  getDescription(): string {
    return `${this.coffee.getDescription()} + 샷추가`;
  }

  getCost(): number {
    return this.coffee.getCost() + 500;
  }
}

class WhipDecorator extends CoffeeDecorator {
  getDescription(): string {
    return `${this.coffee.getDescription()} + 휘핑크림`;
  }

  getCost(): number {
    return this.coffee.getCost() + 700;
  }
}

// 사용: 동적으로 옵션 조합
let coffee: Coffee = new Americano();
coffee = new MilkDecorator(coffee);     // 아메리카노 + 우유
coffee = new ShotDecorator(coffee);     // 아메리카노 + 우유 + 샷추가
coffee = new WhipDecorator(coffee);     // 아메리카노 + 우유 + 샷추가 + 휘핑크림

console.log(coffee.getDescription());  // "아메리카노 + 우유 + 샷추가 + 휘핑크림"
console.log(coffee.getCost());         // 5700
```

### 실무 적용: 로깅/캐싱

```typescript
interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
}

class OrderRepositoryImpl implements OrderRepository {
  async findById(id: string): Promise<Order | null> {
    return this.database.query('SELECT * FROM orders WHERE id = ?', [id]);
  }

  async save(order: Order): Promise<void> {
    await this.database.execute('INSERT INTO orders...', order);
  }
}

// 로깅 Decorator
class LoggingOrderRepository implements OrderRepository {
  constructor(
    private readonly repository: OrderRepository,
    private readonly logger: Logger,
  ) {}

  async findById(id: string): Promise<Order | null> {
    this.logger.debug(`Finding order: ${id}`);
    const result = await this.repository.findById(id);
    this.logger.debug(`Found order: ${result?.id ?? 'not found'}`);
    return result;
  }

  async save(order: Order): Promise<void> {
    this.logger.debug(`Saving order: ${order.id}`);
    await this.repository.save(order);
    this.logger.debug(`Saved order: ${order.id}`);
  }
}

// 캐싱 Decorator
class CachingOrderRepository implements OrderRepository {
  private cache = new Map<string, Order>();

  constructor(private readonly repository: OrderRepository) {}

  async findById(id: string): Promise<Order | null> {
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    const order = await this.repository.findById(id);
    if (order) {
      this.cache.set(id, order);
    }
    return order;
  }

  async save(order: Order): Promise<void> {
    await this.repository.save(order);
    this.cache.set(order.id, order);
  }
}

// 사용: Decorator 조합
let repository: OrderRepository = new OrderRepositoryImpl(database);
repository = new LoggingOrderRepository(repository, logger);
repository = new CachingOrderRepository(repository);
// 이제 repository는 로깅 + 캐싱 기능을 모두 갖춤
```

### 실무 적용: 재시도/타임아웃

```typescript
interface HttpClient {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, body: any): Promise<T>;
}

// 기본 구현
class FetchHttpClient implements HttpClient {
  async get<T>(url: string): Promise<T> {
    const response = await fetch(url);
    return response.json();
  }

  async post<T>(url: string, body: any): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  }
}

// 재시도 Decorator
class RetryingHttpClient implements HttpClient {
  constructor(
    private readonly client: HttpClient,
    private readonly maxRetries: number = 3,
    private readonly delay: number = 1000,
  ) {}

  async get<T>(url: string): Promise<T> {
    return this.withRetry(() => this.client.get(url));
  }

  async post<T>(url: string, body: any): Promise<T> {
    return this.withRetry(() => this.client.post(url, body));
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        await this.sleep(this.delay * Math.pow(2, i));
      }
    }
    throw lastError!;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 타임아웃 Decorator
class TimeoutHttpClient implements HttpClient {
  constructor(
    private readonly client: HttpClient,
    private readonly timeout: number = 5000,
  ) {}

  async get<T>(url: string): Promise<T> {
    return this.withTimeout(() => this.client.get(url));
  }

  async post<T>(url: string, body: any): Promise<T> {
    return this.withTimeout(() => this.client.post(url, body));
  }

  private async withTimeout<T>(operation: () => Promise<T>): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), this.timeout)
      ),
    ]);
  }
}

// 조합
let httpClient: HttpClient = new FetchHttpClient();
httpClient = new TimeoutHttpClient(httpClient, 5000);
httpClient = new RetryingHttpClient(httpClient, 3, 1000);
// 5초 타임아웃 + 3회 재시도
```

### Decorator vs 상속

| 관점 | 상속 | Decorator |
|------|------|-----------|
| **확장 시점** | 컴파일 타임 | 런타임 |
| **조합** | 어려움 (클래스 폭발) | 자유로운 조합 |
| **제거** | 불가능 | 가능 |
| **복잡도** | 간단 | Wrapper 중첩 |

---

## 3. Facade 패턴

> "복잡한 서브시스템에 대한 단순한 인터페이스를 제공하라"

### 문제 (Problem)

여러 서브시스템을 조합해야 하는 복잡한 작업:
- 클라이언트가 모든 서브시스템을 알아야 함
- 서브시스템 변경 시 클라이언트 수정 필요
- 중복 코드 발생

### 해결책 (Solution)

```typescript
// 복잡한 서브시스템들
class InventorySystem {
  checkStock(productId: string): boolean { ... }
  reserveStock(productId: string, quantity: number): void { ... }
  releaseStock(productId: string, quantity: number): void { ... }
}

class PaymentSystem {
  validateCard(cardInfo: CardInfo): boolean { ... }
  charge(cardInfo: CardInfo, amount: Money): PaymentResult { ... }
  refund(transactionId: string): void { ... }
}

class ShippingSystem {
  calculateFee(address: Address, weight: number): Money { ... }
  createShipment(order: Order): Shipment { ... }
  trackShipment(trackingNumber: string): ShipmentStatus { ... }
}

class NotificationSystem {
  sendEmail(email: string, template: string, data: object): void { ... }
  sendSMS(phone: string, message: string): void { ... }
}

// Facade: 복잡한 과정을 단순한 인터페이스로
class OrderFacade {
  constructor(
    private readonly inventory: InventorySystem,
    private readonly payment: PaymentSystem,
    private readonly shipping: ShippingSystem,
    private readonly notification: NotificationSystem,
  ) {}

  async placeOrder(orderRequest: OrderRequest): Promise<OrderResult> {
    // 1. 재고 확인
    for (const item of orderRequest.items) {
      if (!this.inventory.checkStock(item.productId)) {
        throw new OutOfStockError(item.productId);
      }
    }

    // 2. 재고 예약
    for (const item of orderRequest.items) {
      this.inventory.reserveStock(item.productId, item.quantity);
    }

    try {
      // 3. 결제 처리
      const paymentResult = await this.payment.charge(
        orderRequest.cardInfo,
        orderRequest.total,
      );

      // 4. 배송 생성
      const shipment = await this.shipping.createShipment(orderRequest);

      // 5. 알림 발송
      await this.notification.sendEmail(
        orderRequest.customer.email,
        'order-confirmation',
        { order: orderRequest, shipment },
      );

      return {
        success: true,
        orderId: generateOrderId(),
        trackingNumber: shipment.trackingNumber,
      };
    } catch (error) {
      // 실패 시 재고 원복
      for (const item of orderRequest.items) {
        this.inventory.releaseStock(item.productId, item.quantity);
      }
      throw error;
    }
  }
}

// 클라이언트는 단순하게 사용
const orderFacade = new OrderFacade(inventory, payment, shipping, notification);
const result = await orderFacade.placeOrder(orderRequest);
```

### 실무 적용 예시

#### 인증 Facade

```typescript
class AuthenticationFacade {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly auditService: AuditService,
  ) {}

  async login(credentials: LoginCredentials): Promise<LoginResult> {
    // 1. 사용자 검증
    const user = await this.userService.validateCredentials(credentials);
    if (!user) {
      await this.auditService.logFailedLogin(credentials.email);
      throw new InvalidCredentialsError();
    }

    // 2. 토큰 생성
    const accessToken = this.tokenService.generateAccessToken(user);
    const refreshToken = this.tokenService.generateRefreshToken(user);

    // 3. 세션 생성
    await this.sessionService.createSession(user.id, refreshToken);

    // 4. 로그인 기록
    await this.auditService.logSuccessfulLogin(user.id);

    return { user, accessToken, refreshToken };
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await this.sessionService.invalidateSession(refreshToken);
    await this.tokenService.blacklistToken(refreshToken);
    await this.auditService.logLogout(userId);
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const session = await this.sessionService.findByToken(refreshToken);
    if (!session) {
      throw new InvalidSessionError();
    }

    const user = await this.userService.findById(session.userId);
    const newAccessToken = this.tokenService.generateAccessToken(user);
    const newRefreshToken = this.tokenService.generateRefreshToken(user);

    await this.sessionService.updateSession(session.id, newRefreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}
```

#### 파일 업로드 Facade

```typescript
class FileUploadFacade {
  constructor(
    private readonly validator: FileValidator,
    private readonly processor: ImageProcessor,
    private readonly storage: FileStorage,
    private readonly cdn: CDNService,
    private readonly database: FileRepository,
  ) {}

  async uploadImage(file: File, userId: string): Promise<UploadResult> {
    // 1. 파일 검증
    await this.validator.validate(file, {
      maxSize: 10 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });

    // 2. 이미지 처리 (리사이즈, 압축)
    const processed = await this.processor.process(file, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 85,
    });

    // 3. 스토리지 업로드
    const storagePath = await this.storage.upload(processed, {
      folder: `users/${userId}/images`,
      filename: generateUniqueFilename(file.name),
    });

    // 4. CDN 등록
    const cdnUrl = await this.cdn.registerAsset(storagePath);

    // 5. DB 저장
    const fileRecord = await this.database.save({
      userId,
      originalName: file.name,
      storagePath,
      cdnUrl,
      size: processed.size,
      mimeType: processed.type,
    });

    return {
      id: fileRecord.id,
      url: cdnUrl,
    };
  }
}
```

---

## 4. Composite 패턴

> "개별 객체와 복합 객체를 동일하게 다루라"

### 문제 (Problem)

트리 구조의 데이터를 다룰 때:
- 개별 항목과 그룹을 다르게 처리해야 함
- 재귀적 구조 처리 복잡
- 일관된 인터페이스 제공 어려움

### 해결책 (Solution)

```typescript
// Component
interface MenuComponent {
  getName(): string;
  getPrice(): number;
  print(indent: number): void;
}

// Leaf
class MenuItem implements MenuComponent {
  constructor(
    private readonly name: string,
    private readonly price: number,
    private readonly description: string,
  ) {}

  getName(): string {
    return this.name;
  }

  getPrice(): number {
    return this.price;
  }

  print(indent: number = 0): void {
    const padding = '  '.repeat(indent);
    console.log(`${padding}${this.name} - ${this.price}원`);
    console.log(`${padding}  ${this.description}`);
  }
}

// Composite
class Menu implements MenuComponent {
  private children: MenuComponent[] = [];

  constructor(private readonly name: string) {}

  add(component: MenuComponent): void {
    this.children.push(component);
  }

  remove(component: MenuComponent): void {
    this.children = this.children.filter(c => c !== component);
  }

  getName(): string {
    return this.name;
  }

  getPrice(): number {
    // 하위 모든 항목의 가격 합계
    return this.children.reduce((sum, child) => sum + child.getPrice(), 0);
  }

  print(indent: number = 0): void {
    const padding = '  '.repeat(indent);
    console.log(`${padding}[${this.name}]`);
    this.children.forEach(child => child.print(indent + 1));
  }
}

// 사용
const coffeeMenu = new Menu('커피');
coffeeMenu.add(new MenuItem('아메리카노', 4000, '깔끔한 에스프레소'));
coffeeMenu.add(new MenuItem('카페라떼', 4500, '부드러운 우유와 에스프레소'));

const teaMenu = new Menu('차');
teaMenu.add(new MenuItem('녹차', 3500, '국산 녹차'));
teaMenu.add(new MenuItem('얼그레이', 4000, '향긋한 베르가못'));

const allMenu = new Menu('전체 메뉴');
allMenu.add(coffeeMenu);  // Menu를 추가
allMenu.add(teaMenu);     // Menu를 추가
allMenu.add(new MenuItem('물', 0, '무료'));  // MenuItem을 추가

allMenu.print();
// [전체 메뉴]
//   [커피]
//     아메리카노 - 4000원
//       깔끔한 에스프레소
//     카페라떼 - 4500원
//       부드러운 우유와 에스프레소
//   [차]
//     녹차 - 3500원
//       국산 녹차
//     얼그레이 - 4000원
//       향긋한 베르가못
//   물 - 0원
//     무료
```

### 실무 적용 예시

#### 조직도

```typescript
interface OrganizationUnit {
  getName(): string;
  getHeadCount(): number;
  getTotalSalary(): number;
  print(indent?: number): void;
}

class Employee implements OrganizationUnit {
  constructor(
    private readonly name: string,
    private readonly position: string,
    private readonly salary: number,
  ) {}

  getName(): string {
    return this.name;
  }

  getHeadCount(): number {
    return 1;
  }

  getTotalSalary(): number {
    return this.salary;
  }

  print(indent: number = 0): void {
    console.log(`${'  '.repeat(indent)}${this.name} (${this.position})`);
  }
}

class Department implements OrganizationUnit {
  private members: OrganizationUnit[] = [];

  constructor(private readonly name: string) {}

  add(unit: OrganizationUnit): void {
    this.members.push(unit);
  }

  getName(): string {
    return this.name;
  }

  getHeadCount(): number {
    return this.members.reduce((sum, m) => sum + m.getHeadCount(), 0);
  }

  getTotalSalary(): number {
    return this.members.reduce((sum, m) => sum + m.getTotalSalary(), 0);
  }

  print(indent: number = 0): void {
    console.log(`${'  '.repeat(indent)}[${this.name}] (${this.getHeadCount()}명)`);
    this.members.forEach(m => m.print(indent + 1));
  }
}

// 사용
const engineering = new Department('개발팀');
engineering.add(new Employee('김철수', 'Tech Lead', 8000));
engineering.add(new Employee('이영희', 'Senior Developer', 6000));
engineering.add(new Employee('박민수', 'Junior Developer', 4000));

const design = new Department('디자인팀');
design.add(new Employee('정수진', 'Design Lead', 7000));
design.add(new Employee('최동훈', 'UI Designer', 5000));

const company = new Department('회사');
company.add(engineering);
company.add(design);

company.print();
// [회사] (5명)
//   [개발팀] (3명)
//     김철수 (Tech Lead)
//     이영희 (Senior Developer)
//     박민수 (Junior Developer)
//   [디자인팀] (2명)
//     정수진 (Design Lead)
//     최동훈 (UI Designer)

console.log(`총 인원: ${company.getHeadCount()}`);  // 5명
console.log(`총 급여: ${company.getTotalSalary()}`);  // 30000
```

#### 파일 시스템

```typescript
interface FileSystemNode {
  getName(): string;
  getSize(): number;
  getPath(): string;
  find(predicate: (node: FileSystemNode) => boolean): FileSystemNode[];
}

class File implements FileSystemNode {
  constructor(
    private readonly name: string,
    private readonly size: number,
    private readonly parent?: Directory,
  ) {}

  getName(): string {
    return this.name;
  }

  getSize(): number {
    return this.size;
  }

  getPath(): string {
    return this.parent ? `${this.parent.getPath()}/${this.name}` : this.name;
  }

  find(predicate: (node: FileSystemNode) => boolean): FileSystemNode[] {
    return predicate(this) ? [this] : [];
  }
}

class Directory implements FileSystemNode {
  private children: FileSystemNode[] = [];

  constructor(
    private readonly name: string,
    private readonly parent?: Directory,
  ) {}

  add(node: FileSystemNode): void {
    this.children.push(node);
  }

  getName(): string {
    return this.name;
  }

  getSize(): number {
    return this.children.reduce((sum, child) => sum + child.getSize(), 0);
  }

  getPath(): string {
    return this.parent ? `${this.parent.getPath()}/${this.name}` : this.name;
  }

  find(predicate: (node: FileSystemNode) => boolean): FileSystemNode[] {
    const results: FileSystemNode[] = predicate(this) ? [this] : [];
    for (const child of this.children) {
      results.push(...child.find(predicate));
    }
    return results;
  }
}

// 사용
const root = new Directory('root');
const src = new Directory('src', root);
const components = new Directory('components', src);

components.add(new File('Button.tsx', 1024, components));
components.add(new File('Modal.tsx', 2048, components));
src.add(components);
src.add(new File('index.ts', 512, src));
root.add(src);

console.log(`총 크기: ${root.getSize()}`);  // 3584

// 모든 .tsx 파일 찾기
const tsxFiles = root.find(node => node.getName().endsWith('.tsx'));
tsxFiles.forEach(file => console.log(file.getPath()));
// root/src/components/Button.tsx
// root/src/components/Modal.tsx
```

#### 권한 시스템

```typescript
interface Permission {
  getName(): string;
  includes(permission: string): boolean;
  getAll(): string[];
}

class SinglePermission implements Permission {
  constructor(private readonly name: string) {}

  getName(): string {
    return this.name;
  }

  includes(permission: string): boolean {
    return this.name === permission;
  }

  getAll(): string[] {
    return [this.name];
  }
}

class PermissionGroup implements Permission {
  private permissions: Permission[] = [];

  constructor(private readonly name: string) {}

  add(permission: Permission): void {
    this.permissions.push(permission);
  }

  getName(): string {
    return this.name;
  }

  includes(permission: string): boolean {
    return this.permissions.some(p => p.includes(permission));
  }

  getAll(): string[] {
    return this.permissions.flatMap(p => p.getAll());
  }
}

// 사용
const readOrders = new SinglePermission('orders:read');
const writeOrders = new SinglePermission('orders:write');
const deleteOrders = new SinglePermission('orders:delete');

const orderManager = new PermissionGroup('Order Manager');
orderManager.add(readOrders);
orderManager.add(writeOrders);

const admin = new PermissionGroup('Admin');
admin.add(orderManager);
admin.add(deleteOrders);
admin.add(new SinglePermission('users:manage'));

console.log(admin.includes('orders:read'));    // true
console.log(admin.includes('orders:delete'));  // true
console.log(admin.getAll());
// ['orders:read', 'orders:write', 'orders:delete', 'users:manage']
```

### Composite 패턴 적용 기준

| 상황 | Composite 적용 |
|------|---------------|
| 트리 구조 데이터 | ✅ |
| 개별/그룹 동일 처리 필요 | ✅ |
| 재귀적 연산 (합계, 검색 등) | ✅ |
| 단순 리스트 | ❌ |
