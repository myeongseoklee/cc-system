# 생성 패턴 (Creational Patterns)

> 객체 생성 방법 추상화

---

## 1. Factory Method 패턴

> "객체 생성을 서브클래스에 위임하라"

### 문제와 해결책

```typescript
// ❌ 직접 생성: 구체 클래스에 의존
class OrderService {
  createNotification(order: Order): Notification {
    if (order.customer.prefersSMS) {
      return new SMSNotification(order);  // 구체 클래스
    } else {
      return new EmailNotification(order);  // 구체 클래스
    }
  }
}

// ✅ Factory Method 패턴
abstract class NotificationFactory {
  // Factory Method
  abstract createNotification(order: Order): Notification;

  // Template Method로 사용
  sendNotification(order: Order): void {
    const notification = this.createNotification(order);
    notification.send();
  }
}

class SMSNotificationFactory extends NotificationFactory {
  createNotification(order: Order): Notification {
    return new SMSNotification(order);
  }
}

class EmailNotificationFactory extends NotificationFactory {
  createNotification(order: Order): Notification {
    return new EmailNotification(order);
  }
}

// 사용
const factory = customer.prefersSMS
  ? new SMSNotificationFactory()
  : new EmailNotificationFactory();

factory.sendNotification(order);
```

### 실무 적용 예시

#### 문서 변환기 Factory

```typescript
interface Document {
  getContent(): string;
  export(): Buffer;
}

abstract class DocumentFactory {
  abstract createDocument(content: string): Document;

  // Template Method: 공통 로직 + Factory Method
  convertAndSave(content: string, filePath: string): void {
    const document = this.createDocument(content);
    const buffer = document.export();
    fs.writeFileSync(filePath, buffer);
  }
}

class PDFDocumentFactory extends DocumentFactory {
  createDocument(content: string): Document {
    return new PDFDocument(content);
  }
}

class WordDocumentFactory extends DocumentFactory {
  createDocument(content: string): Document {
    return new WordDocument(content);
  }
}

// 사용
function getDocumentFactory(type: 'pdf' | 'word'): DocumentFactory {
  switch (type) {
    case 'pdf': return new PDFDocumentFactory();
    case 'word': return new WordDocumentFactory();
  }
}

const factory = getDocumentFactory('pdf');
factory.convertAndSave(content, 'report.pdf');
```

#### 데이터베이스 연결 Factory

```typescript
interface DatabaseConnection {
  connect(): Promise<void>;
  query(sql: string): Promise<any[]>;
  close(): Promise<void>;
}

abstract class DatabaseFactory {
  abstract createConnection(config: DatabaseConfig): DatabaseConnection;

  async withConnection<T>(
    config: DatabaseConfig,
    operation: (conn: DatabaseConnection) => Promise<T>
  ): Promise<T> {
    const connection = this.createConnection(config);
    await connection.connect();
    try {
      return await operation(connection);
    } finally {
      await connection.close();
    }
  }
}

class MySQLFactory extends DatabaseFactory {
  createConnection(config: DatabaseConfig): DatabaseConnection {
    return new MySQLConnection(config);
  }
}

class PostgreSQLFactory extends DatabaseFactory {
  createConnection(config: DatabaseConfig): DatabaseConnection {
    return new PostgreSQLConnection(config);
  }
}
```

### Factory Method vs Simple Factory

| 관점 | Simple Factory | Factory Method |
|------|----------------|----------------|
| **구조** | 클래스 하나에 조건문 | 상속 계층 |
| **확장성** | 조건문 추가 필요 | 새 Factory 클래스 추가 |
| **복잡도** | 단순 | 클래스 증가 |
| **사용 상황** | 생성 로직 단순 | 생성 + 추가 로직 필요 |

---

## 2. Abstract Factory 패턴

> "관련 객체들의 제품군을 생성하라"

### 문제 (Problem)

관련된 객체들을 일관되게 생성해야 할 때:
- 여러 객체가 서로 호환되어야 함
- 제품군 전체를 교체해야 함

### 해결책 (Solution)

