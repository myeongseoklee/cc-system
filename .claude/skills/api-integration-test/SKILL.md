---
name: api-integration-test
description: API 통합 테스트 작성. Infrastructure mock하여 전체 레이어 검증.
---

# API 통합 테스트

## 목적
전체 레이어 통합 검증 (API → Service → UseCase → Repository)

## Infrastructure Mock

### DB Mock
```typescript
mockDatabase.tc.executeQuery.mockResolvedValue({ rows: [...] });
```

### 외부 API Mock
```typescript
mockApiClient.post.mockResolvedValue({ data: ... });
```

## 테스트 구조

```typescript
describe('POST /api/entity', () => {
  test('정상 생성', async () => {
    // Arrange
    mockDatabase.tc.executeQuery.mockResolvedValue({ rows: [{ id: 1 }] });

    // Act
    const res = await request(app).post('/api/entity').send({ name: 'test' });

    // Assert
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(1);
  });
});
```

상세: [references/integration-test-guide.md](references/integration-test-guide.md)
