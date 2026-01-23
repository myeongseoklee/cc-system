# Factory & Repository

> "복잡한 객체 생성은 Factory로, 영속성은 Repository로 분리하라."

---

## Factory Pattern

**복잡한 객체 생성 로직을 캡슐화**

### 목적

- 생성 책임 분리
- 복잡한 생성 로직 숨김
- 일관된 생성 보장

### 예시

```typescript
class OrderFactory {
  /**
   * 원시 데이터로부터 Aggregate 생성
   */
  static create(rawData: RawData): Order {
    // 1. Value Object 생성
    const items = rawData.items.map(item =>
      new OrderItem(
        item.productId,
        new Money(item.price),
        item.quantity
      )
    );

    // 2. 할인 정책 생성
    const discountPolicy = DiscountPolicyFactory.of(rawData.discountType);

    // 3. Aggregate Root 반환
    return new Order({
      orderId: rawData.orderId,
      customerId: rawData.customerId,
      orderDate: DateValue.fromYYYYMMDD(rawData.orderDate),
      items,
      discountPolicy,
    });
  }

  /**
   * 여러 원시 데이터를 그룹화하여 생성
   */
  static createFromRawDataList(dataList: RawData[]): Order[] {
    return dataList.map(data => this.create(data));
  }
}
```

---

## 정적 팩토리 메서드 vs 생성자

### 정적 팩토리 메서드를 선택하는 경우

**1. 이름이 필요할 때**

```typescript
// ❌ 생성자: 의도 불명확
const date1 = new Date(2026, 0, 22);
const date2 = new Date(1737536400000);

// ✅ 정적 팩토리: 의도 명확
const date1 = DateValue.fromYYYYMMDD(20260122);
const date2 = DateValue.fromTimestamp(1737536400000);
const date3 = DateValue.today();
```

**2. 캐싱이 필요할 때**

```typescript
class Money {
  private static readonly ZERO = new Money(0);

  private constructor(private readonly amount: Decimal) {}

  static zero(): Money {
    return Money.ZERO;  // 캐싱된 인스턴스 반환
  }

  static of(amount: number): Money {
    return amount === 0 ? Money.ZERO : new Money(new Decimal(amount));
  }
}
```

**3. 다형적 반환이 필요할 때**

```typescript
class DiscountPolicyFactory {
  static of(type: string, value?: number): DiscountPolicy {
    switch (type) {
      case 'PERCENT':
        return new PercentDiscountPolicy(value ?? 10);
      case 'AMOUNT':
        return new AmountDiscountPolicy(Money.of(value ?? 1000));
      case 'TIERED':
        return new TieredDiscountPolicy();
      case 'NONE':
        return NoneDiscountPolicy.INSTANCE;
      default:
        throw new Error(`Unknown discount type: ${type}`);
    }
  }
}
```

### 명명 규칙

| 메서드명 | 용도 | 예시 |
|---------|------|------|
| `from` | 형변환 (매개변수 1개) | `Date.from(instant)` |
| `of` | 집계 (매개변수 여러 개) | `Money.of(1000)` |
| `create` | 매번 새 인스턴스 | `OrderFactory.create()` |
| `parse` | 문자열 파싱 | `LocalDate.parse("2026-01-22")` |
| `zero`, `empty` | 특별한 인스턴스 | `Money.zero()` |

---

## Repository Pattern

**도메인 객체의 영속성을 담당하는 추상화**

### 목적

- 도메인 로직과 데이터 접근 로직 분리
- 인프라스트럭처 의존성 격리
- 테스트 용이성

### 인터페이스 정의 (도메인 계층)

```typescript
interface OrderRepository {
  findById(orderId: string): Promise<Order | null>;
  findByCustomerId(customerId: string): Promise<Order[]>;
  save(order: Order): Promise<Order>;
}
```

### 구현 (인프라스트럭처 계층)

```typescript
class OrderRepositoryImpl implements OrderRepository {
  async findById(orderId: string): Promise<Order | null> {
    const rows = await database.executeQuery(
      'SP_Order_Select',
      [orderId],
    );
    if (rows.length === 0) return null;
    return OrderFactory.create(rows[0]);
  }

  async save(order: Order): Promise<Order> {
    await database.executeQuery(
      'SP_Order_Upsert',
      [order.orderId, order.toJSON()],
    );
    return order;
  }
}
```

### 사용 (UseCase)

```typescript
class CreateOrderUseCase {
  constructor(
    private readonly repository: OrderRepository // 인터페이스
  ) {}

  async exec(request: CreateOrderRequest): Promise<Order> {
    const order = OrderFactory.create(request);
    return this.repository.save(order);
  }
}
```

---

## Factory vs Repository

| 역할 | Factory | Repository |
|------|---------|------------|
| 목적 | 객체 생성 | 객체 영속화 |
| 입력 | 원시 데이터, DTO | Query, ID |
| 출력 | 도메인 객체 | 도메인 객체 |
| 저장소 | 없음 | DB, 파일 등 |

---

## 체크리스트

### Factory

- [ ] 복잡한 생성 로직이 Factory에 캡슐화되어 있는가?
- [ ] 정적 팩토리 메서드 이름이 의도를 명확히 표현하는가?
- [ ] 생성된 객체의 유효성이 보장되는가?

### Repository

- [ ] 인터페이스가 도메인 계층에 정의되어 있는가?
- [ ] 구현이 인프라스트럭처 계층에 있는가?
- [ ] 도메인 로직이 Repository에 들어가지 않았는가?
