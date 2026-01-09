---
name: frontend-feature
description: pages/, components/, hooks/ 신규 기능 TDD 개발. Hook 설계 → 컴포넌트 → 페이지 통합.
---

# Frontend 신규 기능 (TDD)

## 관련 문서
- 컴포넌트: `src/components/CLAUDE.md`
- Hooks: `src/hooks/CLAUDE.md`

## 관련 스킬 (필수)
- `tdd-new-feature`: TDD 방법론, Red-Green-Refactor
- `jest-unit-test`: 테스트 문법, Mock/Fake

## 개발 흐름

```
요구사항 → 테스트 목록 → Hook TDD → 컴포넌트 TDD → 페이지 통합
                         ↓
           Red → Green → Refactor
```

## Phase 1: 분석 & 설계

### 요구사항
1. 기능 / 사용자 스토리
2. API 연동
3. 상태 관리

### 테스트 목록
[references/test-list-template.md](references/test-list-template.md)

### 기존 패턴 확인
유사 hooks 구조, 재사용 컴포넌트

## Phase 2: Hook TDD

### 1. 테스트 먼저 (Red)
[references/hook-test-example.md](references/hook-test-example.md)

### 2. 구현 (Green)
```typescript
export const useFeatureData = (filters?) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getData(filters);
      setData(result);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
```

## Phase 3: 컴포넌트 TDD

### 1. 테스트 먼저 (Red)
[references/component-test-example.md](references/component-test-example.md)

### 2. 구현 (Green)
```typescript
export const FeatureComponent = ({ data, isLoading, onAction }) => {
  if (isLoading) return <Spinner />;
  if (data.length === 0) return <Text>데이터가 없습니다</Text>;

  return (
    <Box>
      {data.map(item => (
        <FeatureItem key={item.id} item={item} onClick={() => onAction(item.id)} />
      ))}
    </Box>
  );
};
```

### 규칙
- Chakra UI만 (Tailwind 금지)
- 로직은 hooks로
- Props 타입 명시

## Phase 4: 페이지 통합

```typescript
const FeaturePage = () => {
  const { data, loading, error, refetch } = useFeatureData();
  const { handleSubmit, submitting } = useFeatureActions();

  return (
    <Layout>
      <FeatureComponent data={data} isLoading={loading} onAction={handleSubmit} />
    </Layout>
  );
};
```

## 테스트 실행

```bash
npx jest src/hooks/features/[domain] --coverage
npx jest src/components/[domain] --coverage
```

## 체크리스트

### TDD
- [ ] 테스트 목록 먼저
- [ ] Hook 테스트 → 구현
- [ ] 컴포넌트 테스트 → 구현
- [ ] 모든 테스트 통과

### Hook
- [ ] loading/error 상태
- [ ] useCallback/useMemo
- [ ] 커버리지 80%+

### Component
- [ ] Chakra UI만
- [ ] Props 타입
- [ ] 에러/로딩 UI
- [ ] 접근성 (ARIA)

## 상세 가이드

- [Hook 테스트 예제](references/hook-test-example.md)
- [Action Hook 패턴](references/action-hook.md)
- [컴포넌트 테스트 예제](references/component-test-example.md)
- [테스트 목록 템플릿](references/test-list-template.md)
