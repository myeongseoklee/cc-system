---
name: backend-v1-to-v2-migration
description: v1 → v2 마이그레이션. 11개 전문 에이전트로 레거시를 v2 클린 아키텍처로 자동 전환. AST 기반 의존성 분석 포함.
---

# Backend v1 → v2 마이그레이션

v1 레거시 코드를 v2 클린 아키텍처로 자동 마이그레이션합니다. 11개 전문 에이전트가 분석부터 정리까지 전 과정을 처리합니다.

## 마이그레이션 파이프라인 (완전판) ⭐

```
v1-analyzer (AST 참조 분석 포함)
     ↓
v1-api-integration-test-writer (API 엔드포인트)
     ↓
v1-dependency-integration-test-writer (Service→Service, Internal, @databases) ⭐ NEW
     ↓
v1 테스트 실행 ✅ (25-35개 전체 테스트)
     ↓
v2-architect → test-writer → migration-executor
     ↓             ↓                ↓
architecture    tests       implementation
     ↓             ↓                ↓
v2-api-integration-test-writer → v2 테스트 실행 ✅
              ↓
migration-validator → api-connector → frontend-api-updater → v1-code-cleaner
         ↓                 ↓                  ↓                    ↓
    validation      API 연결          FE 업데이트           v1 정리
```

**핵심 변경사항:**
- **v1-analyzer (강화)**: AST 기반 참조 분석 (references, callGraph, databaseDependencies) ⭐
- **v1-api-integration-test-writer**: v1 API 통합 테스트 작성 (2-10개)
- **v1-dependency-integration-test-writer (신규)**: v1 의존성 통합 테스트 작성 (15-25개) ⭐
- **v2-api-integration-test-writer**: v2 API 통합 테스트 작성 → v1/v2 비교
- **migration-validator (강화)**: v1/v2 통합 테스트 결과 비교, 100% 기능 동등성 검증

**테스트 커버리지:**
- Before: API 테스트만 (2-10개)
- After: API + 의존성 테스트 (25-35개) ⭐

## 11개 전문 에이전트

### 1. v1-analyzer
**역할**: v1 레거시 코드 정적 분석
- req/res 패턴, 메모리 필터링, 안티패턴 검출
- 비즈니스 로직 추출 (repository 내부 로직 포함)
- 복잡도 추정

**실행**:
```bash
Task(subagent_type="migration-v1-analyzer", prompt="domainName: content")
```

**출력**: `/tmp/migration/{domain}/v1-analysis.json`

---

### 2. v1-api-integration-test-writer (신규) ⭐
**역할**: v1 API 통합 테스트 작성
- **기존 프로젝트 패턴 100% 준수** (createAuthedRequest, mockDatabase)
- v1 현재 동작을 baseline으로 기록
- 모든 테스트 통과 확인 후 다음 단계 진행

**실행**:
```bash
Task(subagent_type="migration-v1-api-integration-test-writer", prompt="analysisFile: /tmp/migration/tag/v1-analysis.json, domainName: tag")
```

**출력**:
- `src/pages/api/{domain}/__tests__/index.api.test.ts`
- `/tmp/migration/{domain}/v1-api-test-report.json`

**중요**: 이 단계에서 v1 통합 테스트를 실행하고 모두 통과해야 다음 단계로 진행!

```bash
npm test -- src/pages/api/tag/__tests__/index.api.test.ts
✅ 모든 테스트 통과 확인
```

---

### 2.5. v1-dependency-integration-test-writer (신규) ⭐
**역할**: v1 함수의 **모든 의존처** 통합 테스트 작성
- **Service→Service 호출 테스트** (5-10개)
- **Internal 함수 체인 테스트** (5-10개)
- **@databases 함수 사용 테스트** (2-5개)
- **Database Isolation Principle 준수** ⭐

**실행**:
```bash
Task(subagent_type="migration-v1-dependency-integration-test-writer", prompt="analysisFile: /tmp/migration/tag/v1-analysis.json, domainName: tag")
```

