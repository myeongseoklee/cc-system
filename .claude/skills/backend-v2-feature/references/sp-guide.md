# Repository 및 Database Schema 가이드

## 디렉토리 구조

```
src/
├── entity/              # TypeORM Entity 정의
│   └── order.entity.ts
├── repository/          # Repository 구현
│   └── order.repository.ts
└── migration/           # DB Migration 파일
    └── 001-create-orders.ts
```

## Entity 정의

```typescript
// entity/order.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'order_number', unique: true })
  orderNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

## Repository 패턴

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
```

## 네이밍 규칙

- **Entity**: `PascalCase` + `Entity` 접미사 (e.g., `OrderEntity`)
- **Repository**: `PascalCase` + `Repository` 접미사 (e.g., `OrderRepository`)
- **메서드**: `find*`, `save`, `update`, `delete`

예시:
- `findById` - 단일 조회
- `findByCustomerId` - 조건 조회
- `findAll` - 전체 조회
- `save` - 생성/수정
- `delete` - 삭제

## Migration

```typescript
// migration/001-create-orders.ts
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateOrders1234567890 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'orders',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid' },
          { name: 'customer_id', type: 'varchar', length: '50' },
          { name: 'order_number', type: 'varchar', length: '50', isUnique: true },
          { name: 'total_amount', type: 'decimal', precision: 10, scale: 2 },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('orders');
  }
}
```

## Query Builder (복잡한 쿼리)

```typescript
async findWithFilters(filters: {
  customerId?: string;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
}): Promise<{ items: OrderEntity[]; total: number }> {
  const qb = this.repository.createQueryBuilder('order');

  if (filters.customerId) {
    qb.andWhere('order.customerId = :customerId', { customerId: filters.customerId });
  }

  if (filters.startDate) {
    qb.andWhere('order.createdAt >= :startDate', { startDate: filters.startDate });
  }

  if (filters.endDate) {
    qb.andWhere('order.createdAt <= :endDate', { endDate: filters.endDate });
  }

  const [items, total] = await qb
    .orderBy('order.createdAt', 'DESC')
    .skip((filters.page - 1) * filters.limit)
    .take(filters.limit)
    .getManyAndCount();

  return { items, total };
}
```

## 상세 가이드

- TypeORM 공식 문서: https://typeorm.io/
- Repository 패턴 상세: `docs/domain-design/phases/03-implementation/references/factory-repository.md`
