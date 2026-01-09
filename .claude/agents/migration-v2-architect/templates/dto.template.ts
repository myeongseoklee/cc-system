import { z } from 'zod';
{{#if_pagination}}
import { APIPaginationValidationSchema } from '@modules/validationSchema/common/pagination';
{{/if_pagination}}

export const {{DtoName}} = z.object({
  {{#each_field}}
  {{fieldName}}: {{zodValidator}},
  {{/each_field}}
  {{#if_pagination}}
  pageNo: APIPaginationValidationSchema.GET.shape.pageNo,
  pageSize: APIPaginationValidationSchema.GET.shape.pageSize,
  {{/if_pagination}}
});

export type {{DtoName}} = z.infer<typeof {{DtoName}}>;

{{#if_pagination}}
// Offset 계산 헬퍼
export const {{dtoName}}WithOffset = (data: {{DtoName}}) => {
  return APIPaginationValidationSchema.getOffset(data);
};
{{/if_pagination}}
