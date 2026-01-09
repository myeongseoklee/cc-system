# Hook Creator

## 개요

**Hook Creator**는 Claude Code의 라이프사이클 이벤트에서 자동으로 실행되는 Hooks를 생성하고 설정하는 가이드 Skill입니다. 자동 포맷팅, 로깅, 알림, 파일 보호, 커스텀 권한 등을 설정할 수 있습니다. 새로운 Hook을 만들거나, PreToolUse, PostToolUse, Notification 등의 Hook 이벤트를 다룰 때 사용됩니다.

## 주요 기능

- **이벤트 기반 자동화**: 특정 시점에 자동으로 명령 실행
- **도구 실행 전/후 처리**: PreToolUse, PostToolUse 이벤트 활용
- **파일 보호**: 특정 파일 수정 차단
- **자동 포맷팅**: 코드 저장 후 자동 포맷터 실행
- **로깅**: 모든 명령 및 도구 사용 기록
- **커스텀 알림**: 작업 완료 시 데스크톱 알림

## 파일 위치

- **원본 파일**: `.claude/skills/hook-creator/SKILL.md`
- **참조 문서**:
  - `references/hook-events.md` - 10개 Hook 이벤트 상세 정의
  - `references/examples.md` - 실전 예제

## Hook 설정 구조

### JSON 형식

```json
{
  "hooks": {
    "<EventName>": [
      {
        "matcher": "<ToolPattern>",
        "hooks": [
          {
            "type": "command",
            "command": "<shell-command>"
          }
        ]
      }
    ]
  }
}
```

### 저장 위치

- **사용자 설정**: `~/.claude/settings.json` (모든 프로젝트)
- **프로젝트 설정**: `.claude/settings.json` (해당 프로젝트만)

## 사용 방법

### Hook 생성 워크플로우

#### 1단계: 사용 사례 결정

무엇을 자동화할지 결정:
- 자동 포맷팅
- 명령 로깅
- 파일 보호
- 알림
- 권한 제어

#### 2단계: 적절한 이벤트 선택

10가지 이벤트 중 선택 (자세한 내용은 아래 참조)

#### 3단계: Hook 명령 작성

Shell 명령어 작성 (보통 `jq`로 JSON 파싱)

```bash
jq -r '.tool_input.file_path'
```

#### 4단계: Matcher 설정

- `*` - 모든 도구
- `Bash` - Bash만
- `Edit|Write` - Edit 또는 Write
- `Read` - Read만

#### 5단계: 저장 위치 결정

개인용 → `~/.claude/settings.json`
프로젝트용 → `.claude/settings.json`

#### 6단계: 테스트

간단한 테스트로 Hook 동작 확인

## 지원하는 10가지 Hook 이벤트

| 이벤트 | 트리거 시점 | 차단 가능 | 주요 용도 |
|--------|----------|---------|---------|
| **PreToolUse** | 도구 실행 전 | Yes (exit 2) | 검증, 차단 |
| **PostToolUse** | 도구 실행 후 | No | 포맷팅, 로깅 |
| **PermissionRequest** | 권한 대화 표시 전 | Yes | 자동 허용/거부 |
| **UserPromptSubmit** | 사용자 프롬프트 제출 시 | No | 전처리 |
| **Notification** | 알림 발송 시 | No | 커스텀 알림 |
| **Stop** | Claude 응답 완료 | No | 정리 작업 |
| **SubagentStop** | Sub-agent 완료 | No | 정리 |
| **PreCompact** | 컨텍스트 압축 전 | No | 사전 작업 |
| **SessionStart** | 세션 시작/재개 | No | 초기화 |
| **SessionEnd** | 세션 종료 | No | 정리 |

## Matcher 패턴

```json
{
  "matcher": "*"              // 모든 도구
  "matcher": "Bash"           // Bash만
  "matcher": "Edit|Write"     // Edit 또는 Write
  "matcher": "Read"           // Read만
}
```

