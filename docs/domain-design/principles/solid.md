# SOLID 및 설계 원칙

> 객체지향 설계의 핵심 원칙들

---

## 개요

### SOLID 원칙

| 원칙  | 이름                  | 한 줄 설명                                               |
| ----- | --------------------- | -------------------------------------------------------- |
| **S** | Single Responsibility | 클래스는 하나의 책임만 가져야 한다                       |
| **O** | Open/Closed           | 확장에 열려있고, 수정에 닫혀있어야 한다                  |
| **L** | Liskov Substitution   | 하위 타입은 상위 타입을 대체할 수 있어야 한다            |
| **I** | Interface Segregation | 클라이언트는 사용하지 않는 메서드에 의존하지 않아야 한다 |
| **D** | Dependency Inversion  | 구체 클래스가 아닌 추상화에 의존하라                     |

### 추가 설계 원칙

| 원칙 | 이름 | 한 줄 설명 |
|------|------|-----------|
| **DRY** | Don't Repeat Yourself | 지식의 중복을 제거하라 |
| **Hollywood** | Hollywood Principle | 프레임워크가 코드를 호출하게 하라 |
| **IoC** | Inversion of Control | 제어 흐름을 역전시켜라 |

---

## SRP: 단일 책임 원칙

> "클래스는 하나의 책임만 가져야 한다."

**핵심:** 클래스가 변경되는 이유는 하나뿐이어야 함

```typescript
// ❌ 여러 책임
class OrderService {
	calculateTotal() {} // 계산 책임
	saveToDatabase() {} // 저장 책임
	sendEmail() {} // 알림 책임
	generateReport() {} // 리포트 책임
}

// ✅ 책임 분리
class OrderCalculator {
	calculateTotal() {} // 계산 책임
}

class OrderRepository {
	save() {} // 저장 책임
}

class NotificationService {
	sendEmail() {} // 알림 책임
}

class ReportGenerator {
	generate() {} // 리포트 책임
}
```

---

## OCP: 개방-폐쇄 원칙

> "확장에는 열려있고, 수정에는 닫혀있어야 한다."

**핵심:** 새로운 기능을 추가할 때 기존 코드를 수정하지 않아야 함

```typescript
// ✅ 새로운 할인 정책 추가 시 기존 코드 수정 없음
interface DiscountPolicy {
	applyDiscount(amount: Money): Money;
}

class PercentDiscountPolicy implements DiscountPolicy {}
class AmountDiscountPolicy implements DiscountPolicy {}
class TieredDiscountPolicy implements DiscountPolicy {} // 새로운 정책 추가

// 클라이언트 코드는 수정 불필요
class Order {
	private readonly discountPolicy: DiscountPolicy;

	calculateTotal(): Money {
		const subtotal = this.calculateSubtotal();
		return this.discountPolicy.applyDiscount(subtotal); // 어떤 정책이든 같은 방식
	}
}
```

---

## LSP: 리스코프 치환 원칙

> "하위 타입은 상위 타입을 대체할 수 있어야 한다."

**핵심:** 자식 클래스는 부모 클래스의 계약을 준수해야 함

```typescript
// ✅ 인터페이스 계약 준수
interface DiscountPolicy {
	applyDiscount(amount: Money): Money; // 반드시 Money 반환
}

class PercentDiscountPolicy implements DiscountPolicy {
	applyDiscount(amount: Money): Money {
		return amount.multiply(1 - this.percent / 100); // Money 반환
	}
}

// ❌ 계약 위반
class BrokenDiscountPolicy implements DiscountPolicy {
	applyDiscount(amount: Money): Money {
		throw new Error('Not implemented'); // 예외 발생 → 대체 불가
	}
}
```

**LSP 위반 예시:**

```typescript
// ❌ 잘못된 상속
abstract class Bird {
	abstract fly(): void;
}

class Penguin extends Bird {
	fly(): void {
		throw new Error('펭귄은 날 수 없습니다'); // LSP 위반!
	}
}

// ✅ 올바른 설계
abstract class Bird {
	abstract move(): void;
}

class FlyingBird extends Bird {
	move(): void {
		this.fly();
	}
	private fly(): void {
		console.log('날아서 이동');
	}
}

class Penguin extends Bird {
	move(): void {
		this.walk();
	}
	private walk(): void {
		console.log('걸어서 이동');
	}
}
```

---

## ISP: 인터페이스 분리 원칙

> "클라이언트는 사용하지 않는 메서드에 의존하지 않아야 한다."

**핵심:** 큰 인터페이스를 작은 인터페이스로 분리

