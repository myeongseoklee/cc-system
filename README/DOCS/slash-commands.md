# Slash Commands (공식 가이드)

## 개요

**Slash Commands**는 Claude Code의 interactive 세션 중 Claude의 동작을 제어하는 명령어 시스템입니다. `/` 접두사로 시작하는 명령어로 내장 명령어와 커스텀 명령어를 모두 지원합니다.

이 문서는 Claude Code Slash Commands의 공식 가이드 (`docs/cc/slash-commands.md`)를 요약한 것입니다.

## 주요 기능

- **40+ 내장 명령어**: /help, /model, /compact, /hooks, /agents 등
- **커스텀 명령어 생성**: 자주 사용하는 프롬프트를 명령어로 저장
- **인자 전달**: `$ARGUMENTS`, `$1`, `$2` 등으로 동적 인자 처리
- **Bash 실행**: `!` 접두사로 쉘 명령 실행
- **파일 참조**: `@` 접두사로 파일 내용 포함
- **네임스페이싱**: 서브디렉토리로 명령어 구조화

## 파일 위치

- **원본 파일**: `docs/cc/slash-commands.md` (22.8KB)
- **커스텀 명령어 저장**:
  - 프로젝트: `.claude/commands/`
  - 사용자: `~/.claude/commands/`

## 주요 내장 명령어

| 명령어 | 설명 |
|--------|------|
| `/help` | 모든 명령어 목록 및 도움말 |
| `/model [model]` | 사용할 모델 선택 (sonnet/opus/haiku) |
| `/compact` | 대화 기록 압축 |
| `/hooks` | 현재 Hooks 설정 표시 |
| `/agents` | 사용 가능한 Sub-agents 목록 |
| `/sandbox [on\|off]` | 샌드박스 모드 토글 |
| `/skills` | 사용 가능한 Skills 목록 |
| `/tasks` | 실행 중인 백그라운드 작업 |
| `/clear` | 대화 기록 초기화 |
| `/exit` | Claude Code 종료 |

## 커스텀 명령어 생성

### 파일 구조

```markdown
---
description: /help에 표시될 설명
argument-hint: [arg1] [arg2]
allowed-tools: Bash(git status:*), Read, Write
model: claude-sonnet-4-5-20250929
---

프롬프트 본문

$ARGUMENTS 또는 $1, $2 등
```

### 저장 위치

| Scope | 경로 | 우선순위 | 표시 |
|-------|------|---------|------|
| 프로젝트 | `.claude/commands/` | 높음 | (project) |
| 사용자 | `~/.claude/commands/` | 낮음 | (user) |

### 네임스페이싱

서브디렉토리로 명령어 조직화:

```
.claude/commands/
├── frontend/
│   ├── component.md → /component (project:frontend)
│   └── review.md → /review (project:frontend)
└── backend/
    └── api.md → /api (project:backend)
```

## 커스텀 명령어 기능

### 1. Arguments (인자)

#### 모든 인자 (`$ARGUMENTS`)

```markdown
Fix issue #$ARGUMENTS following our coding standards
```

사용: `/fix-issue 123` → "Fix issue #123 following our coding standards"

#### 위치 기반 인자 (`$1`, `$2`)

```markdown
Review PR #$1 with priority $2
```

사용: `/review 456 high` → "Review PR #456 with priority high"

### 2. Bash 실행 (`!`)

frontmatter에 `allowed-tools` 필요:

```markdown
---
allowed-tools: Bash(git status:*), Bash(git diff:*)
---

Current status: !`git status`
Changes: !`git diff HEAD`
```

### 3. 파일 참조 (`@`)

```markdown
Review @src/utils/helpers.js for issues.
Compare @$1 with @$2.
```

사용: `/compare file1.js file2.js`

### 4. Extended Thinking

복잡한 작업에 Extended Thinking 활성화 가능

## Frontmatter 옵션

