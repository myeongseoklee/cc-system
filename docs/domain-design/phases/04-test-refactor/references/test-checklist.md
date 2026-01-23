# 테스트 체크리스트

> "좋은 테스트는 코드의 행동을 문서화하고 변경을 안전하게 만든다."

---

## 테스트 작성 원칙

### AAA 패턴

```typescript
it('두 금액을 더할 수 있다', () => {
  // Arrange: 준비
  const money1 = new Money(1000);
  const money2 = new Money(500);

  // Act: 실행
  const result = money1.plus(money2);

  // Assert: 검증
  expect(result.toNumber()).toBe(1500);
});
```

### 테스트 이름 규칙

```typescript
// ✅ 행동을 설명
it('두 금액을 더할 수 있다', () => {})
it('음수 금액은 생성할 수 없다', () => {})
it('같은 금액은 동등하다', () => {})

// ❌ 구현을 설명
it('plus 메서드', () => {})
it('constructor', () => {})
```

### 한 테스트 = 한 검증

```typescript
// ✅ 각 테스트는 하나만 검증
it('두 금액을 더할 수 있다', () => {
  const result = new Money(1000).plus(new Money(500));
  expect(result.toNumber()).toBe(1500);
});

it('금액은 불변이다', () => {
  const money = new Money(1000);
  money.plus(new Money(500));
  expect(money.toNumber()).toBe(1000); // 원본 불변
});

// ❌ 여러 개 검증
it('plus 메서드', () => {
  const money1 = new Money(1000);
  const money2 = new Money(500);
  const result = money1.plus(money2);

  expect(result.toNumber()).toBe(1500);
  expect(money1.toNumber()).toBe(1000); // 여러 검증
  expect(money2.toNumber()).toBe(500);  // 여러 검증
});
```

---

## 테스트 유형별 체크리스트

### 단위 테스트

- [ ] 외부 의존성이 Mock/Stub으로 대체되었는가?
- [ ] 테스트가 독립적인가? (다른 테스트에 의존 X)
- [ ] 테스트가 빠른가? (DB, 네트워크 X)
- [ ] 경계값을 테스트했는가?

```typescript
describe('Money', () => {
  it('두 금액을 더할 수 있다', () => {
    expect(new Money(1000).plus(new Money(500)).toNumber()).toBe(1500);
  });

  it('0을 더하면 같은 금액이다', () => {
    expect(new Money(1000).plus(Money.zero()).toNumber()).toBe(1000);
  });

  it('음수 금액은 생성할 수 없다', () => {
    expect(() => new Money(-1)).toThrow('금액은 음수일 수 없습니다');
  });
});
```

### 통합 테스트

- [ ] 실제 컴포넌트 간 상호작용을 테스트하는가?
- [ ] 테스트 환경이 프로덕션과 유사한가?
- [ ] 데이터 정리(cleanup)가 되는가?

```typescript
describe('CreateOrderUseCase', () => {
  it('주문을 생성하고 저장한다', async () => {
    // Arrange
    const repository = new OrderRepositoryImpl();
    const useCase = new CreateOrderUseCase(repository);

    // Act
    const result = await useCase.exec({
      customerId: 'CUSTOMER_001',
      items: [{ productId: 'PROD_001', quantity: 2, price: 10000 }],
    });

    // Assert
    expect(result).toBeInstanceOf(Order);
    expect(result.orderId).toBeDefined();
  });
});
```

---

## 경계값 테스트

| 상황 | 테스트 케이스 |
|------|-------------|
| 빈 값 | `[]`, `""`, `null`, `undefined` |
| 최소값 | `0`, 첫 번째 요소 |
| 최대값 | `Number.MAX_VALUE`, 마지막 요소 |
| 경계 | 범위의 시작과 끝 |
| 예외 | 유효하지 않은 입력 |

```typescript
describe('Money 경계값 테스트', () => {
  it('0원을 생성할 수 있다', () => {
    expect(new Money(0).toNumber()).toBe(0);
  });

  it('음수는 생성할 수 없다', () => {
    expect(() => new Money(-1)).toThrow();
  });

  it('매우 큰 금액도 처리할 수 있다', () => {
    const big = new Money(999999999999);
    expect(big.toNumber()).toBe(999999999999);
  });

  it('소수점 금액도 처리할 수 있다', () => {
    const money = new Money(100.5);
    expect(money.toNumber()).toBe(100.5);
  });
});
```

---

## Mock/Stub 사용

### Stub: 고정된 값 반환

```typescript
const stubRepository: OrderRepository = {
  findById: jest.fn().mockResolvedValue({
    orderId: 'ORDER_001',
    customerId: 'CUSTOMER_001',
    total: Money.of(10000),
  })
};
```

### Mock: 호출 검증

```typescript
const mockNotifier = {
  send: jest.fn()
};

// 테스트 후
expect(mockNotifier.send).toHaveBeenCalledWith(expect.objectContaining({
  type: 'ORDER_COMPLETED'
}));
```

### Fake: 간단한 구현

```typescript
class FakeOrderRepository implements OrderRepository {
  private data: Order[] = [];

  async findById(orderId: string): Promise<Order | null> {
    return this.data.find(o => o.orderId === orderId) ?? null;
  }

  async save(order: Order): Promise<Order> {
    this.data.push(order);
    return order;
  }

  // 테스트 헬퍼
  addData(order: Order): void {
    this.data.push(order);
  }
}
```

---

## 테스트 품질 체크리스트

### 작성 시

- [ ] AAA 패턴을 따르는가?
- [ ] 테스트 이름이 행동을 설명하는가?
- [ ] 한 테스트가 하나만 검증하는가?
- [ ] 경계값을 테스트했는가?
- [ ] 예외 케이스를 테스트했는가?

### 유지보수 시

- [ ] 테스트가 깨지면 원인을 쉽게 파악할 수 있는가?
- [ ] 구현 변경 시 테스트도 함께 변경해야 하는가? (최소화)
- [ ] 테스트가 너무 많은 구현 세부사항을 알고 있는가?
- [ ] 테스트 실행 속도가 적절한가?
