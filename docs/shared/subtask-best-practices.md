# 하위 작업(Sub-task) 모범 사례

> 병렬 하위 에이전트를 효과적으로 활용하는 방법

---

## 개요

복잡한 작업을 분해하여 병렬로 처리하면:
- 컨텍스트 사용 최소화
- 처리 시간 단축
- 각 작업의 집중도 향상

---

## 핵심 원칙

### 1. 병렬 실행

```python
# ✅ 병렬 실행: 독립적인 작업들을 동시에
tasks = [
    Task("Research database schema", db_research_prompt),
    Task("Find API patterns", api_research_prompt),
    Task("Investigate UI components", ui_research_prompt),
    Task("Check test patterns", test_research_prompt)
]
await asyncio.gather(*tasks)
```

### 2. 집중된 프롬프트

각 하위 작업에 명확한 지시 제공:

```markdown
✅ 좋은 프롬프트:
- "humanlayer-wui/src/components/ 디렉토리에서 Button 컴포넌트 패턴 찾기"
- "hld/internal/store/ 에서 Repository 패턴 분석"

❌ 나쁜 프롬프트:
- "UI 컴포넌트 찾기" (너무 모호)
- "코드베이스 분석" (범위가 넓음)
```

### 3. 디렉토리 명시

```markdown
✅ 명시적 디렉토리:
- WUI 관련: `humanlayer-wui/` 디렉토리
- Daemon 관련: `hld/` 디렉토리
- API 관련: `humanlayer-api/` 디렉토리

❌ 모호한 표현:
- "UI에서 찾아봐" (WUI? 다른 UI?)
- "백엔드 코드" (어떤 서비스?)
```

---

## 하위 작업 유형

| 유형 | 용도 | 예시 에이전트 |
|------|------|-------------|
| **Locator** | 파일/코드 위치 찾기 | `codebase-locator` |
| **Analyzer** | 구현 방식 분석 | `codebase-analyzer` |
| **Pattern Finder** | 유사 패턴 검색 | `codebase-pattern-finder` |
| **History** | 이력/컨텍스트 조사 | `thoughts-locator`, `thoughts-analyzer` |

---

## 프롬프트 구조

효과적인 하위 작업 프롬프트 구조:

```markdown
## 목표
[구체적으로 무엇을 찾거나 분석할지]

## 검색 범위
[어떤 디렉토리, 어떤 파일 패턴]

## 기대 결과
[파일:라인 형식, 코드 스니펫, 패턴 설명 등]

## 제약 사항
- 읽기 전용 도구만 사용
- 개선 제안 하지 않음 (리서치의 경우)
```

---

## 결과 검증

하위 작업 완료 후:

1. **모든 작업 완료 대기** - 일부만 완료된 상태로 진행하지 않음
2. **결과 교차 검증** - 의심스러운 결과는 추가 조사
3. **파일:라인 참조 확인** - 실제 파일과 대조
4. **종합 후 제시** - 개별 결과가 아닌 통합된 분석

---

## 안티패턴

### 1. 순차적 실행

```python
# ❌ 순차 실행: 시간 낭비
result1 = await task1.run()
result2 = await task2.run()  # task1 완료까지 대기
result3 = await task3.run()  # task2 완료까지 대기

# ✅ 병렬 실행
results = await asyncio.gather(task1.run(), task2.run(), task3.run())
```

### 2. 너무 큰 범위

```markdown
❌ "전체 코드베이스에서 모든 패턴 찾기"
✅ "src/services/에서 Repository 패턴 찾기"
```

### 3. 결과 무시

```markdown
❌ 하위 작업 결과를 검증 없이 사용
✅ 결과가 예상과 다르면 후속 작업으로 확인
```

---

## 체크리스트

- [ ] 독립적인 작업들은 병렬로 실행하는가?
- [ ] 각 프롬프트에 구체적인 디렉토리가 명시되었는가?
- [ ] 기대하는 결과 형식이 명시되었는가?
- [ ] 모든 하위 작업 완료를 기다리는가?
- [ ] 결과를 검증하고 종합하는가?

---

## 관련 문서

- [Research Codebase 프롬프트](../context-engineering/research-codebase.md) - 코드베이스 리서치 프로세스
- [Create Plan 프롬프트](../context-engineering/create-plan.md) - 구현 계획 작성 프로세스
