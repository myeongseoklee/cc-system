# Repository 패턴

## 기본 구조

```typescript
// repository/order.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../entity/order.entity';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repository: Repository<OrderEntity>,
  ) {}

  async findAll(): Promise<OrderEntity[]> {
    return this.repository.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<OrderEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByCustomerId(customerId: string): Promise<OrderEntity[]> {
    return this.repository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }

  async save(entity: Partial<OrderEntity>): Promise<OrderEntity> {
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<OrderEntity>): Promise<void> {
    await this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}

export default new OrderRepository();
```

## 메서드 네이밍 규칙

| 작업 | 메서드명 | 반환 타입 |
|------|----------|----------|
| 전체 조회 | `findAll()` | `Entity[]` |
| ID로 조회 | `findById(id)` | `Entity \| null` |
| 조건 조회 | `findBy{Field}(value)` | `Entity[]` |
| 생성/수정 | `save(entity)` | `Entity` |
| 수정 | `update(id, data)` | `void` |
| 삭제 | `delete(id)` | `void` |

## 원칙

1. **ORM 사용**: 직접 쿼리 작성 금지, TypeORM/Prisma 활용
2. **변환 금지**: 데이터 가공은 UseCase에서
3. **에러 처리**: ORM에서 자동 처리
4. **단일 책임**: Repository는 데이터 접근만 담당

## 파일 위치

```
repository/
├── order.repository.ts
├── product.repository.ts
└── customer.repository.ts
```

## 관계 조회 (Relations)

```typescript
async findWithItems(orderId: string): Promise<OrderEntity | null> {
  return this.repository.findOne({
    where: { id: orderId },
    relations: ['items', 'items.product'],
  });
}
```

## 페이지네이션

```typescript
async findWithPagination(page: number, limit: number): Promise<{
  items: OrderEntity[];
  total: number;
  page: number;
  limit: number;
}> {
  const [items, total] = await this.repository.findAndCount({
    skip: (page - 1) * limit,
    take: limit,
    order: { createdAt: 'DESC' },
  });

  return { items, total, page, limit };
}
```
