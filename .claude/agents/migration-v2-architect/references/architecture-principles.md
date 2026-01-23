# v2 아키텍처 원칙

## 계층별 책임

```
API Route → DTO.parse() → Service → UseCase → Repository → Database
```

### 1. DTO (Data Transfer Object)
- **Zod 스키마** 기반 런타임 검증
- 입력 타입 안전성 보장
- 파라미터 변환 (문자열 → 숫자 등)

```typescript
export const SelectOrderListDto = z.object({
  customerId: z.string().uuid(),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional(),
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
});
```

### 2. UseCase
- **클래스 기반** 설계
- **단일 책임 원칙**: 1 UseCase = 1 비즈니스 기능
- **Public**: `exec()` 메서드만 외부 노출
- **Private**: 내부 로직은 private 메서드로 분리
- 비즈니스 로직의 핵심 (데이터 변환, 검증, 필터링, 집계)

```typescript
export class SelectOrderListUseCase {
  constructor(private readonly repository: OrderRepository) {}

  async exec({ customerId, status, page, limit }: SelectOrderListDto) {
    // 1. 검증
    this.validate(customerId);
    // 2. 데이터 조회
    const data = await this.repository.findByCustomerId(customerId, {
      status,
      page,
      limit,
    });
    // 3. 변환
    return this.transform(data);
  }

  private validate(customerId: string) { /* ... */ }
  private transform(data: OrderEntity[]): OrderDto[] { /* ... */ }
}
```

### 3. Repository
- **ORM 사용** (비즈니스 로직 금지!)
- 인터페이스 명확성: `findById`, `findByCustomerId`, `save`, `delete`
- 파라미터 타입 명시
- **클래스 기반 + DI**

```typescript
@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repository: Repository<OrderEntity>,
  ) {}

  async findByCustomerId(customerId: string): Promise<OrderEntity[]> {
    return this.repository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }
}
```

### 4. Service
- **UseCase 조합** (여러 UseCase를 순차 실행)
- 트랜잭션 관리
- Policy 적용 (권한 제어)
- 캐시 적용

```typescript
// 단순
export const selectOrderList = async (dto: SelectOrderListDto) => {
  const usecase = new SelectOrderListUseCase(orderRepository);
  return await usecase.exec(dto);
};

// 트랜잭션
export const createOrderWithItems = async (dto: CreateOrderDto) => {
  return dataSource.transaction(async (manager) => {
    const createOrderUseCase = new CreateOrderUseCase(
      manager.getRepository(OrderEntity),
    );
    const createItemsUseCase = new CreateOrderItemsUseCase(
      manager.getRepository(OrderItemEntity),
    );

    const order = await createOrderUseCase.exec(dto);
    await createItemsUseCase.exec(order.id, dto.items);

    return order;
  });
};
```

## 설계 우선순위

1. **단순성**: 과도한 추상화 금지
2. **명확성**: 계층별 책임 명확히 분리
3. **재사용성**: UseCase는 독립적으로 테스트 가능
4. **일관성**: 기존 v2 패턴 따르기
