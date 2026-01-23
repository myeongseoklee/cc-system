# Subagent Creator

## 개요

**Subagent Creator**는 특정 작업에 특화된 AI Sub-agent를 생성하기 위한 종합 가이드 Skill입니다. 커스텀 시스템 프롬프트와 도구 설정으로 작업별 AI 워크플로우를 구성할 수 있습니다. 새로운 Sub-agent를 만들거나, 커스텀 에이전트를 설정하거나, 작업별 AI 어시스턴트를 구성할 때 사용됩니다.

## 주요 기능

- **커스텀 시스템 프롬프트**: 특정 역할에 맞는 AI 인격 정의
- **도구 접근 제어**: 필요한 도구만 선택적으로 허용
- **모델 선택**: sonnet/opus/haiku 중 선택
- **자동 위임**: description 기반으로 적절한 시점에 자동 활성화
- **권한 모드 설정**: 파일 수정 권한 세밀하게 제어

## 파일 위치

- **원본 파일**: `.claude/skills/subagent-creator/SKILL.md`
- **템플릿**: `assets/subagent-template.md`
- **참조 문서**:
  - `references/examples.md` - 6개 예제 (code-reviewer, debugger 등)
  - `references/available-tools.md` - 사용 가능한 도구 목록

## Sub-agent 파일 형식

### 저장 위치

- **프로젝트**: `.claude/agents/` (높은 우선순위)
- **사용자**: `~/.claude/agents/` (낮은 우선순위)

### 파일 구조

```markdown
---
name: subagent-name
description: 이 Agent를 언제 사용하는지 명확히 설명 ("use proactively"로 자동 위임)
tools: Tool1, Tool2, Tool3  # 선택 - 생략 시 모든 도구 상속
model: sonnet               # 선택 - sonnet/opus/haiku/inherit
permissionMode: default     # 선택 - default/acceptEdits/bypassPermissions/plan
skills: skill1, skill2      # 선택 - 자동 로드할 스킬
---

시스템 프롬프트를 여기에 작성합니다.
역할, 책임, 행동 방식을 정의합니다.
```

## 설정 필드

| 필드 | 필수 | 설명 |
|------|------|------|
| `name` | Yes | 소문자와 하이픈으로 구성 (예: `code-reviewer`) |
| `description` | Yes | 목적 및 사용 시점 (자동 위임의 핵심) |
| `tools` | No | 쉼표로 구분된 도구 목록 (생략 시 모든 도구 상속) |
| `model` | No | `sonnet`, `opus`, `haiku`, `inherit` 중 선택 |
| `permissionMode` | No | `default`, `acceptEdits`, `bypassPermissions`, `plan` |
| `skills` | No | 자동으로 로드할 Skills |

## 사용 방법

### Sub-agent 생성 워크플로우

#### 1단계: 요구사항 수집

사용자에게 다음을 질문:
- Sub-agent의 목적은 무엇인가?
- 언제 사용되어야 하는가?
- 어떤 도구가 필요한가?

#### 2단계: Scope 선택

- **프로젝트** (`.claude/agents/`): 팀과 공유
- **사용자** (`~/.claude/agents/`): 개인 사용

#### 3단계: 설정 정의

- name: 고유하고 설명적인 이름
- description: 자동 위임을 위한 명확한 트리거
- tools: 필요한 도구만 선택 (보안)
- model: 작업 복잡도에 따라 선택

#### 4단계: 시스템 프롬프트 작성

효과적인 프롬프트 작성 가이드:
1. 역할 명확히 정의
2. 호출 시 수행할 작업 나열
3. 책임 범위 지정
4. 제약사항 및 가이드라인 포함
5. 출력 형식 정의

#### 5단계: 파일 생성

적절한 위치에 `.md` 파일 작성

## Description 작성 Best Practices

`description`은 자동 위임의 핵심입니다.

### 좋은 예시

```yaml
# 구체적인 트리거
description: Expert code reviewer. Use PROACTIVELY after writing or modifying code.

# 명확한 사용 사례
description: Debugging specialist for errors, test failures, and unexpected behavior.
```

### 나쁜 예시

```yaml
# 너무 모호함
description: Helps with code
```

**팁**: "use proactively" 키워드를 포함하면 자동 활성화 가능성 향상

## 시스템 프롬프트 가이드라인

### 1. 역할 명확히 정의

```markdown
You are a [specific expert role].
```

예시: "You are an expert code reviewer specializing in security and performance."

