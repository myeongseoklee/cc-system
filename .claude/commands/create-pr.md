---
description: Bitbucket PR 생성 (커밋 기반 요약)
allowed-tools: Bash(git *:*), Bash(curl:*), Bash(security:*)
---

# Bitbucket PR 생성

## 사전 설정 (필수)

### 1. 저장소 정보 설정

프로젝트의 `.claude/settings.local.json`에 다음을 추가:

```json
{
  "BITBUCKET_WORKSPACE": "your-workspace",
  "BITBUCKET_REPO_SLUG": "your-repo-name"
}
```

또는 환경 변수로 설정:
```bash
export BITBUCKET_WORKSPACE="your-workspace"
export BITBUCKET_REPO_SLUG="your-repo-name"
```

### 2. 인증 정보 설정 (최초 1회)

```bash
security add-generic-password -a "bitbucket_api" -s "bitbucket_credentials" -w "이메일:API토큰" -U
```

API 토큰 발급: https://id.atlassian.com/manage-profile/security/api-tokens

---

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
     "https://api.bitbucket.org/2.0/repositories/${BITBUCKET_WORKSPACE}/${BITBUCKET_REPO_SLUG}/pullrequests" \
     -d '{"title":"...","source":{"branch":{"name":"..."}},"destination":{"branch":{"name":"..."}},"description":"..."}'
   ```

## 사용

```
/create-pr [대상브랜치]
```
미지정 시 `main`

$ARGUMENTS
