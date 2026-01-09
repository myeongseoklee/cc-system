---
description: Bitbucket PR 생성 (커밋 기반 요약)
allowed-tools: Bash(git *:*), Bash(curl:*), Bash(security:*)
---

# Bitbucket PR 생성

## 절차

1. **현재 브랜치 확인**: `git branch --show-current`
2. **기존 PR 체크**: 열린 PR 있으면 `/update-pr` 실행
3. **커밋 조회**: `git log origin/{target}..HEAD --oneline`
4. **요약 생성**: 커밋 분석 → 제목/설명
5. **API 호출**:
   ```bash
   BITBUCKET_CREDS=$(security find-generic-password -a "bitbucket_api" -s "bitbucket_credentials" -w)

   curl -X POST -u "${BITBUCKET_CREDS}" \
     -H "Content-Type: application/json" \
     "https://api.bitbucket.org/2.0/repositories/gurucompany3/src_tc_admin_web/pullrequests" \
     -d '{"title":"...","source":{"branch":{"name":"..."}},"destination":{"branch":{"name":"..."}},"description":"..."}'
   ```

## 사용

```
/create-pr [대상브랜치]
```
미지정 시 `main`

## 인증 (최초 1회)

```bash
security add-generic-password -a "bitbucket_api" -s "bitbucket_credentials" -w "이메일:API토큰" -U
```

API 토큰: https://id.atlassian.com/manage-profile/security/api-tokens

$ARGUMENTS