```typescript
// ❌ 큰 인터페이스
interface OrderOperations {
  calculateTotal(): Money;
  applyDiscount(): Money;
  sendNotification(): void;
  generateReport(): void;
  auditLog(): void;
}

// ✅ 인터페이스 분리
interface Calculable {
  calculateTotal(): Money;
  applyDiscount(): Money;
}

interface Notifiable {
  sendNotification(): void;
}

interface Reportable {
  generateReport(): void;
}

interface Auditable {
  auditLog(): void;
}

// 필요한 인터페이스만 구현
class Order implements Calculable, Auditable {
  calculateTotal(): Money { ... }
  applyDiscount(): Money { ... }
  auditLog(): void { ... }
}
```

---

## DIP: 의존성 역전 원칙

> "구체 클래스가 아닌 추상화에 의존하라."

**핵심:**

- 고수준 모듈이 저수준 모듈에 의존하면 안 됨
- 둘 다 추상화에 의존해야 함

```typescript
// ❌ 구체 클래스에 의존
class Order {
	private readonly discountPolicy: PercentDiscountPolicy; // 구체 클래스

	calculateTotal(): Money {
		return this.discountPolicy.applyDiscount(this.subtotal);
	}
}

// ✅ 추상화(인터페이스)에 의존
class Order {
	private readonly discountPolicy: DiscountPolicy; // 인터페이스

	calculateTotal(): Money {
		return this.discountPolicy.applyDiscount(this.subtotal);
	}
}

// 의존성 주입
const percentPolicy = new PercentDiscountPolicy(10);
const tieredPolicy = new TieredDiscountPolicy();

const order1 = new Order(items, percentPolicy);
const order2 = new Order(items, tieredPolicy); // 정책 교체 가능
```

**의존성 방향:**

```
Before (DIP 위반):
  [고수준 모듈] ───────────────► [저수준 모듈]
  Order                    PercentDiscountPolicy

After (DIP 준수):
  [고수준 모듈] ───► [추상화] ◄─── [저수준 모듈]
  Order           DiscountPolicy   PercentDiscountPolicy
```

