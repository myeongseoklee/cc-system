# 리팩토링 패턴

## 원칙

1. **동작 불변**: 기능 변경 없이 구조 개선
2. **테스트 먼저**: 안전망 확보 후 리팩토링
3. **작은 단계**: 한 번에 하나씩 변경

## 흐름

```
테스트 작성 → Refactor → 테스트 통과 확인
```

## 주요 패턴

### 1. 함수 추출 (Extract Function)

긴 함수 → 작은 함수들

**Before:**
```typescript
export const processOrder = async (order) => {
  // 검증
  if (!order.items || order.items.length === 0) {
    throw new Error('No items');
  }
  if (order.total < 0) {
    throw new Error('Negative total');
  }

  // 계산
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = order.coupon ? subtotal * order.coupon.rate : 0;
  const tax = (subtotal - discount) * 0.1;
  const total = subtotal - discount + tax;

  // 저장
  await db.query('INSERT INTO orders ...');
};
```

**After:**
```typescript
export const processOrder = async (order) => {
  validateOrder(order);
  const total = calculateTotal(order);
  await saveOrder({ ...order, total });
};

function validateOrder(order) {
  if (!order.items || order.items.length === 0) {
    throw new Error('No items');
  }
  if (order.total < 0) {
    throw new Error('Negative total');
  }
}

function calculateTotal(order) {
  const subtotal = calculateSubtotal(order.items);
  const discount = calculateDiscount(subtotal, order.coupon);
  const tax = calculateTax(subtotal - discount);
  return subtotal - discount + tax;
}
```

### 2. 중복 제거 (Remove Duplication)

복사-붙여넣기 → 공통 함수

**Before:**
```typescript
// 여러 곳에서 중복
const buzzvil = settings
  .filter(s => s.type === 2 && s.isDisplay === 1)
  .map(s => ({ ...s, exposureWeight: s.exposureWeight / 100 }));

const adcash = settings
  .filter(s => s.type === 1 && s.isDisplay === 1)
  .map(s => ({ ...s, exposureWeight: s.exposureWeight / 100 }));
```

**After:**
```typescript
function filterAndTransform(settings, type) {
  return settings
    .filter(s => s.type === type && s.isDisplay === 1)
    .map(s => ({ ...s, exposureWeight: s.exposureWeight / 100 }));
}

const buzzvil = filterAndTransform(settings, 2);
const adcash = filterAndTransform(settings, 1);
```

### 3. 조건문 단순화 (Simplify Conditional)

복잡한 if → 명확한 조건

**Before:**
```typescript
if (order.status === 'pending' && order.total > 10000 && order.user.isPremium ||
    order.status === 'processing' && order.total > 5000 && order.user.isPremium) {
  applyDiscount();
}
```

**After:**
```typescript
function canApplyDiscount(order) {
  if (!order.user.isPremium) return false;

  const isPending = order.status === 'pending' && order.total > 10000;
  const isProcessing = order.status === 'processing' && order.total > 5000;

  return isPending || isProcessing;
}

if (canApplyDiscount(order)) {
  applyDiscount();
}
```

### 4. 네이밍 개선 (Rename Variable)

모호한 이름 → 명확한 의미

**Before:**
```typescript
const d = new Date();
const x = data.filter(i => i.s === 1);
const tmp = calculateValue(x);
```

**After:**
```typescript
const today = new Date();
const activeItems = data.filter(item => item.status === 1);
const totalRevenue = calculateRevenue(activeItems);
```

### 5. Magic Number 제거

숫자 → 상수

**Before:**
```typescript
if (user.level > 5) {
  applyDiscount(price * 0.15);
}
```

**After:**
```typescript
const PREMIUM_LEVEL = 5;
const PREMIUM_DISCOUNT_RATE = 0.15;

if (user.level > PREMIUM_LEVEL) {
  applyDiscount(price * PREMIUM_DISCOUNT_RATE);
}
```

### 6. 함수 매개변수 객체화 (Introduce Parameter Object)

많은 파라미터 → 객체

**Before:**
```typescript
function createOrder(userId, productId, quantity, price, coupon, shippingAddress) {
  // ...
}
```

**After:**
```typescript
interface CreateOrderParams {
  userId: number;
  productId: number;
  quantity: number;
  price: number;
  coupon?: string;
  shippingAddress: string;
}

function createOrder(params: CreateOrderParams) {
  // ...
}
```

### 7. Guard Clause

중첩 if → Early Return

**Before:**
```typescript
function processPayment(payment) {
  if (payment) {
    if (payment.amount > 0) {
      if (payment.method === 'card') {
        return chargeCard(payment);
      }
    }
  }
  return null;
}
```

**After:**
```typescript
function processPayment(payment) {
  if (!payment) return null;
  if (payment.amount <= 0) return null;
  if (payment.method !== 'card') return null;

  return chargeCard(payment);
}
```

## 체크리스트

### 리팩토링 전
- [ ] 테스트 작성 (안전망)
- [ ] 코드 이해 (변경 범위 파악)
- [ ] 작은 단계로 계획

### 리팩토링 중
- [ ] 한 번에 하나씩 변경
- [ ] 각 단계마다 테스트 실행
- [ ] 동작 불변 확인

### 리팩토링 후
- [ ] 모든 테스트 통과
- [ ] 코드 리뷰
- [ ] 문서 업데이트