## Hook 명령어 패턴

### JSON 데이터 추출 (jq 사용)

```bash
# 파일 경로 추출
jq -r '.tool_input.file_path'

# 명령어 추출
jq -r '.tool_input.command'

# Fallback 값
jq -r '.tool_input.description // "No description"'

# 조건부 처리
jq -r 'if .tool_input.file_path then .tool_input.file_path else empty end'
```

### Exit 코드

#### PreToolUse 이벤트

- `0` - 도구 실행 허용
- `2` - 도구 차단 및 Claude에 피드백 제공

#### PermissionRequest 이벤트

- `0` - 사용자 결정에 맡김
- `1` - 자동 거부
- `2` - 자동 승인

## 예제

### 예제 1: Bash 명령 로깅

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.command' >> ~/.claude/bash-log.txt"
          }
        ]
      }
    ]
  }
}
```

### 예제 2: TypeScript 자동 포맷팅

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | { read f; [[ \"$f\" == *.ts ]] && npx prettier --write \"$f\"; }"
          }
        ]
      }
    ]
  }
}
```

### 예제 3: .env 파일 편집 차단

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "python3 -c \"import json,sys; p=json.load(sys.stdin).get('tool_input',{}).get('file_path',''); sys.exit(2 if '.env' in p else 0)\""
          }
        ]
      }
    ]
  }
}
```

Exit 코드 2로 차단하면 Claude에게 "You cannot edit .env files" 메시지 전달 가능

### 예제 4: 데스크톱 알림

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.message' | xargs -I {} osascript -e 'display notification \"{}\" with title \"Claude Code\"'"
          }
        ]
      }
    ]
  }
}
```

macOS에서 알림 표시

## 핵심 개념/섹션

### Hook 실행 순서

1. 이벤트 트리거
2. Matcher로 필터링
3. Hook 명령 실행 (JSON stdin)
4. Exit 코드 확인 (차단 가능 이벤트만)

### JSON 입력 구조

Hooks는 stdin으로 JSON 데이터를 받습니다:

```json
{
  "tool_name": "Edit",
  "tool_input": {
    "file_path": "/path/to/file.js",
    "old_string": "...",
    "new_string": "..."
  }
}
```

### 보안 고려사항

- Hooks는 현재 환경의 자격증명으로 실행됨
- 신뢰할 수 없는 프로젝트의 Hooks 주의
- 민감한 정보가 Hook 로그에 기록될 수 있음

## 일반적인 사용 사례

### 1. 자동 코드 포맷팅

PostToolUse + Edit/Write → Prettier/Black/gofmt 실행

### 2. 커밋 전 검증

PreToolUse + Bash(git commit) → 린터 실행

### 3. 파일 보호

PreToolUse + Edit/Write → 민감 파일 차단

### 4. 작업 로깅

PostToolUse + * → 모든 도구 사용 기록

### 5. 알림

Stop/SubagentStop → 작업 완료 알림

## 관련 항목

- [hooks](../DOCS/hooks.md) - Hooks 공식 가이드 상세 문서
- [skill-creator](skill-creator.md) - Skill 생성 방법론
- [INDEX](../INDEX.md) - 전체 프로젝트 구조

## 활용 팁

1. **점진적 추가**: 한 번에 하나씩 Hook 추가하여 테스트
2. **로그 활용**: 초기에는 로깅 Hook으로 JSON 구조 파악
3. **에러 처리**: Hook 명령에 에러 처리 포함
4. **성능 고려**: 무거운 작업은 백그라운드 실행
5. **팀 공유**: 프로젝트 설정으로 팀원과 공유

## 참고사항

- Hooks는 쉘 명령어로 실행됨
- `jq`는 JSON 파싱의 표준 도구
- Exit 코드로 동작 제어 가능 (일부 이벤트)
- 프로젝트 Hooks는 Git으로 공유 가능
