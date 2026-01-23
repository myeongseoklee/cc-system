# Database Isolation Principle

## 핵심 원칙

**각 도메인은 고립되어 마이그레이션됩니다.**

```
도메인 마이그레이션 시:
✅ 현재 도메인의 Repository 사용처만 테스트
❌ 다른 도메인의 Repository 사용은 무시
✅ v2 마이그레이션 시 각 도메인이 독립적으로 Repository를 구현
```

## 문제 시나리오

### v1 상황: 여러 도메인이 공용 함수 공유

```typescript
// shared/repository/product.repository.ts (공용 인프라)
export const findProductsByCustomerId = async (customerId: string) => {
  return await repository.find({ where: { customerId } });
};
```

**7개 도메인이 사용 중:**
```typescript
// v1: order domain
import { findProductsByCustomerId } from '@shared/repository/product';
export const selectOrdersWithProducts = async (customerId) => {
  const products = await findProductsByCustomerId(customerId); // ← 공용 함수
  const orders = await orderRepository.findByCustomerId(customerId);
  return filterOrdersByProducts(orders, products);
};

// v1: invoice domain
import { findProductsByCustomerId } from '@shared/repository/product';
export const selectInvoicesByCustomer = async (customerId) => {
  const products = await findProductsByCustomerId(customerId); // ← 같은 함수!
  const invoices = await invoiceRepository.findAll();
  return filterInvoicesByProducts(invoices, products);
};

// v1: report, analytics, billing, subscription 도메인도 동일하게 사용
```

### 잘못된 접근: Cross-domain 의존성 생성

```typescript
// ❌ 절대 안 됨!
// v2: order domain 마이그레이션 후
import { ProductRepository } from '@modules/domain_v2/order/repository';

// v2: invoice domain (아직 v1)
const products = await ProductRepository.findByCustomerId(customerId); // ← FORBIDDEN!
```

**문제:**
1. Invoice domain이 Order domain에 의존
2. Clean Architecture 위반 (domain간 직접 의존)
3. Order domain 변경 시 Invoice domain 영향
4. 마이그레이션 순서 강제됨 (Order 먼저 → Invoice 나중)

## 올바른 접근: Progressive Migration with Isolation

### Principle

```
각 도메인 마이그레이션 시:
1. 공용 Repository를 자신의 v2 repository로 복사
2. 다른 도메인은 여전히 v1 공용 Repository 사용
3. 모든 도메인 마이그레이션 완료 후 v1 공용 Repository 제거
```

### 구현 예시

#### Step 1: Order 도메인 마이그레이션

```typescript
// ✅ v2: order domain
// src/modules/domain_v2/order/repository/product.repository.ts
@Injectable()
export class ProductRepository {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly repository: Repository<ProductEntity>,
  ) {}

  async findByCustomerId(customerId: string): Promise<ProductEntity[]> {
    return this.repository.find({ where: { customerId } });
  }
}

// ✅ v2: order service
import { ProductRepository } from './repository/product.repository';
export const selectOrdersWithProducts = async ({ customerId }) => {
  const products = await productRepository.findByCustomerId(customerId); // v2 repository
  const orders = await orderRepository.findByCustomerId(customerId);
  return filterOrdersByProducts(orders, products);
};
```

**다른 도메인들:**
```typescript
// ✅ v1: invoice domain (여전히 v1 공용 Repository 사용)
import { findProductsByCustomerId } from '@shared/repository/product'; // ← v1 유지!
export const selectInvoicesByCustomer = async (customerId) => {
  const products = await findProductsByCustomerId(customerId); // ← v1 repository 함수
  const invoices = await invoiceRepository.findAll();
  return filterInvoicesByProducts(invoices, products);
};
```

#### Step 2: Invoice 도메인 마이그레이션 (나중에)

```typescript
// ✅ v2: invoice domain (독립적으로 구현)
// src/modules/domain_v2/invoice/repository/product.repository.ts
@Injectable()
export class ProductRepository {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly repository: Repository<ProductEntity>,
  ) {}

  async findByCustomerId(customerId: string): Promise<ProductEntity[]> {
    return this.repository.find({ where: { customerId } });
  }
}
```

