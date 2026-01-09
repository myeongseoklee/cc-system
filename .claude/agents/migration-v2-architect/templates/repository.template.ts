import database from '@databases';

export default {
  /**
   * {{methodDescription}}
   */
  {{methodName}}: async ({
    {{params}},
    master = false,
  }: {
    {{paramTypes}};
    master?: boolean;
  }, connection?: Base.MySQL.Connection) => {
    const result = await database.tc.executeQuery(
      '{{spName}}',
      [{{spParams}}],
      master,
      connection,
    );
    {{#if_single}}
    return result.rows[0] as {{returnType}};
    {{else}}
    return result.rows as {{returnType}}[];
    {{/if_single}}
  },
};
