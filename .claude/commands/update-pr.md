---
description: 현재 브랜치 PR 제목/설명 업데이트
allowed-tools: Bash(git *:*), Bash(curl:*), Bash(security:*)
---

# PR 업데이트

## 절차

1. 브랜치 확인: `git branch --show-current`
2. PR 조회 → 없으면 `/create-pr`
3. 커밋 조회: `git log origin/{target}..HEAD`
4. 요약 생성
5. API 업데이트:
   ```bash
   curl -X PUT -u "${BITBUCKET_CREDS}" \
     ".../pullrequests/{PR_ID}" \
     -d '{"title":"...","description":"..."}'
   ```

## 사용

```
/update-pr
```

$ARGUMENTS
