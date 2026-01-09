# CC-System (Claude Code System)

> 프로덕션 환경을 위한 고급 Claude Code 워크플로우 시스템

## 🎯 Overview

CC-System은 복잡한 프로덕션 코드베이스에서 AI 코딩 에이전트를 효과적으로 활용하기 위한 통합 시스템입니다. 11개의 전문 에이전트, 13개의 개발 스킬, 그리고 Advanced Context Engineering 방법론을 제공합니다.

### 핵심 가치
- ✅ **브라운필드 코드베이스 지원**: 대규모 레거시 프로젝트에서도 작동
- ✅ **품질 보증**: 전문가 검토를 통과하는 코드 품질
- ✅ **생산성 향상**: 검증된 워크플로우로 3-5일 작업을 7시간으로 단축
- ✅ **팀 협업**: 정신적 정렬 유지 및 지식 공유

---

## 📁 프로젝트 구조

```
cc-system/
├── .claude/                      # Claude Code 설정
│   ├── agents/                   # 11개 전문 에이전트
│   │   ├── migration-v1-analyzer/
│   │   ├── migration-v2-architect/
│   │   ├── migration-executor/
│   │   └── ...
│   ├── skills/                   # 13개 개발 스킬
│   │   ├── backend-v1-to-v2-migration/
│   │   ├── tdd-new-feature/
│   │   ├── jest-unit-test/
│   │   └── ...
│   └── commands/                 # 4개 커맨드
│       ├── create-pr.md
│       ├── create-prd.md
│       └── ...
├── docs/
│   └── context-enginnering/     # 고급 컨텍스트 엔지니어링 가이드
├── README/                       # 상세 문서
│   ├── AGENTS/
│   ├── DOCS/
│   ├── PROMPTS/
│   └── SKILLS/
└── prompt/                       # 추가 프롬프트
```

---

## 🤖 핵심 컴포넌트

### 1. Migration Agents (11개)

Backend v1 → v2 마이그레이션을 위한 전문 에이전트 파이프라인

```
v1 분석 → v2 설계 → 테스트 작성 → 구현 → 검증 → 정리
```

**주요 에이전트:**
- `migration-v1-analyzer`: v1 코드 정적 분석 및 복잡도 평가
- `migration-v2-architect`: Clean Architecture 기반 v2 설계
- `migration-test-writer`: TDD 기반 테스트 작성
- `migration-executor`: 실제 코드 구현 (DTO/UseCase/Repository/Service)
- `migration-validator`: 기능 동등성 및 품질 검증
- `migration-api-connector`: API 엔드포인트 연결 (3가지 전략)

[자세히 보기 →](./.claude/skills/backend-v1-to-v2-migration/SKILL.md)

---

### 2. Development Skills (13개)

#### 🏗️ Backend Development
- **backend-v1-to-v2-migration**: 11개 에이전트 기반 마이그레이션 워크플로우
- **backend-v2-feature**: domain_v2/ 신규 기능 TDD 개발
- **backend-refactoring**: 동작 변경 없는 구조 개선
- **api-integration-test**: API 통합 테스트 작성

#### 🎨 Frontend Development
- **frontend-feature**: pages/components/hooks 신규 기능 TDD

#### 🧪 Testing
- **tdd-new-feature**: 신규 기능 TDD 개발
- **tdd-legacy-codebase**: 레거시 코드에 테스트 추가
- **jest-unit-test**: Jest 유닛 테스트 작성 (Mock/Fake/Spy)

#### 📋 Planning
- **planning**: 기능 구현 전 작업 계획 수립

#### 🛠️ Meta Skills
- **skill-creator**: 새로운 스킬 생성
- **slash-command-creator**: 슬래시 커맨드 생성
- **subagent-creator**: 커스텀 서브 에이전트 생성
- **hook-creator**: Claude Code 훅 설정

---

### 3. Context Engineering

**Advanced Context Engineering (ACE)** 방법론 - 대규모 코드베이스에서 AI를 효과적으로 활용

#### 핵심 기법: 빈번한 의도적 압축 (FCA)

```
리서치 → 계획 → 구현
   ↓        ↓       ↓
 문서화   문서화   코드
```

**주요 가이드:**
- 📘 **ACE-FCA Guide**: 컨텍스트 관리 전략 및 워크플로우
- 📘 **Create Plan**: 구현 계획 작성 프롬프트 (5단계 프로세스)
- 📘 **Research Codebase**: 코드베이스 리서치 프롬프트 (9단계 프로세스)

[자세히 보기 →](./docs/context-enginnering/README.md)

---

## 🚀 빠른 시작

### 1. 새로운 기능 개발

