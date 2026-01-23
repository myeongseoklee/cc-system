# 테스트 작성 가이드

## AAA 패턴

모든 테스트는 AAA 패턴 준수:
```typescript
test('성공: ...', async () => {
  // Arrange - 준비
  const dto = { customerId: 100 };
  const mockData = [{ id: 1 }];
  jest.spyOn(repository, 'selectList').mockResolvedValue(mockData);

  // Act - 실행
  const result = await usecase.selectList.exec(dto);

  // Assert - 검증
  expect(result).toEqual(mockData);
  expect(repository.selectList).toHaveBeenCalledWith(dto, undefined);
});
```

## Mock 패턴

**Repository Mock:**
```typescript
jest.spyOn(repository, 'method').mockResolvedValue(data);
```

**UseCase Mock:**
```typescript
jest.spyOn(usecase, 'method').mockImplementation(async () => result);
```
