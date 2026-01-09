# 기존 프로젝트 API 통합 테스트 패턴

## 필수 참고 파일

```
src/pages/api/settlements/platform/additional-data/__tests__/index.api.test.ts
src/pages/api/channels/apps/[appSN]/adSettings/__tests__/index.api.test.ts
```

## 핵심 패턴

### 1. 기본 구조

```typescript
import databases from '@databases';
import {
  createAuthedRequest,
  getJSONData,
  getStatusCode,
  mockDatabase,
} from '@test-utils';
import handler from '../index';

// Database Mock 헬퍼 초기화
const db = mockDatabase();
(databases.tc as any).executeQuery = db.executeQuery;

describe('GET /api/domain', () => {
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
  query: { cpSN: '100', pageNo: '1', pageSize: '20' },
});

// POST 요청
const { req, res } = createAuthedRequest({
  method: 'POST',
  body: { cpSN: 100, data: {...} },
});

// DELETE 요청
const { req, res } = createAuthedRequest({
  method: 'DELETE',
  query: { id: '123' },
});
```

### 3. Mock 설정

```typescript
// Select 쿼리 Mock
db.mockSelect('Webtoon.admin_SelectTagList', [
  { tagSN: 1, tag: 'Action', cpSN: 100 },
  { tagSN: 2, tag: 'Romance', cpSN: 100 },
]);

// SelectOne 쿼리 Mock
db.mockSelectOne('Webtoon.admin_SelectTagCount', { count: 10 });

// Mutation 쿼리 Mock
db.mockMutation('Webtoon.admin_InsertTag', [
  { tagSN: 3 }
]);

// 여러 Mock 순서대로
db.mockSelect('SP1', [data1]);
db.mockSelect('SP2', [data2]);
db.mockMutation('SP3', [result]);
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
expect(data.data.items[0].tagSN).toBe(1);

// 에러 응답
expect(getStatusCode(res)).toBe(400);
const error = getJSONData(res);
expect(error.success).toBe(false);
```

### 5. describe/test 네이밍

```typescript
describe('GET /api/settlements/platform/additional-data', () => {
  test('정상: 부가 데이터 조회', async () => {});
  test('정상: 데이터가 없는 경우 빈 배열 반환', async () => {});
  test('예외: year가 누락된 경우 400 에러', async () => {});
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
mockDatabase() // db.mockSelect, db.mockMutation 등

// Assertion 헬퍼
getStatusCode(res)
getJSONData(res)
```

상세: `src/test-utils/index.ts` 파일 참고
