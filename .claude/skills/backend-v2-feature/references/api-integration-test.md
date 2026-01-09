# API Integration Test

## 목적

전체 레이어 통합 검증 (API → Service → UseCase → Repository)

## Infrastructure Mock

### DB Mock

```typescript
jest.mock('@modules/database/tc');
import { database } from '@modules/database/tc';

(database.tc.executeQuery as jest.Mock).mockResolvedValue({
  rows: [{ id: 1, name: 'test' }],
});
```

### 외부 API Mock

```typescript
jest.mock('@modules/api-client');
import { APIClient } from '@modules/api-client';

(APIClient.post as jest.Mock).mockResolvedValue({ data: { success: true } });
```

## 테스트 구조

```typescript
// src/pages/api/v2/[domain]/__tests__/list.api.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '../list';

// Infrastructure Mock
jest.mock('@modules/database/tc');

describe('GET /api/v2/entity/list', () => {
  beforeEach(() => {
    (database.tc.executeQuery as jest.Mock).mockResolvedValue({
      rows: [{ id: 1, name: 'test' }],
    });
  });

  test('정상: 목록 반환', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      body: { page: 1, limit: 10 },
      headers: { authorization: 'Bearer token' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      success: true,
      data: expect.arrayContaining([
        expect.objectContaining({ id: 1, name: 'test' }),
      ]),
    });
  });

  test('에러: 권한 없음', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      body: { page: 1, limit: 10 },
      headers: {}, // No auth
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
  });
});
```

## 상세 가이드

`.claude/skills/api-integration-test/` 참조
