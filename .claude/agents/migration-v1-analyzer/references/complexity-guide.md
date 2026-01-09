# 복잡도 추정 가이드

## 복잡도 판단 기준

각 함수별로 다음 요소를 종합 평가하여 복잡도를 결정합니다.

| 요소 | 가중치 |
|------|--------|
| **SP 호출 개수** | 1-2개: LOW, 3-5개: MEDIUM, 5+: HIGH |
| **트랜잭션 사용** | 있으면 +MEDIUM |
| **비즈니스 로직 복잡도** | 단순: LOW, 중간: MEDIUM, 복잡: HIGH |
| **외부 의존성** | HTTP/외부 API 호출: +MEDIUM |
| **Policy 적용** | CP 가시성 제어: CRITICAL |
| **메모리 필터링** | 대량 데이터: +MEDIUM |

---

## 복잡도 분류

### LOW (1-2시간)

**특징:**
- 단순 CRUD 작업
- SP 호출 1-2개
- 비즈니스 로직 거의 없음
- 트랜잭션 불필요
- 외부 의존성 없음

**예시:**
```typescript
// 단순 목록 조회
export const selectTagList = async (req, res) => {
  const cpSN = req.query.cpSN;
  const result = await DB.executeQuery('SelectTagList', [cpSN]);
  res.json(result.rows);
};
```

**v2 변환:**
- DTO 1개
- UseCase 1개 (exec만, private 메서드 없음)
- Repository 메서드 1개
- Service 1개 (UseCase 직접 호출)

---

### MEDIUM (3-5시간)

**특징:**
- 트랜잭션 필요
- SP 호출 3-5개
- 비즈니스 로직 중간 (검증, 변환)
- 일부 메모리 필터링
- 도메인 내부 의존성

**예시:**
```typescript
// 태그 삽입 + 중복 체크
export const insertTag = async (req, res) => {
  const { cpSN, tag } = req.body;

  // 1. 중복 체크
  const existing = await DB.executeQuery('SelectTagByTag', [tag]);
  if (existing.rows.length > 0) {
    throw new Error('중복');
  }

  // 2. 삽입
  const result = await DB.executeQuery('InsertTag', [cpSN, tag]);

  // 3. 관계 테이블 삽입
  await DB.executeQuery('InsertContentTag', [result.rows[0].tagSN, cpSN]);

  res.json({ success: true });
};
```

**v2 변환:**
- DTO 1개
- UseCase 1개 (exec + private 메서드 1-2개)
- Repository 메서드 2-3개
- Service 1개 (트랜잭션 관리)

---

### HIGH (6-10시간)

**특징:**
- 복잡한 트랜잭션 (여러 단계)
- SP 호출 5개 이상
- 복잡한 비즈니스 로직 (다단계 검증, 변환)
- 외부 의존성 (HTTP, 다른 도메인)
- 대량 데이터 메모리 필터링

**예시:**
```typescript
// 컨텐츠 벌크 삽입 + 태그 연결 + 알림
export const bulkInsertContents = async (req, res) => {
  const { cpSN, contents } = req.body;

  const connection = await DB.getConnection();

  try {
    await connection.query('START TRANSACTION');

    // 1. 컨텐츠 검증
    for (const content of contents) {
      const exists = await DB.executeQuery('SelectContentByTitle', [content.title]);
      if (exists.rows.length > 0) {
        throw new Error(`중복: ${content.title}`);
      }
    }

    // 2. 벌크 삽입
    const contentSNs = [];
    for (const content of contents) {
      const result = await DB.executeQuery('InsertContent', [cpSN, content.title, content.description]);
      contentSNs.push(result.rows[0].contentSN);
    }

    // 3. 태그 연결
    for (let i = 0; i < contents.length; i++) {
      for (const tag of contents[i].tags) {
        await DB.executeQuery('InsertContentTag', [contentSNs[i], tag.tagSN]);
      }
    }

    // 4. 외부 알림 전송
    await axios.post('https://notification-api.com/send', {
      message: `${contents.length}개 컨텐츠 추가됨`
    });

    await connection.query('COMMIT');
    res.json({ success: true, contentSNs });
  } catch (e) {
    await connection.query('ROLLBACK');
    throw e;
  }
};
```

