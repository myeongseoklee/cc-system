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
  const cpSN = req.query.cpSN;
  const result = await db.query(...);
  res.json(result);
};

// v2 (개선)
export const SelectList = class {
  async exec(dto: SelectListDto) {
    return await repository.selectList(dto);
  }
};
```

---

## 패턴 B: 메모리 필터링 (성능 문제) ⭐ 빈번

**문제점:** DB에서 전체 데이터 조회 후 JavaScript로 필터링

**감지 방법:**
```typescript
// Grep 패턴
pattern: "selectAll.*\\.filter\\("
pattern: "selectAll.*\n.*\\.filter\\("  // 여러 줄

// 컨텍스트 확인: DB 조회 후 메모리 필터링인지 체크
```

**실제 예제 (content 도메인 - 심각한 성능 문제):**
```typescript
// v1 (안티패턴 - 전형적인 메모리 필터링)
const selectAllContentsBy = async ({
  contentType, cpSN, genreSN, minAge, isDisplay, contentTitle, contentSN,
}) => {
  let contents = await DB_TC.content.selectAllContents(contentType);
  if (cpSN) {
    contents = contents.filter((content) => content.cpSN === cpSN);
  }
  if (genreSN) {
    contents = contents.filter((content) => content.genreSN === genreSN);
  }
  if (minAge) {
    contents = contents.filter((content) => content.minAge === minAge);
  }
  if (isDisplay) {
    contents = contents.filter((content) => content.isDisplay);
  }
  if (contentTitle) {
    contents = contents.filter((content) =>
      content.contentTitle.includes(contentTitle),
    );
  }
  if (contentSN) {
    contents = contents.filter((content) => content.contentSN === contentSN);
  }
  return contents;
};

// v2 (개선 - SP 파라미터로 필터링)
// Repository
selectListBySearchText: async (
  cpSN: number,
  genreSN: number,
  minAge: number,
  isDisplay: number,
  offset: number,
  limit: number,
  connection?: Base.MySQL.Connection,
) => {
  return (
    await database.tc.executeQuery(
      'Webtoon.admin_SelectContentListBySearchText',
      [cpSN, genreSN, minAge, isDisplay, offset, limit],
      false,
      connection,
    )
  ).rows;
};
```

**핵심:** v1의 filter 연쇄 → v2의 SP 파라미터로 전환!

---

## 패턴 C: DB 직접 쿼리

**문제점:** Repository 패턴 없음

**감지 방법:**
```typescript
// Grep 패턴
pattern: "DB_TC\\."
pattern: "await.*\\.query\\("
pattern: "execute\\("
```

**예시:**
```typescript
// v1 (안티패턴)
const result = await DB_TC.executeQuery('SELECT * FROM ...');

// v2 (개선)
const result = await repository.selectList(...);
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
const connection = await DB_TC.getConnection();
try {
  await connection.query('START TRANSACTION');
  await method1(connection);
  await method2(connection);
  await connection.query('COMMIT');
} catch (e) {
  await connection.query('ROLLBACK');
  throw e;
}

// v2 (개선 - Service에서 추상화)
const { connection, commitTransaction, rollbackTransaction, endConnection } =
  await DB_TC.startTransaction(getUuid(), 'OperationName');
try {
  await usecase1.exec(params, connection);
  await usecase2.exec(params, connection);
  await commitTransaction();
} catch (e) {
  await rollbackTransaction();
  throw e;
} finally {
  await endConnection();
}
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
// 3. 여러 executeQuery가 순차적으로 호출 (단순 트랜잭션 아님)

// Grep 패턴 (함수 내부에서)
pattern: "if.*\\.rows\\.length.*throw"
pattern: "if.*\\.rows\\[0\\].*throw"
pattern: "executeQuery.*executeQuery" (같은 함수 내 2회 이상)

// 검출 조건:
// - 함수가 여러 SP를 호출하면서
// - 중간에 if문으로 검증/분기 로직이 있으면
// → Repository 내부 비즈니스 로직 (안티패턴)
```

**예시:**
```typescript
// v1 (안티패턴 - Repository 내부 비즈니스 로직)
export const insertTag = async (tag: string) => {
  // 1. 중복 체크 (비즈니스 로직!)
  const existing = await DB.executeQuery('SelectTagByTag', [tag]);
  if (existing.rows.length > 0) {
    throw new Error('이미 존재하는 태그');
  }

  // 2. 삽입
  return await DB.executeQuery('InsertTag', [tag]);
};

// v2 (개선 - UseCase로 분리)
// Repository (SP 호출만)
export default {
  selectByTag: async ({ tag }: { tag: string }) => {
    const result = await database.tc.executeQuery('SelectTagByTag', [tag]);
    return result.rows[0];
  },
  insert: async ({ tag }: { tag: string }) => {
    return await database.tc.executeQuery('InsertTag', [tag]);
  },
};

// UseCase (비즈니스 로직)
export class InsertTag {
  async exec({ tag, connection }: { tag: string; connection?: Connection }) {
    // 1. 중복 체크 (UseCase의 private 메서드로)
    await this.checkDuplicate(tag, connection);

    // 2. 삽입
    return await repository.insert({ tag }, connection);
  }

  private async checkDuplicate(tag: string, connection?: Connection) {
    const existing = await repository.selectByTag({ tag }, connection);
    if (existing) {
      throw new TagAlreadyExistException(tag);
    }
  }
}
```

**중요:** Repository 내부 비즈니스 로직은 v2에서 **UseCase로 이동**해야 합니다!
- Repository는 순수하게 SP 호출만 (비즈니스 로직 금지)
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

**실제 예제 (account 도메인):**
```typescript
// v1 (mapper 패턴)
import mapper from '../mapper';

const selectPurchaseContentList = async (accountSN, offset, pageSize) => {
  return mapper.purchaseContentListMapper(
    await DB_TC.purchaseContents.selectPurchaseContentListByAccountSN(
      accountSN,
      offset,
      pageSize,
    ),
  );
};

// v2 (UseCase private 메서드로 변환)
export class SelectPurchaseContentList {
  async exec(accountSN: number, offset: number, pageSize: number) {
    const rawData = await tc.purchaseContentsRepository.selectList(
      accountSN,
      offset,
      pageSize,
    );
    return this.transformData(rawData);
  }

  private transformData(data: RawData[]): PurchaseContent[] {
    return data.map((item) => ({
      ...item,
      purchaseDate: new Date(item.purchase_date),
    }));
  }
}
```

**v2 전환:** mapper 로직 → UseCase의 private 메서드로 이동

---

## 복잡도 판단

복잡도 평가 상세: [complexity-guide.md](complexity-guide.md)
