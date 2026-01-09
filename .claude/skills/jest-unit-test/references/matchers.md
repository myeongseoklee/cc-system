# Jest Matchers

## 값 비교

```typescript
expect(value).toBe(42);                    // ===
expect(value).toEqual({ a: 1 });           // 깊은 비교
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeTruthy();
expect(value).toBeFalsy();
```

## 배열/객체

```typescript
expect(array).toContain(item);
expect(array).toHaveLength(3);
expect(obj).toHaveProperty('key');
expect(obj).toMatchObject({ a: 1 });       // 부분 매칭
```

## 호출 검증

```typescript
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(2);
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
expect(mockFn).toHaveBeenCalledWith(
  expect.objectContaining({ key: 'value' })
);
```

## 예외

```typescript
expect(() => fn()).toThrow();
expect(() => fn()).toThrow(Error);
expect(() => fn()).toThrow('error message');
await expect(asyncFn()).rejects.toThrow();
```

## 숫자

```typescript
expect(value).toBeGreaterThan(3);
expect(value).toBeGreaterThanOrEqual(3.5);
expect(value).toBeLessThan(5);
expect(value).toBeLessThanOrEqual(4.5);
expect(value).toBeCloseTo(0.3); // 부동소수점
```

## 문자열

```typescript
expect(str).toMatch(/pattern/);
expect(str).toContain('substring');
```

## jest-extended

```typescript
expect(date).toBeDate();
expect(array).toBeArrayOfSize(3);
expect(value).toBeEmpty();
expect(array).toInclude(item);
```

## expect.anything()

```typescript
expect(mockFn).toHaveBeenCalledWith(
  expect.anything(),  // 아무 값이나
  'specific value'
);
```

## expect.any(Type)

```typescript
expect(result).toEqual({
  id: expect.any(Number),
  name: expect.any(String),
  createdAt: expect.any(Date)
});
```