> **IoC 심화**: DIP는 IoC(제어의 역전)의 일부입니다. 자세한 내용은 [IoC 심화 섹션](#ioc-제어의-역전-심화)을 참고하세요.

---

## SOLID 적용 체크리스트

| 원칙 | 체크 항목                                     |
| ---- | --------------------------------------------- |
| SRP  | 클래스가 변경되는 이유가 하나인가?            |
| OCP  | 새 기능 추가 시 기존 코드를 수정하지 않는가?  |
| LSP  | 자식 클래스가 부모 클래스를 대체할 수 있는가? |
| ISP  | 클라이언트가 사용하지 않는 메서드가 없는가?   |
| DIP  | 구체 클래스가 아닌 인터페이스에 의존하는가?   |

---

## 추가 설계 원칙

---

### DRY: Don't Repeat Yourself

> "모든 지식은 시스템 내에서 단일하고 명확하며 권위있는 표현을 가져야 한다."

**핵심:** 코드 중복 ≠ 지식의 중복

#### 중복의 종류

| 종류 | 설명 | 대응 |
|------|------|------|
| **진짜 중복** | 동일한 비즈니스 규칙이 여러 곳에 | 추상화로 통합 ✅ |
| **우연의 중복** | 우연히 코드가 같을 뿐, 다른 규칙 | 분리 유지 ✅ |
| **의도적 중복** | 성능/가독성을 위한 선택 | 문서화 후 유지 |

#### 진짜 중복 vs 우연의 중복

```typescript
// 우연의 중복: 코드는 같지만 다른 비즈니스 규칙
// ❌ 잘못된 추상화
function validateAge(age: number): boolean {
  return age >= 19;  // "성인 확인"과 "음주 가능 확인"이 우연히 같음
}

// ✅ 분리 유지 (비즈니스 규칙이 다름)
function isAdult(age: number): boolean {
  return age >= 19;  // 성인 기준 (민법)
}

function canDrinkAlcohol(age: number): boolean {
  return age >= 19;  // 음주 가능 기준 (청소년보호법)
}
// 나중에 법이 바뀌면 독립적으로 수정 가능
```

```typescript
// 진짜 중복: 동일한 비즈니스 규칙이 여러 곳에
// ❌ 중복된 할인 계산 로직
class CartService {
  calculateDiscount(amount: Money): Money {
    if (amount.isGreaterThan(Money.of(100000))) {
      return amount.multiply(0.1);
    }
    return Money.zero();
  }
}

class OrderService {
  calculateDiscount(amount: Money): Money {
    if (amount.isGreaterThan(Money.of(100000))) {  // 동일한 규칙!
      return amount.multiply(0.1);
    }
    return Money.zero();
  }
}

// ✅ 단일 소스로 통합
class DiscountPolicy {
  private static readonly THRESHOLD = Money.of(100000);
  private static readonly RATE = 0.1;

  static calculate(amount: Money): Money {
    if (amount.isGreaterThan(this.THRESHOLD)) {
      return amount.multiply(this.RATE);
    }
    return Money.zero();
  }
}
```

#### Rule of Three

> "중복이 2번일 때는 참고, 3번일 때 추상화하라."

| 반복 횟수 | 대응 |
|----------|------|
| 1번 | 그대로 둠 |
| 2번 | 주의 깊게 관찰 (우연의 중복일 수 있음) |
| 3번 | 추상화 고려 (패턴 확인됨) |

#### Premature Abstraction 경고

```typescript
// ❌ 성급한 추상화: 1번 사용되는 코드를 추상화
interface StringProcessor {
  process(str: string): string;
}

class TrimProcessor implements StringProcessor {
  process(str: string): string {
    return str.trim();
  }
}

// ✅ 필요할 때까지 직접 사용
const trimmed = str.trim();
```

**DRY 체크리스트:**

- [ ] 동일한 비즈니스 규칙이 여러 곳에 있는가? → 통합
- [ ] 코드는 같지만 다른 이유로 변경될 수 있는가? → 분리 유지
- [ ] 3번 이상 반복되는 패턴인가? → 추상화 고려

---

### Hollywood Principle

> "Don't call us, we'll call you."

**핵심:** 저수준 컴포넌트가 고수준 컴포넌트를 호출하지 않고, 고수준이 저수준을 호출

#### 라이브러리 vs 프레임워크

| 구분 | 제어 흐름 | 예시 |
|------|----------|------|
| **라이브러리** | 내가 라이브러리를 호출 | Lodash, Moment.js |
| **프레임워크** | 프레임워크가 내 코드를 호출 | NestJS, Spring |

```typescript
// 라이브러리: 내가 호출
import _ from 'lodash';
const result = _.map(items, transformFn);  // 내가 lodash를 호출

// 프레임워크: NestJS가 내 코드를 호출
@Controller('orders')
class OrderController {
  @Post()
  createOrder(@Body() dto: CreateOrderDto) {  // NestJS가 이 메서드를 호출
    return this.orderService.create(dto);
  }
}
```

#### 콜백/이벤트 패턴

Hollywood Principle의 일상적 적용:

```typescript
// ❌ Hollywood Principle 위반: 저수준이 고수준에 의존
class Button {
  private orderService: OrderService;  // UI가 비즈니스 로직에 직접 의존

  onClick(): void {
    this.orderService.createOrder();
  }
}

// ✅ Hollywood Principle 적용: 콜백으로 역전
class Button {
  constructor(private readonly onClick: () => void) {}

  click(): void {
    this.onClick();  // 고수준이 전달한 콜백을 호출
  }
}

// 고수준에서 동작 정의
const submitButton = new Button(() => orderService.createOrder());
```

#### 이벤트 기반 아키텍처

```typescript
// ✅ Hollywood Principle: 이벤트 발행/구독
class Order {
  complete(): void {
    this.status = OrderStatus.COMPLETED;
    this.events.push(new OrderCompletedEvent(this.orderId));  // 이벤트 발행
  }
}

// 고수준에서 핸들러 등록 (프레임워크가 호출)
@EventHandler(OrderCompletedEvent)
class SendNotificationHandler {
  handle(event: OrderCompletedEvent): void {
    // 프레임워크가 이 핸들러를 호출
    this.notificationService.send(event.orderId);
  }
}
```

#### DI와의 관계

Hollywood Principle + DIP = Dependency Injection

```typescript
// DI: 프레임워크가 의존성을 주입 (Hollywood Principle)
@Injectable()
class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,  // 프레임워크가 주입
    private readonly paymentService: PaymentService,   // 프레임워크가 주입
  ) {}
}
```

---

### IoC: 제어의 역전 심화

> "제어 흐름을 직접 관리하지 않고, 프레임워크나 컨테이너에 위임하라."

#### DIP vs IoC vs DI 관계

| 개념 | 정의 | 수준 |
|------|------|------|
| **DIP** | 추상화에 의존하라 (설계 원칙) | 설계 |
| **IoC** | 제어 흐름을 역전시켜라 (아키텍처 원칙) | 아키텍처 |
| **DI** | 의존성을 외부에서 주입하라 (IoC 구현 기법) | 구현 |

```
┌─────────────────────────────────────────────────────────────┐
│                     IoC (Inversion of Control)              │
│                     제어 흐름의 역전                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                DIP (Dependency Inversion)            │   │
│  │                의존성 방향의 역전                      │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │        DI (Dependency Injection)             │    │   │
│  │  │        의존성 주입 (DIP 구현 기법)             │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### IoC 없이 vs IoC 적용

```typescript
// ❌ IoC 없이: 직접 제어
class OrderService {
  private readonly repository: OrderRepository;
  private readonly paymentService: PaymentService;

  constructor() {
    // 직접 의존성 생성 (제어를 직접 관리)
    this.repository = new MySQLOrderRepository(
      new DatabaseConnection('mysql://...')
    );
    this.paymentService = new StripePaymentService(
      new StripeClient('sk_...')
    );
  }
}

// ✅ IoC 적용: 프레임워크가 제어
@Injectable()
class OrderService {
  constructor(
    private readonly repository: OrderRepository,     // 주입됨
    private readonly paymentService: PaymentService,  // 주입됨
  ) {}
  // 의존성 생성/관리는 IoC 컨테이너가 담당
}
```

#### IoC 컨테이너

IoC 컨테이너는 객체의 생명주기와 의존성을 관리:

```typescript
// IoC 컨테이너 설정 (NestJS 예시)
@Module({
  providers: [
    OrderService,
    {
      provide: OrderRepository,
      useClass: MySQLOrderRepository,  // 구현체 바인딩
    },
    {
      provide: PaymentService,
      useClass: StripePaymentService,
    },
  ],
})
class OrderModule {}

// 테스트에서는 다른 구현체 바인딩
@Module({
  providers: [
    OrderService,
    {
      provide: OrderRepository,
      useClass: InMemoryOrderRepository,  // 테스트용 구현체
    },
    {
      provide: PaymentService,
      useClass: MockPaymentService,
    },
  ],
})
class TestOrderModule {}
```

#### 테스트 가능성

IoC의 가장 큰 이점은 **테스트 가능성**:

```typescript
// ❌ IoC 없이: 테스트 어려움
class OrderService {
  constructor() {
    this.repository = new MySQLOrderRepository(...);  // 실제 DB 필요
  }
}

// 테스트 불가능 (실제 DB 연결 필요)
describe('OrderService', () => {
  it('should create order', () => {
    const service = new OrderService();  // MySQL 연결 시도
    // ...
  });
});

// ✅ IoC 적용: 테스트 용이
class OrderService {
  constructor(private readonly repository: OrderRepository) {}
}

// 테스트 가능 (Mock 주입)
describe('OrderService', () => {
  it('should create order', () => {
    const mockRepo = {
      save: jest.fn().mockResolvedValue(testOrder),
    };
    const service = new OrderService(mockRepo as any);
    // 실제 DB 없이 테스트 가능
  });
});
```

#### DI의 세 가지 방식

| 방식 | 장점 | 단점 | 권장 |
|------|------|------|------|
| **생성자 주입** | 불변성, 필수 의존성 명확 | 파라미터 많아질 수 있음 | ✅ 권장 |
| **Setter 주입** | 선택적 의존성 | 불변성 X, 누락 가능 | 선택적 경우만 |
| **필드 주입** | 코드 간결 | 테스트 어려움, 의존성 숨김 | ❌ 비권장 |

```typescript
// ✅ 생성자 주입 (권장)
class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly paymentService: PaymentService,
  ) {}
}

