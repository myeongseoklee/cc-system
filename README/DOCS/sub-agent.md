# Sub-agent (공식 가이드)

## 개요

**Subagents**는 특정 작업에 특화된 전문 AI 어시스턴트로, 독립적인 컨텍스트 윈도우와 커스텀 시스템 프롬프트를 가집니다. 복잡한 작업을 전문화된 에이전트에게 위임하여 효율성과 품질을 향상시킵니다.

이 문서는 Claude Code Subagents의 공식 가이드 (`docs/cc/sub-agent.md`)를 요약한 것입니다.

## 주요 기능

- **독립적 컨텍스트**: 각 Subagent는 자체 컨텍스트 윈도우 보유
- **전문화된 지시사항**: 특정 작업에 최적화된 시스템 프롬프트
- **재사용성**: 여러 프로젝트에서 동일 Subagent 활용
- **유연한 권한**: 도구 접근 세밀하게 제어
- **자동 위임**: description 기반 자동 활성화

## 파일 위치

- **원본 파일**: `docs/cc/sub-agent.md` (22.3KB)
- **Subagent 저장**:
  - 프로젝트: `.claude/agents/` (높은 우선순위)
  - CLI: `--agents` 플래그
  - 사용자: `~/.claude/agents/` (낮은 우선순위)

## Built-in Subagents (3가지)

### 1. General-purpose

- **용도**: 복잡한 다단계 작업, 코드베이스 탐색
- **도구**: 모든 도구 접근 가능
- **모델**: 상속 (기본적으로 Sonnet)
- **사용 시점**: 복잡한 작업을 독립 컨텍스트에서 처리

### 2. Plan

- **용도**: Plan 모드에서만 사용, 구현 계획 수립
- **도구**: 읽기 전용 (Read, Grep, Glob, Bash)
- **모델**: 상속
- **사용 시점**: EnterPlanMode 호출 시 자동 활성화

### 3. Explore

- **용도**: 코드베이스 빠른 탐색 및 검색
- **도구**: 읽기 전용 (Glob, Grep, Read, Bash)
- **모델**: Haiku (빠르고 경량)
- **thoroughness**: quick/medium/very thorough

## Subagent 파일 형식

### 구조

```markdown
---
name: subagent-name
description: 언제 사용하는지 (자동 위임 핵심)
tools: Tool1, Tool2  # 선택 - 생략 시 모든 도구
model: sonnet        # 선택 - sonnet/opus/haiku/inherit
permissionMode: default  # 선택
skills: skill1, skill2   # 선택
---

시스템 프롬프트

역할, 책임, 행동 방식 정의
```

### 설정 필드

| 필드 | 필수 | 설명 |
|------|------|------|
| `name` | Yes | 소문자 + 하이픈 (예: `code-reviewer`) |
| `description` | Yes | 목적 및 사용 시점 (자동 위임 핵심) |
| `tools` | No | 접근 가능한 도구 (생략 시 모든 도구) |
| `model` | No | sonnet/opus/haiku/inherit |
| `permissionMode` | No | default/acceptEdits/bypassPermissions/plan |
| `skills` | No | 자동 로드할 스킬 |

## 사용 방법

### 자동 위임

Claude가 `description`을 기반으로 적절한 Subagent 자동 선택

```markdown
---
description: Use PROACTIVELY after writing code for quality review
---
```

"PROACTIVELY", "automatically" 등 키워드 사용

### 명시적 호출

사용자가 직접 요청:
```
"Use the code-reviewer subagent to check my changes"
```

### /agents 명령어

```
/agents         # 사용 가능한 Subagents 목록
/agents list    # 상세 정보
```

## Thoroughness Levels (Explore Agent)

| Level | 설명 | 사용 시점 |
|-------|------|---------|
| **quick** | 기본 검색 | 간단한 파일 찾기 |
| **medium** | 중간 탐색 | 여러 위치 검색 |
| **very thorough** | 포괄적 분석 | 완전한 코드베이스 이해 |

사용:
```
"Use the Explore agent with very thorough level to understand the authentication system"
```

## Permission Modes

