# API 엔드포인트 탐색 가이드

## 왜 필요한가?

v1 도메인 로직(`src/modules/domain/{domain}`)이 있어도, API 엔드포인트(`src/pages/api/`)가 없으면 **마이그레이션 불가**입니다.
- API가 없으면 통합 테스트 작성 불가
- 프론트엔드가 호출하지 않는 도메인일 수 있음
- 내부 유틸리티일 수 있음

## 탐색 전략

### Strategy 1: Glob 패턴 (권장)

```bash
# 패턴 1: 도메인명과 동일한 경로
Glob "src/pages/api/{domainName}/**/*.ts"
# 예: order → src/pages/api/order/

# 패턴 2: 다른 도메인 하위 리소스
Glob "src/pages/api/**/*{domainName}*.ts"
# 예: order → src/pages/api/products/orders/

# 패턴 3: 복수형 변환
Glob "src/pages/api/{domainName}s/**/*.ts"
# 예: account → src/pages/api/accounts/
```

### Strategy 2: Grep 검색

```bash
# 도메인 import 검색
Grep "from '@modules/domain/{domainName}'" path:src/pages/api

# 예: order 도메인 사용하는 API 찾기
Grep "from '@modules/domain/order'" path:src/pages/api
```

## API 파일 분석

API 파일을 찾으면 다음을 추출:

### 1. HTTP Methods

```typescript
export default APIHandler({
  get: AuthInterceptor(...),   // GET
  post: AuthInterceptor(...),  // POST
  put: AuthInterceptor(...),   // PUT
  delete: AuthInterceptor(...) // DELETE
});
```

### 2. Handler 매핑

```typescript
async (req, res) => {
  res.json(await order.service.selectOrderListBySearchText(dto));
}
// → handler: "order.service.selectOrderListBySearchText"
```

### 3. Auth 설정

```typescript
AuthInterceptor(
  [ADMIN_ROLE_TYPE.MASTER],           // roles
  [ADMIN_AUTHORITIES.MANAGEMENT.ALL], // authorities
  ...
)
```

### 4. Validation Schema

```typescript
const dto = OrderAPIValidation.GET.parse(req.query);
// → validation: "OrderAPIValidation.GET"
```

## 출력 형식

```json
{
  "apiEndpoints": [
    {
      "path": "/api/products/orders",
      "file": "src/pages/api/products/orders/index.ts",
      "methods": {
        "get": {
          "handler": "order.service.selectOrderListBySearchText",
          "auth": {
            "roles": ["MASTER"],
            "authorities": ["MANAGEMENT.ALL"]
          }
        },
        "post": {
          "handler": "order.service.insertOrder",
          "auth": {
            "roles": ["MASTER"],
            "authorities": ["MANAGEMENT.ALL"]
          }
        }
      },
      "validation": "OrderAPIValidation"
    },
    {
      "path": "/api/products/orders/[orderId]",
      "file": "src/pages/api/products/orders/[orderId]/index.ts",
      "methods": {
        "put": {
          "handler": "order.service.updateOrder"
        },
        "delete": {
          "handler": "order.service.deleteOrder"
        }
      }
    }
  ]
}
```

## API가 없는 경우

### 경고 메시지

```
⚠️ WARNING: API 엔드포인트를 찾을 수 없습니다.

도메인: order
검색 위치:
  - src/pages/api/order/
  - src/pages/api/orders/
  - src/pages/api/**/order*.ts
  - Grep: "from '@modules/domain/order'"

가능한 이유:
  1. 내부 유틸리티 도메인 (API 노출 불필요)
  2. 다른 도메인에 병합됨 (예: order → products/orders)
  3. Deprecated되어 사용 안 함

조치:
  - 실제 API 경로를 수동으로 확인하거나
  - API가 없으면 마이그레이션 불필요
```

### v1-analysis.json

```json
{
  "domainName": "order",
  "apiEndpoints": [],  // 빈 배열
  "warnings": [
    "API 엔드포인트를 찾을 수 없습니다. 실제 사용 여부를 확인하세요."
  ]
}
```

## 실제 예제 (order 도메인)

### 탐색 과정

```bash
# Step 1: 직접 경로 확인
$ ls src/pages/api/order/
# → 없음

$ ls src/pages/api/orders/
# → 없음

# Step 2: Glob 광범위 검색
$ find src/pages/api -name "*order*"
src/pages/api/products/orders/index.ts
src/pages/api/products/orders/[orderId]/index.ts
src/pages/api/products/orders/all/index.ts
src/pages/api/products/orders/counts/index.ts

# Step 3: Grep 확인
$ grep -r "from '@modules/domain/order'" src/pages/api/
src/pages/api/products/orders/index.ts:import order from '@modules/domain/order';
src/pages/api/products/orders/[orderId]/index.ts:import order from '@modules/domain/order';
```

### 발견

- **API 위치:** `/api/products/orders/` (products 하위 리소스)
- **4개 엔드포인트:**
  - `/api/products/orders` - GET/POST
  - `/api/products/orders/[orderId]` - PUT/DELETE
  - `/api/products/orders/all` - GET
  - `/api/products/orders/counts` - GET

### 출력

```json
{
  "domainName": "order",
  "apiEndpoints": [
    {
      "path": "/api/products/orders",
      "methods": { "get": {...}, "post": {...} }
    },
    {
      "path": "/api/products/orders/[orderId]",
      "methods": { "put": {...}, "delete": {...} }
    },
    {
      "path": "/api/products/orders/all",
      "methods": { "get": {...} }
    },
    {
      "path": "/api/products/orders/counts",
      "methods": { "get": {...} }
    }
  ]
}
```

## 체크리스트

- [ ] Glob 패턴 3가지 시도 (`{domain}/`, `{domain}s/`, `**/*{domain}*.ts`)
- [ ] Grep 검색 (`from '@modules/domain/{domain}'`)
- [ ] 모든 API 파일 발견
- [ ] 각 API의 HTTP methods 식별
- [ ] Handler 함수 매핑
- [ ] Auth 설정 추출
- [ ] Validation schema 확인
- [ ] API 없으면 경고 메시지
- [ ] `apiEndpoints` 배열 JSON 출력
