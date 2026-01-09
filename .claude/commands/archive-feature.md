---
description: 구현 기능 문서화 (FE/BE, 날짜, 변경범위)
---

# 기능 아카이브

## 질문

1. **기능명** / **영역** (FE/BE) / **날짜** (YYYY-MM-DD)

## 위치

- FE: `.cursor/rules/feature/frontend/{PageName}.md`
- BE: `.cursor/rules/feature/backend/{DomainName}.md`

## 템플릿

```markdown
# {도메인} - {기능} ({날짜})

## 요약
- {구현 내용}

## 변경
### BE
- API/Service/UseCase/Repository/DTO/SP

### FE
- Page/Component/Hook

## 상세
- {구현 설명}

## 의존성
- {고려사항}

## 노트
- {기술 세부}
```

## 동일 날짜
신규 → 섹션 추가 | 수정 → 내용 업데이트

$ARGUMENTS