| 모드 | 설명 |
|------|------|
| `default` | 일반 권한 처리 (기본값) |
| `acceptEdits` | 편집 자동 승인 |
| `bypassPermissions` | 모든 권한 우회 (주의!) |
| `plan` | Plan 모드에서만 실행 |

## 실제 예제

### 예제 1: Code Reviewer

```markdown
---
name: code-reviewer
description: Expert code reviewer. Use PROACTIVELY after writing or modifying code.
tools: Read, Grep, Glob, Bash
model: sonnet
---

You are an expert code reviewer.

When invoked:
1. Use Bash(git diff) to identify changes
2. Read and analyze code
3. Check for quality, security, performance

Output:
## Summary
[Changes overview]

## Issues Found
- [Issue descriptions]

## Recommendations
- [Specific improvements]
```

### 예제 2: Debugger

```markdown
---
name: debugger
description: Debugging specialist for errors and test failures
tools: Read, Edit, Bash, Grep, Glob
model: sonnet
---

You are a debugging specialist.

Process:
1. Analyze error messages
2. Read relevant code
3. Identify root cause
4. Provide minimal fix
```

### 예제 3: Data Scientist

```markdown
---
name: data-scientist
description: SQL and BigQuery analysis expert
tools: Bash, Read, Write
model: sonnet
---

You are a data analysis expert.

Responsibilities:
- Write efficient SQL queries
- Analyze BigQuery data
- Create visualizations
```

## 고급 기능

### Subagent Chaining (체이닝)

여러 Subagent를 순차적으로 실행:

```
1. Explore agent: 코드베이스 이해
2. Code-reviewer: 변경사항 리뷰
3. Test-runner: 테스트 실행
```

### Resumable Subagents

이전 대화를 이어서 진행:

```
"Resume the debugger subagent from earlier"
```

Agent ID로 재개 가능

## CLI 기반 설정

```bash
claude --agents '{
  "code-reviewer": {
    "description": "Code review expert",
    "tools": ["Read", "Grep"],
    "prompt": "You are a code reviewer..."
  }
}'
```

JSON 형식으로 직접 설정

## 핵심 개념/섹션

### 독립 컨텍스트 윈도우

각 Subagent는 자체 컨텍스트를 가져:
- 메인 대화와 독립
- 컨텍스트 오염 방지
- 집중된 작업 수행

### 자동 vs 명시적 호출

**자동**:
- Description 기반 트리거
- "PROACTIVELY" 키워드 사용
- Claude가 자동 판단

**명시적**:
- 사용자 직접 요청
- "Use the X subagent" 패턴
- 확실한 제어

### 도구 제한의 장점

- **보안**: 필요한 도구만 허용
- **집중**: 관련 없는 작업 방지
- **성능**: 최소 권한 원칙

## 일반적인 사용 사례

1. **코드 리뷰**: 변경사항 자동 검토
2. **디버깅**: 에러 분석 및 수정
3. **테스트**: 테스트 작성 및 실행
4. **문서화**: 문서 자동 생성
5. **보안 감사**: 취약점 검사
6. **데이터 분석**: SQL 쿼리 및 분석

## 관련 항목

- [subagent-creator](../SKILLS/subagent-creator.md) - Subagent 생성 가이드 Skill
- [brand-logo-finder](../AGENTS/brand-logo-finder.md) - 실제 Agent 예제
- [INDEX](../INDEX.md) - 전체 프로젝트 구조

## 활용 팁

1. **특화된 역할**: 각 Agent는 명확한 단일 책임
2. **좋은 Description**: 자동 위임을 위한 핵심
3. **최소 권한**: 필요한 도구만 허용
4. **적절한 모델**: 작업 복잡도에 따라 haiku/sonnet/opus 선택
5. **팀 공유**: 프로젝트 scope으로 저장

## 참고사항

- Subagent는 마크다운 + YAML frontmatter
- 프로젝트 scope이 사용자 scope보다 우선
- Resumable: 이전 대화 재개 가능
- Chainable: 여러 Agent 순차 실행 가능
- Built-in Agents: General-purpose, Plan, Explore
- Thoroughness 레벨로 탐색 깊이 조절