**출력**:
- `src/modules/domain/{domain}/__tests__/service-dependencies.test.ts`
- `src/modules/domain/{domain}/__tests__/internal-functions.test.ts`
- `src/modules/domain/{domain}/__tests__/database-dependencies.test.ts`
- `/tmp/migration/{domain}/v1-dependency-test-report.json`

**중요**: 이 단계에서 의존성 테스트를 실행하고 모두 통과해야 다음 단계로 진행!

```bash
npm test -- src/modules/domain/tag/__tests__/service-dependencies.test.ts
npm test -- src/modules/domain/tag/__tests__/internal-functions.test.ts
npm test -- src/modules/domain/tag/__tests__/database-dependencies.test.ts
✅ 모든 테스트 통과 확인 (15-25개)
```

**테스트 커버리지:**
- API 테스트: 2-10개
- 의존성 테스트: 15-25개
- **Total: 25-35개** (vs 기존 2-10개) ⭐

---

### 3. v2-architect
**역할**: v2 아키텍처 설계
- DTO/UseCase/Repository/Service 명세 작성
- **페이지네이션 공통 유틸리티 사용** (APIPaginationValidationSchema)
- v1 → v2 매핑
- 파일 구조 설계

**실행**:
```bash
Task(subagent_type="migration-v2-architect", prompt="analysisFile: /tmp/migration/content/v1-analysis.json")
```

**출력**: `/tmp/migration/{domain}/v2-architecture.md`

---

### 4. test-writer
**역할**: TDD 단위 테스트 작성 (AAA 패턴, Mock)
- DTO 테스트 (100% 커버리지)
- UseCase 테스트 (90% 커버리지)
- Service 테스트 (80% 커버리지)

**실행**:
```bash
Task(subagent_type="migration-test-writer", prompt="specFile: /tmp/migration/content/v2-architecture.md")
```

**출력**: `/tmp/migration/{domain}/tests/`

---

### 5. migration-executor
**역할**: v2 코드 구현 (TDD Green 단계)
- DTO/UseCase/Repository/Service 실제 코드 작성
- 테스트 통과 확인
- 타입 체크, 린트

**실행**:
```bash
Task(subagent_type="migration-executor", prompt="specFile: /tmp/migration/content/v2-architecture.md, testsDir: /tmp/migration/content/tests")
```

**출력**: `src/modules/domain_v2/{domain}/`

---

### 6. v2-api-integration-test-writer (신규) ⭐
**역할**: v2 API 통합 테스트 작성
- **v1 통합 테스트와 동일한 시나리오** (API 경로만 변경)
- v1/v2 기능 동등성 검증 준비

**실행**:
```bash
Task(subagent_type="migration-v2-integration-test-writer", prompt="v1TestReportFile: /tmp/migration/tag/v1-api-test-report.json, v2ArchitectureFile: /tmp/migration/tag/v2-architecture.md, domainName: tag")
```

**출력**:
- `src/pages/api/{domain}/__tests__/index.v2.api.test.ts`
- `/tmp/migration/{domain}/v2-api-test-report.json`

**중요**: 이 단계에서 v2 통합 테스트를 실행하고 모두 통과해야 검증 단계로 진행!

```bash
npm test -- src/pages/api/tag/__tests__/index.v2.api.test.ts
✅ 모든 테스트 통과 확인
```

---

### 7. migration-validator (강화) ⭐
**역할**: 마이그레이션 검증
- **v1 ↔ v2 통합 테스트 결과 비교** (신규)
- v1 ↔ v2 기능 동등성 확인 (100% 일치)
- 안티패턴 제거 확인
- 성능 비교 (선택)

**검증 전략:**
- **Strategy A**: 단위 테스트만 (기본, 빠름)
- **Strategy B**: 통합 테스트만 (기능 동등성 검증)
- **Strategy C**: 단위 + 통합 테스트 (가장 철저, 권장) ⭐

