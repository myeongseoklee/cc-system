# API Integration Test

## 목적

전체 레이어 통합 검증 (API → Service → UseCase → Repository)

## Infrastructure Mock

### Repository Mock

```typescript
const mockOrderRepository = {
  findById: jest.fn(),
  findByCustomerId: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

jest.mock('@modules/repository/order.repository', () => ({
  orderRepository: mockOrderRepository,
}));
```

### 외부 API Mock

```typescript
jest.mock('@modules/api-client');
import { APIClient } from '@modules/api-client';

(APIClient.post as jest.Mock).mockResolvedValue({ data: { success: true } });
```

## 테스트 구조

```typescript
// src/pages/api/v2/orders/__tests__/list.api.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '../list';

// Repository Mock
const mockOrderRepository = {
  findByCustomerId: jest.fn(),
};

jest.mock('@modules/repository/order.repository', () => ({
  orderRepository: mockOrderRepository,
}));

describe('GET /api/v2/orders/list', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOrderRepository.findByCustomerId.mockResolvedValue([
      { id: 'order-1', orderNumber: 'ORD-001', customerId: 'cust-1' },
    ]);
  });

  test('정상: 목록 반환', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { customerId: 'cust-1' },
      headers: { authorization: 'Bearer token' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      success: true,
      data: expect.arrayContaining([
        expect.objectContaining({ id: 'order-1', orderNumber: 'ORD-001' }),
      ]),
    });
  });

  test('에러: 권한 없음', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { customerId: 'cust-1' },
      headers: {}, // No auth
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
  });
});
```

## 상세 가이드

`.claude/skills/api-integration-test/` 참조
