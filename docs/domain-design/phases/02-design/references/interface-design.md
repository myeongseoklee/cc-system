# 인터페이스 설계

> "인터페이스를 먼저 정의하고, 구현은 나중에 한다."

---

## 인터페이스 우선 설계

### 순서

```
1. 협력에서 필요한 메시지 정의
   ↓
2. 인터페이스로 메시지 그룹화
   ↓
3. 인터페이스 사용 (구현 없어도 됨)
   ↓
4. 나중에 구현
```

### 예시

```typescript
// 1. 인터페이스 먼저 정의
interface DiscountPolicy {
  applyDiscount(amount: Money): Money;
  getName(): string;
}

// 2. 인터페이스 사용 (구현 없어도 됨)
class Order {
  constructor(private readonly discountPolicy: DiscountPolicy) {}

  calculateTotal(): Money {
    return this.discountPolicy.applyDiscount(this.subtotal);
  }
}

// 3. 나중에 구현 (언제든 교체 가능)
class PercentDiscountPolicy implements DiscountPolicy {
  applyDiscount(amount: Money): Money {
    return amount.multiply(1 - this.percent / 100);
  }

  getName(): string {
    return 'PercentDiscount';
  }
}
```

---

## 역할과 인터페이스

### 역할 = 대체 가능한 책임의 집합

```typescript
// 역할: 할인 정책 책임
interface DiscountPolicy {
  getName(): string;
  applyDiscount(amount: Money): Money;
}

// 역할을 수행하는 객체들 (대체 가능)
class PercentDiscountPolicy implements DiscountPolicy {}
class AmountDiscountPolicy implements DiscountPolicy {}
class TieredDiscountPolicy implements DiscountPolicy {}
```

### 인터페이스 분리 원칙 (ISP)

클라이언트는 사용하지 않는 메서드에 의존하면 안 됨:

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

// 필요한 인터페이스만 구현
class Order implements Calculable, Auditable {
  calculateTotal(): Money { ... }
  applyDiscount(): Money { ... }
  auditLog(): void { ... }
}
```

---

## 추상화 레벨

### 공통 책임 추출

```typescript
// ✅ 공통 책임 추출 → 인터페이스
interface DiscountPolicy {
  // 모든 할인 정책이 해야 하는 공통 책임
  getName(): string;
  applyDiscount(amount: Money): Money;
}

// 각 정책은 자신만의 방식으로 구현
class PercentDiscountPolicy implements DiscountPolicy {
  getName(): string { return 'percent'; }
  applyDiscount(amount: Money): Money {
    return amount.multiply(1 - this.percent / 100);
  }
}

class AmountDiscountPolicy implements DiscountPolicy {
  getName(): string { return 'amount'; }
  applyDiscount(amount: Money): Money {
    return amount.minus(this.discountAmount);
  }
}

// 클라이언트는 추상화를 통해 단순하게 사용
class Order {
  private readonly discountPolicy: DiscountPolicy;

  calculateTotal(): Money {
    // 구체 클래스를 몰라도 됨
    return this.discountPolicy.applyDiscount(this.subtotal);
  }
}
```

---

## 인터페이스 명명 규칙

| 패턴 | 용도 | 예시 |
|------|------|------|
| `~able` | 능력/특성 | `Notifiable`, `Auditable` |
| `~Policy` | 정책 패턴 | `DiscountPolicy` |
| `~Strategy` | 전략 패턴 | `PricingStrategy` |
| `~Repository` | 영속성 | `OrderRepository` |
| `~Service` | 도메인 서비스 | `NotificationService` |
| `~Factory` | 생성 | `OrderFactory` |

---

## 체크리스트

- [ ] 인터페이스를 먼저 정의했는가?
- [ ] 클라이언트가 사용하지 않는 메서드가 없는가? (ISP)
- [ ] 공통 책임이 인터페이스로 추출되었는가?
- [ ] 구체 클래스가 아닌 인터페이스에 의존하는가? (DIP)

---

## 다음 단계

인터페이스 설계 완료 → [의존성 관리](./dependency-management.md)로 이동
