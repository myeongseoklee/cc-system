# 유비쿼터스 언어

> "도메인 전문가와 개발자가 사용하는 공통 언어를 정의하라."

---

## 유비쿼터스 언어란?

- 도메인 전문가와 개발자가 **동일한 용어**를 사용
- 코드에 **도메인 용어를 그대로** 반영
- 의사소통 단절을 방지

---

## 원칙

### 1. 도메인 용어를 코드에 그대로 반영

```typescript
// ✅ 도메인 용어 그대로
class Order {
  subtotal: Money;      // 소계
  discount: Money;      // 할인
  total: Money;         // 총액
}

// ❌ 개발자 용어로 변경 (의사소통 단절)
class Order {
  priceBeforeDiscount: Money;
  discountAmount: Money;
  finalPrice: Money;
}
```

### 2. 모호한 용어 정의

| 용어 | 정의 | 사용 맥락 |
|------|------|-----------|
| 소계(subtotal) | 할인 적용 전 금액 | 주문 금액 계산 |
| 할인(discount) | 적용된 할인 금액 | 할인 정책 적용 |
| 총액(total) | 소계 - 할인 | 최종 결제 금액 |

### 3. 용어집(Glossary) 유지

프로젝트 내 공식 용어집을 유지하고 모든 팀원이 참조:

```markdown
## 주문 도메인 용어집

| 한글 | 영문(코드) | 설명 |
|------|-----------|------|
| 주문 | Order | 사용자의 구매 요청 |
| 주문 항목 | OrderItem | 주문에 포함된 개별 상품 |
| 할인 정책 | DiscountPolicy | 할인 계산 로직을 담은 객체 |
| 소계 | subtotal | 할인 전 금액 |
| 총액 | total | 할인 후 최종 금액 |
```

---

## 적용 예시

### Before: 용어 혼란

```typescript
// 개발자마다 다른 용어 사용
class OrderCalculator {
  getPrice(): number { ... }         // 개발자 A
  getAmount(): number { ... }        // 개발자 B
  getTotalCost(): number { ... }     // 개발자 C
}
```

### After: 유비쿼터스 언어 적용

```typescript
// 도메인 용어 통일
class Order {
  calculateSubtotal(): Money { ... }  // 모든 팀원이 같은 용어 사용
  getDiscount(): Money { ... }
  calculateTotal(): Money { ... }     // 소계 - 할인
}
```

---

## 체크리스트

- [ ] 도메인 전문가와 동일한 용어를 사용하는가?
- [ ] 코드에 도메인 용어가 그대로 반영되었는가?
- [ ] 모호한 용어가 명확히 정의되었는가?
- [ ] 용어집이 유지되고 있는가?

---

## 참고

- Eric Evans, "Domain-Driven Design" - 유비쿼터스 언어
- 조영호, "오브젝트" - 도메인 모델과 코드의 일관성
