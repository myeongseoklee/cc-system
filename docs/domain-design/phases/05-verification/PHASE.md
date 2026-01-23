# Phase 5: 검증

> "설계 품질은 안티패턴 제거와 체크리스트 검증으로 확인한다."

---

## 목표

- 안티패턴 점검 및 제거
- 설계 품질 체크리스트 검증
- 최종 코드 리뷰

---

## 순서

```
1. 안티패턴 점검
   ↓
2. 설계 품질 체크리스트
   ↓
3. 최종 검증
   ↓
4. 완료 또는 이전 Phase로 돌아가기
```

---

## 핵심 원칙

### 안티패턴 점검

| 안티패턴 | 증상 | 해결책 |
|----------|------|--------|
| 빈약한 도메인 모델 | 상태만 있고 행동 없음 | 행동 추가, 서비스 로직을 Entity로 이동 |
| 과도한 Getter/Setter | 캡슐화 위반, 내부 노출 | 메서드로 캡슐화, Tell Don't Ask |
| 신 클래스 | 하나의 클래스에 너무 많은 책임 | 책임 분리, SRP 적용 |
| 기차 충돌 | a.b.c.d() 연쇄 호출 | 디미터 법칙 적용 |

### 설계 품질 체크리스트

```
□ 정보 전문가에게 책임을 할당했는가?
□ 결합도는 낮고 응집도는 높은가?
□ 조건문 대신 다형성을 사용했는가?
□ 상속보다 합성을 선호했는가?
□ 디미터 법칙을 준수했는가?
□ 명령과 쿼리가 분리되었는가?
□ 변경이 예상되는 지점이 인터페이스로 보호되는가?
□ 테스트하기 쉬운 설계인가?
```

---

## 상세 가이드

| 주제 | 설명 | 링크 |
|------|------|------|
| 안티패턴 | 피해야 할 설계 패턴 | [anti-patterns.md](./references/anti-patterns.md) |
| 품질 체크리스트 | 최종 검증 항목 | [quality-checklist.md](./references/quality-checklist.md) |

---

## 안티패턴 예시

### 빈약한 도메인 모델

```typescript
// ❌ 빈약한 도메인 모델
class OrderData {
  subtotal: number;
  discount: number;
  // 행동 없음 (getter/setter만)
}

class OrderService {
  calculateTotal(data: OrderData): number {
    return data.subtotal - data.discount;
  }
}

// ✅ 풍부한 도메인 모델
class OrderSummary {
  constructor(
    readonly subtotal: Money,
    readonly discount: Money,
  ) {}

  getTotal(): Money {
    return this.subtotal.minus(this.discount);
  }
}

class Order {
  calculateTotal(): Money {
    return this.summary.getTotal();
  }
}
```

### 과도한 Getter

```typescript
// ❌ 과도한 Getter
class OrderSummary {
  getSubtotal(): Money { return this.subtotal; }
  getDiscount(): Money { return this.discount; }
}

// 외부에서 계산
const total = summary.getSubtotal().minus(summary.getDiscount());

// ✅ 메서드로 캡슐화
class OrderSummary {
  getTotal(): Money {
    return this.subtotal.minus(this.discount);
  }
}

// 객체에게 시킴
const total = summary.getTotal();
```

### 신 클래스

```typescript
// ❌ 신 클래스
class OrderManager {
  calculateTotal() {}
  saveToDatabase() {}
  sendEmail() {}
  generateReport() {}
  exportToExcel() {}
  validateData() {}
}

// ✅ 책임 분리
class OrderCalculator { calculateTotal() {} }
class OrderRepository { save() {} }
class NotificationService { sendEmail() {} }
```

---

## 최종 체크리스트

### 설계 시

- [ ] 협력 시나리오를 먼저 작성했는가?
- [ ] 메시지를 먼저 정의했는가?
- [ ] 각 객체의 책임이 명확한가?
- [ ] Tell, Don't Ask 원칙을 지켰는가?
- [ ] 인터페이스에 의존하는가?

### 구현 시

- [ ] 테스트를 먼저 작성했는가? (TDD)
- [ ] 메서드가 20줄 이하인가?
- [ ] private 필드를 사용했는가?
- [ ] 불변성을 보장하는가?
- [ ] Value Object를 적절히 사용했는가?

### 리팩토링 시

- [ ] 중복 코드가 없는가?
- [ ] 조건문을 다형성으로 변경했는가?
- [ ] 긴 메서드를 추출했는가?
- [ ] 테스트가 모두 통과하는가?
- [ ] 기존 기능이 유지되는가?

---

## 결론

모든 체크리스트가 통과하면 설계 완료. 문제가 발견되면 해당 Phase로 돌아가서 수정.

```
✅ 분석 완료    → Phase 1 통과
✅ 설계 완료    → Phase 2 통과
✅ 구현 완료    → Phase 3 통과
✅ 테스트 완료  → Phase 4 통과
✅ 검증 완료    → Phase 5 통과 → 배포 가능
```

---

## 핵심 원칙 요약

### 협력, 책임, 역할

1. **협력이 먼저다**: 객체보다 협력 시나리오를 먼저 설계하라
2. **메시지가 객체를 선택한다**: 무엇을 해야 하는가(메시지)가 누가 할 것인가(객체)보다 먼저
3. **객체는 자율적이다**: 스스로 결정하고 책임을 진다 (Tell, Don't Ask)

### GRASP 패턴

4. **정보 전문가에게 책임을 할당하라**: 필요한 정보를 가장 많이 아는 객체가 책임을 진다
5. **낮은 결합도와 높은 응집도를 유지하라**: 변경의 영향을 최소화하고 관련 책임만 모아라
6. **다형성으로 조건문을 대체하라**: 타입에 따른 분기는 다형성으로 해결
7. **변경이 예상되는 지점을 인터페이스로 보호하라**: Protected Variations

### 의존성 관리

8. **추상화에 의존하라**: 구체 클래스가 아닌 인터페이스에 의존 (DIP)
9. **디미터 법칙을 준수하라**: 최소 지식 원칙, 기차 충돌 코드를 피하라
10. **명령과 쿼리를 분리하라**: 상태 변경과 값 반환을 분리 (CQS)

### 설계 원칙

11. **상속보다 합성을 사용하라**: 코드 재사용은 상속이 아닌 합성으로
12. **단일 책임 원칙**: 하나의 클래스는 하나의 변경 이유만 가져야 한다
13. **개방-폐쇄 원칙**: 확장에는 열려있고, 수정에는 닫혀있게
