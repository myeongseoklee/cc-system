# REST Client E2E Test

## 테스트 파일 위치

```
test/
├─ [domain]/
│  ├─ get.http           # 목록 조회
│  ├─ [id]/get.http      # 단건 조회
│  ├─ post.http          # 생성
│  └─ [id]/put.http      # 수정
```

## REST Client 작성 예시

```http
### 목록 조회 - 정상
GET {{host}}/api/v2/entity/list
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "page": 1,
  "limit": 10
}

### 목록 조회 - 필터 적용
GET {{host}}/api/v2/entity/list
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "page": 1,
  "limit": 10,
  "status": "active"
}

### 단건 조회
GET {{host}}/api/v2/entity/1
Content-Type: application/json
Authorization: Bearer {{token}}

### 생성
POST {{host}}/api/v2/entity
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "name": "테스트",
  "type": "A"
}
```

## 환경 변수 설정

```json
// http-client.env.json
{
  "dev": {
    "host": "http://localhost:3000",
    "token": "your-dev-token"
  },
  "staging": {
    "host": "https://staging-api.example.com",
    "token": "your-staging-token"
  }
}
```

## 실행 방법

1. 개발 서버 실행: `npm run dev`
2. REST Client 파일 열기: `test/[domain]/get.http`
3. 각 요청 실행 및 응답 확인
