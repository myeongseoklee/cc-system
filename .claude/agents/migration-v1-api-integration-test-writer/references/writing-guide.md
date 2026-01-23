# 테스트 작성 가이드

## AAA 패턴 (Arrange-Act-Assert)

모든 테스트는 AAA 패턴을 엄격히 준수합니다.

```typescript
test('정상: 목록 조회', async () => {
  // Arrange - 테스트 데이터 및 Mock 준비
  const { req, res } = createAuthedRequest({
    method: 'GET',
    query: { customerId: '100', pageNo: '1', pageSize: '20' },
  });

  db.mockSelect('SelectOrderList', [
    { orderId: 1, orderName: 'Order-001' },
  ]);

  // Act - 실제 동작 실행
  await handler(req, res);

  // Assert - 결과 검증
  expect(getStatusCode(res)).toBe(200);
  const data = getJSONData(res);
  expect(data.success).toBe(true);
  expect(data.data.items).toHaveLength(1);
});
```

## Mock 설정 순서

Mock은 **실행 순서대로** 설정합니다.

```typescript
// 올바른 순서 (실행 순서와 동일)
db.mockSelect('SelectOrder', [{ orderId: 1 }]);    // 1번째 호출
db.mockSelect('SelectProduct', []);                 // 2번째 호출
db.mockMutation('InsertOrder', [{ orderId: 2 }]);  // 3번째 호출

// 잘못된 순서
db.mockMutation('InsertOrder', [{ orderId: 2 }]);  // 순서 틀림
db.mockSelect('SelectOrder', [{ orderId: 1 }]);
```

## 파일 구조

```typescript
// 1. Imports
import databases from '@databases';
import { createAuthedRequest, getJSONData, getStatusCode, mockDatabase } from '@test-utils';
import handler from '../index';

// 2. Mock 초기화
const db = mockDatabase();
(databases.tc as any).executeQuery = db.executeQuery;

// 3. describe 블록
describe('GET /api/order', () => {
  // 4. beforeEach
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 5. 테스트 케이스들
  test('...', async () => {});
});
```

## 주의사항

1. **항상 beforeEach에서 jest.clearAllMocks() 호출**
2. **Mock은 각 test 내부에서 설정** (describe 레벨 X)
3. **비동기 함수는 async/await 사용**
4. **getJSONData는 Assert 섹션에서만 호출**

## 자주하는 실수

### Mock을 describe 레벨에 설정 (잘못된 예)

```typescript
describe('GET /api/order', () => {
  // 여기서 설정하면 안됨
  db.mockSelect('SelectOrder', [data]);

  test('...', async () => {});
});
```

### Mock을 test 레벨에 설정 (올바른 예)

```typescript
describe('GET /api/order', () => {
  test('...', async () => {
    // 각 test마다 설정
    db.mockSelect('SelectOrder', [data]);
  });
});
```

### 순서 틀린 Assertion (잘못된 예)

```typescript
// getJSONData를 먼저 호출
const data = getJSONData(res);
expect(getStatusCode(res)).toBe(200);

// 올바른 순서: 상태 코드 먼저 확인
expect(getStatusCode(res)).toBe(200);
const data = getJSONData(res);
```

## 템플릿 활용

`templates/api-test.template.ts`를 복사하여 시작하면 빠릅니다.
