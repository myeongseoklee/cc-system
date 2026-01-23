# v1 안티패턴 가이드

## 패턴 A: req/res 직접 접근

**문제점:** API 계층 강결합

**감지 방법:**
```typescript
// Grep 패턴
pattern: "req\\.(query|body|params)"
pattern: "res\\.(json|send|status)"
```

**예시:**
```typescript
// v1 (안티패턴)
export const getList = async (req, res) => {
  const customerId = req.query.customerId;
  const result = await db.query(...);
  res.json(result);
};

// v2 (개선)
export const SelectList = class {
  async exec(dto: SelectListDto) {
    return await repository.findByCustomerId(dto.customerId);
  }
};
```

---

## 패턴 B: 메모리 필터링 (성능 문제) ⭐ 빈번

**문제점:** DB에서 전체 데이터 조회 후 JavaScript로 필터링

**감지 방법:**
```typescript
// Grep 패턴
pattern: "findAll.*\\.filter\\("
pattern: "findAll.*\n.*\\.filter\\("  // 여러 줄

// 컨텍스트 확인: DB 조회 후 메모리 필터링인지 체크
```

**실제 예제 (심각한 성능 문제):**
```typescript
// v1 (안티패턴 - 전형적인 메모리 필터링)
const selectAllProductsBy = async ({
  category, customerId, minPrice, isActive, productName, productId,
}) => {
  let products = await repository.findAll();
  if (customerId) {
    products = products.filter((p) => p.customerId === customerId);
  }
  if (category) {
    products = products.filter((p) => p.category === category);
  }
  if (minPrice) {
    products = products.filter((p) => p.price >= minPrice);
  }
  if (isActive) {
    products = products.filter((p) => p.isActive);
  }
  if (productName) {
    products = products.filter((p) =>
      p.productName.includes(productName),
    );
  }
  return products;
};

// v2 (개선 - Query Builder로 필터링)
// Repository
async findWithFilters({
  customerId,
  category,
  minPrice,
  isActive,
  offset,
  limit,
}: FilterParams): Promise<Product[]> {
  const qb = this.repository.createQueryBuilder('product');

  if (customerId) {
    qb.andWhere('product.customerId = :customerId', { customerId });
  }
  if (category) {
    qb.andWhere('product.category = :category', { category });
  }
  if (minPrice) {
    qb.andWhere('product.price >= :minPrice', { minPrice });
  }
  if (isActive !== undefined) {
    qb.andWhere('product.isActive = :isActive', { isActive });
  }

  return qb.skip(offset).take(limit).getMany();
}
```

**핵심:** v1의 filter 연쇄 → v2의 Query Builder 조건으로 전환!

---

## 패턴 C: DB 직접 쿼리

**문제점:** Repository 패턴 없음

**감지 방법:**
```typescript
// Grep 패턴
pattern: "db\\."
pattern: "await.*\\.query\\("
pattern: "execute\\("
```

**예시:**
```typescript
// v1 (안티패턴)
const result = await db.query('SELECT * FROM products WHERE ...');

// v2 (개선)
const result = await repository.findByCustomerId(customerId);
```

---

## 패턴 D: 수동 트랜잭션

**문제점:** 반복되는 boilerplate 코드

**감지 방법:**
```typescript
// Grep 패턴
pattern: "getConnection\\(\\)"
pattern: "START TRANSACTION"
pattern: "COMMIT"
pattern: "ROLLBACK"
```

**예시:**
```typescript
// v1 (안티패턴 - boilerplate)
const connection = await db.getConnection();
try {
  await connection.query('START TRANSACTION');
  await method1(connection);
  await method2(connection);
  await connection.query('COMMIT');
} catch (e) {
  await connection.query('ROLLBACK');
  throw e;
}

// v2 (개선 - TypeORM Transaction)
await dataSource.transaction(async (manager) => {
  await manager.save(entity1);
  await manager.save(entity2);
});
```

---

## 패턴 E: Repository 내부 비즈니스 로직 ⭐ CRITICAL

**문제점:** Repository에 비즈니스 로직이 혼재 (v2에서는 금지)

**감지 방법:**
```typescript
// 하나의 함수에서 여러 DB 호출 + 조건문
// 예시:
// 1. Select 후 결과 확인 → throw Error (중복 체크)
// 2. Select 후 if문으로 분기 → Insert/Update (존재 확인)
// 3. 여러 repository 호출이 순차적으로 호출 (단순 트랜잭션 아님)

// Grep 패턴 (함수 내부에서)
pattern: "if.*find.*throw"
pattern: "repository.*repository" (같은 함수 내 2회 이상)

// 검출 조건:
// - 함수가 여러 repository 메서드를 호출하면서
// - 중간에 if문으로 검증/분기 로직이 있으면
// → Repository 내부 비즈니스 로직 (안티패턴)
```

**예시:**
```typescript
// v1 (안티패턴 - Repository 내부 비즈니스 로직)
export const insertProduct = async (product: Product) => {
  // 1. 중복 체크 (비즈니스 로직!)
  const existing = await repository.findByName(product.name);
  if (existing) {
    throw new Error('이미 존재하는 상품');
  }

  // 2. 삽입
  return await repository.save(product);
};

// v2 (개선 - UseCase로 분리)
// Repository (조회/저장만)
export class ProductRepository {
  async findByName(name: string): Promise<Product | null> {
    return this.repository.findOne({ where: { name } });
  }
  async save(product: Product): Promise<Product> {
    return this.repository.save(product);
  }
}

// UseCase (비즈니스 로직)
export class CreateProductUseCase {
  async exec({ product }: { product: CreateProductDto }) {
    // 1. 중복 체크 (UseCase의 private 메서드로)
    await this.checkDuplicate(product.name);

    // 2. 삽입
    return await this.repository.save(product);
  }

  private async checkDuplicate(name: string) {
    const existing = await this.repository.findByName(name);
    if (existing) {
      throw new ProductAlreadyExistsException(name);
    }
  }
}
```

**중요:** Repository 내부 비즈니스 로직은 v2에서 **UseCase로 이동**해야 합니다!
- Repository는 순수하게 조회/저장만 (비즈니스 로직 금지)
- 검증/중복 체크/상태 확인 → UseCase의 private 메서드로 구현

---

## 패턴 F: Mapper 사용 (데이터 변환 분리)

**특징:** 데이터 변환을 별도 mapper 파일로 분리 (안티패턴 아님, 패턴 인식용)

**감지 방법:**
```typescript
// Grep 패턴
pattern: "import.*mapper"
pattern: "mapper\\."
```

**실제 예제:**
```typescript
// v1 (mapper 패턴)
import mapper from '../mapper';

const selectPurchaseList = async (customerId, offset, pageSize) => {
  return mapper.purchaseListMapper(
    await repository.findByCustomerId(
      customerId,
      offset,
      pageSize,
    ),
  );
};

// v2 (UseCase private 메서드로 변환)
export class SelectPurchaseListUseCase {
  async exec(customerId: string, offset: number, pageSize: number) {
    const rawData = await this.repository.findByCustomerId(
      customerId,
      offset,
      pageSize,
    );
    return this.transformData(rawData);
  }

  private transformData(data: RawData[]): PurchaseItem[] {
    return data.map((item) => ({
      ...item,
      purchaseDate: new Date(item.purchaseDate),
    }));
  }
}
```

**v2 전환:** mapper 로직 → UseCase의 private 메서드로 이동

---

## 복잡도 판단

복잡도 평가 상세: [complexity-guide.md](complexity-guide.md)
