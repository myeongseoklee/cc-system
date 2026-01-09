# Hook 테스트 예제

```typescript
// __tests__/useFeatureData.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useFeatureData } from '../useFeatureData';

describe('useFeatureData', () => {
  test('초기 로딩 시 loading true', () => {
    const { result } = renderHook(() => useFeatureData());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([]);
  });

  test('데이터 로드 완료 시 data 설정', async () => {
    mockApi.getData.mockResolvedValue([{ id: 1, name: 'test' }]);
    const { result } = renderHook(() => useFeatureData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toHaveLength(1);
    });
  });

  test('에러 발생 시 error 설정', async () => {
    mockApi.getData.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useFeatureData());

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.loading).toBe(false);
    });
  });
});
```
