import { z } from 'zod';
import usecase from '../usecase';
import { {{DtoName}} } from '../dto/{{dtoFile}}';

// 단순 Service (destructured parameters 패턴)
export const {{serviceName}} = async ({
  {{params}}
}: z.infer<typeof {{DtoName}}>) => {
  return await usecase.{{usecaseName}}.exec({{paramNames}});
};

// 트랜잭션 Service (destructured parameters 패턴)
import DB_TC from '@DB_TC';
import { getUuid } from '@modules/utils';

export const {{serviceName}} = async ({
  {{params}}
}: z.infer<typeof {{DtoName}}>) => {
  const { connection, commitTransaction, rollbackTransaction, endConnection } =
    await DB_TC.startTransaction(getUuid(), '{{TransactionName}}');

  try {
    const result1 = await usecase.{{usecase1}}.exec({{params}}, connection);
    const result2 = await usecase.{{usecase2}}.exec({{params}}, connection);
    await commitTransaction();
    return result2;
  } catch (e) {
    await rollbackTransaction();
    throw e;
  } finally {
    await endConnection();
  }
};

// Switch 분기 Service 패턴 (조건에 따라 다른 로직 실행)
export const {{serviceName}} = async ({
  {{params}}
}: z.infer<typeof {{DtoName}}>) => {
  switch ({{switchKey}}) {
    case '{{case1}}':
      const result1 = await usecase.{{usecase1}}.exec({{paramNames}});
      return result1;

    case '{{case2}}':
      const result2 = await usecase.{{usecase2}}.exec({{paramNames}});
      return result2;

    default:
      throw new Error(`Invalid {{switchKey}}: ${{{switchKey}}}`);
  }
};