**실행**:
```bash
Task(subagent_type="migration-validator", prompt="domainName: tag, strategy: unit+integration")
```

**출력**: `/tmp/migration/{domain}/validation-report.json`

**검증 항목:**
- v1/v2 통합 테스트 결과 100% 일치
- 불일치율 0.1% 이하
- 모든 단위 테스트 통과
- 안티패턴 제거 확인

---

### 8. api-connector
**역할**: v2 도메인을 실제 API 라우트에 연결
- v1 API → v2 Service 교체 (Strategy A: replace)
- 새 v2 API 라우트 생성 (Strategy B: new-route)
- 병렬 실행 검증 (Strategy C: parallel)

**실행**:
```bash
Task(subagent_type="migration-api-connector", prompt="domainName: content, strategy: replace")
```

**출력**: `/tmp/migration/{domain}/api-connection-report.json`

---

### 9. frontend-api-updater
**역할**: API 경로 변경 시 프론트엔드 자동 업데이트
- API 호출 경로 검색 (axios, fetch, service)
- 경로 자동 수정
- 테스트 코드 업데이트

**실행** (Strategy B: new-route인 경우만):
```bash
Task(subagent_type="migration-frontend-api-updater", prompt="domainName: content, apiConnectionReport: /tmp/migration/content/api-connection-report.json")
```

**출력**: `/tmp/migration/{domain}/frontend-update-report.json`

---

### 10. v1-code-cleaner
**역할**: v1 레거시 코드 정리
- Deprecated 표시 (Strategy A, 기본)
- 주석 처리 (Strategy B)
- 완전 삭제 (Strategy C)

**실행**:
```bash
Task(subagent_type="migration-v1-code-cleaner", prompt="domainName: content, strategy: deprecated")
```

**출력**: `/tmp/migration/{domain}/v1-cleanup-report.json`

---

## 사용 방법

### 단계별 실행 (권장)

**Step 1: v1 분석**
```
도메인명을 알려주세요. v1 코드를 분석하겠습니다.
예: "tag 도메인을 마이그레이션하고 싶어요"

→ v1-analyzer 에이전트 실행
```

**Step 2: v1 API 통합 테스트 작성**
```
v1 API 통합 테스트를 작성하겠습니다.

→ v1-api-integration-test-writer 에이전트 실행
→ npm test 실행 → API 테스트 통과 확인 ✅ (2-10개)
```

**Step 2.5: v1 의존성 통합 테스트 작성 (신규) ⭐**
```
v1 함수의 모든 의존처 통합 테스트를 작성하겠습니다.

→ v1-dependency-integration-test-writer 에이전트 실행
→ npm test 실행 → 의존성 테스트 통과 확인 ✅ (15-25개)
→ Total: 25-35개 전체 테스트 통과 ⭐
```

**Step 3-8: v2 설계, 구현, 검증**
```
각 단계마다 이전 단계의 출력을 다음 에이전트에 전달하여 자동으로 진행됩니다.
```

**Step 9-11: API 연결, FE 업데이트, v1 정리**
```
최종 단계로 v2를 프로덕션에 적용하고 v1 코드를 정리합니다.
```

### 전체 자동 실행 (고급)

```
"tag 도메인을 v2로 전체 마이그레이션해줘"

→ 11개 에이전트가 순차적으로 자동 실행됩니다.
```

## 마이그레이션 전략

### API 연결 전략 (api-connector)

**Strategy A: replace (기본, 권장)**
- v1 API 라우트 유지, 내부만 v2로 교체
- 프론트엔드 수정 불필요
- 가장 안전

**Strategy B: new-route**
- v2 전용 API 라우트 생성 (`/api/v2/...`)
- v1과 v2 공존
- 프론트엔드 수정 필요 → frontend-api-updater 실행