// Setter 주입 (선택적 의존성)
class OrderService {
  private logger?: Logger;

  setLogger(logger: Logger): void {
    this.logger = logger;
  }
}

// ❌ 필드 주입 (비권장)
class OrderService {
  @Inject()
  private orderRepository: OrderRepository;  // 의존성이 숨겨짐
}
```

---

## 원칙 간 관계

```
┌─────────────────────────────────────────────────────────────────┐
│                     설계 원칙 관계도                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   DRY ─────────────────────────────────────────────────────────│
│     │                                                           │
│     │ 지식의 단일 표현                                           │
│     ▼                                                           │
│   SRP (Single Responsibility) ◄────────────────────────────────│
│     │                                                           │
│     │ 책임 분리                                                  │
│     ▼                                                           │
│   ISP (Interface Segregation) ◄────────────────────────────────│
│     │                                                           │
│     │ 인터페이스 분리                                            │
│     ▼                                                           │
│   DIP (Dependency Inversion) ◄──── Hollywood Principle         │
│     │                                     │                     │
│     │ 추상화에 의존                        │ 제어 역전           │
│     ▼                                     ▼                     │
│   OCP (Open/Closed) ◄───────────────── IoC                     │
│     │                                                           │
│     │ 확장에 열림                                                │
│     ▼                                                           │
│   LSP (Liskov Substitution)                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 참고

- Robert C. Martin, "Clean Architecture"
- Robert C. Martin, "Agile Software Development"
- Andrew Hunt & David Thomas, "The Pragmatic Programmer" (DRY)
- Martin Fowler, "Inversion of Control Containers and the Dependency Injection pattern"
