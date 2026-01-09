# Slash Command Creator

## 개요

**Slash Command Creator**는 Claude Code의 커스텀 슬래시 명령어를 생성하는 가이드 Skill입니다. 자주 사용하는 프롬프트를 재사용 가능한 명령어로 만들어 효율성을 높일 수 있습니다. 새로운 슬래시 명령어를 만들거나, 기존 명령어를 업데이트하거나, 명령어 문법 및 옵션에 대해 질문할 때 사용됩니다.

## 주요 기능

- **명령어 초기화**: 스크립트를 통한 빠른 명령어 생성
- **인자 전달**: `$ARGUMENTS`, `$1`, `$2` 등으로 동적 인자 처리
- **Bash 실행**: `!` 접두사로 쉘 명령어 실행 (권한 설정 필요)
- **파일 참조**: `@` 접두사로 파일 내용 포함
- **네임스페이싱**: 서브디렉토리로 명령어 구조화

## 파일 위치

- **원본 파일**: `.claude/skills/slash-command-creator/SKILL.md`
- **참조 문서**:
  - `references/frontmatter.md` - YAML 메타데이터 레퍼런스
  - `references/examples.md` - 다양한 예제
- **초기화 스크립트**: `scripts/init_command.py`

## 슬래시 명령어 구조

### 기본 형식

```markdown
---
description: /help에 표시될 간단한 설명
---

프롬프트 지침을 여기에 작성합니다.

$ARGUMENTS
```

### 저장 위치

| Scope | 경로 | 표시 |
|-------|------|------|
| 프로젝트 | `.claude/commands/` | (project) |
| 개인 | `~/.claude/commands/` | (user) |

### 네임스페이싱

서브디렉토리로 명령어 조직화:

```
.claude/commands/frontend/component.md → /component (project:frontend)
~/.claude/commands/backend/api.md → /api (user:backend)
```

## 사용 방법

### 1단계: 명령어 초기화

```bash
python3 .claude/skills/slash-command-creator/scripts/init_command.py <command-name> --scope project
```

또는

```bash
python3 .claude/skills/slash-command-creator/scripts/init_command.py <command-name> --scope personal
```

### 2단계: 명령어 파일 편집

생성된 `.md` 파일을 열어 편집:

```markdown
---
description: 이슈 수정 명령어
argument-hint: [issue-number]
---

Fix issue #$ARGUMENTS following our coding standards and best practices.
Review the issue description carefully and provide a comprehensive solution.
```

### 3단계: 사용

```
/fix-issue 123
```

결과: "Fix issue #123 following our coding standards..."

## 핵심 기능

### 1. Arguments (인자 처리)

#### 모든 인자 사용 (`$ARGUMENTS`)

```markdown
Fix issue #$ARGUMENTS following our coding standards
```

사용: `/fix-issue 123` → "Fix issue #123 following..."

#### 위치 기반 인자 (`$1`, `$2`)

```markdown
Review PR #$1 with priority $2
```

사용: `/review 456 high` → "Review PR #456 with priority high"

### 2. Bash 실행

`!` 접두사로 쉘 명령어 실행 (frontmatter에 `allowed-tools` 필요):

```markdown
---
allowed-tools: Bash(git status:*), Bash(git diff:*)
---

Current status: !`git status`
Changes since last commit: !`git diff HEAD`
```

### 3. 파일 참조

`@` 접두사로 파일 내용 포함:

```markdown
Review @src/utils/helpers.js for potential issues.
Compare @$1 with @$2 and identify differences.
```

사용: `/compare file1.js file2.js`

## Frontmatter 옵션

| 필드 | 설명 | 필수 여부 |
|------|------|---------|
| `description` | /help에 표시될 설명 | Yes |
| `allowed-tools` | 명령어가 사용할 수 있는 도구 | No |
| `argument-hint` | 예상 인자 힌트 | No |
| `model` | 사용할 특정 모델 | No |
| `disable-model-invocation` | SlashCommand 도구 호출 방지 | No |

### allowed-tools 예제

```yaml
---
allowed-tools: Bash(git add:*), Bash(git commit:*), Write, Edit
---
```

## 예제

### 예제 1: 간단한 리뷰 명령어

```markdown
---
description: 코드 리뷰 수행
---

Review the following code for:
- Code quality and readability
- Potential bugs
- Performance improvements
- Security issues

$ARGUMENTS
```

사용: `/review @src/main.js`

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

Please summarize the changes and suggest next steps.
```

사용: `/git-summary`

### 예제 3: 위치 인자 사용

```markdown
---
description: 두 파일 비교
argument-hint: <file1> <file2>
---

Compare the following files and identify key differences:

File 1: @$1
File 2: @$2

Provide a detailed comparison highlighting structural and functional differences.
```

사용: `/compare src/v1.js src/v2.js`

## 핵심 개념/섹션

### Slash Commands vs Skills

| 항목 | Slash Commands | Skills |
|------|---------------|--------|
| **복잡도** | 간단한 프롬프트 | 복잡한 기능 |
| **파일 수** | 단일 마크다운 | 여러 파일 (scripts, references) |
| **호출 방식** | 명시적 (`/command`) | 자동 발견 또는 명시적 |
| **사용 사례** | 빠른 반복 작업 | 전문 도메인 지식 |

### 선택 기준

- **Slash Commands 사용**: 간단한 프롬프트 템플릿, 빠른 반복 작업
- **Skills 사용**: 복잡한 워크플로우, 스크립트 및 참조 자료 필요

## 관련 항목

- [skill-creator](skill-creator.md) - 더 복잡한 Skill 생성 방법
- [slash-commands](../DOCS/slash-commands.md) - 슬래시 명령어 공식 가이드
- [INDEX](../INDEX.md) - 전체 프로젝트 구조

## 활용 팁

1. **자주 사용하는 프롬프트 저장**: 반복적인 요청을 명령어로 만들기
2. **팀 공유**: `.claude/commands/`에 저장하여 팀원과 공유
3. **버전 관리**: Git으로 명령어 변경 이력 추적
4. **네임스페이스 활용**: 관련 명령어를 서브디렉토리로 그룹화

## 참고사항

- 명령어 파일은 마크다운 (`.md`) 형식
- 프로젝트 scope이 개인 scope보다 우선 순위 높음
- `description` 필드는 필수
- Extended thinking 지원 가능