| 필드 | 설명 | 필수 |
|------|------|------|
| `description` | /help에 표시될 설명 | Yes |
| `allowed-tools` | 사용 가능한 도구 | No |
| `argument-hint` | 인자 힌트 | No |
| `model` | 사용할 모델 | No |
| `disable-model-invocation` | SlashCommand 도구 호출 방지 | No |

## Slash Commands vs Skills

| 항목 | Slash Commands | Skills |
|------|---------------|--------|
| **복잡도** | 간단한 프롬프트 | 복잡한 기능 |
| **파일 수** | 단일 마크다운 | 여러 파일 (scripts, references) |
| **호출 방식** | 명시적 (`/command`) | 자동 발견 또는 명시적 |
| **사용 사례** | 빠른 반복 작업 | 전문 도메인 지식 |
| **번들 리소스** | 없음 | scripts, references, assets |

### 선택 기준

- **Slash Commands**: 간단한 프롬프트 템플릿, 빠른 작업
- **Skills**: 복잡한 워크플로우, 스크립트 및 참조 자료 필요

## 예제

### 예제 1: 간단한 리뷰 명령어

```markdown
---
description: 코드 리뷰 수행
---

Review the following code for:
- Code quality
- Potential bugs
- Security issues

$ARGUMENTS
```

`.claude/commands/review.md` 저장 후:
```
/review @src/main.js
```

### 예제 2: Git 워크플로우

```markdown
---
description: Git 상태 및 변경사항 요약
allowed-tools: Bash(git status:*), Bash(git diff:*)
---

## Current Git Status

!`git status`

## Changes

!`git diff HEAD`

Summarize changes and suggest next steps.
```

사용: `/git-summary`

### 예제 3: 두 파일 비교

```markdown
---
description: 두 파일 비교
argument-hint: <file1> <file2>
---

Compare:

File 1: @$1
File 2: @$2

Highlight structural and functional differences.
```

사용: `/compare src/v1.js src/v2.js`

## 플러그인 및 MCP 통합

### 플러그인 명령어

플러그인이 커스텀 Slash Commands 제공 가능

### MCP 서버 명령어

MCP 서버가 동적 명령어 노출 가능

## 핵심 개념/섹션

### 명령어 우선순위

1. 프로젝트 명령어 (`.claude/commands/`)
2. CLI 명령어 (`--commands` 플래그)
3. 사용자 명령어 (`~/.claude/commands/`)

### 인자 처리

```
/review 123 high
        ↓
$ARGUMENTS = "123 high"
$1 = "123"
$2 = "high"
```

### Bash 실행 패턴

```markdown
!`git status`
```

→ 명령 실행 결과를 프롬프트에 포함

### 파일 참조 패턴

```markdown
@src/utils/helpers.js
```

→ 파일 내용을 프롬프트에 포함

## 일반적인 사용 사례

1. **코드 리뷰**: `/review @file.js`
2. **Git 워크플로우**: `/git-summary`, `/commit`
3. **테스트 실행**: `/test @test-file.js`
4. **문서 생성**: `/doc @component.jsx`
5. **배포**: `/deploy production`

## 관련 항목

- [slash-command-creator](../SKILLS/slash-command-creator.md) - 명령어 생성 가이드 Skill
- [skill-creator](../SKILLS/skill-creator.md) - 더 복잡한 기능은 Skill로
- [INDEX](../INDEX.md) - 전체 프로젝트 구조

## 활용 팁

1. **자주 사용하는 패턴 저장**: 반복 작업을 명령어로 만들기
2. **팀 공유**: 프로젝트 scope으로 팀원과 공유
3. **네임스페이스 활용**: 관련 명령어를 폴더로 그룹화
4. **Bash 조합**: Git, npm 등과 통합
5. **버전 관리**: Git으로 명령어 이력 추적

## 참고사항

- 명령어는 마크다운 파일 (`.md`)
- `description` 필드는 필수
- 프로젝트 scope이 우선순위 높음
- Extended thinking 지원
- 40+ 내장 명령어 사용 가능
