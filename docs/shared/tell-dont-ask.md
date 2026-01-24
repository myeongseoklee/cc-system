# Tell, Don't Ask 원칙

> "객체에게 무엇을 하라고 요청하라. 어떻게 하는지 묻지 마라."

---

## 개요

Tell, Don't Ask는 객체지향 설계의 핵심 원칙 중 하나로, **데이터를 가진 객체가 그 데이터를 사용하는 행동도 가져야 한다**는 원칙입니다.

이 원칙은 GRASP의 **정보 전문가(Information Expert)** 패턴의 실천적 표현입니다.

---

## 핵심 개념

| 방식 | 설명 | 결과 |
|------|------|------|
| **Ask** | 데이터를 꺼내서 외부에서 처리 | 캡슐화 파괴, 로직 분산 |
| **Tell** | 객체에게 행동을 요청 | 캡슐화 유지, 응집도 높음 |

---

## 코드 예시

### Ask (나쁜 예)

```typescript
// ❌ Ask: 데이터를 꺼내서 외부에서 계산
class PaymentService {
  calculateDiscount(order: Order): number {
    const subtotal = order.getSubtotal(); // 물어봄
    const items = order.getItems();       // 물어봄
    const customer = order.getCustomer(); // 물어봄

    // 외부에서 계산 - Order가 해야 할 일을 여기서 함
    let discount = 0;
    if (customer.isVIP()) {
      discount = subtotal.times(0.1).toNumber();
    }
    return discount;
  }
}
```

### Tell (좋은 예)

```typescript
// ✅ Tell: 객체에게 행동을 요청
class Order {
  private readonly discountPolicy: DiscountPolicy;

  calculateTotal(): Money {
    // 스스로 결정하고 계산
    const subtotal = this.calculateSubtotal();
    return this.discountPolicy.applyDiscount(subtotal);
  }
}

class PaymentService {
  processPayment(order: Order): Money {
    // 그냥 시키기만 함
    return order.calculateTotal();
  }
}
```

---

## 적용 신호

Tell, Don't Ask를 적용해야 할 때:

1. **Getter 연쇄 호출** - `order.getCustomer().getAddress().getCity()`
2. **외부에서 계산** - 데이터를 꺼내서 다른 곳에서 로직 수행
3. **Feature Envy** - 다른 객체 데이터를 과도하게 사용하는 메서드

---

## 관련 안티패턴

| 안티패턴 | 설명 |
|----------|------|
| **Anemic Domain Model** | 데이터만 있고 행동이 없는 도메인 객체 |
| **Feature Envy** | 다른 객체 데이터를 과도하게 사용 |
| **Train Wreck** | `a.b.c.d()` 연쇄 호출 |

---

## 체크리스트

- [ ] Getter를 호출한 후 외부에서 계산하고 있는가? → Tell로 변경
- [ ] 객체 내부 데이터를 외부에 노출하고 있는가? → 캡슐화
- [ ] 메서드가 다른 객체 데이터를 과도하게 사용하는가? → 해당 객체로 이동

---

## 관련 문서

- [GRASP 패턴 - 정보 전문가](../domain-design/patterns/grasp.md#1-정보-전문가-information-expert) - Tell, Don't Ask의 원천
- [객체지향 핵심 개념](../domain-design/principles/oop-fundamentals.md#4-자율적인-객체) - 자율적인 객체
