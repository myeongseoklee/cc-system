# API 연결 전략 (실제 프로젝트 기반)

## 실제 프로젝트 패턴

### APIHandler + AuthInterceptor 구조

```typescript
import { APIHandler } from '@modules/api';
import { AuthInterceptor } from '@modules/auth/server';
import { ADMIN_AUTHORITIES, ADMIN_ROLE_TYPE } from '@modules/const';

export default APIHandler({
  get: AuthInterceptor(
    [ADMIN_ROLE_TYPE.MASTER, ADMIN_ROLE_TYPE.CHANNEL],  // 허용 role
    [ADMIN_AUTHORITIES.ACCOUNT.ALL],  // 필요 권한
    async (req, res) => {
      // req.local.admin에 인증 정보 주입됨
      const dto = SelectListDto.parse({
        ...req.query,
        categoryId: req.local.admin.categoryId,  // admin 정보 주입
        role: req.local.admin.role,
      });
      res.status(200).json(await service.selectList(dto));
    },
  ),
});
```

## Strategy A: replace (권장)

**v1 API 파일을 v2로 직접 교체**

### Before (v1):
```typescript
// pages/api/accounts/index.ts
import accountV1 from '@modules/domain/account';

export default async (req, res) => {
  const result = await accountV1.service.getList(req.query);
  res.json(result);
};
```

### After (v2):
```typescript
// pages/api/accounts/index.ts
import { APIHandler } from '@modules/api';
import { AuthInterceptor } from '@modules/auth/server';
import { ADMIN_AUTHORITIES, ADMIN_ROLE_TYPE } from '@modules/const';
import account from '@modules/domain_v2/account';
import { SelectListAccountBySearchTextDto } from '@modules/domain_v2/account/dto';

export default APIHandler({
  get: AuthInterceptor(
    [ADMIN_ROLE_TYPE.MASTER, ADMIN_ROLE_TYPE.CHANNEL],
    [ADMIN_AUTHORITIES.ACCOUNT.ALL],
    async (req, res) => {
      try {
        const dto = SelectListAccountBySearchTextDto.parse({
          ...req.query,
          categoryId: req.local.admin.categoryId,
          role: req.local.admin.role,
        });
        res.status(200).json(await account.service.selectListAccountBySearchText(dto));
      } catch (e) {
        res.json([]);
      }
    },
  ),
});
```

**장점:**
- FE 수정 불필요 (API 경로 동일)
- 가장 안전한 전환

## Strategy B: new-route

**v2 전용 API 라우트 생성 (`/api/v2/...`)**

```typescript
// pages/api/v2/accounts/index.ts (신규)
import { APIHandler } from '@modules/api';
import { AuthInterceptor } from '@modules/auth/server';
import { ADMIN_AUTHORITIES, ADMIN_ROLE_TYPE } from '@modules/const';
import account from '@modules/domain_v2/account';
import { SelectListAccountBySearchTextDto } from '@modules/domain_v2/account/dto';

export default APIHandler({
  get: AuthInterceptor(
    [ADMIN_ROLE_TYPE.MASTER, ADMIN_ROLE_TYPE.CHANNEL],
    [ADMIN_AUTHORITIES.ACCOUNT.ALL],
    async (req, res) => {
      const dto = SelectListAccountBySearchTextDto.parse({
        ...req.query,
        categoryId: req.local.admin.categoryId,
      });
      res.status(200).json(await account.service.selectListAccountBySearchText(dto));
    },
  ),
});
```

**단점:**
- FE 수정 필요 (`/api/accounts` → `/api/v2/accounts`)
- frontend-api-updater 실행 필요

## Strategy C: parallel

**v1/v2 동시 실행 + 결과 비교 (검증용)**

```typescript
// pages/api/accounts/index.ts
import accountV1 from '@modules/domain/account';
import accountV2 from '@modules/domain_v2/account';

export default APIHandler({
  get: AuthInterceptor(
    [ADMIN_ROLE_TYPE.MASTER],
    [ADMIN_AUTHORITIES.ACCOUNT.ALL],
    async (req, res) => {
      const [v1Result, v2Result] = await Promise.all([
        accountV1.service.selectList(req.query),
        accountV2.service.selectListAccountBySearchText({
          ...req.query,
          categoryId: req.local.admin.categoryId,
        }),
      ]);

      if (!isEqual(v1Result, v2Result)) {
        logger.warn('[MIGRATION] v1/v2 불일치', { v1Result, v2Result });
      }

      res.status(200).json(v2Result);  // v2 결과 사용
    },
  ),
});
```

**단점:** 성능 비용 2배 (검증 완료 후 Strategy A로 전환)

## req.local.admin 구조

```typescript
type AdminAuthorizedApiRequest = NextApiRequest & {
  local: {
    admin: {
      payload: Admin.Model.JWTPayload;
      role: typeof ADMIN_ROLE_TYPE[keyof typeof ADMIN_ROLE_TYPE];
      customerId: number;
      categoryId: number;
    };
  };
};
```

**사용 예:**
- `req.local.admin.categoryId` - Channel 관리자의 categoryId
- `req.local.admin.customerId` - CP 관리자의 customerId
- `req.local.admin.role` - MASTER / CHANNEL / CP
- `req.local.admin.payload.refId` - role에 따른 참조 ID
- `req.local.admin.payload.accountId` - admin accountId

## ADMIN_AUTHORITIES 예시

```typescript
ADMIN_AUTHORITIES.ACCOUNT.ALL
ADMIN_AUTHORITIES.STATISTICS.PRODUCT
ADMIN_AUTHORITIES.CP.CREATE
```

## 실전 체크리스트

- [ ] APIHandler 사용
- [ ] AuthInterceptor roles 설정
- [ ] AuthInterceptor authorities 설정
- [ ] DTO에 admin 정보 주입 (categoryId, role, refId 등)
- [ ] res.status(200).json() 사용
- [ ] try-catch 에러 처리 (선택)
