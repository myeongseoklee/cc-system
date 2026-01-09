---
description: PRD 생성 (기능명, 문제, 요구사항, 기술명세, 테스트)
---

# PRD 생성

## 질문 (최대 3개)

1. **기능 이름** / **해결 문제** / **유형** (Full-Stack/BE/FE)

## 템플릿

```markdown
# {기능명} - PRD

## 개요
- 기능: {설명}
- 문제: {해결 대상}
- 지표: {성공 기준}

## 요구사항
### 기능
- [ ] {요구사항}

### 비기능
- 성능: {기준}
- 보안: {기준}

## 기술명세
- 아키텍처: v2 / v1
- API: {엔드포인트}
- DB: {스키마/SP}

## 구현
1. Phase 1: {단계}
2. Phase 2: {단계}

## 테스트
- [ ] 단위
- [ ] 통합

## 위험
- {요소}
```

## 관련
- BE v2: `.claude/skills/backend-v2-feature/`
- FE: `.claude/skills/frontend-feature/`

$ARGUMENTS
