# Repository 패턴

## 기본 구조

```typescript
// repository/tc/entity.repository.ts
const entityRepository = {
  selectList: async (params: Params) => {
    return (await database.tc.executeQuery('Webtoon.admin_SelectEntityList', [...], false)).rows;
  },

  insert: async (params: Params) => {
    return (await database.tc.executeQuery('Webtoon.admin_InsertEntity', [...], true)).rows;
  },

  update: async (params: Params) => {
    return (await database.tc.executeQuery('Webtoon.admin_UpdateEntity', [...], true)).rows;
  }
};

export default entityRepository;
```

## mutation flag

- `false`: SELECT (조회)
- `true`: INSERT/UPDATE/DELETE (변경)

## 원칙

1. **SP 호출만**: 직접 쿼리 작성 금지
2. **변환 금지**: 데이터 가공은 UseCase에서
3. **에러 처리**: executeQuery에서 자동 처리

## 파일 위치

```
repository/
├─ tc/
│  └─ entity.repository.ts
└─ youtube/
   └─ channel.repository.ts
```
