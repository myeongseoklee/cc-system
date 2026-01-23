# UseCase 설계 가이드 (실제 코드베이스 기반)

## 패턴 1: 간단한 UseCase (파라미터 직접 나열)

```typescript
export class CancelOrderUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async exec(orderId: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new OrderNotFoundException(orderId);
    }
    order.status = 'CANCELLED';
    await this.orderRepository.save(order);
  }
}
```

## 패턴 2: 복잡한 UseCase (private 메서드 분리)

**실제 예제:**
```typescript
import { Injectable } from '@nestjs/common';
import { OrderRepository } from '../repository/order.repository';
import { ProductRepository } from '../repository/product.repository';

@Injectable()
export class SelectOrderListFilteredByUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async exec(
    customerId: string,
    productId: string | null,
    status: string | null,
    offset: number,
    limit: number,
  ) {
    const products = await this.getProductsByCustomerId(customerId);
    const orders = await this.getOrdersFiltered(
      customerId,
      productId,
      products,
      status,
      offset,
      limit,
    );
    return this.mapOrdersWithProducts(orders, products);
  }

  private async getProductsByCustomerId(customerId: string) {
    return this.productRepository.findByCustomerId(customerId);
  }

  private async getOrdersFiltered(
    customerId: string,
    productId: string | null,
    products: Product[],
    status: string | null,
    offset: number,
    limit: number,
  ) {
    const productIds = productId
      ? [productId]
      : products.map((p) => p.id);
    return this.orderRepository.findByFilters({
      customerId,
      productIds,
      status,
      offset,
      limit,
    });
  }

  private mapOrdersWithProducts(orders: Order[], products: Product[]) {
    return orders.map((order) => {
      const product = products.find((p) => p.id === order.productId);
      return {
        ...order,
        productName: product?.name,
        productCategory: product?.category,
      };
    });
  }
}
```

**핵심 패턴:**
- exec(): 플로우 조정
- get*(): 데이터 조회
- map*(): 데이터 변환

## exec() 파라미터 선택

- **3개 이하:** 직접 나열 (권장)
- **4개 이상:** destructured object

## usecase/index.ts

```typescript
import { SelectOrderListUseCase } from './select-order-list.usecase';
import { CreateOrderUseCase } from './create-order.usecase';

export { SelectOrderListUseCase, CreateOrderUseCase };
```
