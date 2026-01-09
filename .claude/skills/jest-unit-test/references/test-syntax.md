# Jest 테스트 문법

## 기본 구조

```typescript
describe('테스트 대상', () => {
  test('테스트 케이스 설명', () => {
    // Arrange - 준비
    // Act - 실행
    // Assert - 검증
  });
});
```

## AAA 패턴

### Arrange (준비)
```typescript
const input = { name: 'test', value: 100 };
mockRepository.findById.mockResolvedValue(input);
```

### Act (실행)
```typescript
const result = await usecase.exec({ id: 1 });
```

### Assert (검증)
```typescript
expect(result).toEqual(input);
```

## 비동기 테스트

### async/await
```typescript
test('비동기 작업', async () => {
  const result = await asyncFunction();
  expect(result).toBe('success');
});
```

### Promise
```typescript
test('Promise 성공', () => {
  return expect(asyncFunction()).resolves.toBe('success');
});

test('Promise 실패', () => {
  return expect(asyncFunction()).rejects.toThrow(Error);
});
```

## 테스트 명명

```typescript
describe('UpsertAppAdSettings', () => {
  describe('exec', () => {
    test('AdCash: type=1로 upsert 호출', () => {});
    test('Buzzvil: exposureWeight를 100으로 나눔', () => {});
  });
});
```

**규칙**:
- `describe`: 테스트 대상 (영어)
- `test`: "[상황]: [기대 동작]" (한글)
