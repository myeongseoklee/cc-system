# v1 → v2 마이그레이션 가이드

## 전체 흐름

```
v1 분석 → v2 설계 → 테스트 작성 → 마이그레이션 → 검증
```

## 1단계: v1 분석

### 현재 동작 이해
```typescript
// v1 코드 분석
export const getOrderList = async (req, res) => {
  // 비즈니스 로직과 DB 로직이 혼재
  const query = `SELECT * FROM orders WHERE customer_id = ?`;
  const results = await db.query(query, [req.query.customerId]);

  // 데이터 변환
  const transformed = results.map(r => ({
    id: r.seq,
    orderNumber: r.order_number,
    createdAt: new Date(r.created_at)
  }));

  res.json(transformed);
};
```

### 의존성 파악
- DB 직접 쿼리
- req/res 직접 접근
- 에러 처리 없음

### 비즈니스 로직 추출
- 주문 목록 조회
- 데이터 변환 (seq → id, order_number → orderNumber)

## 2단계: v2 설계

### UseCase 설계
```typescript
export class SelectOrderListUseCase {
  constructor(private repository: OrderRepository) {}

  async exec(query: { customerId: string }): Promise<Order[]> {
    const raw = await this.repository.findByCustomerId(query.customerId);
    return this.transform(raw);
  }

  private transform(data: RawData[]): Order[] {
    return data.map(r => ({
      id: r.seq,
      orderNumber: r.orderNumber,
      createdAt: new Date(r.createdAt)
    }));
  }
}
```

### Repository 인터페이스
```typescript
// repository/order.repository.ts
@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repository: Repository<OrderEntity>,
  ) {}

  async findByCustomerId(customerId: string): Promise<OrderEntity[]> {
    return this.repository.find({
      where: { customerId },
      order: { createdAt: 'DESC' }
    });
  }
}
```

### DTO 정의
```typescript
export const SelectOrderListDto = z.object({
  customerId: z.string().min(1),
});
export type SelectOrderListDto = z.infer<typeof SelectOrderListDto>;
```

## 3단계: 테스트 작성

```typescript
describe('SelectOrderListUseCase', () => {
  let usecase: SelectOrderListUseCase;
  let mockRepo: jest.Mocked<OrderRepository>;

  beforeEach(() => {
    mockRepo = { findByCustomerId: jest.fn() };
    usecase = new SelectOrderListUseCase(mockRepo);
  });

  test('seq → id 변환', async () => {
    // Arrange
    mockRepo.findByCustomerId.mockResolvedValue([
      { seq: 1, orderNumber: 'ORD-001', createdAt: '2024-01-01' }
    ]);

    // Act
    const result = await usecase.exec({ customerId: 'cust-100' });

    // Assert
    expect(result[0].id).toBe(1); // seq → id
    expect(result[0].createdAt).toBeInstanceOf(Date);
  });
});
```

## 4단계: 마이그레이션

### v2 구현
```typescript
// Service
export const orderService = {
  getList: async (dto: SelectOrderListDto) => {
    const usecase = new SelectOrderListUseCase(orderRepository);
    return await usecase.exec(dto);
  }
};

// API Route
export default withApiHandler(async (req, res) => {
  const dto = SelectOrderListDto.parse(req.query);
  const data = await orderService.getList(dto);
  res.status(200).json(data);
});
```

### v1 → v2 호출로 전환
```typescript
// v1 API (deprecated)
export const getOrderList = async (req, res) => {
  // v2로 위임
  const dto = { customerId: String(req.query.customerId) };
  const result = await orderService.getList(dto);
  res.json(result);
};
```

### 병렬 실행 (Optional)
```typescript
// 두 버전을 동시에 실행하여 결과 비교
const [v1Result, v2Result] = await Promise.all([
  getOrderListV1(params),
  orderService.getList(params)
]);

if (!isEqual(v1Result, v2Result)) {
  logger.warn('Migration inconsistency', { v1Result, v2Result });
}

return v2Result; // v2 결과 사용
```

## 5단계: 검증

### 기존 테스트 통과
```bash
npx jest src/pages/api/orders --coverage
```

### v2 테스트 추가
```bash
npx jest src/modules/domain_v2/orders/usecase --coverage
```

### v1 제거
```typescript
// v1 코드 삭제 (v2가 안정적으로 동작 확인 후)
// export const getOrderList = ...
```

## 체크리스트

### 분석 단계
- [ ] v1 현재 동작 이해
- [ ] 의존성 파악 (DB, 외부 API)
- [ ] 비즈니스 로직 식별

### 설계 단계
- [ ] UseCase 설계 (비즈니스 로직)
- [ ] Repository 인터페이스 (DB 추상화)
- [ ] DTO 정의 (입출력 타입)

### 구현 단계
- [ ] v2 구현 (TDD)
- [ ] v1 → v2 위임
- [ ] 병렬 실행 (Optional)

### 검증 단계
- [ ] 기존 테스트 통과
- [ ] v2 테스트 추가
- [ ] v1 제거
