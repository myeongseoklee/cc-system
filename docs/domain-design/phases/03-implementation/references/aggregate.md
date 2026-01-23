# Aggregate

> "일관성 경계를 가진 Entity와 Value Object의 묶음"

---

## Aggregate란?

- **일관성 경계**: 하나의 트랜잭션에서 함께 변경되는 객체들의 묶음
- **Aggregate Root**: 외부에서 접근 가능한 유일한 진입점
- **불변식 보장**: Root가 전체 Aggregate의 불변식을 책임

---

## 규칙

### 1. Root를 통해서만 접근

```typescript
class Order {
  private readonly items: OrderItem[];

  // ✅ Root를 통해서만 접근
  getItem(index: number): OrderItem | undefined {
    return this.items[index];
  }

  // ❌ 외부에서 직접 접근 불가
  // items 필드를 public으로 노출하지 않음
}
```

### 2. Root가 불변식 보장

```typescript
class Order {
  private readonly items: OrderItem[];

  // 불변식: 주문 항목 최대 100개
  addItem(item: OrderItem): void {
    if (this.items.length >= 100) {
      throw new Error('최대 100개까지 담을 수 있습니다');
    }
    this.items.push(item);
  }

  // 불변식: 최소 1개 이상의 항목
  validate(): boolean {
    return this.items.length > 0;
  }
}
```

### 3. 트랜잭션 경계

- 하나의 Aggregate = 하나의 트랜잭션
- 여러 Aggregate를 수정해야 하면 도메인 이벤트 사용

```typescript
// ✅ 하나의 Aggregate 내에서 일관성 보장
class Order {
  private items: OrderItem[] = [];
  private status: OrderStatus = OrderStatus.CREATED;

  complete(): void {
    // 불변식 검증
    if (this.items.length === 0) {
      throw new Error('주문 항목이 없습니다');
    }
    if (this.status !== OrderStatus.CREATED) {
      throw new Error('완료할 수 없는 상태입니다');
    }

    this.status = OrderStatus.COMPLETED;
  }
}
```

---

## 예시: Order Aggregate

```
Order (Aggregate Root)
├── orderId: string (식별자)
├── customerId: string (다른 Aggregate 참조)
├── orderDate: DateValue (Value Object)
├── items: OrderItem[]
│   ├── OrderItem (Entity)
│   │   ├── productId: string
│   │   ├── price: Money (Value Object)
│   │   └── quantity: number
│   └── ...
└── discountPolicy: DiscountPolicy (Value Object/Strategy)
```

### 코드

```typescript
// Aggregate Root
class Order {
  readonly orderId: string;
  readonly customerId: string;
  readonly orderDate: DateValue;
  private readonly items: OrderItem[];
  private readonly discountPolicy: DiscountPolicy;

  // Root를 통한 접근
  getItem(index: number): OrderItem | undefined {
    return this.items[index];
  }

  getAllItems(): ReadonlyArray<OrderItem> {
    return [...this.items];
  }

  // 항목 추가 (불변식 검증)
  addItem(item: OrderItem): void {
    if (this.items.length >= 100) {
      throw new Error('최대 100개까지 담을 수 있습니다');
    }
    this.items.push(item);
  }

  // 총액 계산 (Root가 조율)
  calculateTotal(): Money {
    const subtotal = this.items.reduce(
      (total, item) => total.plus(item.calculateAmount()),
      Money.zero()
    );
    return this.discountPolicy.applyDiscount(subtotal);
  }

  // JSON 변환 (Root가 책임)
  toJSON(): OrderDTO {
    return {
      orderId: this.orderId,
      customerId: this.customerId,
      orderDate: this.orderDate.toYYYYMMDD(),
      items: this.items.map(item => item.toJSON()),
      total: this.calculateTotal().toNumber(),
    };
  }
}
```

---

## Aggregate 설계 가이드

### 작은 Aggregate 선호

```typescript
// ✅ 작은 Aggregate
class Order {
  readonly orderId: string;
  private items: OrderItem[];
  private status: OrderStatus;
}

// ❌ 너무 큰 Aggregate
class Order {
  readonly orderId: string;
  private items: OrderItem[];
  private customer: Customer;      // 별도 Aggregate로 분리
  private payment: Payment;        // 별도 Aggregate로 분리
  private shipping: Shipping;      // 별도 Aggregate로 분리
}
```

### ID로 다른 Aggregate 참조

```typescript
// ✅ ID로 참조
class Order {
  readonly customerId: string;  // Customer Aggregate의 ID만 보유
}

// ❌ 객체 참조
class Order {
  readonly customer: Customer;  // 다른 Aggregate 직접 참조
}
```

---

## 체크리스트

- [ ] Aggregate Root가 명확히 정의되어 있는가?
- [ ] 외부에서 Root를 통해서만 접근하는가?
- [ ] Root가 불변식을 보장하는가?
- [ ] Aggregate 크기가 적절한가?
- [ ] 다른 Aggregate는 ID로만 참조하는가?
