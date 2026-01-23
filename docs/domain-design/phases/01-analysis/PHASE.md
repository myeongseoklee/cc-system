# Phase 1: 분석/이해

> "객체가 먼저가 아니라, 협력이 먼저다."

---

## 목표

- 도메인 이해 및 유비쿼터스 언어 정의
- 협력 시나리오 작성
- 필요한 메시지 추출
- 객체의 책임 식별

---

## 순서

```
1. 유비쿼터스 언어 정의
   ↓
2. 협력 시나리오 작성
   ↓
3. 메시지 추출
   ↓
4. 다음 Phase로 이동
```

---

## 핵심 원칙

### 협력이 먼저다

객체를 먼저 정의하지 말고, **협력 관계**를 먼저 설계하라.

```
❌ "Order 클래스를 만들자. 어떤 메서드가 필요할까?"
✅ "주문 생성 시나리오에서 어떤 메시지들이 오가는가?"
```

### 메시지가 객체를 선택한다

객체가 메시지를 선택하는 것이 아니라, **메시지가 객체를 선택**한다.

**설계 순서:**
1. **메시지 먼저 정의** (무엇을 해야 하는가?)
2. **그 메시지를 처리할 객체 선택** (누가 할 수 있는가?)
3. **객체에 메서드 구현**

### Tell, Don't Ask

- 객체에게 "어떻게 하라"고 지시하지 말고
- **"무엇을 하라"고 요청**하라

```typescript
// ❌ Ask: 묻고 외부에서 계산
const total = order.getSubtotal() - order.getDiscount();

// ✅ Tell: 시키기만 함
const total = order.calculateTotal();
```

---

## 상세 가이드

| 주제 | 설명 | 링크 |
|------|------|------|
| 협력 시나리오 | 유스케이스별 협력 관계 작성법 | [collaboration-scenario.md](./references/collaboration-scenario.md) |
| 유비쿼터스 언어 | 도메인 전문가와 개발자의 공통 언어 | [ubiquitous-language.md](./references/ubiquitous-language.md) |
| 메시지 추출 | 시나리오에서 메시지 식별 | [message-extraction.md](./references/message-extraction.md) |

---

## 예시: 주문 생성

### 1. 협력 시나리오

```
유스케이스: 주문 생성

1. 사용자가 상품을 장바구니에 담는다
2. 시스템이 주문 항목을 생성한다
3. 시스템이 할인 정책을 선택한다
4. 시스템이 Order 엔티티를 생성한다
5. 각 항목이 금액을 계산한다
6. Order가 총액을 계산하여 반환한다
```

### 2. 메시지 추출

```typescript
interface Messages {
  createOrderItem(product, quantity): OrderItem;
  selectDiscountPolicy(type): DiscountPolicy;
  calculateAmount(): Money;
  calculateTotal(): Money;
}
```

### 3. 다음 단계

메시지가 식별되면 → [Phase 2: 설계](../02-design/PHASE.md)로 이동하여 책임 할당

---

## 체크리스트

- [ ] 도메인 용어를 코드에 그대로 반영했는가?
- [ ] 협력 시나리오를 먼저 작성했는가?
- [ ] 필요한 메시지를 모두 추출했는가?
- [ ] Tell, Don't Ask 원칙을 고려했는가?

---

## 관련 원칙

- [객체지향 핵심](../../principles/oop-fundamentals.md) - 책임, 역할, 협력의 기본 개념
