import { tc } from '../repository';
import _ from 'lodash';

// ========================================
// 패턴 1: 파라미터 직접 나열 (간단한 경우)
// ========================================
export class {{UseCaseName}} {
  async exec(
    {{param1}}: {{type1}},
    {{param2}}: {{type2}},
    connection?: Base.MySQL.Connection,
  ) {
    return await tc.{{repositoryName}}.{{method}}({{param1}}, {{param2}}, connection);
  }
}

// ========================================
// 패턴 2: 복잡한 로직 + private 메서드
// ========================================
export class {{UseCaseName}} {
  async exec(
    {{param1}}: {{type1}},
    {{param2}}: {{type2}},
    connection?: Base.MySQL.Connection,
  ) {
    const list1 = await this.getList1({{param2}});
    const list2 = await this.getList2({{param1}}, {{param2}}, list1, connection);
    return this.mapper(list2, list1);
  }

  private async getList1({{param}}: {{type}}) {
    return _.chain(
      await tc.{{repository1}}.{{method1}}({{param}})
    ).value();
  }

  private async getList2(
    {{param1}}: {{type1}},
    {{param2}}: {{type2}},
    list1: {{Type1}}[],
    connection?: Base.MySQL.Connection,
  ) {
    const params = {{param2}} ? list1.map((item) => item.{{field}}) : null;
    return await tc.{{repository2}}.{{method2}}(
      {{param1}},
      params,
      connection,
    );
  }

  private mapper(list2: {{Type2}}[], list1: {{Type1}}[]) {
    return list2.map((item) => {
      const matched = list1.find((x) => x.{{field1}} === item.{{field2}});
      return {
        ...item,
        {{newField1}}: matched.{{field3}},
        {{newField2}}: matched.{{field4}},
      };
    });
  }
}

// ========================================
// 패턴 3: APIPaginationValidationSchema.getOffset 활용
// ========================================
export class {{UseCaseName}} {
  async exec({
    {{param1}},
    pageNo,
    pageSize,
    connection,
  }: {
    {{param1}}: {{type1}};
    pageNo: number;
    pageSize: number;
    connection?: Base.MySQL.Connection;
  }) {
    const { offset } = APIPaginationValidationSchema.getOffset({ pageNo, pageSize });
    return await tc.{{repositoryName}}.{{method}}({ {{param1}}, pageSize, offset }, connection);
  }
}