```bash
# 1단계: 기존 코드 리서치
/research_codebase "인증 시스템 구조"

# 2단계: 구현 계획 수립
/create_plan "OAuth2 로그인 추가"

# 3단계: TDD로 개발
/tdd-new-feature
```

### 2. Backend 마이그레이션

```bash
# v1 API를 v2 Clean Architecture로 전환
/backend-v1-to-v2-migration

# 11개 에이전트가 자동으로 순차 실행:
# 분석 → 설계 → 테스트 → 구현 → 검증 → 정리
```

### 3. 테스트 작성

```bash
# 신규 기능 TDD
/tdd-new-feature

# 레거시 코드에 테스트 추가
/tdd-legacy-codebase

# Jest 유닛 테스트
/jest-unit-test
```

---

## 📊 검증된 성과

### BAML 프로젝트 (300k LOC Rust)
- ⏱️ **개발 시간**: 3-5일 → 7시간 (85% 단축)
- ✅ **코드 품질**: 전문가 검토 통과
- 🎯 **복잡도**: 취소 지원, WASM 컴파일 등 고난이도 기능
- 🔧 **기술 스택**: Rust + TypeScript (처음 접하는 코드베이스)

### 핵심 성공 요인
1. **컨텍스트 관리**: 40-60% 활용도 유지
2. **높은 레버리지**: 리서치/계획에 인간 집중
3. **병렬 처리**: 서브 에이전트 활용
4. **품질 게이트**: 각 단계별 검증

---

## 💡 핵심 원칙

### 컨텍스트 품질 공식
```
컨텍스트 창 품질 = (정확성 × 완전성) / 노이즈
```

### 인간 레버리지 피라미드
```
나쁜 리서치 1줄 → 수천 줄 나쁜 코드
나쁜 계획 1줄   → 수백 줄 나쁜 코드
나쁜 코드 1줄   → 나쁜 코드 1줄
```
→ **가장 높은 레버리지 지점에 인간의 노력 집중**

### 워크플로우 단계
1. **Research**: 코드베이스 이해 (문서화자 역할)
2. **Plan**: 구현 계획 수립 (높은 레버리지)
3. **Implement**: 실제 코드 작성 (계획 기반)

---

## 📚 문서

### 주요 가이드
- [Context Engineering](./docs/context-enginnering/README.md) - ACE-FCA 방법론
- [Migration Workflow](./README/SKILLS/backend-v1-to-v2-migration.md) - 11단계 마이그레이션
- [Skills Index](./README/INDEX.md) - 전체 스킬 목록

### 참고 자료
- [Advanced Context Engineering (YC Talk)](https://hlyr.dev/ace)
- [12 Factor Agents](https://hlyr.dev/12fa)
- [Sean Grove - Specs are the new code](https://www.youtube.com/watch?v=8rABwKRsec4)
- [Stanford - AI 생산성 연구](https://www.youtube.com/watch?v=tbDDYKRFjhk)

---

## 🛠️ 기술 스택

### AI & Agents
- **Claude Code**: 기본 플랫폼
- **Sonnet 4.5**: 주요 모델
- **서브 에이전트**: 컨텍스트 격리 및 병렬 처리

### 개발 방법론
- **TDD**: Test-Driven Development
- **Clean Architecture**: v2 도메인 설계
- **ACE-FCA**: Advanced Context Engineering with Frequent Compaction

---

## 🤝 기여

이 시스템은 다음 방법론을 기반으로 구축되었습니다:
- [dexhorthy](https://github.com/dexhorthy)의 Advanced Context Engineering
- [HumanLayer](https://humanlayer.dev)의 AI 협업 워크플로우
- 실제 프로덕션 프로젝트에서 검증된 패턴

### 라이선스
MIT License

---

## 🎯 다음 단계

1. ✅ [Context Engineering 가이드 읽기](./docs/context-enginnering/README.md)
2. ✅ [Migration Workflow 이해하기](./README/SKILLS/backend-v1-to-v2-migration.md)
3. ✅ 간단한 리서치로 시작하기
4. ✅ TDD 스킬로 첫 기능 개발
5. ✅ 점진적으로 복잡한 작업 확장

---

## 📬 Contact

- **Repository**: [cc-system](https://github.com/myeongseoklee/cc-system)
- **Issues**: 문제 발견 시 이슈 등록
- **Discussions**: 질문 및 아이디어 공유

---

**Remember**: 이것은 마법 프롬프트 컬렉션이 아닙니다. 높은 레버리지 지점(리서치/계획)에 인간의 판단과 검토를 구축하는 **체계적인 엔지니어링 접근법**입니다. 🎯
