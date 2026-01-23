# 메시지 추출

> "객체가 메시지를 선택하는 것이 아니라, 메시지가 객체를 선택한다."

---

## 메시지란?

- 객체 간 **커뮤니케이션 수단**
- "무엇을 해야 하는가?"를 표현
- 인터페이스(public 메서드)로 구현됨

---

## 추출 순서

### 1. 협력 시나리오에서 동사 추출

```
시나리오:
1. 사용자가 상품을 **선택**한다
2. 시스템이 주문 항목을 **생성**한다
3. 시스템이 할인 정책을 **적용**한다
4. 각 항목이 금액을 **계산**한다
5. Order가 총액을 **반환**한다
```

### 2. 동사를 메시지로 변환

| 동사 | 메시지 |
|------|--------|
| 선택한다 | `select()`, `choose()` |
| 생성한다 | `create()`, `add()` |
| 적용한다 | `apply()`, `applyDiscount()` |
| 계산한다 | `calculate()`, `compute()` |
| 반환한다 | `getTotal()`, `toJSON()` |

### 3. 메시지 시그니처 정의

```typescript
interface Messages {
  // 생성
  createOrderItem(product: Product, quantity: number): OrderItem;

  // 적용
  applyDiscount(amount: Money): Money;

  // 계산
  calculateAmount(): Money;
  calculateTotal(): Money;

  // 반환
  toJSON(): OrderDTO;
}
```

---

## 메시지 선택 기준

### "무엇을" vs "어떻게"

```typescript
// ✅ 무엇을 (What) - 좋은 메시지
calculateTotal(): Money;  // 총액을 계산하라

// ❌ 어떻게 (How) - 나쁜 메시지
multiplyPriceByQuantityAndSubtractDiscount(): Money;  // 구현 노출
```

### 클라이언트 관점

메시지는 **클라이언트가 원하는 것**을 표현:

```typescript
// 클라이언트가 원하는 것: "주문의 총액을 알고 싶다"
order.calculateTotal();

// 클라이언트가 원하는 것: "항목의 금액을 알고 싶다"
item.calculateAmount();
```

---

## 예시: 주문 메시지

### 1단계: 협력에서 메시지 추출

```typescript
// 협력에서 필요한 메시지들
interface DiscountPolicy {
  applyDiscount(amount: Money): Money;  // "할인을 적용하라"
  getName(): string;                     // "정책 이름을 알려달라"
}
```

### 2단계: 메시지 사용 (구현 없어도 됨)

```typescript
class Order {
  private readonly items: OrderItem[];
  private readonly discountPolicy: DiscountPolicy;

  calculateTotal(): Money {
    const subtotal = this.calculateSubtotal();
    // 다형성: 메시지만 보내면 각 객체가 알아서 처리
    return this.discountPolicy.applyDiscount(subtotal);
  }
}
```

### 3단계: 나중에 구현

```typescript
class PercentDiscountPolicy implements DiscountPolicy {
  applyDiscount(amount: Money): Money {
    // 퍼센트 할인 방식으로 구현
    return amount.multiply(1 - this.percent / 100);
  }
}

class AmountDiscountPolicy implements DiscountPolicy {
  applyDiscount(amount: Money): Money {
    // 정액 할인 방식으로 구현
    return amount.minus(this.discountAmount);
  }
}
```

---

## 체크리스트

- [ ] 협력 시나리오에서 동사를 추출했는가?
- [ ] 메시지가 "무엇을"을 표현하는가? (어떻게 X)
- [ ] 메시지 시그니처가 명확한가?
- [ ] 클라이언트 관점에서 메시지가 의미있는가?

---

## 다음 단계

메시지가 정의되면 → [책임 할당](../../02-design/references/responsibility-assignment.md)으로 이동하여 메시지를 처리할 객체 선택
