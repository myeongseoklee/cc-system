# Design Pipeline (설계 파이프라인)

## 개요

**Design Pipeline**은 Claude Code를 활용하여 복잡한 프로젝트를 효율적으로 설계하는 방법론입니다. Master Agent와 Sub Agent 아키텍처를 사용하여 Framer 랜딩페이지를 React + TailwindCSS + motion/react로 클론 코딩하는 파이프라인을 설계합니다.

## 주요 기능

- **Master/Sub Agent 구조**: 전체 흐름 관리와 하위 작업 분리
- **Context 최적화**: 불필요한 데이터 제거로 비용 절감
- **Step-by-Step 데이터 추출**: 정보를 단계별로 추출 및 전처리
- **리소스 정확성**: 이미지 다운로드 및 placeholder 추출

## 파일 위치

- **원본 파일**: `prompt/design-pipeline.md`

## 핵심 원칙

### 1. Context 소모 최적화

**문제**: 큰 데이터를 AI에게 그대로 전달하면 context size를 과하게 소모해 비용 증가 및 정확도 하락

**해결**: Step-by-step으로 필요한 정보만 추출, 불필요한 데이터는 Python script 등으로 제거

**예시**:
```python
# 나쁜 예: 전체 데이터 전달
send_to_ai(huge_json_data)  # Context 낭비

# 좋은 예: 필요한 정보만 추출
filtered_data = extract_necessary_info(huge_json_data)
send_to_ai(filtered_data)  # Context 효율적 사용
```

### 2. 데이터 연관관계 사전 처리

**원칙**: Code-level에서 계산 가능한 연관관계는 미리 처리하여 전달

**예시**:
```python
# 나쁜 예: AI에게 연관관계 계산 맡김
"Find all components that use theme colors"

# 좋은 예: 사전 계산
component_theme_map = compute_component_theme_relations(components)
send_to_ai(component_theme_map)
```

### 3. 이미지 리소스 정확성

**요구사항**:
- 이미지를 정확히 다운로드
- 모든 placeholder 추출
- 이미지 메타데이터 보존

## Master/Sub Agent 아키텍처

### Master Agent 역할

- 전체 작업 흐름 관리
- Sub Agent에게 작업 위임
- 결과 통합 및 최종 출력

### Sub Agent 역할

- Context 소모가 큰 하위 작업 담당
- 특화된 데이터 처리
- 독립적인 컨텍스트에서 실행

## 프로젝트 요구사항

**목표**: Framer 랜딩페이지를 React + TailwindCSS + motion/react로 정확히 클론 코딩

**기술 스택**:
- React: 컴포넌트 기반 UI
- TailwindCSS: 유틸리티 우선 스타일링
- motion/react: 애니메이션 및 인터랙션

**구조**:
```
Header 컴포넌트
Footer 컴포넌트
섹션 컴포넌트들 (Hero, Features, CTA 등)
```

## Step-by-Step 파이프라인

### 1단계: 초기 질문 (명확화)

Master Agent가 사용자에게 최대 4개 질문:
- 권장 옵션 포함
- 각 질문당 3개 선택지
- 모호한 부분 해결

**예시 질문**:
1. **컴포넌트 구조**:
   - Option 1: 페이지별 분리 (Recommended)
   - Option 2: 기능별 분리
   - Option 3: Atomic Design 패턴

2. **스타일링 접근**:
   - Option 1: TailwindCSS 클래스만 사용 (Recommended)
   - Option 2: CSS Modules 병행
   - Option 3: Styled Components

### 2단계: 데이터 추출 (Sub Agent)

Sub Agent가 Framer 페이지에서 필요한 정보 추출:

**추출 대상**:
- 레이아웃 구조
- 컴포넌트 계층
- 텍스트 콘텐츠
- 색상 팔레트
- 폰트 정보
- 애니메이션 속성
- 이미지 URL 및 placeholder

**전처리**:
```python
# 불필요한 메타데이터 제거
filtered_structure = {
    "layout": extract_layout(framer_data),
    "components": extract_components(framer_data),
    "styles": extract_styles(framer_data),
    # Framer 내부 설정 등은 제외
}
```

