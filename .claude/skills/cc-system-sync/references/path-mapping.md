# 경로 매핑 가이드

cc-system → 운영 프로젝트 경로 변환 규칙.

## 기본 매핑 규칙

### 1:1 매핑 (동일 경로)

대부분의 파일은 동일한 경로에 매핑:

| cc-system 경로 | 타겟 경로 |
|----------------|-----------|
| `.claude/skills/*` | `.claude/skills/*` |
| `.claude/agents/*` | `.claude/agents/*` |
| `.claude/settings.json` | `.claude/settings.json` |
| `docs/*` | `docs/*` |

---

## 상대 경로 조정

### 스킬 내부 참조

스킬 파일에서 다른 리소스 참조 시:

```markdown
# cc-system 원본
상세 가이드: [references/guide.md](references/guide.md)
설계 문서: [../../docs/design.md](../../docs/design.md)

# 운영 프로젝트 (동일 구조면 변경 없음)
상세 가이드: [references/guide.md](references/guide.md)
설계 문서: [../../docs/design.md](../../docs/design.md)
```

### 구조가 다른 경우

```markdown
# cc-system 원본 (.claude/skills/tdd/SKILL.md)
참조: [../../docs/patterns/tdd.md](../../docs/patterns/tdd.md)

# 운영 프로젝트 (docs가 다른 위치에 있는 경우)
# docs/ → documentation/ 으로 변경된 경우
참조: [../../documentation/patterns/tdd.md](../../documentation/patterns/tdd.md)
```

---

## 경로 변환 알고리즘

### Step 1: 구조 분석

```
1. 운영 프로젝트의 디렉토리 구조 파악
2. cc-system과의 차이점 식별
3. 매핑 테이블 생성
```

### Step 2: 변환 규칙 적용

```
for each link in file:
  if is_relative_link(link):
    absolute_path = resolve(current_file, link)
    mapped_path = apply_mapping(absolute_path)
    new_link = make_relative(current_file, mapped_path)
    replace(link, new_link)
```

### Step 3: 검증

```
for each converted_link:
  if not exists(target_path):
    warn("Dead link: {link}")
```

---

## 일반적인 경로 차이 처리

### Case 1: docs 위치 변경

```
cc-system: docs/
프로젝트: documentation/

매핑: docs/* → documentation/*
```

### Case 2: 스킬 이름 변경

```
cc-system: .claude/skills/tdd-new-feature/
프로젝트: .claude/skills/tdd/

매핑: tdd-new-feature/* → tdd/*
```

### Case 3: 중첩 구조 평탄화

```
cc-system: .claude/skills/backend/v1-to-v2/
프로젝트: .claude/skills/migration/

매핑: backend/v1-to-v2/* → migration/*
```

---

## 경로 매핑 설정

`.claude/sync-config.json`으로 커스텀 매핑 정의 가능:

```json
{
  "pathMappings": {
    "docs/": "documentation/",
    ".claude/skills/tdd-new-feature/": ".claude/skills/tdd/",
    ".claude/skills/backend-v1-to-v2-migration/": ".claude/skills/migration/"
  },
  "excludePaths": [
    ".claude/skills/project-specific/",
    "docs/internal/"
  ]
}
```

---

## 링크 유형별 처리

### 마크다운 링크

```markdown
[텍스트](경로)           → 상대 경로 조정
[텍스트](경로 "제목")    → 상대 경로 조정
![이미지](경로)          → 상대 경로 조정
```

### 참조 스타일 링크

```markdown
[텍스트][ref]
[ref]: 경로             → 상대 경로 조정
```

### 코드 내 경로

```typescript
// 자동 조정하지 않음 (수동 확인 필요)
import { x } from '../../modules/x'
```

---

## 경로 충돌 해결

### 동일 이름, 다른 위치

```
cc-system: .claude/skills/test/SKILL.md
프로젝트 기존: .claude/skills/test/SKILL.md (다른 내용)

해결:
1. 내용 비교
2. 동일 스킬 → 머지
3. 다른 스킬 → 이름 변경 제안
```

### 순환 참조 방지

```
파일 A → 파일 B → 파일 A (순환)

해결:
1. 순환 감지
2. 경고 출력
3. 한쪽 링크 제거 제안
```

---

## 검증 체크리스트

- [ ] 모든 상대 경로가 유효한 파일을 가리킴
- [ ] 외부 링크는 변경되지 않음
- [ ] 이미지 경로가 올바름
- [ ] 코드 내 import 경로 확인 (수동)
