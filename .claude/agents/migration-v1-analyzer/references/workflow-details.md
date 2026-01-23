# v1 분석 워크플로우 상세 가이드

## 1단계: v1 파일 탐색

```bash
# 도메인 디렉토리 확인
ls -la {PROJECT_PATH}/src/modules/domain/{domainName}

# 주요 파일 식별
Glob "src/modules/domain/{domainName}/**/*.ts"
```

**확인할 파일:**
- `service/index.ts` - 핵심 비즈니스 로직
- `mapper/*.ts` - 데이터 변환 로직
- `type/*.ts` - 타입 정의
- `repository/*.ts` - DB 접근 (Repository 비즈니스 로직 검출!)

---

## 2단계: 함수 목록 추출

**service/index.ts 파일 읽기:**
- 모든 `export` 함수 식별
- 각 함수의 시그니처 추출
- 파라미터 타입 분석 (req, res, dto 등)

**추출 정보:**
```typescript
{
  name: "selectOrderList",
  signature: "async (req, res) => {...}",
  parameters: [
    { name: "req", type: "Request", source: "api" },
    { name: "res", type: "Response", source: "api" }
  ],
  returnType: "Promise<void>"
}
```

---

## 3단계: 안티패턴 검출

각 함수에서 5가지 안티패턴 검색 (상세는 [anti-patterns.md](anti-patterns.md)):

### A. req/res 직접 접근
```bash
Grep "req\\.(query|body|params)" path:service/
Grep "res\\.(json|send|status)" path:service/
```

### B. 메모리 필터링
```bash
Grep "\\.filter\\(" path:service/
Grep "\\.map\\(" path:service/
Grep "\\.reduce\\(" path:service/
```

### C. DB 직접 쿼리
```bash
Grep "db\\." path:service/
Grep "repository\\." path:service/
```

### D. 수동 트랜잭션
```bash
Grep "getConnection\\(\\)" path:service/
Grep "START TRANSACTION" path:service/
```

### E. Repository 내부 비즈니스 로직 ⭐
```bash
# Repository 파일에서 검출
Grep "if.*\\.rows\\.length.*throw" path:domain/repository/
Grep "if.*\\.rows\\[0\\].*throw" path:domain/repository/

# 하나의 함수에서 여러 DB 호출 + 조건문
# 예: 중복 체크 → throw, 존재 확인 → insert/update
```

**Repository 비즈니스 로직 예시:**
```typescript
// v1 안티패턴
export const insertProduct = async (product: Product) => {
  // 1. 중복 체크 (비즈니스 로직!)
  const existing = await repository.findByName(product.name);
  if (existing) {
    throw new Error('이미 존재하는 상품');
  }

  // 2. 삽입
  return await repository.save(product);
};
```

이런 패턴은 **v2에서 UseCase로 이동**해야 합니다!

---

## 4단계: 비즈니스 로직 추출 {#business-logic-extraction}

각 함수의 로직을 4가지로 분류:

### 1. Validation (검증)
- 파라미터 검증
- 비즈니스 규칙 검증
- 권한 검증

**예시:**
```typescript
if (!customerId) throw new Error('customerId 필수');
if (productName.length > 100) throw new Error('상품명 길이 초과');
```

### 2. Transformation (변환)
- 데이터 형식 변환
- 객체 매핑
- 집계 전처리

**예시:**
```typescript
const transformed = data.map(item => ({
  productId: item.productId,
  productName: item.name,
}));
```

### 3. Filtering (필터링)
- 조건부 데이터 필터링
- 권한별 데이터 가시성 제어

**예시:**
```typescript
const filtered = allProducts.filter(p => p.customerId === customerId);
```

### 4. Aggregation (집계)
- 데이터 통계 계산
- 그룹화

**예시:**
```typescript
const total = data.reduce((sum, item) => sum + item.count, 0);
```

---

## 5단계: 의존성 분석

### DB 의존성
**Repository 메서드 추출:**
```bash
Grep "repository\\.[a-zA-Z]+" output_mode:content
```

**결과:**
```json
{
  "methods": [
    "repository.findByCustomerId",
    "repository.save"
  ],
  "tables": ["orders", "order_items"]
}
```

### 도메인 의존성
```bash
Grep "from.*domain/" path:service/
```

### 외부 의존성
- HTTP 호출 (axios, fetch)
- 외부 라이브러리

---

## 6단계: 복잡도 추정

각 함수별로 다음 요소를 고려:

| 요소 | 가중치 |
|------|--------|
| Repository 호출 개수 | 1-2개: LOW, 3-5개: MEDIUM, 5+: HIGH |
| 트랜잭션 사용 | +MEDIUM |
| 비즈니스 로직 복잡도 | 단순: LOW, 중간: MEDIUM, 복잡: HIGH |
| 외부 의존성 | 있음: +MEDIUM |
| Policy 적용 | 있음: CRITICAL |

**복잡도 기준:**
- **LOW**: 단순 CRUD, 호출 1-2개 → 1-2시간
- **MEDIUM**: 트랜잭션, 비즈니스 로직 중간, 호출 3-5개 → 3-5시간
- **HIGH**: 복잡한 트랜잭션, 외부 의존성, 호출 5개+ → 6-10시간
- **CRITICAL**: Policy 적용, 가시성 제어 → 10+시간

---

## 7단계: JSON 출력

템플릿 형식으로 출력: [../templates/v1-analysis.json.template](../templates/v1-analysis.json.template)

**필수 포함 정보:**
1. 함수별 안티패턴 목록 (type, severity)
2. 비즈니스 로직 명세 (validation, transformation 등)
3. DB 의존성 (Repository 메서드, 테이블)
4. 복잡도 및 예상 시간
5. 마이그레이션 노트

**출력 위치:**
```
/tmp/migration/{domainName}/v1-analysis.json
```

---

## 검증 체크리스트

분석 완료 후 다음을 확인:

- [ ] 모든 export 함수가 분석에 포함됨
- [ ] 각 함수별로 complexity 평가 완료
- [ ] 안티패턴 5가지 모두 검사 완료
- [ ] Repository 내부 비즈니스 로직 검출 (중요!)
- [ ] DB 의존성 식별 (Repository 메서드 목록 완전)
- [ ] 비즈니스 로직 4가지로 분류 완료
- [ ] migrationNotes 작성 완료
- [ ] JSON 파싱 가능 (유효성 확인)
- [ ] 출력 파일 저장 완료
- [ ] summary 섹션 통계 정확

---

## 다음 단계

1. v1-analysis.json 파일 경로를 사용자에게 알림
2. v1-api-integration-test-writer 에이전트로 전달하여 v1 통합 테스트 작성
