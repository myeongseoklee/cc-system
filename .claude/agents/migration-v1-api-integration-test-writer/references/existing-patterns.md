# 기존 프로젝트 API 통합 테스트 패턴

## 필수 참고 파일

```
src/pages/api/orders/__tests__/index.api.test.ts
src/pages/api/products/__tests__/index.api.test.ts
```

## 핵심 패턴

### 1. 기본 구조

```typescript
import {
  createAuthedRequest,
  getJSONData,
  getStatusCode,
  mockOrderRepository,
  mockProductRepository,
} from '@test-utils';
import handler from '../index';

describe('GET /api/orders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('정상: ...', async () => {
    // Arrange
    // Act
    // Assert
  });
});
```

### 2. createAuthedRequest 사용법

```typescript
// GET 요청
const { req, res } = createAuthedRequest({
  method: 'GET',
  query: { customerId: 'cust-100', page: '1', limit: '20' },
});

// POST 요청
const { req, res } = createAuthedRequest({
  method: 'POST',
  body: { customerId: 'cust-100', items: [...] },
});

// DELETE 요청
const { req, res } = createAuthedRequest({
  method: 'DELETE',
  query: { id: 'order-123' },
});
```

### 3. Mock 설정

```typescript
// Repository Mock
mockOrderRepository.findByCustomerId.mockResolvedValue([
  { id: 'order-1', orderNumber: 'ORD-001', customerId: 'cust-100' },
  { id: 'order-2', orderNumber: 'ORD-002', customerId: 'cust-100' },
]);

// 단일 조회 Mock
mockOrderRepository.findById.mockResolvedValue({
  id: 'order-1',
  orderNumber: 'ORD-001',
});

// 저장 Mock
mockOrderRepository.save.mockResolvedValue({
  id: 'order-3',
  orderNumber: 'ORD-003',
});

// 여러 Mock 순서대로
mockOrderRepository.findById.mockResolvedValue({ id: 'order-1' });
mockProductRepository.findById.mockResolvedValue({ id: 'prod-1' });
mockOrderRepository.save.mockResolvedValue({ id: 'order-1' });
```

### 4. Assertion 패턴

```typescript
// 상태 코드 확인
expect(getStatusCode(res)).toBe(200);

// 응답 데이터 확인
const data = getJSONData(res);
expect(data.success).toBe(true);
expect(data.data.total).toBe(10);
expect(data.data.items).toHaveLength(2);
expect(data.data.items[0].id).toBe('order-1');

// 에러 응답
expect(getStatusCode(res)).toBe(400);
const error = getJSONData(res);
expect(error.success).toBe(false);
```

### 5. describe/test 네이밍

```typescript
describe('GET /api/orders', () => {
  test('정상: 주문 목록 조회', async () => {});
  test('정상: 데이터가 없는 경우 빈 배열 반환', async () => {});
  test('예외: customerId가 누락된 경우 400 에러', async () => {});
});
```

**네이밍 규칙:**
- describe: `{HTTP_METHOD} {API_PATH}`
- test: `{상태}: {동작 설명}`
  - 상태: 정상, 예외, 경계값
  - 설명: 명확하고 구체적으로

## test-utils 사용 가능 헬퍼

```typescript
// Mock 헬퍼
createAuthedRequest({ method, query?, body?, headers? })
mockOrderRepository // { findById, findByCustomerId, save, delete, ... }
mockProductRepository // { findById, findAll, ... }

// Assertion 헬퍼
getStatusCode(res)
getJSONData(res)
```

상세: `src/test-utils/index.ts` 파일 참고
