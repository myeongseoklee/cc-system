# Action Hook 패턴

```typescript
// __tests__/useFeatureActions.test.ts
describe('useFeatureActions', () => {
  test('submit 호출 시 submitting true → API → false', async () => {
    mockApi.submit.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useFeatureActions());

    act(() => {
      result.current.handleSubmit({ name: 'test' });
    });

    expect(result.current.submitting).toBe(true);
    await waitFor(() => {
      expect(result.current.submitting).toBe(false);
    });
    expect(mockApi.submit).toHaveBeenCalledWith({ name: 'test' });
  });
});
```