**코드 중복?**
- ✅ 각 도메인이 독립적
- ✅ 마이그레이션 순서 자유로움
- ✅ Clean Architecture 유지
- ⚠️ 코드 중복 있지만 isolation의 대가

#### Step 3: 모든 도메인 마이그레이션 완료 후

```typescript
// shared/repository/product.repository.ts
/**
 * @deprecated ALL domains migrated to v2! ✅
 * @v1-dependencies: 0 domains remaining
 *
 * Migrated domains (7):
 *   - ✅ order, invoice, report, analytics, billing, subscription, notification
 *
 * @safe-to-remove true
 * @removal-date 2026-02-01
 */
export const findProductsByCustomerId = async (customerId: string) => {
  throw new Error('This v1 function is deprecated. Use domain_v2 repositories.');
};
```

## 테스트 전략

### v1-dependency-integration-test-writer 동작

**Order 도메인 테스트 시:**

```typescript
// ✅ 현재 도메인(order)의 Repository 사용만 테스트
test('order uses shared findProductsByCustomerId', async () => {
  mockProductRepository.findByCustomerId.mockResolvedValue([{ id: 'prod-1' }]);
  await orderService.selectOrdersWithProducts('cust-1');
  expect(mockProductRepository.findByCustomerId).toHaveBeenCalledWith('cust-1');
});

// ❌ 다른 도메인(invoice)의 사용은 테스트 안 함
// invoice domain이 마이그레이션될 때 자체적으로 테스트함
```

### v1-analysis.json 활용

```json
{
  "repositoryDependencies": {
    "functionsUsed": ["findProductsByCustomerId"],
    "crossDomainUsage": {
      "findProductsByCustomerId": {
        "totalReferences": 7,
        "currentDomain": 1,    // ← 현재 domain만 테스트
        "otherDomains": 6,     // ← 무시 (isolation)
        "domainList": ["invoice", "report", "analytics", "billing", "subscription", "notification"]
      }
    }
  }
}
```

**테스트 작성:**
```typescript
// currentDomain: 1 → 1개 테스트 작성
// otherDomains: 6 → 무시 (각 도메인이 마이그레이션될 때 자체 테스트)
```

## 장단점

### 장점 ✅

1. **Domain Isolation 유지**
   - 각 도메인이 독립적
   - Clean Architecture 원칙 준수

2. **마이그레이션 유연성**
   - 도메인 순서 자유로움
   - 병렬 마이그레이션 가능

3. **안전성**
   - 다른 도메인 영향 없음
   - 롤백 쉬움

4. **테스트 명확성**
   - 각 도메인이 자체 테스트
   - 의존성 추적 쉬움

### 단점 ⚠️

1. **코드 중복**
   - 같은 Repository 코드 여러 곳
   - 하지만 isolation의 대가

2. **리팩토링 비용**
   - Entity 변경 시 모든 도메인 업데이트
   - 하지만 v2에서는 Entity 변경 적음

### 결론

**Isolation > DRY**
- Code duplication은 acceptable
- Domain isolation은 essential
- v2 마이그레이션 안전성이 최우선

## 체크리스트

### v1-dependency-integration-test-writer
- [ ] `repositoryDependencies.currentDomain` 참조만 테스트
- [ ] `repositoryDependencies.otherDomains` 무시
- [ ] 현재 도메인의 Repository 사용처 100% 커버

### v2-architect
- [ ] 공용 Repository를 v2 repository로 구현
- [ ] 다른 도메인 v2 repository 참조 금지
- [ ] Isolation principle 준수

### migration-executor
- [ ] Repository에 ORM 로직 구현
- [ ] 다른 도메인 import 없음
- [ ] 독립적 실행 가능

### migration-validator
- [ ] 현재 도메인의 Repository 사용 검증
- [ ] Cross-domain 참조 0개 확인
- [ ] Isolation 유지 확인
