import usecase from '../usecase';
import { {{DtoName}} } from '../dto/{{dtoFile}}';
{{#if_transaction}}
import DB_TC from '@DB_TC';
import { getUuid } from '@modules/utils';
{{/if_transaction}}

{{#if_transaction}}
// 트랜잭션 사용
export const {{serviceName}} = async (dto: {{DtoName}}): Promise<{{returnType}}> => {
  const { connection, commitTransaction, rollbackTransaction, endConnection } =
    await DB_TC.startTransaction(getUuid(), '{{TransactionName}}');

  try {
    {{#each_usecase}}
    const {{resultVar}} = await usecase.{{usecaseName}}.exec({
      {{usecaseParams}},
      connection,
    });
    {{/each_usecase}}

    await commitTransaction();
    return {{finalResult}};
  } catch (e) {
    await rollbackTransaction();
    throw e;
  } finally {
    await endConnection();
  }
};
{{else}}
// 단순 UseCase 호출
export const {{serviceName}} = async (dto: {{DtoName}}): Promise<{{returnType}}> => {
  return await usecase.{{usecaseName}}.exec(dto);
};
{{/if_transaction}}
