# Brand Logo Finder

## 개요

**Brand Logo Finder**는 Brandfetch를 활용하여 브랜드 로고 및 시각적 자산을 자동으로 검색하는 Sub-agent입니다. 사용자가 브랜드 로고, 브랜드 자산, 브랜드 아이덴티티 정보를 요청할 때 자동으로 활성화됩니다.

## 주요 기능

- **브랜드 도메인 자동 검색**: WebSearch를 통해 공식 웹사이트 도메인 찾기
- **Brandfetch 접근**: 도메인 기반으로 Brandfetch 페이지 자동 접근
- **로고 정보 추출**: 로고 URL, 포맷, 브랜드 색상 등 시각 자산 정보 추출
- **경량 모델 사용**: Haiku 모델로 빠르고 효율적인 처리

## 파일 위치

- **원본 파일**: `.claude/agents/brand-logo-finder.md`
- **사용 도구**: WebFetch, WebSearch
- **모델**: haiku (경량 모델)

## 동작 프로세스

### 1단계: 브랜드 도메인 찾기
WebSearch를 사용하여 브랜드의 공식 웹사이트 도메인 검색

```
예시: "Spotify official website" 검색 → spotify.com 찾기
```

### 2단계: 도메인 추출
검색 결과에서 공식 도메인 식별 (일반적으로 .com 우선)

```
spotify.com, apple.com, github.com 등
```

### 3단계: Brandfetch 접근
추출된 도메인으로 Brandfetch 페이지 접근

```
URL 패턴: https://brandfetch.com/[brand-domain]
예시: https://brandfetch.com/spotify.com
```

### 4단계: 로고 정보 추출
Brandfetch 페이지에서 로고 및 브랜드 정보 파싱

## 출력 형식

Agent는 다음 정보를 제공합니다:

- **Brand Name**: 공식 브랜드명
- **Brandfetch URL**: Brandfetch 페이지 링크
- **Logo URLs**: 로고 파일 직접 링크
- **Logo Formats**: 사용 가능한 포맷 (SVG, PNG 등)
- **Brand Colors**: 주요 브랜드 색상

## 사용 방법

### 기본 사용

```
사용자: "Spotify 로고 찾아줘"
```

Agent 처리:
1. WebSearch: "Spotify official website" → `spotify.com` 발견
2. WebFetch: `https://brandfetch.com/spotify.com` 접근
3. 로고 자산 추출 및 보고

### 여러 브랜드

```
사용자: "Apple과 Google의 브랜드 로고 찾아줘"
```

Agent가 각 브랜드에 대해 순차적으로 처리

## 예제

### 예제 1: Spotify

**입력**: "Spotify 로고 찾아줘"

**처리**:
1. WebSearch → `spotify.com`
2. Brandfetch 접근
3. 출력:
   - Brand Name: Spotify
   - Brandfetch URL: https://brandfetch.com/spotify.com
   - Logo Formats: SVG, PNG
   - Brand Colors: #1DB954 (green), #191414 (black)

### 예제 2: GitHub

**입력**: "GitHub 브랜드 자산 필요해"

**처리**:
1. WebSearch → `github.com`
2. Brandfetch 접근
3. 로고 및 아이콘 세트 정보 제공

## 핵심 개념/섹션

### 자동 위임 (Auto-delegation)

Agent의 `description`에 "brand's logo, brand assets, or brand identity" 키워드가 포함되어 있어, 사용자가 브랜드 관련 요청을 할 때 자동으로 활성화됩니다.

### 도구 제한

이 Agent는 WebFetch와 WebSearch만 사용 가능하도록 제한되어 있어, 안전하고 목적에 맞게 동작합니다.

### 경량 모델 선택

Haiku 모델을 사용하여:
- 빠른 응답 시간
- 낮은 비용
- 충분한 정확도

## 가이드라인

### 도메인 선택 우선순위

1. `.com` 도메인 우선
2. 검색 결과가 여러 개일 경우 가장 권위 있는 도메인 선택
3. Brandfetch에 없는 경우 대체 확장자 시도 (.io, .co, .org)

### 에러 처리

- 브랜드를 찾을 수 없는 경우: 사용자에게 알림
- Brandfetch에 정보 없음: 대안 제안
- 여러 도메인 후보: 가장 공식적인 것 선택

## 관련 항목

- [subagent-creator](../SKILLS/subagent-creator.md) - 이와 같은 Agent를 직접 만드는 방법
- [sub-agent](../DOCS/sub-agent.md) - Subagent 시스템 공식 가이드
- [INDEX](../INDEX.md) - 전체 프로젝트 구조

## 확장 가능성

이 Agent를 참고하여 다음과 같은 Agent를 만들 수 있습니다:

- **Icon Finder**: 무료 아이콘 검색 Agent
- **Font Finder**: 폰트 추천 및 검색 Agent
- **Color Palette Generator**: 브랜드 색상 기반 팔레트 생성 Agent
- **Stock Photo Finder**: Unsplash/Pexels 이미지 검색 Agent

## 참고사항

- Agent는 `.claude/agents/` (프로젝트) 또는 `~/.claude/agents/` (개인)에 저장
- description이 명확할수록 자동 활성화 정확도 향상
- 필요에 따라 도구 목록 및 모델 변경 가능