**Strategy C: parallel**
- v1과 v2 동시 실행 + 결과 비교
- 가장 안전하지만 성능 비용 2배
- 프로덕션 검증용

### 검증 전략 (migration-validator)

**Strategy A: unit-test (기본)**
- 단위 테스트만 실행
- 빠른 피드백
- 계층별 동작 검증

**Strategy B: integration**
- API 통합 테스트만 실행
- v1/v2 기능 동등성 검증
- 엔드투엔드 동작 검증

**Strategy C: unit+integration (권장) ⭐**
- 단위 + 통합 테스트 모두 실행
- 가장 철저한 검증
- v1/v2 100% 기능 동등성 보장

### v1 정리 전략 (v1-code-cleaner)

**Strategy A: deprecated (기본, 권장)**
- `@deprecated` 주석 추가
- 런타임 경고 추가
- 제거 예정일 표시
- 가장 안전 (롤백 불필요)

**Strategy B: comment**
- v1 코드 전체 주석 처리
- 참고용 보존
- 빌드 에러 없음

**Strategy C: delete**
- v1 코드 완전 삭제
- 가장 깔끔
- v2 완전 검증 후에만 사용

## 출력 파일 구조

```
/tmp/migration/{domain}/
├── v1-analysis.json              # v1 분석 결과
├── v1-api-test-report.json       # v1 통합 테스트 리포트 (신규)
├── v2-architecture.md            # v2 아키텍처 명세
├── tests/                        # 단위 테스트 파일
│   ├── dto/*.test.ts
│   ├── usecase/*.test.ts
│   └── service/*.test.ts
├── test-spec-report.json         # 테스트 명세 리포트
├── execution-report.json         # 구현 결과
├── v2-api-test-report.json       # v2 통합 테스트 리포트 (신규)
├── validation-report.json        # 검증 결과
├── api-connection-report.json    # API 연결 결과
├── frontend-update-report.json   # FE 업데이트 결과 (선택)
└── v1-cleanup-report.json        # v1 정리 결과
```

## 예상 소요 시간 (도메인당)

| 복잡도 | 함수 수 | v1 분석 | v1 테스트 | v2 설계 | 단위 테스트 | 구현 | v2 테스트 | 검증 | 총 시간 |
|--------|---------|---------|-----------|---------|-------------|------|-----------|------|---------|
| 단순   | 2-5개   | 5분     | 10분      | 10분    | 15분        | 20분 | 10분      | 15분 | ~1.5시간 |
| 중간   | 6-15개  | 10분    | 20분      | 20분    | 30분        | 1시간 | 20분     | 20분 | ~3시간   |
| 복잡   | 16개+   | 15분    | 30분      | 30분    | 1시간       | 2시간 | 30분     | 30분 | ~5시간   |

*실제 시간은 복잡도, SP 존재 여부, 의존성에 따라 달라질 수 있습니다.*

## 주요 특징

- **완전 자동화**: 11개 에이전트가 전 과정 처리
- **AST 기반 의존성 분석**: 모든 참조 추적 (orphaned refs = 0) ⭐
- **TDD 기반**: 테스트 먼저 작성 (Red) → 구현 (Green)
- **100% 기능 동등성 보장**: v1/v2 통합 테스트 비교 (25-35개) ⭐
- **Database Isolation Principle**: 각 도메인 독립 마이그레이션 ⭐
- **안전한 전환**: 3가지 전략으로 리스크 최소화
- **추적 가능**: 각 단계마다 JSON 리포트 생성
- **품질 보장**: 타입 체크, 린트, 테스트 커버리지 자동 확인
- **기존 프로젝트 패턴 준수**: 팀 컨벤션 유지

## 다음 단계

마이그레이션 완료 후:
1. v1 코드 정리 (deprecated/comment/delete)
2. 다음 도메인 마이그레이션
3. 전체 시스템 통합 테스트

## 문제 해결

상세 가이드: [references/migration-guide.md](references/migration-guide.md)
