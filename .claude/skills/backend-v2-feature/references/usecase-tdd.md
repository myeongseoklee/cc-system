# UseCase TDD 예제

## 1. UseCase 테스트 먼저 (Red)

```typescript
// __tests__/select-entity-list.usecase.test.ts
describe('SelectEntityListUseCase', () => {
  let usecase: SelectEntityListUseCase;
  let mockRepository: jest.Mocked<EntityRepository>;

  beforeEach(() => {
    mockRepository = {
      selectList: jest.fn(),
    };
    usecase = new SelectEntityListUseCase(mockRepository);
  });

  test('정상 조회 시 변환된 목록 반환', async () => {
    // Arrange
    const query = { page: 1, limit: 10 };
    mockRepository.selectList.mockResolvedValue([
      { id: 1, name: 'test', created_at: '2024-01-01' }
    ]);

    // Act
    const result = await usecase.exec(query);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 1, name: 'test' });
  });
});
```

## 2. UseCase 구현 (Green)

```typescript
// usecase/select-entity-list.usecase.ts
export class SelectEntityListUseCase {
  constructor(private repository: EntityRepository) {}

  async exec(query: Query): Promise<Result[]> {
    const data = await this.fetchData(query);
    return this.transform(data);
  }

  private async fetchData(query: Query) {
    return await this.repository.selectList(query);
  }

  private transform(data: RawData[]): Result[] {
    return _.chain(data).map(/* ... */).value();
  }
}
```

## AAA 패턴

### Arrange
- 테스트 데이터 준비
- Mock 설정
- Factory 함수 사용

### Act
- 단일 동작 실행 (한 줄)

### Assert
- 결과 검증
- 구체적 값 하드코딩 (계산식 재사용 금지)

---

## UseCase 내 디자인 패턴

### 정책/알고리즘이 여러 가지일 때: Strategy 패턴

```typescript
// 할인 정책, 결제 방식, 검증 규칙 등
interface DiscountPolicy {
  applyDiscount(amount: Money): Money;
}

class PercentDiscountPolicy implements DiscountPolicy { ... }
class AmountDiscountPolicy implements DiscountPolicy { ... }

// UseCase에서 사용
class CreateOrderUseCase {
  constructor(private discountPolicy: DiscountPolicy) {}

  async exec(query: Query): Promise<Order> {
    const subtotal = this.calculateSubtotal(query);
    const total = this.discountPolicy.applyDiscount(subtotal);
    // ...
  }
}
```

→ [Strategy 패턴 상세](../../../docs/domain-design/patterns/design-patterns/behavioral.md#1-strategy-패턴-⭐)

### 복잡한 객체 생성: Factory/Builder 패턴

```typescript
// DTO, 복잡한 Entity 생성
class OrderFactory {
  static create(rawData: RawData): Order {
    const items = rawData.items.map(item => new OrderItem(item));
    const discountPolicy = this.selectDiscountPolicy(rawData);
    return new Order({ items, discountPolicy });
  }
}
```

→ [Factory 패턴 상세](../../../docs/domain-design/patterns/design-patterns/creational.md#1-factory-method-패턴)
→ [Builder 패턴 상세](../../../docs/domain-design/patterns/design-patterns/creational.md#3-builder-패턴)
