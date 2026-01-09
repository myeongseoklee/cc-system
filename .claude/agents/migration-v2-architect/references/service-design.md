# Service 설계 가이드

## 단순 Service

```typescript
import usecase from '../usecase';
import { SelectListDto } from '../dto/select-list.dto';

export const selectList = async (dto: SelectListDto) => {
  return await usecase.selectList.exec(dto);
};
```

## 트랜잭션 Service

```typescript
import DB_TC from '@DB_TC';
import { getUuid } from '@modules/utils';
import usecase from '../usecase';

export const deleteTag = async (tagSN: number) => {
  const { connection, commitTransaction, rollbackTransaction, endConnection } =
    await DB_TC.startTransaction(getUuid(), 'DeleteTag');

  try {
    // UseCase 1: 사용 중인지 확인
    const inUse = await usecase.checkTagInUse.exec({ tagSN }, connection);
    if (inUse) {
      throw new TagInUseException(tagSN);
    }

    // UseCase 2: 삭제
    await usecase.deleteTag.exec({ tagSN }, connection);

    await commitTransaction();
  } catch (e) {
    await rollbackTransaction();
    throw e;
  } finally {
    await endConnection();
  }
};
```

## 중요: Repository 직접 호출 금지!

```typescript
// ❌ 잘못된 예
import { tc } from '../repository';
export const selectList = async (dto) => {
  return await tc.tagRepository.selectList(dto);  // 금지!
};

// ✅ 올바른 예
import usecase from '../usecase';
export const selectList = async (dto) => {
  return await usecase.selectList.exec(dto);
};
```
