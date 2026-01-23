// ========================================
// 패턴 1: GET with AuthInterceptor (가장 일반적)
// ========================================
import { APIHandler } from '@modules/api';
import { AuthInterceptor } from '@modules/auth/server';
import { ADMIN_AUTHORITIES, ADMIN_ROLE_TYPE } from '@modules/const';
import {{domainName}} from '@modules/domain_v2/{{domainName}}';
import { {{DtoName}} } from '@modules/domain_v2/{{domainName}}/dto';

export default APIHandler({
  get: AuthInterceptor(
    [ADMIN_ROLE_TYPE.MASTER, ADMIN_ROLE_TYPE.CHANNEL],
    [ADMIN_AUTHORITIES.{{DOMAIN}}.ALL],
    async (req, res) => {
      const dto = {{DtoName}}.parse({
        ...req.query,
        categoryId: req.local.admin.categoryId,
        role: req.local.admin.role,
      });
      res.status(200).json(await {{domainName}}.service.{{serviceName}}(dto));
    },
  ),
});

// ========================================
// 패턴 2: POST with try-catch (에러 처리)
// ========================================
export default APIHandler({
  post: AuthInterceptor(
    [ADMIN_ROLE_TYPE.MASTER],
    [ADMIN_AUTHORITIES.{{DOMAIN}}.CREATE],
    async (req, res) => {
      try {
        const dto = {{DtoName}}.parse(req.body);
        res.status(200).json(await {{domainName}}.service.{{serviceName}}(dto));
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    },
  ),
});

// ========================================
// 패턴 3: Multiple Methods (GET + POST)
// ========================================
export default APIHandler({
  get: AuthInterceptor(
    [ADMIN_ROLE_TYPE.MASTER],
    [ADMIN_AUTHORITIES.{{DOMAIN}}.ALL],
    async (req, res) => {
      const dto = {{GetDtoName}}.parse(req.query);
      res.status(200).json(await {{domainName}}.service.{{getServiceName}}(dto));
    },
  ),
  post: AuthInterceptor(
    [ADMIN_ROLE_TYPE.MASTER],
    [ADMIN_AUTHORITIES.{{DOMAIN}}.CREATE],
    async (req, res) => {
      const dto = {{PostDtoName}}.parse(req.body);
      res.status(200).json(await {{domainName}}.service.{{postServiceName}}(dto));
    },
  ),
});

// ========================================
// 패턴 4: Factory Pattern (CP role에 따라 다른 service)
// ========================================
import { statistics } from '@modules/domain_v2';

export default APIHandler({
  get: AuthInterceptor(
    [ADMIN_ROLE_TYPE.MASTER, ADMIN_ROLE_TYPE.CP],
    [ADMIN_AUTHORITIES.STATISTICS.PRODUCT],
    async (req, res) => {
      const query = {{DtoName}}.parse({
        ...req.query,
        role: req.local.admin.role,
        refId: req.local.admin.payload.refId,
        adminId: req.local.admin.payload.accountId,
      });
      res.status(200).json(await statistics.factory.{{serviceName}}(query));
    },
  ),
});
