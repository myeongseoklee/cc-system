# 협력 시나리오 작성법

> "객체가 먼저가 아니라, 협력이 먼저다."

---

## 협력 시나리오란?

객체들이 메시지를 주고받으며 문제를 해결하는 과정을 서술한 것.

**설계 전에 협력 시나리오를 작성하면:**
- 어떤 객체가 필요한지 파악
- 객체 간 메시지 흐름 이해
- 책임 할당의 근거 확보

---

## 작성 순서

### 1. 유스케이스 선택

```
유스케이스: 주문 총액 계산
```

### 2. 시나리오 작성 (자연어)

```
1. 사용자가 주문을 요청한다
2. 시스템이 주문 항목을 조회한다
3. 각 항목이 금액을 계산한다
4. Order가 소계를 계산한다
5. 할인 정책이 할인을 적용한다
6. Order가 최종 금액을 반환한다
```

### 3. 메시지 추출

각 단계에서 필요한 메시지를 추출:

```typescript
// 2단계에서 필요한 메시지
getItems(): OrderItem[]

// 3단계에서 필요한 메시지
calculateAmount(): Money

// 4단계에서 필요한 메시지
calculateSubtotal(): Money

// 5단계에서 필요한 메시지
applyDiscount(amount: Money): Money

// 6단계에서 필요한 메시지
calculateTotal(): Money
```

### 4. 객체 식별

메시지를 처리할 객체를 정보 전문가 원칙으로 식별:

| 메시지 | 정보 전문가 | 이유 |
|--------|------------|------|
| `getItems` | Order | 항목 목록 보유 |
| `calculateAmount` | OrderItem | 가격, 수량 정보 보유 |
| `calculateSubtotal` | Order | 전체 항목 정보 보유 |
| `applyDiscount` | DiscountPolicy | 할인 로직 보유 |
| `calculateTotal` | Order | 소계, 할인 정책 보유 |

---

## 예시: 할인 적용

### 협력 시나리오

```
시나리오: 주문 할인 적용

1. 클라이언트가 Order에게 "총액을 계산하라" 요청
2. Order가 각 OrderItem에게 "금액을 계산하라" 요청
3. Order가 DiscountPolicy에게 "할인을 적용하라" 요청
4. DiscountPolicy가 금액에 따라 할인율 결정
5. 결과를 역순으로 반환
```

### 코드로 표현

```typescript
class Order {
  private readonly items: OrderItem[];
  private readonly discountPolicy: DiscountPolicy;

  calculateTotal(): Money {
    // 1. 모든 항목에게 금액 계산 메시지 전송
    const subtotal = this.items.reduce(
      (total, item) => total.plus(item.calculateAmount()),
      Money.zero()
    );

    // 2. 할인 정책에게 할인 적용 메시지 전송
    return this.discountPolicy.applyDiscount(subtotal);
  }
}
```

---

## 체크리스트

- [ ] 유스케이스가 명확히 정의되었는가?
- [ ] 각 단계에서 필요한 메시지를 추출했는가?
- [ ] 메시지를 처리할 객체(정보 전문가)를 식별했는가?
- [ ] 객체 간 협력 관계가 명확한가?

---

## 다음 단계

메시지와 객체가 식별되면 → [책임 할당](../../02-design/references/responsibility-assignment.md)으로 이동
