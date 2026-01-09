# TDD 사이클: Red-Green-Refactor

## Red: 실패하는 테스트 작성

```typescript
test('정액 쿠폰 적용 시 해당 금액만큼 할인', () => {
  // Arrange
  const coupon = createCoupon({ type: 'FIXED', discountAmount: 1000 });
  const order = createOrder({ total: 10000 });

  // Act
  const result = couponService.apply(order, coupon);

  // Assert
  expect(result.discountedTotal).toBe(9000); // 아직 구현 없음 → 실패
});
```

**핵심**: 테스트가 실패하는지 반드시 확인. 실패 안 하면 테스트가 잘못됨.

## Green: 최소한의 코드로 통과

```typescript
// 첫 번째 테스트 통과를 위한 최소 구현
apply(order: Order, coupon: Coupon) {
  return { discountedTotal: 9000 }; // 하드코딩 OK
}
```

**핵심**: 완벽한 코드가 아니어도 됨. 오버엔지니어링 금지.

## Refactor: 테스트 통과 유지하며 개선

```typescript
// 두 번째 테스트 추가
test('2000원 쿠폰 적용 시 2000원 할인', () => {
  // Arrange
  const coupon = createCoupon({ type: 'FIXED', discountAmount: 2000 });
  const order = createOrder({ total: 10000 });

  // Act
  const result = couponService.apply(order, coupon);

  // Assert
  expect(result.discountedTotal).toBe(8000);
});

// 이제 일반화 필요
apply(order: Order, coupon: Coupon) {
  return { discountedTotal: order.total - coupon.discountAmount };
}
```

## 경계값 테스트

```typescript
describe('경계값 케이스', () => {
  test('최소 주문금액과 정확히 동일하면 적용 가능', () => {
    // Arrange
    const order = createOrder({ total: 10000 });
    const coupon = createCoupon({ minOrderAmount: 10000 });

    // Act & Assert
    expect(() => service.apply(order, coupon)).not.toThrow();
  });

  test('최소 주문금액보다 1원 부족하면 에러', () => {
    // Arrange
    const order = createOrder({ total: 9999 });
    const coupon = createCoupon({ minOrderAmount: 10000 });

    // Act & Assert
    expect(() => service.apply(order, coupon))
      .toThrow(MinimumAmountNotMetError);
  });

  test('할인 금액이 주문 금액 초과 시 0원 처리', () => {
    // Arrange
    const order = createOrder({ total: 500 });
    const coupon = createCoupon({ discountAmount: 1000 });

    // Act
    const result = service.apply(order, coupon);

    // Assert
    expect(result.discountedTotal).toBe(0);
  });
});
```

## 예외 케이스 테스트

```typescript
describe('에러 케이스', () => {
  test('이미 사용된 쿠폰 적용 시 에러', async () => {
    // Arrange
    const usedCoupon = createCoupon({ usedAt: new Date() });

    // Act & Assert
    await expect(service.apply(order, usedCoupon))
      .rejects.toThrow(CouponAlreadyUsedError);
  });

  test('만료된 쿠폰 적용 시 에러', async () => {
    // Arrange
    const expiredCoupon = createCoupon({
      expiresAt: new Date('2024-01-01')
    });

    // Act & Assert
    await expect(service.apply(order, expiredCoupon))
      .rejects.toThrow(CouponExpiredError);
  });
});
```
