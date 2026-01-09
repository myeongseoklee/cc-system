# v2 아키텍처 원칙

## 계층별 책임

```
API Route → DTO.parse() → Service → UseCase → Repository → SP
```

### 1. DTO (Data Transfer Object)
- **Zod 스키마** 기반 런타임 검증
- 입력 타입 안전성 보장
- 파라미터 변환 (문자열 → 숫자 등)

```typescript
export const SelectListDto = z.object({
  cpSN: z.coerce.number().positive(),
  searchText: z.string().max(256).optional(),
});
```

### 2. UseCase
- **클래스 기반** 설계
- **단일 책임 원칙**: 1 UseCase = 1 비즈니스 기능
- **Public**: `exec()` 메서드만 외부 노출
- **Private**: 내부 로직은 private 메서드로 분리
- 비즈니스 로직의 핵심 (데이터 변환, 검증, 필터링, 집계)

```typescript
export class SelectList {
  async exec({ cpSN, connection }) {
    // 1. 검증
    this.validate(cpSN);
    // 2. 데이터 조회
    const data = await repository.selectList({ cpSN }, connection);
    // 3. 변환
    return this.transform(data);
  }

  private validate(cpSN: number) { /* ... */ }
  private transform(data: any) { /* ... */ }
}
```

### 3. Repository
- **SP 호출만** 담당 (비즈니스 로직 금지!)
- 인터페이스 명확성: `selectList`, `insert`, `update`, `delete`
- 파라미터 타입 명시
- **Object literal export**

```typescript
export default {
  selectList: async ({ cpSN, pageSize, offset, master = false }) => {
    const result = await database.tc.executeQuery('SP명', [cpSN, pageSize, offset], master);
    return result.rows;
  },
};
```

### 4. Service
- **UseCase 조합** (여러 UseCase를 순차 실행)
- 트랜잭션 관리
- Policy 적용 (CP 가시성 제어)
- 캐시 적용

```typescript
// 단순
export const selectList = async (dto) => await usecase.selectList.exec(dto);

// 트랜잭션
export const bulkInsert = async (dto) => {
  const { connection, commitTransaction, rollbackTransaction, endConnection } =
    await DB_TC.startTransaction(getUuid(), 'BulkInsert');
  try {
    await usecase.insert1.exec(dto, connection);
    await usecase.insert2.exec(dto, connection);
    await commitTransaction();
  } catch (e) {
    await rollbackTransaction();
    throw e;
  } finally {
    await endConnection();
  }
};
```

## 설계 우선순위

1. **단순성**: 과도한 추상화 금지
2. **명확성**: 계층별 책임 명확히 분리
3. **재사용성**: UseCase는 독립적으로 테스트 가능
4. **일관성**: 기존 v2 패턴 따르기
