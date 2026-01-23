# 합성과 상속

> "상속은 코드 재사용을 위한 도구가 아니다. 타입 계층을 구현하기 위한 도구다."

---

## 상속의 문제점

### 1. 불필요한 인터페이스 상속

```typescript
// ❌ Stack이 Vector를 상속 (Java의 실수)
class Stack<T> extends Vector<T> {
	push(item: T): void {
		this.addElement(item);
	}
	pop(): T {
		return this.removeElementAt(this.size() - 1);
	}
}

// 문제: Stack이 Vector의 모든 메서드를 상속
const stack = new Stack<number>();
stack.push(1);
stack.push(2);
stack.add(1, 3); // 중간 삽입 가능! Stack의 의미 훼손
```

### 2. 메서드 오버라이딩의 오용

```typescript
// ❌ 부모 클래스의 구현에 의존
class InstrumentedHashSet<T> extends HashSet<T> {
	private addCount = 0;

	add(element: T): boolean {
		this.addCount++;
		return super.add(element);
	}

	addAll(elements: T[]): boolean {
		this.addCount += elements.length;
		return super.addAll(elements); // 내부적으로 add()를 호출!
	}
}

// 문제: addAll이 내부적으로 add()를 호출하면 addCount가 중복 증가
const set = new InstrumentedHashSet<number>();
set.addAll([1, 2, 3]); // addCount = 6 (3 + 3), 기대값 3
```

### 3. 부모 클래스 변경의 영향

```typescript
// 부모 클래스 변경이 자식에게 영향
class Parent {
	newMethod(): void {} // 새 메서드 추가
}

class Child extends Parent {
	// 우연히 같은 이름의 메서드가 있었다면?
	newMethod(): string {
		return 'conflict'; // 시그니처 불일치로 컴파일 에러
	}
}
```

---

## 합성을 선호하라

> "상속보다 합성을 사용하라" - Effective Java

### 합성으로 해결

```typescript
// ✅ 합성: 기존 클래스를 확장하지 않고 private 필드로 참조
class InstrumentedSet<T> {
	private readonly set: Set<T> = new Set();
	private addCount = 0;

	add(element: T): boolean {
		this.addCount++;
		const hadElement = this.set.has(element);
		this.set.add(element);
		return !hadElement;
	}

	addAll(elements: T[]): boolean {
		let result = false;
		elements.forEach((element) => {
			if (this.add(element)) {
				result = true;
			}
		});
		return result;
	}

	getAddCount(): number {
		return this.addCount;
	}
}

// 내부 구현에 의존하지 않음
const set = new InstrumentedSet<number>();
set.addAll([1, 2, 3]); // addCount = 3 (정확!)
```

### 전략 패턴으로 행동 합성

```typescript
// ✅ 합성 + 전략 패턴
interface DiscountPolicy {
	applyDiscount(amount: Money): Money;
}

class PercentDiscountPolicy implements DiscountPolicy {
	constructor(private readonly percent: number) {}

	applyDiscount(amount: Money): Money {
		return amount.multiply(1 - this.percent / 100);
	}
}

class TieredDiscountPolicy implements DiscountPolicy {
	applyDiscount(amount: Money): Money {
		if (amount.isGreaterThan(Money.of(100000))) {
			return amount.multiply(0.85); // 15% 할인
		}
		return amount.multiply(0.95); // 5% 할인
	}
}

// 상속 대신 합성으로 행동 변경
class Order {
	constructor(
		private readonly subtotal: Money,
		private readonly discountPolicy: DiscountPolicy, // 합성
	) {}

	calculateTotal(): Money {
		return this.discountPolicy.applyDiscount(this.subtotal);
	}
}

// 런타임에 전략 교체 가능
const order1 = new Order(subtotal, new PercentDiscountPolicy(10));
const order2 = new Order(subtotal, new TieredDiscountPolicy());
```

---

## 올바른 상속 사용법

**상속은 is-a 관계일 때만 사용하라.**

### 진정한 is-a 관계

```typescript
// ✅ 올바른 상속: 진정한 is-a 관계
abstract class Discount {
	abstract calculateDiscountAmount(price: Money): Money;
}

class AmountDiscount extends Discount {
	constructor(private readonly discountAmount: Money) {
		super();
	}

	calculateDiscountAmount(price: Money): Money {
		return this.discountAmount;
	}
}

class PercentDiscount extends Discount {
	constructor(private readonly percent: number) {
		super();
	}

	calculateDiscountAmount(price: Money): Money {
		return price.multiply(this.percent / 100);
	}
}

// 클라이언트는 추상 클래스에 의존
function applyDiscount(price: Money, discount: Discount): Money {
	return price.minus(discount.calculateDiscountAmount(price));
}
```

### 리스코프 치환 원칙 (LSP)

```typescript
// ✅ 자식 클래스는 부모 클래스를 대체할 수 있어야 함
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

// ❌ 잘못된 상속 (LSP 위반)
// class Penguin extends FlyingBird {} // 펭귄은 날 수 없음!

// 클라이언트 코드는 Bird 타입만 알면 됨
function moveBirds(birds: Bird[]): void {
	birds.forEach((bird) => bird.move()); // 다형성
}
```

---

## 선택 가이드

| 질문                             | 상속 | 합성 |
| -------------------------------- | ---- | ---- |
| is-a 관계인가?                   | ✅   | -    |
| 코드 재사용이 목적인가?          | ❌   | ✅   |
| 런타임에 행동을 변경해야 하는가? | ❌   | ✅   |
| 부모의 모든 메서드가 필요한가?   | ✅   | -    |
| 구현 상속인가? (abstract class)  | ✅   | -    |

---

## 체크리스트

- [ ] 상속은 is-a 관계인가?
- [ ] 부모의 모든 메서드가 자식에게 의미있는가?
- [ ] LSP를 준수하는가? (자식이 부모를 대체 가능?)
- [ ] 코드 재사용이 목적이라면 합성을 사용했는가?
- [ ] 전략 패턴 등으로 행동 변경을 합성으로 처리했는가?
