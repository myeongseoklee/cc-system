# Context Engineering for AI Coding Agents

> 복잡한 프로덕션 코드베이스에서 AI 코딩 에이전트를 효과적으로 활용하기 위한 고급 컨텍스트 엔지니어링 기법

## 📚 문서 구조

### 핵심 가이드

#### 1. Advanced Context Engineering (ACE-FCA)
**빈번한 의도적 압축(Frequent Intentional Compaction)을 통한 AI 코딩**

- 📄 **한글**: [`ace-fca-ko.md`](./ace-fca-ko.md)
- 📄 **English**: [`ace-fca.md`](./ace-fca.md)

**주요 내용:**
- 대규모 코드베이스에서 AI를 작동시키는 방법
- 컨텍스트 관리 전략 (40-60% 활용도 유지)
- 연구 → 계획 → 구현 워크플로우
- 서브 에이전트를 활용한 병렬 처리
- 300k LOC Rust 프로젝트 성공 사례

**핵심 개념:**
```
컨텍스트 창 품질 = (정확성 × 완전성) / 노이즈
```

---

### 워크플로우 프롬프트

#### 2. Create Plan - 구현 계획 작성
**대화형 리서치와 반복을 통한 상세한 구현 계획 수립**

- 📄 **프롬프트 (한글)**: [`create-plan-ko.md`](./create-plan-ko.md)
- 📄 **Prompt (English)**: [`create_plan.md`](./create_plan.md)
- 📋 **예제 (한글)**: [`create-plan-example-ko.md`](./create-plan-example-ko.md)
- 📋 **Example (English)**: [`create-plan-example.md`](./create-plan-example.md)

**5단계 프로세스:**
1. **컨텍스트 수집 및 초기 분석** - 파일 읽기, 에이전트 리서치
2. **리서치 및 발견** - 병렬 하위 작업으로 코드베이스 탐색
3. **계획 구조 개발** - 사용자와 함께 단계별 구조 합의
4. **상세 계획 작성** - 템플릿 기반 실행 계획 문서화
5. **동기화 및 검토** - 피드백 반영 및 반복 개선

**성공 기준 가이드라인:**
- ✅ **자동 검증**: `make test`, `npm run lint` 등 실행 가능한 명령
- 👤 **수동 검증**: UI/UX 확인, 성능 테스트 등 인간이 필요한 검증

---

#### 3. Research Codebase - 코드베이스 리서치
**역사적 컨텍스트와 함께 코드베이스를 있는 그대로 문서화**

- 📄 **프롬프트 (한글)**: [`research-codebase-ko.md`](./research-codebase-ko.md)
- 📄 **Prompt (English)**: [`research-codebase.md`](./research-codebase.md)
- 📋 **예제 (한글)**: [`research-codebase-example-ko.md`](./research-codebase-example-ko.md)
- 📋 **Example (English)**: [`research-codebase-example.md`](./research-codebase-example.md)

**핵심 원칙:**
> 유일한 임무는 **오늘 존재하는 그대로의 코드베이스를 문서화하고 설명**하는 것
> - ❌ 개선사항 제안 금지
> - ❌ 근본 원인 분석 금지 (명시적 요청 시 제외)
> - ✅ 무엇이, 어디에, 어떻게 작동하는지만 설명

**9단계 프로세스:**
1. 직접 언급된 파일 먼저 읽기
2. 리서치 질문 분석 및 분해
3. 병렬 하위 에이전트 작업 생성
4. 발견사항 대기 및 종합
5. 메타데이터 수집
6. 리서치 문서 생성
7. GitHub 퍼머링크 추가
8. 발견사항 동기화 및 제시
9. 후속 질문 처리

---

## 🎯 사용 방법

### 1. 새로운 기능 구현 시
```bash
# 1단계: 코드베이스 리서치
/research_codebase "인증 시스템이 어떻게 작동하나요?"

# 2단계: 구현 계획 작성
/create_plan "OAuth2 로그인 추가"

# 3단계: 계획 승인 후 구현 진행
```

