# Test Doubles

## 5가지 유형

| 유형 | 정의 | Jest 구현 |
|------|------|----------|
| **Dummy** | 전달되지만 사용 안됨 | `{} as Type` |
| **Stub** | 미리 준비된 답변 반환 | `jest.fn().mockReturnValue()` |
| **Spy** | 호출 추적 + 실제 동작 | `jest.spyOn()` |
| **Mock** | 호출 추적 + 가짜 동작 | `jest.fn()` |
| **Fake** | 실제 구현 간략화 (메모리 DB) | 클래스 직접 구현 |

## Mock vs Stub

| 구분 | Stub (들어오는 상호작용) | Mock (나가는 상호작용) |
|------|-------------------------|----------------------|
| **목적** | 데이터 제공 | 부작용 검증 |
| **예시** | Repository 조회 | Repository 저장, API 호출 |
| **검증** | 반환값만 | 호출 인자, 횟수 |
| **Jest** | `mockResolvedValue()` | `toHaveBeenCalledWith()` |

## 사용 예시

### Stub (조회)
```typescript
// Stub: 데이터 제공
mockRepo.selectContent.mockResolvedValue({ title: '테스트' });
const result = await usecase.exec(123);
expect(result.title).toBe('테스트');  // 반환값만
```

### Mock (저장)
```typescript
// Mock: 부작용 검증
await usecase.exec(params);
expect(mockRepo.insertContent).toHaveBeenCalledWith(
  expect.objectContaining({ title: params.title })
);
```

### Spy
```typescript
const spy = jest.spyOn(console, 'log');
functionThatLogs();
expect(spy).toHaveBeenCalled();
spy.mockRestore();
```

### Fake
```typescript
class FakeRepository {
  private data = new Map();

  async insert(item) {
    this.data.set(item.id, item);
  }

  async findById(id) {
    return this.data.get(id);
  }
}
```

## 선택 기준

- 상태 검증 → Fake
- 호출 검증 → Mock
- 기존 코드 → Spy
- 데이터 제공 → Stub
