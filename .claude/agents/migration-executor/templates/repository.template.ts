import database from '@databases';
import _ from 'lodash';

export default {
  // ========================================
  // 패턴 1: 파라미터 직접 나열 (간단한 경우)
  // ========================================
  {{methodName}}: async (
    {{param1}}: {{type1}},
    {{param2}}: {{type2}},
    connection?: Base.MySQL.Connection,
  ) => {
    return (
      await database.tc.executeQuery(
        '{{spName}}',
        [{{param1}}, {{param2}}],
        false,  // false: Read, true: CUD
        connection,
      )
    ).rows as {{ReturnType}}[];
  },

  // ========================================
  // 패턴 2: 조건부 빈 배열 반환 (isEmpty 체크)
  // ========================================
  {{methodName}}: async (
    {{params}}: {{type}}[],
    connection?: Base.MySQL.Connection,
  ) => {
    if (_.isEmpty({{params}})) return [];
    return (
      await database.tc.executeQuery(
        '{{spName}}',
        [{{params}}.join(',')],
        false,
        connection,
      )
    ).rows as {{ReturnType}}[];
  },

  // ========================================
  // 패턴 3: CUD (mutation: true)
  // ========================================
  {{methodName}}: async (
    {{param1}}: {{type1}},
    {{param2}}: {{type2}},
    connection?: Base.MySQL.Connection,
  ) => {
    return (
      await database.tc.executeQuery(
        '{{spName}}',
        [{{param1}}, {{param2}}],
        true,  // true: CUD
        connection,
      )
    ).rows as {{ReturnType}}[];
  },
};
