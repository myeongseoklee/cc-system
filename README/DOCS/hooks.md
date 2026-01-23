# Hooks (공식 가이드)

## 개요

**Hooks**는 Claude Code의 수명 주기 동안 특정 지점에서 자동으로 실행되는 사용자 정의 쉘 명령어입니다. LLM의 제안에 의존하지 않고 특정 작업이 항상 일어나도록 보장하는 메커니즘을 제공합니다.

이 문서는 Claude Code Hooks의 공식 가이드 (`docs/cc/hooks.md`)를 요약한 것입니다.

## 주요 기능

- **알림 커스터마이징**: 작업 완료 시 커스텀 알림
- **자동 코드 포맷팅**: 파일 저장 후 Prettier, gofmt 등 자동 실행
- **명령어 로깅**: 모든 Bash 명령 기록
- **자동화된 피드백**: 도구 실행 전후 검증 및 피드백
- **파일 보호**: 민감한 파일 수정 차단

## 파일 위치

- **원본 파일**: `docs/cc/hooks.md` (9.6KB)
- **설정 위치**:
  - 사용자: `~/.claude/settings.json`
  - 프로젝트: `.claude/settings.json`

## 10가지 Hook 이벤트

| 이벤트 | 트리거 시점 | 차단 가능 | 주요 용도 |
|--------|----------|---------|---------|
| **PreToolUse** | 도구 실행 직전 | Yes (exit 2) | 도구 실행 검증, 파일 보호 |
| **PostToolUse** | 도구 실행 직후 | No | 자동 포맷팅, 로깅 |
| **PermissionRequest** | 권한 대화 표시 전 | Yes (exit 1/2) | 자동 허용/거부 |
| **UserPromptSubmit** | 사용자 프롬프트 제출 시 | No | 프롬프트 전처리 |
| **Notification** | 알림 발송 시 | No | 커스텀 알림 (데스크톱 등) |
| **Stop** | Claude 응답 완료 시 | No | 세션 정리 작업 |
| **SubagentStop** | Sub-agent 완료 시 | No | Sub-agent 정리 |
| **PreCompact** | 컨텍스트 압축 전 | No | 압축 전 사전 작업 |
| **SessionStart** | 세션 시작/재개 시 | No | 초기화 작업 |
| **SessionEnd** | 세션 종료 시 | No | 최종 정리 |

## Hook 설정 구조

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | grep -q '.env' && exit 2 || exit 0"
          }
        ]
      }
    ],
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

## 사용 방법

### 1. 설정 파일 편집

`~/.claude/settings.json` 또는 `.claude/settings.json` 열기

### 2. Hook 추가

원하는 이벤트에 Hook 설정 추가

### 3. Matcher 지정

- `*`: 모든 도구
- `Bash`: Bash만
- `Edit|Write`: Edit 또는 Write
- `Read`: Read만

### 4. 명령 작성

JSON을 stdin으로 받는 쉘 명령어 작성 (보통 `jq` 사용)

### 5. Exit 코드 설정 (차단 가능 이벤트만)

- **PreToolUse**: 0 (허용), 2 (차단)
- **PermissionRequest**: 0 (사용자 결정), 1 (거부), 2 (승인)

## 실제 예제

### 예제 1: Bash 명령 로깅 (QuickStart)

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

모든 Bash 명령을 `~/.claude/bash-log.txt`에 기록

### 예제 2: TypeScript 파일 자동 포맷팅

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "f=$(jq -r '.tool_input.file_path'); [[ $f == *.ts ]] && npx prettier --write \"$f\" || true"
          }
        ]
      }
    ]
  }
}
```

TypeScript 파일 수정 후 자동으로 Prettier 실행

### 예제 3: Markdown 언어 태그 수정

Markdown 코드 블록에 언어 태그 자동 추가

### 예제 4: 데스크톱 알림 (macOS)

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

### 예제 5: .env 파일 보호

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | grep -q '.env' && exit 2 || exit 0"
          }
        ]
      }
    ]
  }
}
```

.env 파일 수정 시도 시 차단

## 핵심 개념/섹션

### Hook 실행 흐름

```
이벤트 발생
    ↓
Matcher로 도구 필터링
    ↓
Hook 명령 실행 (JSON stdin)
    ↓
Exit 코드 확인 (차단 가능 이벤트만)
    ↓
도구 실행 (허용된 경우) 또는 차단
```

### JSON 입력 구조

Hooks는 stdin으로 JSON 데이터를 받습니다:

```json
{
  "tool_name": "Edit",
  "tool_input": {
    "file_path": "/path/to/file.ts",
    "old_string": "...",
    "new_string": "..."
  }
}
```

`jq`로 파싱:
```bash
jq -r '.tool_input.file_path'
jq -r '.tool_input.command'
jq -r '.message'
```

### Exit 코드의 의미

#### PreToolUse

- `0`: 도구 실행 허용
- `2`: 도구 차단, Claude에게 피드백 제공

#### PermissionRequest

- `0`: 사용자에게 결정 맡김 (기본)
- `1`: 자동 거부
- `2`: 자동 승인

## 보안 주의사항

1. **자격증명**: Hooks는 현재 환경의 자격증명으로 실행됨
2. **프로젝트 Hooks**: 신뢰할 수 없는 프로젝트의 Hooks 주의
3. **로깅**: 민감한 정보가 Hook 로그에 기록될 수 있음
4. **Exit 코드**: 차단 Hook은 신중하게 설계

## 일반적인 사용 사례

1. **CI/CD 통합**: 커밋 전 테스트 자동 실행
2. **코드 품질**: Lint/Format 자동 적용
3. **모니터링**: 모든 도구 사용 로깅
4. **알림**: 중요 작업 완료 시 알림
5. **보안**: 민감 파일/명령 차단

## 관련 항목

- [hook-creator](../SKILLS/hook-creator.md) - Hook 생성 가이드 Skill
- [INDEX](../INDEX.md) - 전체 프로젝트 구조

## 활용 팁

1. **점진적 추가**: 한 번에 하나씩 Hook 추가 및 테스트
2. **로깅 먼저**: 초기에는 로깅 Hook으로 JSON 구조 파악
3. **에러 처리**: Hook 명령에 에러 처리 포함 (`|| true`)
4. **성능 고려**: 무거운 작업은 백그라운드 실행
5. **문서화**: 각 Hook의 목적을 주석으로 명시

## 참고사항

- Hooks는 쉘 명령어로 실행됨
- `jq`는 JSON 파싱의 표준 도구
- 프로젝트 Hooks는 Git으로 공유 가능
- 차단 가능한 이벤트는 PreToolUse와 PermissionRequest뿐
