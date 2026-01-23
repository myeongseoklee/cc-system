# API Integration Test 상세 가이드

## 목적

전체 레이어 통합 검증 (API → Service → UseCase → Repository)

## Infrastructure Mock 전략

### Mock Boundary

**Mock 대상:**
- Repository (DB 접근 추상화)
- 외부 API (APIClient)
- S3 (AWS SDK)
- Redis (Cache)

**Mock 하지 않는 대상:**
- Service (실제 로직)
- UseCase (실제 로직)
- DTO (실제 검증)

## Setup

### 1. Mock 파일 생성

```typescript
// src/test-utils/infrastructure-mocks.ts
export const mockOrderRepository = {
  findById: jest.fn(),
  findByCustomerId: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

export const mockProductRepository = {
  findById: jest.fn(),
  findAll: jest.fn(),
};

export const mockAPIClient = {
  get: jest.fn(),
  post: jest.fn(),
};

export const mockS3 = {
  upload: jest.fn(),
  getSignedUrl: jest.fn(),
};
```

### 2. Mock 적용

```typescript
// src/pages/api/v2/orders/__tests__/list.api.test.ts
import { mockOrderRepository } from '@test-utils/infrastructure-mocks';

jest.mock('@modules/repository/order.repository', () => ({
  orderRepository: mockOrderRepository,
}));

jest.mock('@modules/api-client', () => ({
  APIClient: require('@test-utils/infrastructure-mocks').mockAPIClient,
}));
```

### 3. Test Helper

```typescript
// src/test-utils/api-test-helpers.ts
import { createMocks } from 'node-mocks-http';

export function createApiRequest(options: {
  method: string;
  body?: any;
  query?: any;
  headers?: any;
}) {
  return createMocks({
    method: options.method,
    body: options.body,
    query: options.query,
    headers: {
      'content-type': 'application/json',
      ...options.headers,
    },
  });
}

export function expectSuccessResponse(res, expectedData) {
  expect(res._getStatusCode()).toBe(200);
  expect(res._getJSONData()).toMatchObject({
    success: true,
    data: expectedData,
  });
}

export function expectErrorResponse(res, statusCode, message?) {
  expect(res._getStatusCode()).toBe(statusCode);
  if (message) {
    expect(res._getJSONData().message).toContain(message);
  }
}
```

## 테스트 구조

```typescript
import { createApiRequest, expectSuccessResponse } from '@test-utils/api-test-helpers';
import { mockOrderRepository } from '@test-utils/infrastructure-mocks';
import handler from '../list';

jest.mock('@modules/repository/order.repository');

describe('GET /api/v2/orders/list', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('성공 케이스', () => {
    test('정상: 목록 반환', async () => {
      // Arrange
      mockOrderRepository.findByCustomerId.mockResolvedValue([
        { id: 'order-1', orderNumber: 'ORD-001', createdAt: '2024-01-01' },
        { id: 'order-2', orderNumber: 'ORD-002', createdAt: '2024-01-02' },
      ]);

      const { req, res } = createApiRequest({
        method: 'GET',
        query: { customerId: 'cust-1', page: '1', limit: '10' },
        headers: { authorization: 'Bearer valid-token' },
      });

      // Act
      await handler(req, res);

      // Assert
      expectSuccessResponse(res, {
        data: expect.arrayContaining([
          expect.objectContaining({ id: 'order-1', orderNumber: 'ORD-001' }),
          expect.objectContaining({ id: 'order-2', orderNumber: 'ORD-002' }),
        ]),
      });

      // Repository 호출 검증
      expect(mockOrderRepository.findByCustomerId).toHaveBeenCalledWith('cust-1');
    });

    test('필터 적용', async () => {
      mockOrderRepository.findByCustomerId.mockResolvedValue([
        { id: 'order-1', status: 'completed' },
      ]);

      const { req, res } = createApiRequest({
        method: 'GET',
        query: { customerId: 'cust-1', status: 'completed' },
        headers: { authorization: 'Bearer valid-token' },
      });

      await handler(req, res);

      expectSuccessResponse(res, {
        data: expect.arrayContaining([
          expect.objectContaining({ status: 'completed' }),
        ]),
      });
    });
  });

  describe('에러 케이스', () => {
    test('401: 인증 없음', async () => {
      const { req, res } = createApiRequest({
        method: 'GET',
        query: { customerId: 'cust-1' },
        headers: {}, // No auth
      });

      await handler(req, res);

      expectErrorResponse(res, 401);
    });

    test('400: DTO 검증 실패', async () => {
      const { req, res } = createApiRequest({
        method: 'GET',
        query: { page: '-1', limit: '10' }, // Invalid page
        headers: { authorization: 'Bearer valid-token' },
      });

      await handler(req, res);

      expectErrorResponse(res, 400, 'page');
    });

    test('500: DB 에러', async () => {
      mockOrderRepository.findByCustomerId.mockRejectedValue(
        new Error('DB connection failed')
      );

      const { req, res } = createApiRequest({
        method: 'GET',
        query: { customerId: 'cust-1' },
        headers: { authorization: 'Bearer valid-token' },
      });

      await handler(req, res);

      expectErrorResponse(res, 500);
    });
  });

  describe('비즈니스 로직 검증', () => {
    test('데이터 변환 확인', async () => {
      mockOrderRepository.findByCustomerId.mockResolvedValue([
        { id: 'order-1', createdAt: '2024-01-01T00:00:00Z' },
      ]);

      const { req, res } = createApiRequest({
        method: 'GET',
        query: { customerId: 'cust-1' },
        headers: { authorization: 'Bearer valid-token' },
      });

      await handler(req, res);

      const data = res._getJSONData().data;
      expect(data[0]).toMatchObject({
        id: 'order-1',
        createdAt: expect.any(String),
      });
    });
  });
});
```

## 파일 위치

```
src/pages/api/v2/
├─ orders/
│  ├─ list.ts
│  ├─ [id]/get.ts
│  └─ __tests__/
│     ├─ list.api.test.ts
│     └─ get.api.test.ts
```

## 네이밍 규칙

- 파일명: `*.api.test.ts`
- describe: HTTP 메서드 + 경로
- test: "[상황]: [결과]" (한글)

## 실행 방법

```bash
# 전체 API 테스트
npx jest --testMatch="**/*.api.test.ts"

# 특정 도메인만
npx jest src/pages/api/v2/orders

# Coverage 포함
npx jest --testMatch="**/*.api.test.ts" --coverage
```
