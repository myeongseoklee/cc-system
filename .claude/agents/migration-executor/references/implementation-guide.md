# 구현 가이드

## Exception 구현

**enum.ts 먼저:**
```typescript
export enum OrderExceptionEnum {
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  ORDER_ALREADY_EXIST = 'ORDER_ALREADY_EXIST',
  INVALID_ORDER_STATUS = 'INVALID_ORDER_STATUS',
}
```

**각 exception 클래스:**
```typescript
import { BaseException } from '@exceptions';
import { OrderExceptionEnum } from './enum';

export class OrderNotFoundException extends BaseException {
  constructor(orderId: string) {
    super(OrderExceptionEnum.ORDER_NOT_FOUND, `Order ${orderId} not found`);
  }
}
```

## DTO 구현

테스트에서 요구하는 검증 규칙을 Zod 스키마로 작성

```typescript
import { z } from 'zod';

export const SelectOrderListDto = z.object({
  customerId: z.string().uuid(),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional(),
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
});

export type SelectOrderListDto = z.infer<typeof SelectOrderListDto>;
```

## Repository 구현

**클래스 + DI 패턴 (TypeORM):**
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

  async findByCustomerId(customerId: string): Promise<OrderEntity[]> {
    return this.repository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<OrderEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async save(entity: Partial<OrderEntity>): Promise<OrderEntity> {
    return this.repository.save(entity);
  }
}
```

## UseCase 구현

**클래스 + exec 패턴:**
```typescript
import { Injectable } from '@nestjs/common';
import { OrderRepository } from '../repository/order.repository';

@Injectable()
export class SelectOrderListUseCase {
  constructor(private readonly repository: OrderRepository) {}

  async exec({ customerId, page, limit }: SelectOrderListDto) {
    const orders = await this.repository.findByCustomerId(customerId);
    return this.transform(orders);
  }

  private transform(orders: OrderEntity[]): OrderDto[] {
    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
    }));
  }
}
```

**usecase/index.ts:**
```typescript
import { SelectOrderListUseCase } from './select-order-list.usecase';
import { CreateOrderUseCase } from './create-order.usecase';

export { SelectOrderListUseCase, CreateOrderUseCase };
```

## Service 구현

**UseCase만 호출:**
```typescript
import { SelectOrderListUseCase } from '../usecase';

export const selectOrderList = async (dto: SelectOrderListDto) => {
  const usecase = new SelectOrderListUseCase(orderRepository);
  return await usecase.exec(dto);
};
```

**트랜잭션 처리:**
```typescript
export const createOrderWithItems = async (dto: CreateOrderDto) => {
  return dataSource.transaction(async (manager) => {
    const orderRepo = manager.getRepository(OrderEntity);
    const itemRepo = manager.getRepository(OrderItemEntity);

    const order = await orderRepo.save(dto.order);
    const items = dto.items.map((item) => ({ ...item, orderId: order.id }));
    await itemRepo.save(items);

    return order;
  });
};
```
