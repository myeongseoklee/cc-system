# YouTube Collector

## 개요

**YouTube Collector**는 등록된 유튜브 채널의 새 컨텐츠를 자동으로 수집하고 자막 기반 요약을 생성하는 실전 Skill입니다. 유튜브 채널을 등록하고 관리하며, 최신 영상의 메타데이터와 자막을 수집하여 `.reference/` 폴더에 구조화된 YAML 형식으로 저장합니다.

## 주요 기능

- **채널 등록 및 관리**: 유튜브 채널을 핸들 또는 URL로 등록
- **자동 컨텐츠 수집**: 등록된 채널의 최신 영상 메타데이터 및 자막 추출
- **자막 기반 요약 생성**: 영상 자막을 기반으로 구조화된 마크다운 요약 생성
- **중복 방지**: 이미 수집된 영상은 자동으로 스킵
- **YAML 데이터 저장**: `.reference/` 폴더에 체계적으로 데이터 저장

## 파일 위치

- **원본 파일**: `.claude/skills/youtube-collector/SKILL.md`
- **데이터 스키마**: `.claude/skills/youtube-collector/references/data-schema.md`
- **스크립트**:
  - `scripts/setup_api_key.py` - YouTube API 키 설정
  - `scripts/register_channel.py` - 채널 등록
  - `scripts/collect_videos.py` - 영상 수집
  - `scripts/fetch_videos.py` - 영상 목록 조회
  - `scripts/fetch_transcript.py` - 자막 추출

## 사전 요구사항

### 필수 패키지 설치

```bash
pip install google-api-python-client youtube-transcript-api pyyaml
```

### YouTube Data API 키 발급

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. YouTube Data API v3 활성화
3. API 키 생성
4. 아래 명령어로 설정

```bash
# 대화형 설정
python3 scripts/setup_api_key.py

# 직접 지정
python3 scripts/setup_api_key.py --api-key YOUR_API_KEY

# 현재 설정 확인
python3 scripts/setup_api_key.py --show
```

**설정 파일 저장 위치:**
- macOS/Linux: `~/.config/youtube-collector/config.yaml`
- Windows: `%APPDATA%\youtube-collector\config.yaml`

## 사용 방법

### 1단계: 채널 등록

```bash
# 핸들로 등록
python3 scripts/register_channel.py --channel-handle @channelname --output-dir .reference/

# URL로 등록
python3 scripts/register_channel.py --channel-url "https://youtube.com/@channelname" --output-dir .reference/
```

**결과**: `.reference/channels.yaml`에 채널 정보 추가됨

### 2단계: 컨텐츠 수집

```bash
# 특정 채널의 최신 영상 10개 수집
python3 scripts/collect_videos.py --channel-handle @channelname --output-dir .reference/ --max-results 10

# 등록된 모든 채널 수집
python3 scripts/collect_videos.py --all --output-dir .reference/
```

**결과**: `.reference/contents/{channel_handle}/{video_id}.yaml` 파일 생성

### 3단계: 요약 생성

수집된 영상의 YAML 파일에 AI가 자동으로 `summary` 필드를 추가합니다.

```yaml
summary:
  source: "transcript"  # 또는 "description" (자막 없을 때)
  content: |
    ## 서론
    - 문제 제기 또는 주제 소개

    ## 본론
    - 핵심 내용 상세 설명

    ## 결론
    - 핵심 요약 및 시사점
```

## 데이터 구조

### 프로젝트 디렉토리 구조

```
.reference/
├── youtube-config.yaml     # 프로젝트 설정
├── channels.yaml           # 등록된 채널 목록
└── contents/
    ├── channelname/        # 채널별 폴더 (@ 제외)
    │   ├── abc123.yaml     # 영상 1
    │   └── xyz789.yaml     # 영상 2
    └── anotherchannel/
        └── def456.yaml
```

### channels.yaml 구조

