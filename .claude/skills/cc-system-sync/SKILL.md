---
name: cc-system-sync
description: cc-system 템플릿 변경사항을 운영 프로젝트에 적응형 머지. 사용법 "/cc-system-sync [cc-system경로] [기준커밋]". 사용 시점 (1) cc-system 업데이트 후 프로젝트 동기화 (2) 새 스킬/에이전트 추가 (3) docs 문서 업데이트 반영. git diff로 변경 파일 추출 → 타겟 매핑 → 섹션별 스마트 머지.
---

# cc-system 동기화

> 소스 분석 → 타겟 매핑 → 차이 식별 → 적응형 머지

## 핵심 원칙

1. **프로젝트 컨텍스트 보존**: 기존 프로젝트 고유 내용 유지
2. **적응형 추가**: 새 내용은 프로젝트 스타일에 맞게 변환
3. **충돌 최소화**: 섹션 단위로 머지, 전체 덮어쓰기 금지

## 워크플로우

```
Phase 1: 분석 → Phase 2: 매핑 → Phase 3: 머지 → Phase 4: 검증
```

---

## Phase 1: 소스 분석

### 인자 파싱

```
args: "<cc-system경로> [기준커밋]"
- cc-system경로: 필수, cc-system 레포지토리 경로
- 기준커밋: 선택, 없으면 HEAD~10 사용
```

### 변경 파일 추출

```bash
cd <cc-system경로>
git diff <기준커밋>..HEAD --name-status
```

### 변경 파일 분류

| 경로 패턴 | 유형 | 처리 방식 |
|-----------|------|-----------|
| `.claude/skills/*` | 스킬 | 섹션별 머지 |
| `.claude/agents/*` | 에이전트 | 파일별 머지 |
| `docs/*` | 문서 | 섹션별 머지 |
| `.claude/settings.*` | 설정 | 키별 머지 |

### 변경 유형

- `[A]` Added: 신규 파일 → 생성
- `[M]` Modified: 수정된 파일 → 머지
- `[D]` Deleted: 삭제된 파일 → 확인 후 삭제

---

## Phase 2: 타겟 매핑

### 매핑 전략

```
1. 동일 경로 존재? → 직접 매핑
2. 유사 경로 존재? → 경로 조정
3. 없음? → 신규 생성 위치 결정
```

### 매핑 테이블 생성

| cc-system 경로 | 타겟 경로 | 액션 | 비고 |
|----------------|-----------|------|------|
| `.claude/skills/tdd-new-feature/SKILL.md` | 동일 | merge | 섹션별 |
| `.claude/agents/test-writer.md` | 동일 | merge | 프롬프트 부분만 |
| `docs/domain-design/README.md` | 동일 | merge | 프로젝트 고유 예제 보존 |

### 경로 매핑 규칙

상세 가이드: [references/path-mapping.md](references/path-mapping.md)

---

## Phase 3: 적응형 머지

### 신규 파일 처리

```
1. 소스 내용 읽기
2. 프로젝트 컨텍스트 분석 (기존 스킬/에이전트 스타일)
3. 경로/참조 조정 (상대 경로 수정)
4. 파일 생성
```

### 수정 파일 처리

```
1. 양쪽 내용 읽기 (cc-system, 운영 프로젝트)
2. 섹션 단위 비교
3. 프로젝트 고유 섹션 식별 및 보존
4. 새 섹션/수정 내용 통합
5. 참조 경로 조정
```

### 파일 유형별 머지 전략

| 유형 | 전략 | 보존 대상 |
|------|------|----------|
| SKILL.md | 섹션별 머지 | 프로젝트 전용 섹션, 커스텀 예제 |
| agent.md | 프롬프트 섹션만 업데이트 | 프로젝트별 도구 설정 |
| docs/*.md | 섹션별 머지 | 프로젝트 고유 예제, 링크 |
| settings.json | 키별 머지 | 프로젝트 고유 설정 |

상세 가이드: [references/merge-strategies.md](references/merge-strategies.md)

---

## Phase 4: 검증

### 링크 검증

```bash
# 모든 마크다운 링크 유효성 확인
grep -r '\[.*\](.*\.md)' .claude/ --include="*.md" | while read line; do
  # 링크 대상 파일 존재 확인
done
```

### 스킬 검증

```bash
# frontmatter 형식 검증 (skill-creator 스크립트 활용)
python .claude/skills/skill-creator/scripts/quick_validate.py <스킬경로>
```

### 변경 요약 출력

```
## 동기화 완료

### 추가된 파일 (N개)
- .claude/skills/new-skill/SKILL.md

### 수정된 파일 (N개)
- .claude/skills/tdd-new-feature/SKILL.md
  - [+] 새 섹션: "Phase 3: 리팩토링"
  - [~] 수정: "핵심 원칙" (3줄 → 5줄)

### 수동 확인 필요 (N개)
- .claude/agents/migration-executor.md: 충돌 가능 영역
```

---

## 사용 시나리오

### 시나리오 1: 정기 동기화 (기준 커밋 지정)

```
사용자: "/cc-system-sync ~/repos/cc-system abc1234"

의미: abc1234 커밋 이후의 모든 변경사항을 현재 프로젝트에 반영
```

### 시나리오 2: 최신 변경사항 동기화

```
사용자: "/cc-system-sync ~/repos/cc-system"

의미: 최근 10개 커밋의 변경사항을 현재 프로젝트에 반영
```

### 시나리오 3: 기존 스킬 업데이트

```
변경 내용: tdd-new-feature/SKILL.md [M]

처리:
1. cc-system의 새 SKILL.md 읽기
2. 현재 프로젝트의 SKILL.md 읽기
3. 섹션별 비교:
   - 동일 → 스킵
   - 새 섹션 → 추가
   - 수정된 섹션 → 프로젝트 고유 내용 확인 후 머지
4. 프로젝트 전용 섹션 (예: 커스텀 예제) 보존
```

### 시나리오 4: 새 스킬 추가

```
변경 내용: api-test/SKILL.md [A]

처리:
1. cc-system의 api-test/ 전체 읽기
2. 현재 프로젝트 스킬 패턴 분석 (네이밍, 구조)
3. 경로 매핑 (.claude/skills/api-test/)
4. 참조 경로 조정 (../../docs/... 등)
5. 파일 생성
```

---

## 충돌 해결

충돌 발생 시 처리 우선순위:

1. **프로젝트 우선 (기본)**: 프로젝트 고유 내용 보존
2. **템플릿 우선**: 핵심 워크플로우 업데이트가 중요한 경우
3. **수동 개입**: 양쪽 모두 중요한 변경이 있는 경우

상세 가이드: [references/conflict-resolution.md](references/conflict-resolution.md)

---

## 동기화 기록

동기화 완료 후 `.claude/sync-history.json`에 기록:

```json
{
  "lastSync": {
    "date": "2024-01-15T10:30:00Z",
    "sourceCommit": "abc1234",
    "targetCommit": "def5678",
    "filesAdded": 2,
    "filesModified": 5,
    "filesDeleted": 0
  }
}
```

다음 동기화 시 `sourceCommit`을 기준 커밋으로 사용 가능.

---

## 상세 가이드

- [머지 전략](references/merge-strategies.md) - 파일 유형별 상세 머지 방법
- [경로 매핑](references/path-mapping.md) - 경로 변환 및 조정 규칙
- [충돌 해결](references/conflict-resolution.md) - 충돌 유형별 해결 방법
