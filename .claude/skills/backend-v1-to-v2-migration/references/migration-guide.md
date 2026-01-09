# v1 → v2 마이그레이션 가이드

## 전체 흐름

```
v1 분석 → v2 설계 → 테스트 작성 → 마이그레이션 → 검증
```

## 1단계: v1 분석

### 현재 동작 이해
```typescript
// v1 코드 분석
export const getEntityList = async (req, res) => {
  // 비즈니스 로직과 DB 로직이 혼재
  const query = `SELECT * FROM Entity WHERE appSN = ?`;
  const results = await db.query(query, [req.query.appSN]);

  // 데이터 변환
  const transformed = results.map(r => ({
    id: r.seq,
    name: r.name,
    createdAt: new Date(r.created_at)
  }));

  res.json(transformed);
};
```

### 의존성 파악
- DB 직접 쿼리
- req/res 직접 접근
- 에러 처리 없음

### 비즈니스 로직 추출
- Entity 목록 조회
- 데이터 변환 (seq → id, created_at → createdAt)

## 2단계: v2 설계

### UseCase 설계
```typescript
export class SelectEntityListUseCase {
  constructor(private repository: EntityRepository) {}

  async exec(query: { appSN: number }): Promise<Entity[]> {
    const raw = await this.repository.selectList(query.appSN);
    return this.transform(raw);
  }

  private transform(data: RawData[]): Entity[] {
    return data.map(r => ({
      id: r.seq,
      name: r.name,
      createdAt: new Date(r.created_at)
    }));
  }
}
```

### Repository 인터페이스
```typescript
const entityRepository = {
  selectList: async (appSN: number) => {
    return (await database.tc.executeQuery('Webtoon.admin_SelectEntityList', [appSN], false)).rows;
  }
};
```

### DTO 정의
```typescript
export const SelectEntityListDto = z.object({
  appSN: z.number().min(1),
});
export type SelectEntityListDto = z.infer<typeof SelectEntityListDto>;
```

## 3단계: 테스트 작성

```typescript
describe('SelectEntityListUseCase', () => {
  let usecase: SelectEntityListUseCase;
  let mockRepo: jest.Mocked<EntityRepository>;

  beforeEach(() => {
    mockRepo = { selectList: jest.fn() };
    usecase = new SelectEntityListUseCase(mockRepo);
  });

  test('seq → id 변환', async () => {
    // Arrange
    mockRepo.selectList.mockResolvedValue([
      { seq: 1, name: 'test', created_at: '2024-01-01' }
    ]);

    // Act
    const result = await usecase.exec({ appSN: 100 });

    // Assert
    expect(result[0].id).toBe(1); // seq → id
    expect(result[0].createdAt).toBeInstanceOf(Date);
  });
});
```

## 4단계: 마이그레이션

### v2 구현
```typescript
// Service
export const entityService = {
  getList: async (dto: SelectEntityListDto) => {
    const usecase = new SelectEntityListUseCase(entityRepository);
    return await usecase.exec(dto);
  }
};

// API Route
export default withApiHandler(async (req, res) => {
  const dto = SelectEntityListDto.parse(req.query);
  const data = await entityService.getList(dto);
  res.status(200).json(data);
});
```

### v1 → v2 호출로 전환
```typescript
// v1 API (deprecated)
export const getEntityList = async (req, res) => {
  // v2로 위임
  const dto = { appSN: Number(req.query.appSN) };
  const result = await entityService.getList(dto);
  res.json(result);
};
```

### 병렬 실행 (Optional)
```typescript
// 두 버전을 동시에 실행하여 결과 비교
const [v1Result, v2Result] = await Promise.all([
  getEntityListV1(params),
  entityService.getList(params)
]);

if (!isEqual(v1Result, v2Result)) {
  logger.warn('Migration inconsistency', { v1Result, v2Result });
}

return v2Result; // v2 결과 사용
```

## 5단계: 검증

### 기존 테스트 통과
```bash
npx jest src/pages/api/entity --coverage
```

### v2 테스트 추가
```bash
npx jest src/modules/domain_v2/entity/usecase --coverage
```

### v1 제거
```typescript
// v1 코드 삭제 (v2가 안정적으로 동작 확인 후)
// export const getEntityList = ...
```

## 체크리스트

### 분석 단계
- [ ] v1 현재 동작 이해
- [ ] 의존성 파악 (DB, 외부 API)
- [ ] 비즈니스 로직 식별

### 설계 단계
- [ ] UseCase 설계 (비즈니스 로직)
- [ ] Repository 인터페이스 (DB 추상화)
- [ ] DTO 정의 (입출력 타입)

### 구현 단계
- [ ] v2 구현 (TDD)
- [ ] v1 → v2 위임
- [ ] 병렬 실행 (Optional)

### 검증 단계
- [ ] 기존 테스트 통과
- [ ] v2 테스트 추가
- [ ] v1 제거