### 2. 호출 시 작업 나열

```markdown
When invoked, you should:
1. Read relevant files
2. Analyze for issues
3. Provide recommendations
```

### 3. 책임 범위 지정

```markdown
Your responsibilities include:
- Code quality analysis
- Security vulnerability detection
- Performance optimization suggestions
```

### 4. 제약사항 포함

```markdown
Guidelines:
- Focus only on modified files
- Provide actionable feedback
- Prioritize critical issues
```

### 5. 출력 형식 정의

```markdown
Output Format:
## Summary
[Brief overview]

## Issues Found
- [Issue 1]
- [Issue 2]

## Recommendations
- [Recommendation 1]
```

## 도구 선택 가이드

### 읽기 전용 작업

```yaml
tools: Read, Grep, Glob, Bash
```

사용 사례: 코드 검토, 분석, 보고

### 코드 수정 작업

```yaml
tools: Read, Write, Edit, Grep, Glob, Bash
```

사용 사례: 디버깅, 리팩토링, 자동 수정

### 전체 접근

```yaml
# tools 필드 생략 - 모든 도구 상속
```

## 예제

### 예제 1: Code Reviewer

```markdown
---
name: code-reviewer
description: Expert code reviewer. Use PROACTIVELY after writing or modifying code to ensure quality, security, and performance.
tools: Read, Grep, Glob, Bash
model: sonnet
---

You are an expert code reviewer specializing in code quality, security, and performance.

When invoked, you should:
1. Use Bash(git diff) to identify modified files
2. Read and analyze changed code
3. Check for:
   - Code quality issues
   - Security vulnerabilities
   - Performance problems
   - Best practice violations

Output Format:
## Summary
[Brief overview of changes]

## Issues Found
- [Critical/High/Medium/Low] Issue description

## Recommendations
- Specific actionable improvements
```

### 예제 2: Debugger

```markdown
---
name: debugger
description: Debugging specialist for errors, test failures, and unexpected behavior. Use when encountering bugs or test failures.
tools: Read, Edit, Bash, Grep, Glob
model: sonnet
---

You are a debugging specialist who identifies root causes and provides minimal fixes.

Process:
1. Analyze error messages and stack traces
2. Read relevant code files
3. Identify root cause
4. Provide minimal fix

Focus on:
- Root cause analysis
- Minimal changes
- Comprehensive testing
```

### 예제 3: Documentation Writer

```markdown
---
name: doc-writer
description: Technical documentation writer. Use when creating or updating documentation.
tools: Read, Write, Edit, Glob, Grep
model: haiku
permissionMode: acceptEdits
---

You are a technical documentation writer focused on clarity and completeness.

Guidelines:
- Write clear, concise documentation
- Include code examples
- Use proper markdown formatting
- Keep examples practical
```

## 핵심 개념/섹션

### 자동 위임 (Auto-delegation)

Claude가 `description`을 기반으로 적절한 시점에 Sub-agent를 자동으로 호출합니다.

### 명시적 호출

사용자가 직접 요청:
```
"Use the code-reviewer subagent to review my changes"
```

### Permission Mode

| 모드 | 설명 |
|------|------|
| `default` | 일반 권한 처리 |
| `acceptEdits` | 편집 자동 승인 |
| `bypassPermissions` | 모든 권한 우회 (주의) |
| `plan` | Plan 모드에서만 실행 |

## 관련 항목

- [skill-creator](skill-creator.md) - Skill과 Agent의 차이 이해
- [brand-logo-finder](../AGENTS/brand-logo-finder.md) - 실제 Agent 구현 예제
- [sub-agent](../DOCS/sub-agent.md) - Subagent 시스템 공식 가이드
- [INDEX](../INDEX.md) - 전체 프로젝트 구조

## 활용 팁

1. **특화된 역할 정의**: 명확하고 구체적인 역할 설정
2. **최소 권한 원칙**: 필요한 도구만 허용
3. **적절한 모델 선택**: 작업 복잡도에 따라 haiku/sonnet/opus 선택
4. **팀 공유**: 프로젝트 scope으로 저장하여 팀원과 공유
5. **반복 개선**: 실제 사용 후 프롬프트 및 설정 개선

## 참고사항

- Sub-agent는 독립적인 컨텍스트 윈도우를 가짐
- 프로젝트 scope이 사용자 scope보다 우선순위 높음
- Resumable: 이전 대화를 이어서 진행 가능
- Chainable: 여러 Sub-agent 순차 실행 가능
