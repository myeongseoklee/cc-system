# Phase 2: 설계

> "책임을 수행하는 데 필요한 정보를 가장 많이 알고 있는 객체에게 책임을 할당하라."

---

## 목표

- GRASP 패턴으로 책임 할당
- 인터페이스 정의
- 의존성 관계 설계
- 변경 보호 지점 식별

---

## 순서

```
1. 정보 전문가 찾기 (GRASP)
   ↓
2. 책임 할당
   ↓
3. 인터페이스 정의
   ↓
4. 의존성 방향 결정
   ↓
5. 다음 Phase로 이동
```

---

## 핵심 원칙

### GRASP 패턴

| 패턴 | 핵심 질문 |
|------|-----------|
| 정보 전문가 | "이 책임을 수행할 정보를 누가 가지고 있는가?" |
| 창조자 | "이 객체를 누가 생성해야 하는가?" |
| 낮은 결합도 | "불필요한 의존성이 있는가?" |
| 높은 응집도 | "관련 있는 책임만 모여있는가?" |
| 다형성 | "조건문을 다형성으로 대체할 수 있는가?" |
| 변경 보호 | "변경이 예상되는 지점을 인터페이스로 보호했는가?" |

### SOLID 원칙

| 원칙 | 한 줄 설명 |
|------|-----------|
| SRP | 클래스는 하나의 변경 이유만 가져야 한다 |
| OCP | 확장에 열려있고, 수정에 닫혀있어야 한다 |
| LSP | 하위 타입은 상위 타입을 대체할 수 있어야 한다 |
| ISP | 클라이언트는 사용하지 않는 메서드에 의존하면 안 된다 |
| DIP | 구체 클래스가 아닌 추상화에 의존하라 |

### 인터페이스 우선

> "인터페이스를 먼저 정의하고, 구현은 나중에 한다."

```typescript
// 1. 인터페이스 먼저
interface DiscountPolicy {
  applyDiscount(amount: Money): Money;
}

// 2. 인터페이스 사용 (구현 없어도 됨)
class Order {
  constructor(private readonly discountPolicy: DiscountPolicy) {}

  calculateTotal(): Money {
    return this.discountPolicy.applyDiscount(this.subtotal);
  }
}

// 3. 나중에 구현
class PercentDiscountPolicy implements DiscountPolicy { ... }
```

---

## 상세 가이드

| 주제 | 설명 | 링크 |
|------|------|------|
| 책임 할당 | GRASP 패턴으로 책임 결정 | [responsibility-assignment.md](./references/responsibility-assignment.md) |
| 인터페이스 설계 | 역할 정의 및 추상화 | [interface-design.md](./references/interface-design.md) |
| 의존성 관리 | 결합도/응집도, 디미터 법칙 | [dependency-management.md](./references/dependency-management.md) |

---

## 예시: 주문 책임 할당

### 1. 정보 전문가 찾기

```typescript
// "총액을 계산하라" 메시지 → 누가 정보를 가지고 있는가?

// Order가 항목/할인정책 정보를 가짐 → 총액 계산 책임
class Order {
  calculateTotal(): Money {
    const subtotal = this.calculateSubtotal();
    return this.discountPolicy.applyDiscount(subtotal);
  }
}
```

### 2. 책임 할당

```typescript
// Repository: 데이터 조회 책임
interface OrderRepository {
  findById(orderId: string): Promise<Order>;
}

// Factory: 생성 책임
class OrderFactory {
  static create(rawData: RawData): Order;
}

// Entity: 계산 책임
class OrderItem {
  calculateAmount(): Money;
}

// Aggregate Root: 조율 책임
class Order {
  calculateTotal(): Money;
}
```

### 3. 인터페이스 정의

```typescript
// 공통 책임 추출 → 인터페이스
interface DiscountPolicy {
  getName(): string;
  applyDiscount(amount: Money): Money;
}

interface OrderRepository {
  save(order: Order): Promise<Order>;
  findById(id: string): Promise<Order | null>;
}
```

### 4. 다음 단계

책임 할당 완료 → [Phase 3: 구현](../03-implementation/PHASE.md)으로 이동

---

## 체크리스트

- [ ] 정보 전문가에게 책임을 할당했는가?
- [ ] 인터페이스에 의존하는가?
- [ ] 결합도는 낮고 응집도는 높은가?
- [ ] 변경이 예상되는 지점을 인터페이스로 보호했는가?
- [ ] 조건문을 다형성으로 대체했는가?

---

## 관련 원칙

- [GRASP 패턴](../../principles/grasp-patterns.md) - 책임 할당의 9가지 패턴
- [SOLID 원칙](../../principles/solid.md) - 객체지향 설계 5대 원칙