```typescript
// 제품 인터페이스
interface Button {
  render(): void;
  onClick(handler: () => void): void;
}

interface Input {
  render(): void;
  getValue(): string;
}

interface Modal {
  open(): void;
  close(): void;
}

// Abstract Factory
interface UIFactory {
  createButton(label: string): Button;
  createInput(placeholder: string): Input;
  createModal(title: string): Modal;
}

// 구체 Factory: Material Design
class MaterialUIFactory implements UIFactory {
  createButton(label: string): Button {
    return new MaterialButton(label);
  }

  createInput(placeholder: string): Input {
    return new MaterialInput(placeholder);
  }

  createModal(title: string): Modal {
    return new MaterialModal(title);
  }
}

// 구체 Factory: Bootstrap
class BootstrapUIFactory implements UIFactory {
  createButton(label: string): Button {
    return new BootstrapButton(label);
  }

  createInput(placeholder: string): Input {
    return new BootstrapInput(placeholder);
  }

  createModal(title: string): Modal {
    return new BootstrapModal(title);
  }
}

// 사용: UI 테마 전체 교체 가능
class LoginForm {
  constructor(private readonly uiFactory: UIFactory) {}

  render(): void {
    const emailInput = this.uiFactory.createInput('이메일');
    const passwordInput = this.uiFactory.createInput('비밀번호');
    const submitButton = this.uiFactory.createButton('로그인');

    emailInput.render();
    passwordInput.render();
    submitButton.render();
  }
}

const form = new LoginForm(new MaterialUIFactory());
form.render();  // Material Design UI로 렌더링
```

### 실무 적용 예시

#### 데이터베이스 접근 계층 Factory

```typescript
// 제품 인터페이스
interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
}

interface TransactionManager {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

// Abstract Factory
interface RepositoryFactory {
  createUserRepository(): UserRepository;
  createOrderRepository(): OrderRepository;
  createTransactionManager(): TransactionManager;
}

// 구체 Factory: MySQL
class MySQLRepositoryFactory implements RepositoryFactory {
  constructor(private readonly connection: MySQLConnection) {}

  createUserRepository(): UserRepository {
    return new MySQLUserRepository(this.connection);
  }

  createOrderRepository(): OrderRepository {
    return new MySQLOrderRepository(this.connection);
  }

  createTransactionManager(): TransactionManager {
    return new MySQLTransactionManager(this.connection);
  }
}

// 구체 Factory: MongoDB
class MongoDBRepositoryFactory implements RepositoryFactory {
  constructor(private readonly client: MongoClient) {}

  createUserRepository(): UserRepository {
    return new MongoDBUserRepository(this.client);
  }

  createOrderRepository(): OrderRepository {
    return new MongoDBOrderRepository(this.client);
  }

  createTransactionManager(): TransactionManager {
    return new MongoDBTransactionManager(this.client);
  }
}

// 사용: 데이터베이스 전체 교체 가능
class OrderService {
  private userRepo: UserRepository;
  private orderRepo: OrderRepository;
  private txManager: TransactionManager;

  constructor(factory: RepositoryFactory) {
    this.userRepo = factory.createUserRepository();
    this.orderRepo = factory.createOrderRepository();
    this.txManager = factory.createTransactionManager();
  }

  async createOrder(userId: string, items: OrderItem[]): Promise<Order> {
    await this.txManager.begin();
    try {
      const user = await this.userRepo.findById(userId);
      if (!user) throw new Error('User not found');

      const order = Order.create(user, items);
      await this.orderRepo.save(order);
      await this.txManager.commit();
      return order;
    } catch (error) {
      await this.txManager.rollback();
      throw error;
    }
  }
}
```

#### 테스트용 Mock Factory

```typescript
// 테스트용 Factory
class MockRepositoryFactory implements RepositoryFactory {
  createUserRepository(): UserRepository {
    return new InMemoryUserRepository();
  }

  createOrderRepository(): OrderRepository {
    return new InMemoryOrderRepository();
  }

  createTransactionManager(): TransactionManager {
    return new NoOpTransactionManager();
  }
}

// 테스트에서 사용
describe('OrderService', () => {
  it('should create order', async () => {
    const service = new OrderService(new MockRepositoryFactory());
    const order = await service.createOrder('user-1', [{ productId: 'P1', quantity: 2 }]);
    expect(order).toBeDefined();
  });
});
```

### Factory Method vs Abstract Factory

| 관점 | Factory Method | Abstract Factory |
|------|----------------|------------------|
| **생성 대상** | 단일 제품 | 제품군 (여러 관련 제품) |
| **확장 방식** | 새 Factory 서브클래스 | 새 제품군 Factory |
| **사용 상황** | 한 종류 객체 생성 | 관련 객체 일관 생성 |

---

## 3. Builder 패턴

> "복잡한 객체를 단계별로 생성하라"

### 문제 (Problem)

생성자 파라미터가 많으면:
- 가독성 저하 (파라미터 순서 헷갈림)
- 선택적 파라미터 처리 어려움
- 생성 단계별 검증 어려움

