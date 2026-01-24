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

## 책임 할당 의사결정 플로우차트

```
┌─────────────────────────────────────────────────────────────────┐
│                    "이 책임을 누구에게 할당할까?"                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. 정보를 가장 많이 아는 객체는? ──────────────► 정보 전문가       │
│                    │                                            │
│                    ▼                                            │
│   2. 도메인 개념에 해당하는가? ───── YES ──────► Entity/VO에 할당   │
│                    │                                            │
│                    NO                                           │
│                    ▼                                            │
│   3. 기술적 책임인가? (DB, 외부API) ── YES ──► Pure Fabrication    │
│      (Repository, Gateway, Factory)                             │
│                    │                                            │
│                    NO                                           │
│                    ▼                                            │
│   4. 여러 도메인을 조율하는가? ───── YES ──────► Service/UseCase   │
│                    │                                            │
│                    NO                                           │
│                    ▼                                            │
│   5. 외부 요청을 받는가? ─────────── YES ──────► Controller        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## GRASP 패턴 선택 가이드

### 상황별 패턴 선택

| 상황 | 질문 | 적용 패턴 |
|------|------|----------|
| 새 책임 할당 | "이 정보를 누가 알고 있나?" | **정보 전문가** |
| 객체 생성 | "이 객체와 밀접한 관계인가?" | **창조자** |
| 의존성 증가 | "이 의존이 꼭 필요한가?" | **낮은 결합도** |
| 클래스 비대화 | "이 책임이 여기 맞나?" | **높은 응집도** |
| 타입별 분기 | "switch/if를 없앨 수 있나?" | **다형성** |
| 변경 가능성 | "이 부분이 바뀔 수 있나?" | **변경 보호** |
| 도메인 외 책임 | "도메인 개념이 아닌가?" | **순수 가공물** |
| 직접 결합 문제 | "중간 객체가 필요한가?" | **간접 참조** |

### 패턴 적용 우선순위

```
1순위: 정보 전문가 → 기본 원칙, 항상 먼저 고려
2순위: 낮은 결합도 / 높은 응집도 → 결과 검증 기준
3순위: 순수 가공물 → 기술적 책임 분리
4순위: 다형성 / 변경 보호 → 확장성 확보
```

### 안티패턴 vs 올바른 패턴

| 안티패턴 | 증상 | 해결 패턴 |
|----------|------|----------|
| 빈약한 도메인 | 로직이 Service에 집중 | 정보 전문가 |
| God Class | 한 클래스에 모든 책임 | 높은 응집도 |
| 스파게티 의존성 | 모든 클래스가 연결 | 낮은 결합도, 간접 참조 |
| 조건문 폭발 | switch/if 중복 | 다형성 |

---

## 인터페이스 설계 체크리스트

### 설계 시 확인사항

```
□ 인터페이스 이름이 역할을 표현하는가?
  - ✅ DiscountPolicy (할인 정책 역할)
  - ❌ IDiscount (구현체 이름 + I 접두사)

□ 메서드가 "무엇"을 하는지 표현하는가? (어떻게 X)
  - ✅ applyDiscount(amount: Money): Money
  - ❌ calculatePercentage(amount: number): number

□ 클라이언트 관점에서 설계했는가?
  - 사용하는 쪽에서 필요한 기능만 포함
  - 구현 편의가 아닌 사용 편의 기준

□ 변경 가능성이 있는 부분을 추상화했는가?
  - 외부 시스템 연동 (결제, 알림, 저장소)
  - 비즈니스 규칙 (할인, 배송비, 검증)
  - 정책 (인증, 권한)

□ 너무 많은 메서드가 있지 않은가? (ISP)
  - 5개 이상이면 분리 고려
  - 클라이언트마다 다른 메서드 사용 → 분리

□ 인터페이스가 안정적인가?
  - 자주 변경되는 인터페이스는 문제
  - 변경 시 모든 구현체 수정 필요
```

### 인터페이스 분리 기준

```typescript
// ❌ 뚱뚱한 인터페이스
interface OrderService {
  createOrder(): Order;
  cancelOrder(): void;
  getOrderDetails(): OrderDTO;
  generateReport(): Report;
  sendNotification(): void;
}

// ✅ 역할별 분리
interface OrderCommands {
  createOrder(): Order;
  cancelOrder(): void;
}

interface OrderQueries {
  getOrderDetails(): OrderDTO;
}

interface OrderReporting {
  generateReport(): Report;
}
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

- [GRASP 패턴](../../patterns/grasp.md) - 책임 할당의 9가지 패턴
- [SOLID 원칙](../../principles/solid.md) - 객체지향 설계 5대 원칙

---

## 네비게이션

← [이전: Phase 1 - 분석](../01-analysis/PHASE.md) | [다음: Phase 3 - 구현](../03-implementation/PHASE.md) →
