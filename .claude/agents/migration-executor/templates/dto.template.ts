import { z } from 'zod';
import { APIPaginationValidationSchema } from '@modules/validationSchema/common';

// ========================================
// 패턴 1: 단순 DTO (pagination 없음)
// ========================================
export const {{DtoName}} = z.object({
  {{field1}}: {{zodType1}},
  {{field2}}: {{zodType2}},
});

export type {{DtoName}} = z.infer<typeof {{DtoName}}>;

// ========================================
// 패턴 2: Base DTO extend (재사용성)
// ========================================
import { {{BaseDtoName}} } from './{{baseFile}}';

export const {{DtoName}} = {{BaseDtoName}}.GET.extend({
  {{field}}: {{zodType}},
});

export type {{DtoName}} = z.infer<typeof {{DtoName}}>;

// ========================================
// 패턴 3: transform 체이닝 (데이터 변환)
// ========================================
export const {{DtoName}} = z.object({
  {{field}}: z.enum([{{enumValues}}]).nullable().default('{{defaultValue}}'),
})
  .transform((data) => {
    return {
      ...data,
      {{field}}: data.{{field}} === '{{value1}}' ? {{number1}} : {{number2}},
    };
  })
  .transform(APIPaginationValidationSchema.getOffset);

// ========================================
// 패턴 4: List DTO (pagination 포함)
// ========================================
export const {{DtoName}} = z.object({
  {{filterField}}: {{zodType}},
  ...APIPaginationValidationSchema.GET.shape,
}).transform(APIPaginationValidationSchema.getOffset);

export type {{DtoName}} = z.infer<typeof {{DtoName}}>;