### 2. 버그 수정 시
```bash
# 1단계: 문제 영역 리서치
/research_codebase "결제 API 에러 처리 로직"

# 2단계: 수정 계획 수립
/create_plan "결제 실패 시 재시도 로직 추가"
```

### 3. 리팩토링 시
```bash
# 1단계: 현재 구조 이해
/research_codebase "데이터베이스 접근 패턴"

# 2단계: 리팩토링 계획
/create_plan "Repository 패턴으로 전환"
```

---

## 💡 핵심 원칙

### 컨텍스트 관리
- **40-60% 활용도 유지**: 컨텍스트 창을 너무 채우지 말 것
- **빈번한 압축**: 주요 발견사항을 구조화된 문서로 증류
- **서브 에이전트 활용**: 탐색과 구현을 분리

### 인간 레버리지
```
나쁜 코드 1줄 = 나쁜 코드 1줄
나쁜 계획 1줄 = 수백 줄의 나쁜 코드
나쁜 리서치 1줄 = 수천 줄의 나쁜 코드
```
→ **가장 높은 레버리지 지점(리서치/계획)에 인간의 노력 집중**

### 팀 협업
- **정신적 정렬 유지**: 코드 리뷰가 아닌 계획 리뷰에 집중
- **스펙이 진짜 코드**: 리서치와 계획을 버전 관리에 포함
- **지식 공유**: 문서화된 리서치로 팀 전체가 빠르게 학습

---

## 📊 실제 성과

### BAML 프로젝트 (300k LOC Rust)
- ⏱️ **시간 단축**: 3-5일 작업을 7시간 만에 완료
- ✅ **품질 보증**: 전문가 검토 통과
- 🎯 **복잡도**: 취소 지원, WASM 컴파일 등 고난이도 기능

### 핵심 요소
1. ✅ 브라운필드 코드베이스에서 작동
2. ✅ 복잡한 문제 해결
3. ✅ 조잡한 코드 없음
4. ✅ 정신적 정렬 유지

---

## 🛠️ 추천 도구

### Claude Code
- **서브 에이전트**: 컨텍스트 격리 및 병렬 처리
- **TodoWrite**: 작업 추적 및 진행 상황 관리
- **Task 도구**: 전문화된 에이전트 생성

### Git 워크플로우
```bash
# 계획 단계: main 브랜치에서 작업
git checkout main
# 리서치 및 계획 문서 작성

# 구현 단계: worktree 사용
git worktree add ../feature-branch feature-name
# 실제 코드 구현
```

---

## 📖 추가 자료

### 원문 출처
- [Advanced Context Engineering (YC Talk)](https://hlyr.dev/ace)
- [12 Factor Agents](https://hlyr.dev/12fa)
- [HumanLayer Blog](https://humanlayer.dev)

### 관련 연구
- [Sean Grove - "Specs are the new code"](https://www.youtube.com/watch?v=8rABwKRsec4)
- [Stanford - AI의 개발자 생산성 영향](https://www.youtube.com/watch?v=tbDDYKRFjhk)

---

## 🤝 기여

이 문서는 [dexhorthy](https://github.com/dexhorthy)의 Advanced Context Engineering 방법론을 기반으로 작성되었습니다.

### 라이선스
MIT License

---

## 🚀 시작하기

1. **ACE-FCA 가이드 읽기** - 전체 개념 이해
2. **Research 프롬프트 실습** - 자신의 코드베이스 탐색
3. **Create Plan 프롬프트 실습** - 간단한 기능으로 시작
4. **점진적 확장** - 복잡한 작업으로 발전

**Remember**: 이것은 마법 프롬프트가 아닙니다. 높은 레버리지 지점에 인간의 판단과 검토를 구축하는 것이 핵심입니다. 🎯
