# Skill Creator

## 개요

**Skill Creator**는 효과적인 Skills를 제작하기 위한 종합 가이드입니다. Skills는 Claude의 기능을 확장하는 모듈식 패키지로, 특정 도메인이나 작업을 위한 전문 지식, 워크플로우, 도구 통합을 제공합니다. 이 Skill은 새로운 Skill을 생성하거나 기존 Skill을 업데이트할 때 사용됩니다.

## 주요 기능

- **Skill 개념 이해**: Skills가 무엇이고 어떻게 동작하는지 설명
- **핵심 설계 원칙**: 간결성, 자유도 조절, 점진적 공개(Progressive Disclosure)
- **디렉토리 구조 가이드**: SKILL.md, scripts/, references/, assets/ 구조 설명
- **생성 프로세스**: 6단계 Skill 생성 워크플로우
- **초기화 및 패키징**: 스크립트를 통한 Skill 생성 및 배포

## 파일 위치

- **원본 파일**: `.claude/skills/skill-creator/SKILL.md`
- **관련 스크립트**:
  - `scripts/init_skill.py` - 새 Skill 초기화
  - `scripts/package_skill.py` - Skill 패키징
  - `scripts/quick_validate.py` - 빠른 검증
- **참조 문서**:
  - `references/workflows.md` - 워크플로우 패턴
  - `references/output-patterns.md` - 출력 형식 패턴

## Skill이란?

Skills는 Claude를 일반 목적 에이전트에서 **특정 도메인에 특화된 전문 에이전트**로 변환하는 "온보딩 가이드"입니다.

### Skills가 제공하는 것

1. **전문화된 워크플로우**: 특정 도메인을 위한 다단계 절차
2. **도구 통합**: 특정 파일 형식이나 API 사용 지침
3. **도메인 전문성**: 회사 고유 지식, 스키마, 비즈니스 로직
4. **번들 리소스**: 복잡하고 반복적인 작업을 위한 스크립트, 참조 자료, 자산

## Skill 디렉토리 구조

```
skill-name/
├── SKILL.md (필수)
│   ├── YAML frontmatter (필수)
│   │   ├── name: (필수)
│   │   └── description: (필수)
│   └── Markdown 본문 (필수)
└── 번들 리소스 (선택)
    ├── scripts/          - 실행 가능 코드 (Python/Bash 등)
    ├── references/       - 필요시 로드되는 문서
    └── assets/           - 출력에 사용되는 파일 (템플릿, 아이콘 등)
```

### SKILL.md (필수)

- **Frontmatter (YAML)**: `name`과 `description` 포함. Claude가 Skill 사용 시점을 결정하는 핵심 정보
- **본문 (Markdown)**: Skill 활성화 후 로드되는 지침 및 가이드

### 번들 리소스 (선택)

| 디렉토리 | 용도 | 예시 |
|---------|------|------|
| `scripts/` | 결정적 신뢰성이 필요한 실행 코드 | `rotate_pdf.py`, `process_data.sh` |
| `references/` | 필요시 컨텍스트에 로드되는 참조 문서 | `finance.md`, `api_docs.md`, `policies.md` |
| `assets/` | 출력에 사용되는 파일 (컨텍스트에 로드 안 됨) | `logo.png`, `template.html`, `font.ttf` |

## 핵심 설계 원칙

### 1. 간결함이 핵심 (Concise is Key)

컨텍스트 윈도우는 공공재입니다. **Claude는 이미 매우 똑똑하다고 가정**하세요.

- Claude가 이미 알지 못하는 정보만 추가
- 각 정보에 질문: "Claude가 정말 이 설명이 필요한가?", "이 문단이 토큰 비용을 정당화하는가?"
- 장황한 설명보다 간결한 예제 선호

### 2. 적절한 자유도 설정

작업의 취약성과 가변성에 맞춰 구체성 수준을 조정:

| 자유도 | 언제 사용 | 형식 |
|--------|---------|------|
| **높음** | 여러 접근 방식이 유효, 맥락에 따른 결정 필요 | 텍스트 기반 지침 |
| **중간** | 선호되는 패턴 존재, 일부 변형 허용 | 의사코드 또는 파라미터가 있는 스크립트 |
| **낮음** | 작업이 취약하고 오류 발생 가능, 일관성 중요 | 특정 스크립트, 적은 파라미터 |

