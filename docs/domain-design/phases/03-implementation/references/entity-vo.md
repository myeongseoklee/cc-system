# Entity vs Value Object

> "Entity는 식별자로, Value Object는 값으로 비교한다."

---

## 구분 기준

| 특성     | Entity                             | Value Object              |
| -------- | ---------------------------------- | ------------------------- |
| 식별자   | 있음 (ID)                          | 없음                      |
| 가변성   | 가변 가능                          | **불변**                  |
| 비교     | 동일성 (Identity)                  | 동등성 (Equality)         |
| 생명주기 | 있음                               | 교체 가능                 |
| 예시     | Order, User, Product               | Money, DateValue, Address |

---

## Entity

**식별자가 있고, 생명주기 동안 상태가 변할 수 있는 객체**

```typescript
class Order {
	// 식별자
	readonly orderId: string;
	readonly customerId: string;
	readonly orderDate: DateValue;

	// 상태가 변할 수 있음
	private readonly items: OrderItem[];

	// 동일성 비교 (식별자로 비교)
	equals(other: Order): boolean {
		return this.orderId === other.orderId;
	}
}
```

### Entity 설계 원칙

1. **식별자 정의**: 무엇이 이 객체를 고유하게 만드는가?
2. **생명주기 관리**: 생성, 수정, 삭제 상태 관리
3. **불변식 보장**: 항상 참이어야 하는 조건 검증

---

## Value Object

**식별자가 없고, 불변이며, 값으로 비교되는 객체**

```typescript
class Money {
	private readonly amount: Decimal; // 불변

	constructor(amount: number) {
		if (amount < 0) {
			throw new Error('금액은 음수일 수 없습니다');
		}
		this.amount = new Decimal(amount);
	}

	// 불변성: 새로운 객체 반환
	plus(other: Money): Money {
		return new Money(this.amount.plus(other.amount).toNumber());
	}

	minus(other: Money): Money {
		return new Money(this.amount.minus(other.amount).toNumber());
	}

	multiply(ratio: number): Money {
		return new Money(this.amount.times(ratio).toNumber());
	}

	// 동등성 비교 (값으로 비교)
	equals(other: Money): boolean {
		return this.amount.equals(other.amount);
	}

	toNumber(): number {
		return this.amount.toNumber();
	}
}
```

### Value Object 사용 이유

**1. 도메인 개념 명확화**

```typescript
// ❌ 원시 타입
function calculateTotal(subtotal: number, discount: number): number {
	return subtotal - discount;
}

// ✅ Value Object
function calculateTotal(subtotal: Money, discount: Money): Money {
	return subtotal.minus(discount);
}
```

**2. 유효성 검증 집중**

```typescript
class Money {
	constructor(amount: number) {
		if (amount < 0) {
			throw new Error('금액은 음수일 수 없습니다');
		}
		this.amount = new Decimal(amount);
	}
}
```

**3. 불변성 보장**

```typescript
const money = new Money(1000);
const doubled = money.multiply(2); // 새로운 객체 반환

console.log(money.toNumber()); // 1000 (원본 불변)
console.log(doubled.toNumber()); // 2000
```

---

## 예시: DateValue

```typescript
class DateValue {
	private readonly value: dayjs.Dayjs;

	private constructor(value: dayjs.Dayjs) {
		this.value = value;
	}

	// 정적 팩토리 메서드
	static fromYYYYMMDD(yyyymmdd: number): DateValue {
		const str = String(yyyymmdd);
		return new DateValue(dayjs(str, 'YYYYMMDD'));
	}

	static today(): DateValue {
		return new DateValue(dayjs());
	}

	// 불변성: 새로운 객체 반환
	addDays(days: number): DateValue {
		return new DateValue(this.value.add(days, 'day'));
	}

	// 동등성 비교
	equals(other: DateValue): boolean {
		return this.value.isSame(other.value, 'day');
	}

	toYYYYMMDD(): number {
		return parseInt(this.value.format('YYYYMMDD'));
	}
}
```

---

## 선택 기준

| 질문                        | Entity | Value Object |
| --------------------------- | ------ | ------------ |
| 고유 식별자가 필요한가?     | ✅     | ❌           |
| 생명주기를 추적해야 하는가? | ✅     | ❌           |
| 값이 같으면 같은 것인가?    | ❌     | ✅           |
| 변경 이력이 중요한가?       | ✅     | ❌           |

---

## 체크리스트

### Entity

- [ ] 식별자가 정의되어 있는가?
- [ ] 동일성 비교 메서드(`equals`)가 있는가?
- [ ] 불변식이 항상 보장되는가?

### Value Object

- [ ] 불변인가? (모든 필드가 `readonly`)
- [ ] 모든 연산이 새로운 객체를 반환하는가?
- [ ] 동등성 비교 메서드(`equals`)가 있는가?
- [ ] 유효성 검증이 생성자에서 이루어지는가?
