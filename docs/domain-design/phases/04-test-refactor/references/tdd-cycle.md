# TDD 사이클

> "테스트를 먼저 작성하고, 최소한의 코드로 통과시킨 후, 리팩토링하라."

---

## Red-Green-Refactor

```
┌──────────────────────────────────────────────────┐
│                                                  │
│    ┌─────────┐      ┌─────────┐      ┌─────────┐│
│    │   RED   │ ───► │  GREEN  │ ───► │REFACTOR ││
│    │  (실패) │      │  (통과) │      │  (개선) ││
│    └─────────┘      └─────────┘      └─────────┘│
│         ▲                                  │    │
│         └──────────────────────────────────┘    │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 단계별 설명

### 1. Red: 실패하는 테스트 작성

- 구현 없이 테스트부터 작성
- 테스트가 실패해야 함 (컴파일 에러도 "실패")
- 테스트가 무엇을 검증하는지 명확히

```typescript
describe('Money', () => {
  it('두 금액을 더할 수 있다', () => {
    const money1 = new Money(1000);
    const money2 = new Money(500);

    const result = money1.plus(money2);

    expect(result.toNumber()).toBe(1500);
  });
});
```

### 2. Green: 최소한의 코드로 테스트 통과

- **가장 간단한 방법**으로 테스트 통과
- 설계나 성능은 신경쓰지 않음
- 하드코딩도 허용

```typescript
class Money {
  constructor(private readonly amount: number) {}

  plus(other: Money): Money {
    return new Money(this.amount + other.amount);
  }

  toNumber(): number {
    return this.amount;
  }
}
```

### 3. Refactor: 코드 개선

- 테스트 통과 상태 유지
- 중복 제거
- 설계 개선

```typescript
class Money {
  private readonly amount: Decimal;

  constructor(amount: number) {
    this.amount = new Decimal(amount);
  }

  plus(other: Money): Money {
    return new Money(this.amount.plus(other.amount).toNumber());
  }

  toNumber(): number {
    return this.amount.toNumber();
  }
}
```

---

## 예시: Money 클래스 TDD

### Round 1: 덧셈

```typescript
// Red
it('두 금액을 더할 수 있다', () => {
  const money1 = new Money(1000);
  const money2 = new Money(500);
  expect(money1.plus(money2).toNumber()).toBe(1500);
});

// Green
class Money {
  constructor(private readonly amount: number) {}
  plus(other: Money): Money {
    return new Money(this.amount + other.amount);
  }
  toNumber(): number {
    return this.amount;
  }
}
```

### Round 2: 음수 검증

```typescript
// Red
it('음수 금액은 생성할 수 없다', () => {
  expect(() => new Money(-1000)).toThrow('금액은 음수일 수 없습니다');
});

// Green
class Money {
  constructor(amount: number) {
    if (amount < 0) {
      throw new Error('금액은 음수일 수 없습니다');
    }
    this.amount = amount;
  }
}
```

### Round 3: 동등성 비교

```typescript
// Red
it('같은 금액은 동등하다', () => {
  const money1 = new Money(1000);
  const money2 = new Money(1000);
  expect(money1.equals(money2)).toBe(true);
});

// Green
class Money {
  equals(other: Money): boolean {
    return this.amount === other.amount;
  }
}
```

### Refactor: Decimal 적용

```typescript
// 테스트는 그대로, 구현만 개선
class Money {
  private readonly amount: Decimal;

  constructor(amount: number) {
    if (amount < 0) {
      throw new Error('금액은 음수일 수 없습니다');
    }
    this.amount = new Decimal(amount);
  }

  plus(other: Money): Money {
    return new Money(this.amount.plus(other.amount).toNumber());
  }

  equals(other: Money): boolean {
    return this.amount.equals(other.amount);
  }

  toNumber(): number {
    return this.amount.toNumber();
  }
}
```

---

## TDD 원칙

### 1. 한 번에 하나의 테스트

- 여러 기능을 동시에 테스트하지 않음
- 작은 단계로 진행

### 2. 테스트 이름은 행동을 설명

```typescript
// ✅ 행동 설명
it('두 금액을 더할 수 있다', () => {})
it('음수 금액은 생성할 수 없다', () => {})

// ❌ 구현 설명
it('plus 메서드가 동작한다', () => {})
it('생성자에서 검증한다', () => {})
```

### 3. 테스트가 실패하는 이유는 하나뿐

- 테스트가 실패하면 정확히 무엇이 잘못인지 알 수 있어야 함

### 4. 리팩토링은 테스트 통과 후에만

- 실패하는 테스트가 있으면 리팩토링하지 않음
- 먼저 Green, 그다음 Refactor

---

## 체크리스트

- [ ] 테스트를 먼저 작성했는가?
- [ ] 테스트가 실패하는 것을 확인했는가? (Red)
- [ ] 최소한의 코드로 테스트를 통과시켰는가? (Green)
- [ ] 테스트 통과 후 리팩토링했는가? (Refactor)
- [ ] 리팩토링 후에도 테스트가 통과하는가?
