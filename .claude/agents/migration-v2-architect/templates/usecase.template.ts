import { tc } from '../repository';

export class {{UseCaseName}} {
  async exec({
    {{params}},
    connection,
  }: {
    {{paramTypes}};
    connection?: Base.MySQL.Connection;
  }): Promise<{{returnType}}> {
    // 1. 검증
    {{#if_validation}}
    this.validate({{validationParams}});
    {{/if_validation}}

    // 2. 데이터 조회/처리
    const result = await tc.{{repositoryName}}.{{method}}({
      {{repositoryParams}}
    }, connection);

    // 3. 비즈니스 로직
    {{#if_businessLogic}}
    return this.{{privateMethod}}(result);
    {{else}}
    return result;
    {{/if_businessLogic}}
  }

  {{#if_validation}}
  private validate({{validationParams}}) {
    // 검증 로직
    {{validationLogic}}
  }
  {{/if_validation}}

  {{#if_businessLogic}}
  private {{privateMethod}}(data: {{dataType}}) {
    // 비즈니스 로직
    {{businessLogic}}
  }
  {{/if_businessLogic}}
}
