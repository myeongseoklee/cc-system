# SOLID 원칙

> 객체지향 설계의 5대 원칙

---

## 개요

| 원칙  | 이름                  | 한 줄 설명                                               |
| ----- | --------------------- | -------------------------------------------------------- |
| **S** | Single Responsibility | 클래스는 하나의 책임만 가져야 한다                       |
| **O** | Open/Closed           | 확장에 열려있고, 수정에 닫혀있어야 한다                  |
| **L** | Liskov Substitution   | 하위 타입은 상위 타입을 대체할 수 있어야 한다            |
| **I** | Interface Segregation | 클라이언트는 사용하지 않는 메서드에 의존하지 않아야 한다 |
| **D** | Dependency Inversion  | 구체 클래스가 아닌 추상화에 의존하라                     |

---

## SRP: 단일 책임 원칙

> "클래스는 하나의 책임만 가져야 한다."

**핵심:** 클래스가 변경되는 이유는 하나뿐이어야 함

```typescript
// ❌ 여러 책임
class OrderService {
	calculateTotal() {} // 계산 책임
	saveToDatabase() {} // 저장 책임
	sendEmail() {} // 알림 책임
	generateReport() {} // 리포트 책임
}

// ✅ 책임 분리
class OrderCalculator {
	calculateTotal() {} // 계산 책임
}

class OrderRepository {
	save() {} // 저장 책임
}

class NotificationService {
	sendEmail() {} // 알림 책임
}

class ReportGenerator {
	generate() {} // 리포트 책임
}
```

---

## OCP: 개방-폐쇄 원칙

> "확장에는 열려있고, 수정에는 닫혀있어야 한다."

**핵심:** 새로운 기능을 추가할 때 기존 코드를 수정하지 않아야 함

```typescript
// ✅ 새로운 할인 정책 추가 시 기존 코드 수정 없음
interface DiscountPolicy {
	applyDiscount(amount: Money): Money;
}

class PercentDiscountPolicy implements DiscountPolicy {}
class AmountDiscountPolicy implements DiscountPolicy {}
class TieredDiscountPolicy implements DiscountPolicy {} // 새로운 정책 추가

// 클라이언트 코드는 수정 불필요
class Order {
	private readonly discountPolicy: DiscountPolicy;

	calculateTotal(): Money {
		const subtotal = this.calculateSubtotal();
		return this.discountPolicy.applyDiscount(subtotal); // 어떤 정책이든 같은 방식
	}
}
```

---

## LSP: 리스코프 치환 원칙

> "하위 타입은 상위 타입을 대체할 수 있어야 한다."

**핵심:** 자식 클래스는 부모 클래스의 계약을 준수해야 함

```typescript
// ✅ 인터페이스 계약 준수
interface DiscountPolicy {
	applyDiscount(amount: Money): Money; // 반드시 Money 반환
}

class PercentDiscountPolicy implements DiscountPolicy {
	applyDiscount(amount: Money): Money {
		return amount.multiply(1 - this.percent / 100); // Money 반환
	}
}

// ❌ 계약 위반
class BrokenDiscountPolicy implements DiscountPolicy {
	applyDiscount(amount: Money): Money {
		throw new Error('Not implemented'); // 예외 발생 → 대체 불가
	}
}
```

**LSP 위반 예시:**

```typescript
// ❌ 잘못된 상속
abstract class Bird {
	abstract fly(): void;
}

class Penguin extends Bird {
	fly(): void {
		throw new Error('펭귄은 날 수 없습니다'); // LSP 위반!
	}
}

// ✅ 올바른 설계
abstract class Bird {
	abstract move(): void;
}

class FlyingBird extends Bird {
	move(): void {
		this.fly();
	}
	private fly(): void {
		console.log('날아서 이동');
	}
}

class Penguin extends Bird {
	move(): void {
		this.walk();
	}
	private walk(): void {
		console.log('걸어서 이동');
	}
}
```

---

## ISP: 인터페이스 분리 원칙

> "클라이언트는 사용하지 않는 메서드에 의존하지 않아야 한다."

**핵심:** 큰 인터페이스를 작은 인터페이스로 분리

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

interface Auditable {
  auditLog(): void;
}

// 필요한 인터페이스만 구현
class Order implements Calculable, Auditable {
  calculateTotal(): Money { ... }
  applyDiscount(): Money { ... }
  auditLog(): void { ... }
}
```

---

## DIP: 의존성 역전 원칙

> "구체 클래스가 아닌 추상화에 의존하라."

**핵심:**

- 고수준 모듈이 저수준 모듈에 의존하면 안 됨
- 둘 다 추상화에 의존해야 함

```typescript
// ❌ 구체 클래스에 의존
class Order {
	private readonly discountPolicy: PercentDiscountPolicy; // 구체 클래스

	calculateTotal(): Money {
		return this.discountPolicy.applyDiscount(this.subtotal);
	}
}

// ✅ 추상화(인터페이스)에 의존
class Order {
	private readonly discountPolicy: DiscountPolicy; // 인터페이스

	calculateTotal(): Money {
		return this.discountPolicy.applyDiscount(this.subtotal);
	}
}

// 의존성 주입
const percentPolicy = new PercentDiscountPolicy(10);
const tieredPolicy = new TieredDiscountPolicy();

const order1 = new Order(items, percentPolicy);
const order2 = new Order(items, tieredPolicy); // 정책 교체 가능
```

**의존성 방향:**

```
Before (DIP 위반):
  [고수준 모듈] ───────────────► [저수준 모듈]
  Order                    PercentDiscountPolicy

After (DIP 준수):
  [고수준 모듈] ───► [추상화] ◄─── [저수준 모듈]
  Order           DiscountPolicy   PercentDiscountPolicy
```

---

## SOLID 적용 체크리스트

| 원칙 | 체크 항목                                     |
| ---- | --------------------------------------------- |
| SRP  | 클래스가 변경되는 이유가 하나인가?            |
| OCP  | 새 기능 추가 시 기존 코드를 수정하지 않는가?  |
| LSP  | 자식 클래스가 부모 클래스를 대체할 수 있는가? |
| ISP  | 클라이언트가 사용하지 않는 메서드가 없는가?   |
| DIP  | 구체 클래스가 아닌 인터페이스에 의존하는가?   |

---

## 참고

- Robert C. Martin, "Clean Architecture"
- Robert C. Martin, "Agile Software Development"