### 3. 점진적 공개 (Progressive Disclosure)

정보를 필요한 시점에만 로드:

| 단계 | 로드 시점 | 권장 크기 | 내용 |
|------|---------|---------|------|
| **메타데이터** | 항상 | ~100 단어 | name + description (Frontmatter) |
| **SKILL.md** | Skill 활성화 시 | <5k 단어 | 핵심 지침 및 워크플로우 |
| **번들 리소스** | 필요할 때 | 무제한 | 상세 문서, 스크립트, 자산 |

**원칙**: SKILL.md는 500줄 이하 유지, 상세 정보는 references/에 분리

## Skill 생성 프로세스

### 1단계: 구체적인 사용 예시로 이해

Skill이 해결할 실제 사용 사례 파악

### 2단계: 재사용 가능한 컨텐츠 계획

필요한 scripts/, references/, assets/ 결정

### 3단계: Skill 초기화

```bash
python .claude/skills/skill-creator/scripts/init_skill.py
```

### 4단계: Skill 편집

SKILL.md 작성 및 번들 리소스 추가

### 5단계: 패키징 (선택)

```bash
python .claude/skills/skill-creator/scripts/package_skill.py
```

.skill 파일 생성으로 공유 가능

### 6단계: 반복 개선

실제 사용 후 피드백 반영

## 사용 방법

### Skill 생성 시작

```bash
# 새 Skill 초기화
python .claude/skills/skill-creator/scripts/init_skill.py

# Skill 이름 입력 (예: my-skill)
# 자동으로 디렉토리 구조 생성
```

### SKILL.md Frontmatter 작성

```yaml
---
name: my-skill
description: 이 Skill이 무엇을 하는지, 언제 사용되는지 명확히 설명
---
```

**중요**: `description`이 Skill 자동 활성화의 핵심입니다.

### 본문 작성

```markdown
# My Skill

이 Skill의 목적과 사용법을 설명합니다.

## 주요 기능

1. 기능 1
2. 기능 2

## 사용 예제

\`\`\`
예제 코드
\`\`\`
```

## 핵심 개념/섹션

### References 패턴

1. **High-level + references 패턴**
   ```markdown
   # 주요 개념
   고급 기능은 [ADVANCED.md](ADVANCED.md) 참조
   ```

2. **도메인별 구성**
   ```
   references/
   ├── finance.md
   ├── sales.md
   └── product.md
   ```

3. **조건부 상세 정보**
   기본 정보 제공 → 상세 내용 링크

### 중복 제거

정보는 SKILL.md 또는 references 파일 중 한 곳에만 존재해야 합니다.
- SKILL.md: 필수 절차 지침 및 워크플로우
- references/: 상세 참조 자료, 스키마, 예제

## 예제

### 최소 Skill

```
minimal-skill/
└── SKILL.md
```

```yaml
---
name: minimal-skill
description: 최소한의 Skill 예제
---

# Minimal Skill

간단한 지침만 포함된 Skill입니다.
```

### 완전한 Skill

```
complete-skill/
├── SKILL.md
├── scripts/
│   └── process.py
├── references/
│   ├── api.md
│   └── schema.md
└── assets/
    └── template.html
```

## 관련 항목

- [youtube-collector](youtube-collector.md) - 완전히 동작하는 Skill 실제 예제
- [slash-command-creator](slash-command-creator.md) - Skill과 유사하지만 더 단순한 명령어 생성
- [subagent-creator](subagent-creator.md) - Skill과 함께 사용할 Agent 생성

## 참고사항

- Skill은 프로젝트(`.claude/skills/`) 또는 개인(`~/.claude/skills/`) scope으로 저장 가능
- 프로젝트 scope이 개인 scope보다 우선 순위 높음
- Skill은 자동으로 활성화되거나 명시적으로 호출 가능
- 좋은 `description` 작성이 자동 활성화의 핵심
