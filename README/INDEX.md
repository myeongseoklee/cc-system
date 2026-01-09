# cc-system 프로젝트 문서 가이드

## 프로젝트 개요

**cc-system**은 Claude Code를 위한 통합 AI 확장 플랫폼입니다. 이 저장소는 Claude Code의 기능을 확장하고 자동화하기 위한 다음 컴포넌트들을 제공합니다:

- **Skills**: 재사용 가능한 AI 모듈 및 워크플로우
- **Agents**: 특정 작업에 특화된 AI 어시스턴트
- **Prompts**: AI 프롬프트 최적화 및 설계 방법론
- **Docs**: Claude Code 핵심 기능 공식 가이드

## 문서 구조

이 README 디렉토리는 프로젝트의 모든 주요 문서에 대한 설명을 제공합니다.

### 📚 Skills (5개)

재사용 가능한 기능 모듈 및 생성 가이드

| 문서 | 설명 | 파일 |
|------|------|------|
| [youtube-collector](SKILLS/youtube-collector.md) | 유튜브 채널 영상 수집 및 자막 기반 요약 | 실전 Skill |
| [skill-creator](SKILLS/skill-creator.md) | 새로운 Skill 제작 종합 가이드 | 기초 |
| [slash-command-creator](SKILLS/slash-command-creator.md) | Slash Commands 작성 가이드 | 생성 도구 |
| [subagent-creator](SKILLS/subagent-creator.md) | Sub-agent 생성 가이드 | 생성 도구 |
| [hook-creator](SKILLS/hook-creator.md) | Hooks 커스터마이징 가이드 | 자동화 |

### 🤖 Agents (1개)

특정 작업에 특화된 AI 어시스턴트

| 문서 | 설명 | 파일 |
|------|------|------|
| [brand-logo-finder](AGENTS/brand-logo-finder.md) | Brandfetch를 이용한 브랜드 로고 검색 | Agent 예제 |

### 💡 Prompts (2개)

AI 프롬프트 최적화 및 프로젝트 설계 전략

| 문서 | 설명 | 파일 |
|------|------|------|
| [crystalize-prompt](PROMPTS/crystalize-prompt.md) | AI 프롬프트 압축 전략 | 최적화 |
| [design-pipeline](PROMPTS/design-pipeline.md) | Framer 클론 코딩 파이프라인 설계 | 프로젝트 설계 |

### 📖 Docs (3개)

Claude Code 핵심 기능 공식 가이드 요약

| 문서 | 설명 | 파일 |
|------|------|------|
| [hooks](DOCS/hooks.md) | Claude Code Hooks 공식 가이드 | 자동화 시스템 |
| [slash-commands](DOCS/slash-commands.md) | Slash Commands 공식 가이드 | 명령어 시스템 |
| [sub-agent](DOCS/sub-agent.md) | Subagents 공식 가이드 | Agent 시스템 |

## 추천 학습 경로

### 초급 - 기초 이해

1. [skill-creator](SKILLS/skill-creator.md) - Skill 시스템의 기초 개념 이해
2. [slash-commands](DOCS/slash-commands.md) - 기본 명령어 시스템 파악
3. [youtube-collector](SKILLS/youtube-collector.md) - 실제 동작하는 Skill 예제 학습

### 중급 - 생성 및 커스터마이징

4. [slash-command-creator](SKILLS/slash-command-creator.md) - 자신만의 명령어 생성
5. [hooks](DOCS/hooks.md) - 자동화 Hook 시스템 이해
6. [hook-creator](SKILLS/hook-creator.md) - 커스텀 Hook 작성

### 고급 - Agent 및 최적화

7. [sub-agent](DOCS/sub-agent.md) - Subagent 시스템 심화 학습
8. [subagent-creator](SKILLS/subagent-creator.md) - 전문화된 Agent 생성
9. [brand-logo-finder](AGENTS/brand-logo-finder.md) - Agent 구현 예제 분석
10. [crystalize-prompt](PROMPTS/crystalize-prompt.md) - 프롬프트 최적화 기법
11. [design-pipeline](PROMPTS/design-pipeline.md) - 복잡한 프로젝트 설계 방법론

## 빠른 참조

### 주요 파일 위치

```
.claude/
├── skills/               # Skills 저장소
├── agents/              # Agents 저장소
├── commands/            # Slash Commands 저장소
└── settings.json        # Hooks 및 설정

prompt/                  # 프롬프트 방법론
docs/cc/                 # Claude Code 공식 문서
```

### 사용자 vs 프로젝트 Scope

| 항목 | 프로젝트 | 사용자 (개인) |
|------|---------|-------------|
| Skills | `.claude/skills/` | `~/.claude/skills/` |
| Agents | `.claude/agents/` | `~/.claude/agents/` |
| Commands | `.claude/commands/` | `~/.claude/commands/` |
| Settings | `.claude/settings.json` | `~/.claude/settings.json` |

### 자주 사용하는 명령어

```bash
# Skills 확인
ls .claude/skills/

# Agents 확인
ls .claude/agents/

# Slash Commands 확인
/help

# Hooks 확인
/hooks
```

## 관계도

```
skill-creator (기반 개념)
├── slash-command-creator (명령어 생성)
├── subagent-creator (Agent 생성)
├── hook-creator (자동화 설정)
└── youtube-collector (실전 활용)

sub-agent.md (Agent 시스템)
└── brand-logo-finder (구현 예제)

crystalize-prompt + design-pipeline (프로젝트 전략)
```

## 이 문서를 사용하는 방법

1. **처음 시작**: [추천 학습 경로](#추천-학습-경로)를 따라 순차적으로 학습
2. **특정 기능 찾기**: 위 표에서 원하는 기능 찾아 해당 README 문서 읽기
3. **심화 학습**: 각 README에서 원본 파일 경로 확인 후 상세 내용 학습
4. **실전 적용**: 예제 Skill/Agent를 참고하여 자신만의 모듈 생성

## 프로젝트 목표

이 프로젝트는 Claude Code 개발자들이:
- 재사용 가능한 AI 모듈을 쉽게 만들고 공유
- 자동화 워크플로우를 효율적으로 구축
- 프롬프트 최적화로 비용 절감 및 성능 향상
- 복잡한 프로젝트를 체계적으로 설계

할 수 있도록 돕습니다.
