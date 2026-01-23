# Repository 설계 가이드

## 디렉토리 구조

```
repository/
├── order.repository.ts          # 메인 테이블
├── order-item.repository.ts     # 관계 테이블 (별도!)
└── index.ts
```

## 기본 패턴

```typescript
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

  async findByCustomerId(
    customerId: string,
    options?: { page?: number; limit?: number },
  ): Promise<OrderEntity[]> {
    const qb = this.repository
      .createQueryBuilder('order')
      .where('order.customerId = :customerId', { customerId })
      .orderBy('order.createdAt', 'DESC');

    if (options?.page && options?.limit) {
      qb.skip((options.page - 1) * options.limit).take(options.limit);
    }

    return qb.getMany();
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

## repository/index.ts

```typescript
import { OrderRepository } from './order.repository';
import { OrderItemRepository } from './order-item.repository';

export { OrderRepository, OrderItemRepository };
```

## Query Builder 사용 (복잡한 쿼리)

```typescript
async findWithFilters(filters: {
  customerId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
}): Promise<{ items: OrderEntity[]; total: number }> {
  const qb = this.repository.createQueryBuilder('order');

  if (filters.customerId) {
    qb.andWhere('order.customerId = :customerId', {
      customerId: filters.customerId,
    });
  }

  if (filters.status) {
    qb.andWhere('order.status = :status', { status: filters.status });
  }

  if (filters.startDate) {
    qb.andWhere('order.createdAt >= :startDate', {
      startDate: filters.startDate,
    });
  }

  if (filters.endDate) {
    qb.andWhere('order.createdAt <= :endDate', {
      endDate: filters.endDate,
    });
  }

  const [items, total] = await qb
    .orderBy('order.createdAt', 'DESC')
    .skip((filters.page - 1) * filters.limit)
    .take(filters.limit)
    .getManyAndCount();

  return { items, total };
}
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

## 트랜잭션 처리

```typescript
async createOrderWithItems(
  order: CreateOrderDto,
  items: CreateOrderItemDto[],
): Promise<OrderEntity> {
  return this.dataSource.transaction(async (manager) => {
    const savedOrder = await manager.save(OrderEntity, order);

    const orderItems = items.map((item) => ({
      ...item,
      orderId: savedOrder.id,
    }));
    await manager.save(OrderItemEntity, orderItems);

    return savedOrder;
  });
}
```
