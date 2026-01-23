# 컴포넌트 테스트 예제

```typescript
// __tests__/FeatureComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { FeatureComponent } from '../FeatureComponent';

describe('FeatureComponent', () => {
  test('로딩 중일 때 스피너 표시', () => {
    render(<FeatureComponent data={[]} isLoading={true} onAction={jest.fn()} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('데이터 있을 때 목록 렌더링', () => {
    const data = [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }];
    render(<FeatureComponent data={data} isLoading={false} onAction={jest.fn()} />);

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  test('빈 데이터일 때 빈 상태 표시', () => {
    render(<FeatureComponent data={[]} isLoading={false} onAction={jest.fn()} />);
    expect(screen.getByText(/데이터가 없습니다/)).toBeInTheDocument();
  });
});
```
