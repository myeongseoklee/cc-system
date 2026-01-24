# Phase 3: 구현

> "객체는 상태와 행동을 함께 가진다."

---

## 목표

- Entity와 Value Object 구현
- Aggregate 경계 정의
- Factory로 복잡한 생성 로직 캡슐화
- Repository로 영속성 분리

---

## 순서

```
1. Value Object 구현
   ↓
2. Entity 구현
   ↓
3. Aggregate 경계 정의
   ↓
4. Factory 구현
   ↓
5. Repository 구현
   ↓
6. 다음 Phase로 이동
```

---

## 핵심 원칙

### Entity vs Value Object

| 특성 | Entity | Value Object |
|------|--------|--------------|
| 식별자 | 있음 (ID) | 없음 |
| 가변성 | 가변 가능 | 불변 |
| 비교 | 동일성 (Identity) | 동등성 (Equality) |
| 생명주기 | 있음 | 교체 가능 |

```typescript
// Entity: 식별자로 구분
class Order {
  readonly orderId: string;
  readonly customerId: string;
  equals(other): boolean {
    return this.orderId === other.orderId;
  }
}

// Value Object: 값으로 비교
class Money {
  private readonly amount: Decimal;
  equals(other: Money): boolean {
    return this.amount.equals(other.amount);
  }
}
```

### 정적 팩토리 메서드 vs 생성자

| 상황 | 선택 |
|------|------|
| 이름이 필요할 때 | 정적 팩토리 (`DateValue.fromYYYYMMDD()`) |
| 캐싱이 필요할 때 | 정적 팩토리 (`Money.zero()`) |
| 다형적 반환이 필요할 때 | 정적 팩토리 (`DiscountPolicy.of(type)`) |
| 단순한 객체 생성 | 생성자 (`new Point(10, 20)`) |

### 상속보다 합성

```typescript
// ❌ 상속: 부모 구현에 의존
class InstrumentedHashSet extends HashSet { ... }

// ✅ 합성: 기존 클래스를 필드로 참조
class InstrumentedSet {
  private readonly set: Set<T> = new Set();
}
```

---

## 상세 가이드

| 주제 | 설명 | 링크 |
|------|------|------|
| Entity/VO | Entity와 Value Object 구분 및 구현 | [entity-vo.md](./references/entity-vo.md) |
| Aggregate | 일관성 경계, Aggregate Root | [aggregate.md](./references/aggregate.md) |
| Factory & Repository | 생성 로직 캡슐화, 영속성 분리 | [factory-repository.md](./references/factory-repository.md) |
| 합성과 상속 | 올바른 상속 사용법, 합성 패턴 | [composition-inheritance.md](./references/composition-inheritance.md) |

---

## 예시: 주문 시스템 구현

### 1. Value Object

```typescript
class Money {
  private readonly amount: Decimal;

  constructor(amount: number) {
    if (amount < 0) throw new Error('금액은 음수일 수 없습니다');
    this.amount = new Decimal(amount);
  }

  // 불변성: 새로운 객체 반환
  plus(other: Money): Money {
    return new Money(this.amount.plus(other.amount).toNumber());
  }

  // 동등성 비교
  equals(other: Money): boolean {
    return this.amount.equals(other.amount);
  }
}
```

### 2. Entity

```typescript
class PercentDiscountPolicy implements DiscountPolicy {
  constructor(
    private readonly percent: number,
  ) {}

  getName(): string { return 'percent'; }

  applyDiscount(amount: Money): Money {
    return amount.multiply(1 - this.percent / 100);
  }
}
```

### 3. Aggregate

```typescript
class Order {
  readonly orderId: string;
  private readonly items: OrderItem[];
  private readonly discountPolicy: DiscountPolicy;

  // Root를 통해서만 접근
  getItem(index: number): OrderItem | undefined {
    return this.items[index];
  }

  // 불변식 보장
  addItem(item: OrderItem): void {
    if (this.items.length >= 100) {
      throw new Error('최대 100개까지 담을 수 있습니다');
    }
    this.items.push(item);
  }

  calculateTotal(): Money {
    const subtotal = this.calculateSubtotal();
    return this.discountPolicy.applyDiscount(subtotal);
  }
}
```

### 4. Factory

```typescript
class OrderFactory {
  static create(rawData: RawData): Order {
    // 1. Value Object 생성
    const items = rawData.items.map(item =>
      new OrderItem(item.productId, new Money(item.price), item.quantity)
    );

    // 2. 할인 정책 생성
    const discountPolicy = DiscountPolicyFactory.of(rawData.discountType);

    // 3. Aggregate Root 반환
    return new Order({
      orderId: rawData.orderId,
      items,
      discountPolicy,
    });
  }
}
```

### 5. 다음 단계

구현 완료 → [Phase 4: 테스트](../04-test-refactor/PHASE.md)로 이동

---

## 체크리스트

- [ ] Value Object는 불변인가?
- [ ] Entity는 식별자로 비교하는가?
- [ ] Aggregate Root를 통해서만 내부 객체에 접근하는가?
- [ ] 복잡한 생성 로직은 Factory로 분리했는가?
- [ ] 상속 대신 합성을 사용했는가?

---

## 관련 원칙

- [객체지향 핵심](../../principles/oop-fundamentals.md) - 상태와 행동, 캡슐화

---

## 네비게이션

← [이전: Phase 2 - 설계](../02-design/PHASE.md) | [다음: Phase 4 - 테스트/리팩토링](../04-test-refactor/PHASE.md) →