### 3단계: 연관관계 계산 (Code-level)

Python script로 사전 계산:

```python
# 컴포넌트 간 의존성
dependencies = compute_component_dependencies(components)

# 스타일 재사용 패턴
style_patterns = find_reusable_styles(components)

# 애니메이션 트리거 관계
animation_triggers = map_animation_triggers(interactions)
```

### 4단계: 이미지 처리 (Sub Agent)

이미지 리소스 정확히 다운로드:

```python
for image in images:
    download_image(image.url, output_dir)
    extract_placeholder(image)
    save_metadata(image)
```

### 5단계: 컴포넌트 생성 (Master Agent)

전처리된 데이터를 바탕으로 React 컴포넌트 생성:

```jsx
// Header.jsx
export default function Header() {
  return (
    <header className="...">
      {/* TailwindCSS 클래스 */}
    </header>
  )
}
```

### 6단계: 애니메이션 구현 (Sub Agent)

motion/react로 애니메이션 추가:

```jsx
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  {children}
</motion.div>
```

### 7단계: 통합 및 검증 (Master Agent)

모든 컴포넌트 통합 및 최종 검증

## 파이프라인 다이어그램

```
사용자 요청
    ↓
Master Agent (질문 단계)
    ↓
Sub Agent 1: 데이터 추출
    → Python script: 전처리
    ↓
Sub Agent 2: 이미지 처리
    ↓
Python script: 연관관계 계산
    ↓
Master Agent: 컴포넌트 생성
    ↓
Sub Agent 3: 애니메이션 구현
    ↓
Master Agent: 통합 및 검증
    ↓
최종 결과
```

## 반드시 포함할 사항

### 1. Step-by-Step 정보 추출

각 단계별로:
- 무엇을 추출하는가
- 어떻게 전처리하는가
- 어떻게 후처리하는가

### 2. Agent 관계 및 역할

- Master Agent: 전체 흐름 관리
- Sub Agent 1: 데이터 추출
- Sub Agent 2: 이미지 처리
- Sub Agent 3: 애니메이션 구현

## 주의사항 요약

1. **Context 최적화**: 큰 데이터는 사전 필터링
2. **연관관계 사전 계산**: Code-level에서 처리 가능한 것은 미리 계산
3. **이미지 정확성**: 다운로드 + placeholder 추출

## 예제 사용

### 사용자 요청

```
Framer로 만든 이 랜딩페이지를 React로 클론 코딩해줘.
```

### Master Agent 응답

```
Framer 랜딩페이지 클론 코딩을 시작하기 전에 몇 가지 질문드립니다:

1. 컴포넌트 구조:
   - 페이지별 분리 (Recommended)
   - 기능별 분리
   - Atomic Design 패턴

2. 애니메이션 우선순위:
   - 모든 애니메이션 재현 (Recommended)
   - 주요 애니메이션만
   - 애니메이션 최소화

3. 반응형 디자인:
   - 모바일/태블릿/데스크톱 모두 (Recommended)
   - 데스크톱만
   - 모바일 우선

4. 이미지 최적화:
   - WebP + fallback (Recommended)
   - PNG/JPG 원본 사용
   - 외부 CDN 사용
```

## 관련 항목

- [crystalize-prompt](crystalize-prompt.md) - 프롬프트 압축으로 Context 최적화
- [subagent-creator](../SKILLS/subagent-creator.md) - Sub Agent 생성 방법
- [INDEX](../INDEX.md) - 전체 프로젝트 구조

## 활용 팁

1. **사전 계획**: 파이프라인을 먼저 설계하고 실행
2. **데이터 최소화**: 각 단계에서 필요한 최소 데이터만 전달
3. **Agent 특화**: 각 Sub Agent는 명확한 단일 책임
4. **검증 단계**: 각 단계마다 결과 검증
5. **반복 개선**: 실행 후 파이프라인 최적화

## 참고사항

- Master Agent가 전체 흐름 제어
- Sub Agent는 독립적 컨텍스트
- Python script로 무거운 계산 처리
- 비용과 정확도의 균형 유지
