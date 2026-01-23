# 의존성 테스트 전략 가이드

## 개요

v1 함수의 모든 의존처를 테스트하여 마이그레이션 후 orphaned 참조가 발생하지 않도록 합니다.

## 테스트 카테고리

### 1. Service-to-service 테스트

**정의:** 다른 도메인이 현재 도메인을 호출하는 경우

**예시:**
```typescript
// invoice domain → order domain 호출
import invoiceService from '@modules/domain/invoice/service';
import orderService from '@modules/domain/order/service';

describe('invoice → order service calls', () => {
  test('selectInvoicesByOrder → selectOrderList', async () => {
    // Arrange: Mock Repository for both domains
    mockOrderRepository.findByCustomerId.mockResolvedValue([
      { id: 'order-1', customerId: 'cust-1' },
    ]);
    mockInvoiceRepository.findByOrderId.mockResolvedValue([
      { id: 'inv-1', orderId: 'order-1' },
    ]);

    // Act: Call invoice service (which internally calls order service)
    const result = await invoiceService.selectInvoicesByCustomer({
      customerId: 'cust-1',
    });

    // Assert: Verify both services were called
    expect(mockOrderRepository.findByCustomerId).toHaveBeenCalledWith('cust-1');
    expect(result).toBeDefined();
  });
});
```

**v1-analysis.json 소스:**
```json
{
  "functions": [{
    "name": "selectOrderList",
    "references": {
      "byCategory": { "service": 5 },
      "list": [
        {
          "file": "src/modules/domain/invoice/service/index.ts",
          "line": 120,
          "category": "service",
          "context": "const orders = await order.service.selectOrderList(...);"
        }
      ]
    }
  }]
}
```

### 2. Internal 함수 체인 테스트

**정의:** 같은 도메인 내에서 함수가 다른 함수를 호출하는 경우

**예시:**
```typescript
describe('order internal function chains', () => {
  test('deleteOrder calls findOrderById internally', async () => {
    // Arrange: Mock internal function calls
    mockOrderRepository.findById.mockResolvedValue({
      id: 'order-1',
      status: 'PENDING',
    });
    mockOrderRepository.delete.mockResolvedValue(undefined);

    // Act
    await orderService.deleteOrder('order-1');

    // Assert: Verify call order
    expect(mockOrderRepository.findById).toHaveBeenCalledWith('order-1');
    expect(mockOrderRepository.delete).toHaveBeenCalledWith('order-1');
  });

  test('updateOrder validates order exists first', async () => {
    // Arrange
    mockOrderRepository.findById.mockResolvedValue({
      id: 'order-1',
      status: 'PENDING',
    });
    mockOrderRepository.save.mockResolvedValue({ id: 'order-1' });

    // Act
    await orderService.updateOrder({ id: 'order-1', status: 'COMPLETED' });

    // Assert: Validation happened before update
    expect(mockOrderRepository.findById).toHaveBeenCalled();
    expect(mockOrderRepository.save).toHaveBeenCalled();
  });
});
```

**v1-analysis.json 소스:**
```json
{
  "callGraph": {
    "edges": [
      {
        "from": "deleteOrder",
        "to": "findOrderById",
        "type": "internal-call"
      },
      {
        "from": "updateOrder",
        "to": "findOrderById",
        "type": "internal-call"
      }
    ]
  }
}
```

### 3. Repository 함수 사용 테스트

**정의:** 현재 도메인이 공용 Repository 함수를 사용하는 경우

**예시:**
```typescript
import { findProductsByCustomerId } from '@shared/repository/product';

describe('order → shared repository dependencies', () => {
  test('selectOrdersWithProducts uses findProductsByCustomerId', async () => {
    // Arrange: Mock shared repository function
    mockProductRepository.findByCustomerId.mockResolvedValue([
      { id: 'prod-1', name: 'Product 1' },
    ]);
    mockOrderRepository.findByCustomerId.mockResolvedValue([
      { id: 'order-1', productId: 'prod-1' },
    ]);

    // Act
    const result = await orderService.selectOrdersWithProducts('cust-1');

    // Assert: Repository function called
    expect(mockProductRepository.findByCustomerId).toHaveBeenCalledWith('cust-1');
    expect(result.products).toBeDefined();
    expect(result.orders).toBeDefined();
  });
});
```

**v1-analysis.json 소스:**
```json
{
  "repositoryDependencies": {
    "functionsUsed": ["findProductsByCustomerId"],
    "crossDomainUsage": {
      "findProductsByCustomerId": {
        "totalReferences": 7,
        "currentDomain": 1,
        "otherDomains": 6
      }
    }
  }
}
```

## Mock 전략

