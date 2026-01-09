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
# 예: tag → src/pages/api/tag/

# 패턴 2: 다른 도메인 하위 리소스
Glob "src/pages/api/**/*{domainName}*.ts"
# 예: tag → src/pages/api/contents/tags/

# 패턴 3: 복수형 변환
Glob "src/pages/api/{domainName}s/**/*.ts"
# 예: account → src/pages/api/accounts/
```

### Strategy 2: Grep 검색

```bash
# 도메인 import 검색
Grep "from '@modules/domain/{domainName}'" path:src/pages/api

# 예: tag 도메인 사용하는 API 찾기
Grep "from '@modules/domain/tag'" path:src/pages/api
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
  res.json(await tag.service.selectTagListBySearchText(dto));
}
// → handler: "tag.service.selectTagListBySearchText"
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
const dto = TagAPIValidation.GET.parse(req.query);
// → validation: "TagAPIValidation.GET"
```

## 출력 형식

```json
{
  "apiEndpoints": [
    {
      "path": "/api/contents/tags",
      "file": "src/pages/api/contents/tags/index.ts",
      "methods": {
        "get": {
          "handler": "tag.service.selectTagListBySearchText",
          "auth": {
            "roles": ["MASTER"],
            "authorities": ["MANAGEMENT.ALL"]
          }
        },
        "post": {
          "handler": "tag.service.insertTag",
          "auth": {
            "roles": ["MASTER"],
            "authorities": ["MANAGEMENT.ALL"]
          }
        }
      },
      "validation": "TagAPIValidation"
    },
    {
      "path": "/api/contents/tags/[tagSN]",
      "file": "src/pages/api/contents/tags/[tagSN]/index.ts",
      "methods": {
        "put": {
          "handler": "tag.service.updateTag"
        },
        "delete": {
          "handler": "tag.service.deleteTag"
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

도메인: tag
검색 위치:
  - src/pages/api/tag/
  - src/pages/api/tags/
  - src/pages/api/**/tag*.ts
  - Grep: "from '@modules/domain/tag'"

가능한 이유:
  1. 내부 유틸리티 도메인 (API 노출 불필요)
  2. 다른 도메인에 병합됨 (예: tag → contents/tags)
  3. Deprecated되어 사용 안 함

조치:
  - 실제 API 경로를 수동으로 확인하거나
  - API가 없으면 마이그레이션 불필요
```

### v1-analysis.json

```json
{
  "domainName": "tag",
  "apiEndpoints": [],  // 빈 배열
  "warnings": [
    "API 엔드포인트를 찾을 수 없습니다. 실제 사용 여부를 확인하세요."
  ]
}
```

## 실제 예제 (tag 도메인)

### 탐색 과정

```bash
# Step 1: 직접 경로 확인
$ ls src/pages/api/tag/
# → 없음

$ ls src/pages/api/tags/
# → 없음

# Step 2: Glob 광범위 검색
$ find src/pages/api -name "*tag*"
src/pages/api/contents/tags/index.ts
src/pages/api/contents/tags/[tagSN]/index.ts
src/pages/api/contents/tags/all/index.ts
src/pages/api/contents/tags/counts/index.ts

# Step 3: Grep 확인
$ grep -r "from '@modules/domain/tag'" src/pages/api/
src/pages/api/contents/tags/index.ts:import tag from '@modules/domain/tag';
src/pages/api/contents/tags/[tagSN]/index.ts:import tag from '@modules/domain/tag';
```

### 발견

- ✅ **API 위치:** `/api/contents/tags/` (contents 하위 리소스)
- ✅ **4개 엔드포인트:**
  - `/api/contents/tags` - GET/POST
  - `/api/contents/tags/[tagSN]` - PUT/DELETE
  - `/api/contents/tags/all` - GET
  - `/api/contents/tags/counts` - GET

### 출력

```json
{
  "domainName": "tag",
  "apiEndpoints": [
    {
      "path": "/api/contents/tags",
      "methods": { "get": {...}, "post": {...} }
    },
    {
      "path": "/api/contents/tags/[tagSN]",
      "methods": { "put": {...}, "delete": {...} }
    },
    {
      "path": "/api/contents/tags/all",
      "methods": { "get": {...} }
    },
    {
      "path": "/api/contents/tags/counts",
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
