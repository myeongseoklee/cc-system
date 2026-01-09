# 구현 가이드

## Exception 구현

**enum.ts 먼저:**
```typescript
export enum TagExceptionEnum {
  TAG_NOT_FOUND = 'TAG_NOT_FOUND',
  TAG_ALREADY_EXIST = 'TAG_ALREADY_EXIST',
}
```

**각 exception 클래스:**
```typescript
import { BaseException } from '@exceptions';
import { TagExceptionEnum } from './enum';

export class TagNotFoundException extends BaseException {
  constructor(tagSN: number) {
    super(TagExceptionEnum.TAG_NOT_FOUND, `Tag ${tagSN} not found`);
  }
}
```

## DTO 구현

테스트에서 요구하는 검증 규칙을 Zod 스키마로 작성

## Repository 구현

**object literal export:**
```typescript
export default {
  selectList: async ({ cpSN, master = false }) => {
    const result = await database.tc.executeQuery('SP명', [cpSN], master);
    return result.rows;
  },
};
```

## UseCase 구현

**클래스 + exec 패턴:**
```typescript
export class SelectList {
  async exec({ cpSN, connection }) {
    return await repository.selectList({ cpSN }, connection);
  }
}
```

**usecase/index.ts:**
```typescript
import { SelectList } from './select-list.usecase';

export default {
  selectList: new SelectList(),
};
```

## Service 구현

**UseCase만 호출:**
```typescript
import usecase from '../usecase';

export const selectList = async (dto) => {
  return await usecase.selectList.exec(dto);
};
```