```yaml
channels:
  - id: "UCxxxxxxxxxxxxxxxxxxxxxx"    # 채널 ID
    handle: "@channelname"            # 채널 핸들
    name: "채널 표시 이름"              # 사람이 읽기 쉬운 이름
    added_at: "2025-12-13"            # 등록일
```

### 영상 YAML 구조 (contents/{channel}/{video_id}.yaml)

```yaml
# 기본 정보
video_id: "abc123xyz"
title: "영상 제목"
published_at: "2025-12-10T10:00:00Z"
url: "https://youtube.com/watch?v=abc123xyz"
thumbnail: "https://i.ytimg.com/vi/abc123xyz/maxresdefault.jpg"
description: |
  영상 설명 전체 텍스트
duration: "PT10M30S"                   # ISO 8601 형식
collected_at: "2025-12-13T15:00:00Z"   # 수집 시점

# 자막 정보
transcript:
  available: true                      # 자막 존재 여부
  language: "ko"                       # 자막 언어
  text: |
    자막 전체 텍스트...

# 요약 정보 (AI가 생성)
summary:
  source: "transcript"                 # "transcript" 또는 "description"
  content: |
    ## 서론
    - 요약 내용
```

## 핵심 개념/섹션

### 자막 기반 요약

- **자막 있음**: `transcript.text` 기반으로 요약 생성
- **자막 없음**: `description` 기반으로 요약 생성
- **요약 형식**: 서론, 본론, 결론의 3단계 구조

### 중복 방지

- 파일명이 `{video_id}.yaml` 형식
- 수집 전 파일 존재 여부로 중복 체크
- 이미 존재하는 video_id는 자동 스킵

### 보안

- API 키는 **코드베이스 외부**(사용자 홈 디렉토리)에 저장
- `.reference/` 폴더는 .gitignore에 추가 권장

## 예제

### 채널 등록 예제

사용자: "유튜브 채널 @fireship 등록해줘"

Claude:
```bash
python3 .claude/skills/youtube-collector/scripts/register_channel.py \
  --channel-handle @fireship \
  --output-dir .reference/
```

결과: `.reference/channels.yaml`에 Fireship 채널 추가

### 컨텐츠 수집 예제

사용자: "등록된 유튜브 채널들의 새 영상 수집해줘"

Claude:
```bash
python3 .claude/skills/youtube-collector/scripts/collect_videos.py \
  --all \
  --output-dir .reference/
```

결과: 모든 채널의 최신 영상 10개씩 수집 및 YAML 파일 생성

### 요약 생성 예제

수집된 `.reference/contents/fireship/abc123.yaml` 파일에 Claude가 자동으로 summary 추가:

```yaml
summary:
  source: "transcript"
  content: |
    ## 서론
    - JavaScript의 새로운 기능 소개
    - 2025년 웹 개발 트렌드

    ## 본론
    - async/await의 새로운 패턴
    - 성능 최적화 팁 3가지
    - 실전 예제 코드

    ## 결론
    - 핵심 요약: 비동기 처리의 중요성
    - 다음 단계: 프로덕션 적용 고려사항
```

## 프롬프트 사용 예

```
"유튜브 채널 @channelname 등록해줘"
"등록된 유튜브 채널 목록 보여줘"
"등록된 채널들의 새 영상 수집해줘"
"수집된 유튜브 컨텐츠 목록 보여줘"
"최근 수집된 영상 요약 보여줘"
```

## 관련 항목

- [skill-creator](skill-creator.md) - Skill 생성 방법론 (이 Skill의 기초)
- [hooks](../DOCS/hooks.md) - 수집 후 자동 요약을 Hook으로 설정 가능
- [INDEX](../INDEX.md) - 전체 프로젝트 구조

## 활용 팁

1. **정기 수집 자동화**: cron job으로 `collect_videos.py --all` 실행
2. **요약 품질 향상**: summary 생성 시 구체적인 프롬프트 제공
3. **채널 분류**: channels.yaml에 태그 필드 추가 가능
4. **백업**: .reference/ 폴더를 정기적으로 백업