```typescript
// ❌ 많은 생성자 파라미터
class Order {
  constructor(
    customerId: string,
    items: OrderItem[],
    shippingAddress: Address,
    billingAddress: Address,
    discountCode?: string,
    giftMessage?: string,
    isGift?: boolean,
    requestedDeliveryDate?: Date,
    specialInstructions?: string,
  ) {}
}

// 사용 시 가독성 저하
const order = new Order(
  'C123',
  items,
  shippingAddr,
  billingAddr,
  'SUMMER2024',
  undefined,  // giftMessage
  false,      // isGift
  undefined,  // requestedDeliveryDate
  'Leave at door',
);
```

### 해결책 (Solution)

```typescript
// ✅ Builder 패턴
class OrderBuilder {
  private customerId: string;
  private items: OrderItem[] = [];
  private shippingAddress: Address;
  private billingAddress?: Address;
  private discountCode?: string;
  private giftMessage?: string;
  private isGift: boolean = false;
  private requestedDeliveryDate?: Date;
  private specialInstructions?: string;

  forCustomer(customerId: string): OrderBuilder {
    this.customerId = customerId;
    return this;
  }

  addItem(item: OrderItem): OrderBuilder {
    this.items.push(item);
    return this;
  }

  addItems(items: OrderItem[]): OrderBuilder {
    this.items.push(...items);
    return this;
  }

  shippingTo(address: Address): OrderBuilder {
    this.shippingAddress = address;
    return this;
  }

  billingTo(address: Address): OrderBuilder {
    this.billingAddress = address;
    return this;
  }

  withDiscount(code: string): OrderBuilder {
    this.discountCode = code;
    return this;
  }

  asGift(message?: string): OrderBuilder {
    this.isGift = true;
    this.giftMessage = message;
    return this;
  }

  deliverBy(date: Date): OrderBuilder {
    this.requestedDeliveryDate = date;
    return this;
  }

  withInstructions(instructions: string): OrderBuilder {
    this.specialInstructions = instructions;
    return this;
  }

  build(): Order {
    // 필수 필드 검증
    if (!this.customerId) throw new Error('Customer ID required');
    if (this.items.length === 0) throw new Error('At least one item required');
    if (!this.shippingAddress) throw new Error('Shipping address required');

    return new Order({
      customerId: this.customerId,
      items: this.items,
      shippingAddress: this.shippingAddress,
      billingAddress: this.billingAddress ?? this.shippingAddress,
      discountCode: this.discountCode,
      giftMessage: this.giftMessage,
      isGift: this.isGift,
      requestedDeliveryDate: this.requestedDeliveryDate,
      specialInstructions: this.specialInstructions,
    });
  }
}

// 사용: 가독성 높은 객체 생성
const order = new OrderBuilder()
  .forCustomer('C123')
  .addItem(new OrderItem('P1', 2))
  .addItem(new OrderItem('P2', 1))
  .shippingTo(shippingAddress)
  .withDiscount('SUMMER2024')
  .asGift('생일 축하해!')
  .deliverBy(new Date('2024-12-25'))
  .build();
```

### 실무 적용 예시

#### HTTP 요청 Builder

```typescript
class HttpRequestBuilder {
  private method: string = 'GET';
  private url: string;
  private headers: Record<string, string> = {};
  private queryParams: Record<string, string> = {};
  private body?: any;
  private timeout: number = 30000;

  get(url: string): HttpRequestBuilder {
    this.method = 'GET';
    this.url = url;
    return this;
  }

  post(url: string): HttpRequestBuilder {
    this.method = 'POST';
    this.url = url;
    return this;
  }

  put(url: string): HttpRequestBuilder {
    this.method = 'PUT';
    this.url = url;
    return this;
  }

  delete(url: string): HttpRequestBuilder {
    this.method = 'DELETE';
    this.url = url;
    return this;
  }

  header(key: string, value: string): HttpRequestBuilder {
    this.headers[key] = value;
    return this;
  }

  bearerToken(token: string): HttpRequestBuilder {
    this.headers['Authorization'] = `Bearer ${token}`;
    return this;
  }

  contentType(type: string): HttpRequestBuilder {
    this.headers['Content-Type'] = type;
    return this;
  }

  query(key: string, value: string): HttpRequestBuilder {
    this.queryParams[key] = value;
    return this;
  }

  json(data: any): HttpRequestBuilder {
    this.body = JSON.stringify(data);
    this.contentType('application/json');
    return this;
  }

  withTimeout(ms: number): HttpRequestBuilder {
    this.timeout = ms;
    return this;
  }

  async execute<T>(): Promise<T> {
    const queryString = new URLSearchParams(this.queryParams).toString();
    const fullUrl = queryString ? `${this.url}?${queryString}` : this.url;

    const response = await fetch(fullUrl, {
      method: this.method,
      headers: this.headers,
      body: this.body,
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new HttpError(response.status, await response.text());
    }

    return response.json();
  }
}

// 사용
const users = await new HttpRequestBuilder()
  .get('https://api.example.com/users')
  .bearerToken(accessToken)
  .query('page', '1')
  .query('limit', '10')
  .withTimeout(5000)
  .execute<User[]>();

await new HttpRequestBuilder()
  .post('https://api.example.com/orders')
  .bearerToken(accessToken)
  .json({ customerId: 'C123', items: [{ productId: 'P1', quantity: 2 }] })
  .execute<Order>();
```

