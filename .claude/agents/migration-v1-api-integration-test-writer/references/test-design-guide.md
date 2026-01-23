# 테스트 케이스 설계 가이드

## 기본 원칙

각 v1 함수별로 최소 3가지 카테고리 테스트 작성:
1. **정상 케이스**: 성공 시나리오
2. **예외 케이스**: 검증 실패, 비즈니스 규칙 위반
3. **엣지 케이스**: 빈 데이터, 경계값, 특수 상황

## 테스트 케이스 템플릿

### 1. 목록 조회 (GET /api/{domain})

```typescript
describe('GET /api/order', () => {
  // 정상 케이스
  test('정상: 목록 조회', async () => {
    // db.mockSelect로 여러 행 반환
    // 200 응답, data.items 확인
  });

  test('정상: 데이터가 없는 경우 빈 배열 반환', async () => {
    // db.mockSelect([])
    // 200 응답, data.items === []
  });

  // 예외 케이스
  test('예외: customerId가 누락된 경우 400 에러', async () => {
    // query에 customerId 없이 요청
    // 400 응답
  });

  // 엣지 케이스
  test('엣지: pageSize가 0인 경우 기본값 20 사용', async () => {
    // query: { pageSize: '0' }
    // SP 호출 시 pageSize = 20 확인
  });
});
```

### 2. 상세 조회 (GET /api/{domain}/[id])

```typescript
describe('GET /api/order/[orderId]', () => {
  test('정상: 주문 상세 조회', async () => {
    // db.mockSelectOne으로 단일 행 반환
  });

  test('예외: 존재하지 않는 orderId인 경우 404 에러', async () => {
    // db.mockSelectOne(null)
  });
});
```

### 3. 생성 (POST /api/{domain})

```typescript
describe('POST /api/order', () => {
  test('정상: 주문 생성', async () => {
    // db.mockMutation으로 INSERT 결과 반환
    // 201 응답, data.orderId 확인
  });

  test('예외: 필수 필드 누락 시 400 에러', async () => {
    // body: { customerId: 100 } (orderName 누락)
  });

  test('예외: 중복된 주문 생성 시 409 에러', async () => {
    // v1 코드가 중복 체크하는 경우
    // db.mockSelect로 기존 데이터 반환
  });
});
```

### 4. 수정 (PUT /api/{domain}/[id])

```typescript
describe('PUT /api/order/[orderId]', () => {
  test('정상: 주문 수정', async () => {
    // db.mockMutation으로 UPDATE 결과
  });

  test('예외: 존재하지 않는 주문 수정 시 404 에러', async () => {
    // db.mockSelectOne(null)
  });
});
```

### 5. 삭제 (DELETE /api/{domain}/[id])

```typescript
describe('DELETE /api/order/[orderId]', () => {
  test('정상: 주문 삭제', async () => {
    // db.mockMutation으로 DELETE 결과
  });

  test('예외: 처리 중인 주문 삭제 시 409 에러', async () => {
    // v1 코드가 삭제 가능 여부 체크하는 경우
  });
});
```

## Mock 데이터 설계

### 실제 데이터와 유사하게

```typescript
// 나쁜 예
db.mockSelect('SelectOrder', [{ orderId: 1, orderName: 'a' }]);

// 좋은 예
db.mockSelect('SelectOrderList', [
  {
    orderId: 1,
    orderName: 'Order-001',
    customerId: 100,
    createDate: new Date('2024-01-01'),
    updateDate: new Date('2024-01-01'),
  },
]);
```

### 엣지 케이스

```typescript
// 빈 데이터
db.mockSelect('SelectList', []);

// 경계값
db.mockSelect('SelectList', [
  { id: 1, value: 0 },           // 최소값
  { id: 2, value: 2147483647 },  // INT 최대값
]);

// null 값
db.mockSelectOne('SelectDetail', {
  id: 1,
  name: 'Test',
  description: null,  // nullable 필드
});
```

## 테스트 커버리지 목표

- **정상 케이스**: 각 함수당 최소 1개
- **예외 케이스**: 필수 파라미터 검증 최소 1개
- **엣지 케이스**: 빈 데이터 케이스 최소 1개

총 테스트 개수 = 함수 개수 x 3 (최소)
