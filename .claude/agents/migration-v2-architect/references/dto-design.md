# DTO 설계 가이드 (실제 코드베이스 기반)

## 패턴 1: 단순 DTO

```typescript
export const SelectCustomerInfoDto = z.object({
  customerId: z.number().min(1),
});

export type SelectCustomerInfoDto = z.infer<typeof SelectCustomerInfoDto>;
```

## 패턴 2: Base DTO extend (**가장 중요**)

**실제 account 도메인 예제:**
```typescript
import { APIPaginationValidationSchema } from '@modules/validationSchema/common';
import { z } from 'zod';
import { SelectListAccountBaseDto } from './select-list-account.base-dto';

export const SelectListAccountBySearchTextDto =
  SelectListAccountBaseDto.GET.extend({
    status: z.enum(['active', 'withdraw']).nullable().default('active'),
  })
    .transform((data) => {
      return {
        ...data,
        status: data.status === 'active' ? 1 : -1,
      };
    })
    .transform(APIPaginationValidationSchema.getOffset);
```

## 패턴 3: transform 체이닝

**변환 단계:**
1. `.extend()` - Base DTO에 필드 추가
2. `.transform()` - enum → number 변환
3. `.transform(APIPaginationValidationSchema.getOffset)` - pageNo → offset

**getOffset 변환 결과:**
- `{pageNo: 2, pageSize: 10}` → `{offset: 10, pageSize: 10}`

## 패턴 4: Pagination List DTO

```typescript
export const SelectListDto = z.object({
  customerId: z.number().min(1),
  ...APIPaginationValidationSchema.GET.shape,
}).transform(APIPaginationValidationSchema.getOffset);
```

## 검증 규칙 (실제 사용)

- `z.number()`: 숫자 타입
- `.min(1)`: 최소값
- `.enum([...])`: 허용 값 제한
- `.nullable()`: null 허용
- `.default(V)`: 기본값
- `.optional()`: 선택 필드