#### 쿼리 Builder

```typescript
class QueryBuilder {
  private selectClause: string[] = ['*'];
  private fromClause: string;
  private whereClause: string[] = [];
  private orderByClause: string[] = [];
  private limitValue?: number;
  private offsetValue?: number;
  private params: any[] = [];

  select(...columns: string[]): QueryBuilder {
    this.selectClause = columns;
    return this;
  }

  from(table: string): QueryBuilder {
    this.fromClause = table;
    return this;
  }

  where(condition: string, ...values: any[]): QueryBuilder {
    this.whereClause.push(condition);
    this.params.push(...values);
    return this;
  }

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): QueryBuilder {
    this.orderByClause.push(`${column} ${direction}`);
    return this;
  }

  limit(value: number): QueryBuilder {
    this.limitValue = value;
    return this;
  }

  offset(value: number): QueryBuilder {
    this.offsetValue = value;
    return this;
  }

  build(): { sql: string; params: any[] } {
    if (!this.fromClause) throw new Error('FROM clause required');

    let sql = `SELECT ${this.selectClause.join(', ')} FROM ${this.fromClause}`;

    if (this.whereClause.length > 0) {
      sql += ` WHERE ${this.whereClause.join(' AND ')}`;
    }

    if (this.orderByClause.length > 0) {
      sql += ` ORDER BY ${this.orderByClause.join(', ')}`;
    }

    if (this.limitValue !== undefined) {
      sql += ` LIMIT ${this.limitValue}`;
    }

    if (this.offsetValue !== undefined) {
      sql += ` OFFSET ${this.offsetValue}`;
    }

    return { sql, params: this.params };
  }
}

// 사용
const { sql, params } = new QueryBuilder()
  .select('id', 'name', 'email')
  .from('users')
  .where('status = ?', 'active')
  .where('created_at > ?', '2024-01-01')
  .orderBy('created_at', 'DESC')
  .limit(10)
  .offset(20)
  .build();

// sql: "SELECT id, name, email FROM users WHERE status = ? AND created_at > ? ORDER BY created_at DESC LIMIT 10 OFFSET 20"
// params: ['active', '2024-01-01']
```

#### 테스트 데이터 Builder

```typescript
class UserBuilder {
  private props: Partial<User> = {
    id: 'user-' + Math.random().toString(36).substr(2, 9),
    name: 'Test User',
    email: 'test@example.com',
    status: 'active',
    createdAt: new Date(),
  };

  withId(id: string): UserBuilder {
    this.props.id = id;
    return this;
  }

  withName(name: string): UserBuilder {
    this.props.name = name;
    return this;
  }

  withEmail(email: string): UserBuilder {
    this.props.email = email;
    return this;
  }

  inactive(): UserBuilder {
    this.props.status = 'inactive';
    return this;
  }

  admin(): UserBuilder {
    this.props.role = 'admin';
    return this;
  }

  build(): User {
    return new User(this.props as User);
  }
}

// 테스트에서 사용
describe('UserService', () => {
  it('should deactivate user', () => {
    const user = new UserBuilder()
      .withId('user-123')
      .withName('John')
      .build();

    userService.deactivate(user);

    expect(user.status).toBe('inactive');
  });

  it('should not deactivate admin', () => {
    const admin = new UserBuilder().admin().build();

    expect(() => userService.deactivate(admin)).toThrow();
  });
});
```

### Builder 패턴 적용 기준

| 상황 | Builder 권장 여부 |
|------|------------------|
| 필수 파라미터 2-3개 | ❌ 생성자 사용 |
| 선택적 파라미터 많음 | ✅ Builder 사용 |
| 파라미터 조합 검증 필요 | ✅ Builder 사용 |
| Fluent API 원함 | ✅ Builder 사용 |
| 불변 객체 생성 | ✅ Builder 사용 |