**v2 변환:**
- DTO 2개 (요청, 응답)
- UseCase 3-4개 (검증, 삽입, 태그 연결, 알림)
- Repository 메서드 4-5개
- Service 1개 (복잡한 트랜잭션 + UseCase 조합)
- Exception 클래스 2-3개

---

### CRITICAL (10+시간)

**특징:**
- Policy 적용 (CP별 데이터 가시성 제어)
- 복잡한 권한 로직
- 다중 도메인 의존성
- 대용량 데이터 처리
- 캐시 적용
- 외부 API 다수 호출

**예시:**
```typescript
// CP별 정산 데이터 조회 + 가시성 제어
export const selectSettlementList = async (req, res) => {
  const { cpSN, year, month } = req.query;

  // 1. 권한 확인
  const hasPermission = await checkPermission(cpSN, req.user);
  if (!hasPermission) {
    throw new Error('권한 없음');
  }

  // 2. 데이터 조회 (여러 SP)
  const revenues = await DB.executeQuery('SelectRevenue', [cpSN, year, month]);
  const expenses = await DB.executeQuery('SelectExpense', [cpSN, year, month]);
  const adjustments = await DB.executeQuery('SelectAdjustment', [cpSN, year, month]);

  // 3. 집계
  const total = revenues.rows[0].total - expenses.rows[0].total + adjustments.rows[0].total;

  // 4. CP 가시성 Policy 적용 ⭐
  const visibleData = await cpService.applyVisibilityPolicy({
    cpSN,
    data: { revenues, expenses, adjustments, total },
    resourceType: 'settlement',
  });

  // 5. 캐시 저장
  await redisClient.set(`settlement:${cpSN}:${year}:${month}`, JSON.stringify(visibleData), 'EX', 3600);

  res.json(visibleData);
};
```

**v2 변환:**
- DTO 2-3개
- UseCase 5-6개 (권한 확인, 데이터 조회, 집계, Policy 적용, 캐시)
- Repository 메서드 5-6개
- Service 2개 (메인 Service + Policy Service)
- Policy 로직 별도 구현
- Exception 클래스 3-4개

---

## 복잡도 계산 예시

### 예시 1: selectTagList
- SP 호출: 1개 → LOW
- 트랜잭션: 없음 → 0
- 비즈니스 로직: 단순 → LOW
- 외부 의존성: 없음 → 0

**결과:** LOW (1-2시간)

---

### 예시 2: insertTag (중복 체크)
- SP 호출: 2개 → LOW/MEDIUM 경계
- 트랜잭션: 필요 → +MEDIUM
- 비즈니스 로직: 중복 체크 → MEDIUM
- 외부 의존성: 없음 → 0

**결과:** MEDIUM (3-5시간)

---

### 예시 3: bulkInsertContents
- SP 호출: 5개+ → HIGH
- 트랜잭션: 복잡 → +HIGH
- 비즈니스 로직: 다단계 검증 → HIGH
- 외부 의존성: HTTP 알림 → +MEDIUM

**결과:** HIGH (6-10시간)

---

### 예시 4: selectSettlementList (Policy)
- SP 호출: 3개 → MEDIUM
- 트랜잭션: 없음 → 0
- 비즈니스 로직: 집계 + Policy → HIGH
- 외부 의존성: Redis → +MEDIUM
- **Policy 적용:** ⭐ → CRITICAL

**결과:** CRITICAL (10+시간)

---

## 총 예상 시간 계산

도메인 전체 마이그레이션 시간 = Σ(각 함수 예상 시간) + 버퍼 (20%)

**예시:**
- 함수 5개: LOW 2개, MEDIUM 2개, HIGH 1개
- 계산: (1.5 * 2) + (4 * 2) + (8 * 1) = 3 + 8 + 8 = 19시간
- 버퍼: 19 * 1.2 = 22.8시간

**총 예상 시간:** ~23시간
