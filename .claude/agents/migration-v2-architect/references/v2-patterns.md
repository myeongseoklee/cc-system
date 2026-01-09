# v2 기존 패턴 학습 가이드

## 필수 참고 파일

### 페이지네이션 유틸리티 (필수)
```
src/modules/validationSchema/common/pagination/index.ts
```

**사용법:**
```typescript
import { APIPaginationValidationSchema } from '@modules/validationSchema/common/pagination';

// DTO에 포함
export const SelectListDto = z.object({
  cpSN: z.coerce.number().positive(),
  ...APIPaginationValidationSchema.GET.shape,  // pageNo, pageSize 자동 포함
});

// UseCase에서 offset 계산
const { offset } = APIPaginationValidationSchema.getOffset({ pageNo, pageSize });
```

### DTO 패턴
```
src/modules/domain_v2/curation/dto/select-collection-list.dto.ts
src/modules/domain_v2/content/dto/insert-content.dto.ts
```

### UseCase 패턴
```
src/modules/domain_v2/content/usecase/insert-content.usecase.ts
src/modules/domain_v2/content/usecase/update-content.usecase.ts
```

### Repository 패턴
```
src/modules/domain_v2/content/repository/tc/content.repository.ts
src/modules/domain_v2/settlement/repository/tc/settlement.repository.ts
```

### Service 패턴
```
src/modules/domain_v2/settlement/service/get-monthly-accounting-report-download-url.service.ts
```

### Exception 패턴
```
src/modules/domain_v2/tag/exception/
├── enum.ts
├── tag-not-found.exception.ts
├── tag-already-exist.exception.ts
└── index.ts
```

## 학습 순서

1. **페이지네이션 유틸리티** 읽기 (필수)
2. **DTO** 2-3개 읽고 Zod 스키마 패턴 파악
3. **UseCase** 2-3개 읽고 클래스 구조 파악
4. **Repository** 2-3개 읽고 object literal 패턴 파악
5. **Service** 1-2개 읽고 트랜잭션 패턴 파악
