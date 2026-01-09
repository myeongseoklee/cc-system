# 레거시 코드 테스트 전략

## 전략

### 1. Characterization Test (특성 테스트)

현재 동작을 테스트로 고정

**목적**: 리팩토링 전 현재 동작을 문서화

```typescript
// 레거시 코드 (동작 불명확)
function calculateDiscount(order) {
  let discount = 0;
  if (order.items.length > 5) {
    discount = order.total * 0.1;
  }
  if (order.user.isPremium) {
    discount += 1000;
  }
  return discount;
}

// Characterization Test: 현재 동작을 있는 그대로 테스트
describe('calculateDiscount (현재 동작)', () => {
  test('일반 사용자, 5개 이하', () => {
    const order = { items: [1,2,3], total: 10000, user: { isPremium: false } };
    expect(calculateDiscount(order)).toBe(0);
  });

  test('일반 사용자, 6개 이상', () => {
    const order = { items: [1,2,3,4,5,6], total: 10000, user: { isPremium: false } };
    expect(calculateDiscount(order)).toBe(1000); // 10% 할인
  });

  test('프리미엄 사용자, 5개 이하', () => {
    const order = { items: [1,2,3], total: 10000, user: { isPremium: true } };
    expect(calculateDiscount(order)).toBe(1000); // 고정 1000원
  });

  test('프리미엄 사용자, 6개 이상', () => {
    const order = { items: [1,2,3,4,5,6], total: 10000, user: { isPremium: true } };
    expect(calculateDiscount(order)).toBe(2000); // 10% + 1000원
  });
});
```

### 2. Seam 찾기 (테스트 가능한 경계 식별)

**Seam**: 코드를 변경하지 않고 동작을 변경할 수 있는 지점

```typescript
// Before: DB 의존성 (테스트 어려움)
async function getActiveUsers() {
  const users = await db.query('SELECT * FROM users WHERE active = 1');
  return users.filter(u => u.lastLogin > Date.now() - 30 * 24 * 60 * 60 * 1000);
}

// After: Seam 추가 (의존성 주입)
async function getActiveUsers(userRepository = defaultUserRepository) {
  const users = await userRepository.findActive();
  return users.filter(u => u.lastLogin > Date.now() - 30 * 24 * 60 * 60 * 1000);
}

// 테스트에서 Seam 활용
test('30일 이내 로그인 사용자만 반환', async () => {
  const fakeRepo = {
    findActive: jest.fn().mockResolvedValue([
      { id: 1, lastLogin: Date.now() - 10 * 24 * 60 * 60 * 1000 }, // 10일 전
      { id: 2, lastLogin: Date.now() - 40 * 24 * 60 * 60 * 1000 }, // 40일 전
    ])
  };

  const result = await getActiveUsers(fakeRepo);

  expect(result).toHaveLength(1);
  expect(result[0].id).toBe(1);
});
```

### 3. 의존성 끊기

Mock/Fake로 의존성 제거

**Before: 테스트 불가능**
```typescript
class OrderService {
  async processOrder(orderId) {
    const order = await db.query('SELECT ...');  // DB 의존
    const payment = await paymentGateway.charge(order);  // 외부 API 의존
    await emailService.send(order.user.email, 'Order confirmed');  // 이메일 의존
    return payment;
  }
}
```

**After: 의존성 주입**
```typescript
class OrderService {
  constructor(
    private orderRepo,
    private paymentGateway,
    private emailService
  ) {}

  async processOrder(orderId) {
    const order = await this.orderRepo.findById(orderId);
    const payment = await this.paymentGateway.charge(order);
    await this.emailService.send(order.user.email, 'Order confirmed');
    return payment;
  }
}

// 테스트
test('주문 처리', async () => {
  const mockRepo = { findById: jest.fn().mockResolvedValue(order) };
  const mockGateway = { charge: jest.fn().mockResolvedValue(payment) };
  const mockEmail = { send: jest.fn() };

  const service = new OrderService(mockRepo, mockGateway, mockEmail);
  const result = await service.processOrder(1);

  expect(mockGateway.charge).toHaveBeenCalledWith(order);
  expect(mockEmail.send).toHaveBeenCalled();
  expect(result).toEqual(payment);
});
```

### 4. 점진적 개선

작은 단위로 리팩토링

**Step 1: Characterization Test 작성**
```typescript
test('현재 동작 문서화', () => {
  expect(legacyFunction(input)).toEqual(currentOutput);
});
```

**Step 2: 작은 단위 추출**
```typescript
// Before
function complexFunction(data) {
  // 100줄의 복잡한 로직
}

// Step 2-1: 일부 추출
function complexFunction(data) {
  const validated = validateData(data);  // 추출
  // 90줄의 복잡한 로직
}

// Step 2-2: 계속 추출
function complexFunction(data) {
  const validated = validateData(data);
  const processed = processData(validated);  // 추출
  // 70줄의 복잡한 로직
}
```

**Step 3: 추출한 함수 테스트**
```typescript
describe('validateData', () => {
  test('유효한 데이터', () => {
    expect(validateData({ name: 'test' })).toEqual({ name: 'test' });
  });

  test('무효한 데이터', () => {
    expect(() => validateData(null)).toThrow();
  });
});
```

**Step 4: 리팩토링 계속**
- 각 단계마다 테스트 실행
- Characterization Test가 계속 통과하는지 확인
- 점진적으로 코드 품질 향상

## 흐름

```
현재 동작 테스트 (Characterization) → Refactor → 새 테스트 추가
```

## 체크리스트

### 시작 전
- [ ] Characterization Test 작성
- [ ] Seam 파악
- [ ] 의존성 분석

### 리팩토링 중
- [ ] 작은 단위로 변경
- [ ] 각 단계마다 테스트 실행
- [ ] Characterization Test 통과 확인

### 완료 후
- [ ] 새로운 단위 테스트 추가
- [ ] Characterization Test 제거 (선택적)
- [ ] 문서 업데이트