### Repository Mock 사용

**기본 패턴:**
```typescript
import { mockOrderRepository, mockProductRepository } from '@test-utils/mocks';

describe('Test suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('test case', async () => {
    // Use mockOrderRepository.findById, mockOrderRepository.save, etc.
  });
});
```

### 체이닝 패턴

**여러 Repository 호출 순서대로 mock:**
```typescript
mockOrderRepository.findById.mockResolvedValue({ id: 'order-1' });
mockOrderRepository.findByCustomerId.mockResolvedValue([{ id: 'order-1' }]);
mockProductRepository.findById.mockResolvedValue({ id: 'prod-1' });
mockOrderRepository.save.mockResolvedValue({ id: 'order-1' });

await service.complexOperation();

expect(mockOrderRepository.findById).toHaveBeenCalled();
expect(mockProductRepository.findById).toHaveBeenCalled();
```

### Transaction Mock

```typescript
test('transaction operations', async () => {
  mockOrderRepository.findById.mockResolvedValue({ status: 'READY' });
  mockOrderRepository.save.mockResolvedValue({ id: 'order-1' });
  mockOrderItemRepository.save.mockResolvedValue([{ id: 'item-1' }]);

  await service.createOrderWithItems(orderDto);

  expect(mockDataSource.transaction).toHaveBeenCalled();
});
```

## 테스트 작성 가이드라인

### 1. AAA 패턴 준수

```typescript
test('description', async () => {
  // Arrange: Setup mocks
  mockOrderRepository.findById.mockResolvedValue({ id: 'order-1' });

  // Act: Execute function
  const result = await service.getOrder('order-1');

  // Assert: Verify behavior
  expect(result).toBeDefined();
  expect(mockOrderRepository.findById).toHaveBeenCalled();
});
```

### 2. 실제 Service 호출

**❌ 나쁜 예:**
```typescript
// Service를 mock하면 의존성 테스트 의미 없음
const mockOrderService = { selectOrderList: jest.fn() };
```

**✅ 좋은 예:**
```typescript
// 실제 service 호출, Repository만 mock
import orderService from '@modules/domain/order/service';
mockOrderRepository.findByCustomerId.mockResolvedValue([...]);
await orderService.selectOrderList(...);
```

### 3. Mock 최소화

**원칙:** Infrastructure(Repository, S3, Redis)만 mock

```typescript
// ✅ Infrastructure mock
mockOrderRepository.findById.mockResolvedValue({ ... });

// ✅ 실제 service 호출
await invoiceService.selectAll();
await orderService.selectList();

// ❌ Service mock (금지)
jest.mock('@modules/domain/order/service');
```

### 4. 호출 순서 검증

**Internal 함수 체인:**
```typescript
test('function call order', async () => {
  mockOrderRepository.findById.mockResolvedValue({ ... });
  mockOrderRepository.save.mockResolvedValue({ ... });

  await service.complexOperation();

  // Verify order
  expect(mockOrderRepository.findById).toHaveBeenCalled();
  expect(mockOrderRepository.save).toHaveBeenCalled();
});
```

## 에러 케이스 테스트

### 1. 의존 함수 실패

```typescript
test('handles dependency failure', async () => {
  // Arrange: Repository returns null
  mockOrderRepository.findById.mockResolvedValue(null);

  // Act & Assert
  await expect(
    invoiceService.selectByOrderId('order-999')
  ).rejects.toThrow('Order not found');
});
```

### 2. Internal 함수 체인 중단

```typescript
test('rollback on internal failure', async () => {
  mockOrderRepository.findById.mockResolvedValue({ id: 'order-1' });
  mockOrderRepository.save.mockRejectedValue(new Error('Save failed'));

  await expect(
    orderService.updateOrder({ id: 'order-1' })
  ).rejects.toThrow();

  expect(mockDataSource.transaction).toHaveBeenCalled();
});
```

## 커버리지 목표

### Service-to-service
- **목표:** 모든 cross-domain 참조 100% 커버
- **방법:** v1-analysis.json의 `references.byCategory.service` 전체 테스트

### Internal 함수
- **목표:** 주요 함수 체인 80% 커버
- **우선순위:** 복잡한 체인, 트랜잭션 포함 함수

### Repository 함수
- **목표:** 현재 도메인 사용처 100% 커버
- **제외:** 다른 도메인의 Repository 사용 (isolation 원칙)

## 다음 단계

이 테스트들은 v1 baseline을 확보합니다:
1. v2 마이그레이션 시 동일한 시나리오로 v2 테스트 작성
2. v1 ↔ v2 기능 동등성 검증
3. 마이그레이션 완료 후 orphaned 참조 0개 보장
