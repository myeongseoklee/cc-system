# Repository 설계 가이드

## 디렉토리 구조

```
repository/
├── tc/
│   ├── tag.repository.ts          # 메인 테이블
│   ├── content-tag.repository.ts  # 관계 테이블 (별도!)
│   └── index.ts
└── index.ts
```

## 기본 패턴

```typescript
import database from '@databases';

export default {
  selectList: async ({
    cpSN,
    pageSize,
    offset,
    master = false,
  }: {
    cpSN: number;
    pageSize: number;
    offset: number;
    master?: boolean;
  }) => {
    const result = await database.tc.executeQuery(
      'Webtoon.admin_SelectTagList',
      [cpSN, pageSize, offset],
      master,
    );
    return result.rows as Tag[];
  },

  insert: async ({
    cpSN,
    tag,
  }: {
    cpSN: number;
    tag: string;
  }) => {
    const result = await database.tc.executeQuery(
      'Webtoon.admin_InsertTag',
      [cpSN, tag],
      true,  // CUD는 master=true hardcode
    );
    return result.rows[0] as { tagSN: number };
  },
};
```

## master 파라미터 규칙

- **Read**: 파라미터로 `master?: boolean` 받음 (기본 false, slave)
- **CUD**: 파라미터 없이 `true` hardcode

## repository/tc/index.ts

```typescript
import tagRepository from './tag.repository';
import contentTagRepository from './content-tag.repository';

export default {
  tagRepository,
  contentTagRepository,
};
```

## repository/index.ts

```typescript
import tc from './tc';

export { tc };
```
