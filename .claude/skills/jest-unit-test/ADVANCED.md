# Jest Unit Test - Advanced Concepts

> **빠른 참조**: `SKILL.md`로 돌아가기

이 문서는 테스트 철학과 심화 패턴을 다룹니다.

---

## 📖 좋은 단위 테스트란?

단위 테스트의 궁극적 목표: **"소프트웨어 프로젝트의 지속 가능한 성장"**

### 4가지 기둥

좋은 단위 테스트는 4가지 기둥을 균형있게 갖춘다:

#### 1. 회귀 방지 (Regression Prevention)

- **정의**: 버그를 얼마나 잘 잡아내는가?
- **영향 요인**:
  - 코드 커버리지 ↑ → 회귀 방지 ↑
  - 코드 복잡도 ↑ → 회귀 방지 ↑
  - 도메인 중요도 ↑ → 회귀 방지 ↑

#### 2. 리팩터링 내성 (Refactoring Resistance)

- **정의**: 코드 변경 시 테스트가 깨지지 않는가?
- **핵심**: False Positive(거짓 양성) 최소화
- **방법**: **구현 세부사항이 아닌 관찰 가능한 동작 테스트**

#### 3. 빠른 피드백 (Fast Feedback)

- **정의**: 테스트 실행이 빠른가?
- **영향**: 개발자가 자주 실행할 수 있는가?
- **목표**: 밀리초 단위 (단위 테스트)

#### 4. 유지보수성 (Maintainability)

- **정의**: 이해하기 쉽고, 수정하기 쉬운가?
- **영향 요인**:
  - 코드 크기 ↓ → 유지보수성 ↑
  - 코드 복잡도 ↓ → 유지보수성 ↑

### 트레이드오프

⚠️ **모든 기둥을 동시에 최대화할 수 없다.**

- Mock 과다 사용 → 리팩터링 내성 ↓, False Positive ↑
- 통합 테스트 → 빠른 피드백 ↓, 회귀 방지 ↑
- **균형이 핵심**: 각 기둥의 중요도를 상황에 맞게 조정

---

## 📐 테스트 정확도: 신호 대비 소음

테스트의 품질을 정량적으로 측정하는 공식:

```
테스트 정확도 = 신호 / (신호 + 소음)
```

- **신호 (Signal)**: 테스트가 실제 버그를 찾는 횟수
- **소음 (Noise)**: 거짓 양성 - 버그가 없는데 테스트가 실패하는 경우

**목표**: 소음을 최소화하여 정확도 1.0에 가깝게 유지

### 예시: 소음 발생

```typescript
// ❌ 소음: 리팩터링 시 테스트 깨짐
test('광고 설정 필터링', () => {
	expect(usecase['_filterByType']).toHaveBeenCalled(); // private 메서드
	expect(usecase['_sortByPriority']).toHaveBeenCalled();
	// → 메서드명 변경 시 테스트 실패 (소음)
});

// ✅ 신호만: 동작 검증
test('광고 설정 필터링: type=2인 항목만 반환', () => {
	const result = usecase.exec(input);
	expect(result).toEqual([{ type: 2, name: 'buzzvil' }]);
	// → 리팩터링해도 결과가 같으면 통과 (신호)
});
```

---

## 🏛️ 런던파 vs 고전파

### 고전파 (Classical School) - **우리 프로젝트 기준**

- **단위**: 클래스가 아닌 **동작 (Behavior)**
- **격리**: 테스트끼리 격리 (동시 실행 가능하게)
- **Mock 사용**: 외부 의존성만 (DB, API, 파일 시스템)
- **장점**: 리팩터링 내성 ↑

```typescript
// 고전파: 협력 객체는 실제로 사용
test('광고 설정 필터링 후 변환', () => {
	const filter = new FilterUseCase(); // 실제 객체
	const transformer = new TransformUseCase(); // 실제 객체

	const service = new AppAdService(filter, transformer);
	const result = service.exec(input);

	expect(result).toEqual(expectedOutput); // 최종 결과만 검증
});
```

### 런던파 (London School / Mockist)

- **단위**: 클래스
- **격리**: 클래스끼리 격리 (모든 협력 객체 Mock)
- **Mock 사용**: 모든 의존성
- **단점**: 리팩터링 내성 ↓, 과잉 명세 위험

```typescript
// 런던파: 모든 의존성을 Mock
test('광고 설정 필터링 후 변환', () => {
	const mockFilter = { exec: jest.fn() }; // Mock
	const mockTransformer = { exec: jest.fn() }; // Mock

	const service = new AppAdService(mockFilter, mockTransformer);
	service.exec(input);

	expect(mockFilter.exec).toHaveBeenCalled(); // 내부 호출 검증
	expect(mockTransformer.exec).toHaveBeenCalled();
});
```

### 🎯 프로젝트 정책: 고전파 우선

- **UseCase 테스트**: 실제 로직 실행, Repository만 Mock
- **Service 테스트**: UseCase 조합은 실제로, DB/API만 Mock
- **이유**: 리팩터링 내성 확보, 구현 세부사항 변경에 강함

---

## ⚠️ 과잉 명세 (Overspecification) - 상세

**정의**: 관찰 가능한 동작보다 **더 많은 것**을 검증하는 테스트

- **결과**: 리팩터링 내성 ↓, 거짓 양성 ↑
- **원인**: 구현 세부사항까지 검증
- **해결**: 최종 결과만 검증

### 과잉 명세의 유형

#### 1. 내부 호출 순서 검증

```typescript
// ❌ 과잉 명세
expect(mockRepo.selectAppAdSettings).toHaveBeenCalledBefore(
	mockRepo.upsertAppAdSettings,
);

// ✅ 최종 결과만
expect(result).toEqual({ success: true });
```

#### 2. 중간 상태 검증

```typescript
// ❌ 과잉 명세
expect(mockFilter.exec).toHaveBeenCalledTimes(1);
expect(mockTransformer.exec).toHaveBeenCalledWith(filteredData);

// ✅ 최종 결과만
expect(result).toEqual(expectedOutput);
```

#### 3. 호출 횟수 과도한 검증

```typescript
// ❌ 과잉 명세
expect(mockLogger.debug).toHaveBeenCalledTimes(5); // 로깅은 구현 세부사항

// ✅ 비즈니스 로직만
expect(result).toEqual(expectedResult);
```

**원칙**: Mock 검증은 **외부 의존성의 부작용**만, 내부 협력 객체는 검증하지 않음

---

## 🔍 단위 테스트 vs 통합 테스트 - 상세

### 흔한 오해 vs 실용적 정의

| 구분     | ❌ 흔한 오해     | ✅ 실용적 정의                    |
| -------- | ---------------- | --------------------------------- |
| **단위** | 클래스 하나      | 동작 단위 (여러 클래스 포함 가능) |
| **격리** | 모든 의존성 Mock | 공유 의존성만 격리                |
| **속도** | 빠름             | 빠름 (메모리 내)                  |

### 단위 테스트 (Unit Test)

- **정의**: 단일 동작을 검증, 외부 공유 의존성 없음
- **격리**: 테스트끼리 격리 (동시 실행 가능)
- **의존성**: 프로세스 외부 의존성 제거 (DB, API, 파일)
- **속도**: 매우 빠름 (밀리초)

```typescript
// ✅ 단위 테스트: 메모리 내에서 완결
describe('FilterAppAdSettings', () => {
	test('type=2인 설정만 반환', () => {
		const usecase = new FilterAppAdSettings();
		const input = [
			{ type: 1, name: 'adcash' },
			{ type: 2, name: 'buzzvil' },
		];

		const result = usecase.exec(input);

		expect(result).toEqual([{ type: 2, name: 'buzzvil' }]);
	});
});
```

### 통합 테스트 (Integration Test)

- **정의**: 여러 컴포넌트 간 협력을 검증
- **의존성**: 프로세스 외부 의존성 포함 (실제 DB, API)
- **속도**: 느림 (초 단위)
- **목적**: 시스템 통합 지점 검증

```typescript
// ✅ 통합 테스트: 실제 DB 사용
describe('UpsertAppAdSettings (Integration)', () => {
	test('DB에 실제로 저장 후 조회 가능', async () => {
		const usecase = new UpsertAppAdSettings();
		const params = createValidParams();

		await usecase.exec(params); // 실제 DB에 저장

		const result = await db.query('SELECT ...');
		expect(result[0].adKey).toBe(params.adKey);
	});
});
```

### 프로젝트 기준

| 테스트 대상 | 분류 | 의존성 처리                   | 실행 방법    |
| ----------- | ---- | ----------------------------- | ------------ |
| UseCase     | 단위 | Repository Mock               | `npx jest`   |
| Service     | 단위 | Repository Mock, UseCase 실제 | `npx jest`   |
| API Route   | 통합 | 실제 DB 연결                  | `.http` 파일 |

---

## 🎯 Humble Object 패턴 - 상세

**목적**: 테스트하기 어려운 의존성(DB, API, UI)과 비즈니스 로직 분리

- **Humble Object**: 의존성 처리만 (최소한의 로직, 테스트 생략 가능)
- **Testable Object**: 순수 비즈니스 로직 (의존성 없음, 테스트 집중)

### Before: 혼재된 구조

```typescript
// Service에 DB 로직 + 비즈니스 로직 혼재
export const upsertAppAdSettings = async (dto) => {
	// DB 조회 (테스트 어려움)
	const existing = await db.query('SELECT ...');

	// 비즈니스 로직 (테스트 필요!)
	const filtered = dto.settings.filter((s) => s.isDisplay === 1);
	const transformed = filtered.map((s) => ({
		...s,
		exposureWeight: s.exposureWeight / 100,
	}));

	// DB 저장 (테스트 어려움)
	await db.query('INSERT ...');
};
```

### After: Humble Object 분리

```typescript
// Testable: 순수 로직만 (UseCase)
export class TransformAppAdSettings {
	exec(settings) {
		// DB 의존 없음!
		return settings
			.filter((s) => s.isDisplay === 1)
			.map((s) => ({ ...s, exposureWeight: s.exposureWeight / 100 }));
	}
}

// Humble: DB 처리만 (Service)
export const upsertAppAdSettings = async (dto) => {
	const usecase = new TransformAppAdSettings();
	const transformed = usecase.exec(dto.settings); // 순수 로직 호출
	await repository.upsertAppAdSettings(transformed); // DB 처리
};

// 테스트: Testable Object만 집중
test('isDisplay=1인 설정만 필터링', () => {
	const usecase = new TransformAppAdSettings();
	const input = [
		{ isDisplay: 0, exposureWeight: 50 },
		{ isDisplay: 1, exposureWeight: 50 },
	];

	const result = usecase.exec(input);

	expect(result).toEqual([{ isDisplay: 1, exposureWeight: 0.5 }]);
});
```

**장점**:

- 비즈니스 로직만 격리 테스트
- 의존성 Setup 불필요
- 테스트 속도 빠름

---

## 🏭 테스트 픽스처 재사용 전략

> **실전 사용법**: `SKILL.md`의 "테스트 더블 실전 패턴" 섹션 참조

### 안티패턴: beforeEach

**문제**: 테스트 간 결합도 증가

```typescript
// ❌ beforeEach: 테스트 결합도 증가
describe('UpsertAppAdSettings', () => {
	let commonParams;

	beforeEach(() => {
		commonParams = {
			// 모든 테스트가 공유
			productId: 'prod-123',
			category: 'electronics',
			options: [],
		};
	});

	test('케이스1', () => {
		commonParams.settings = [{ adKey: 'abc' }]; // 수정
		// 다른 테스트에 영향 가능성
	});

	test('케이스2', () => {
		// commonParams가 이전 테스트에서 변경되었을 수 있음
	});
});
```

**왜 문제인가?**
1. **암묵적 결합**: 테스트가 beforeEach 상태에 의존
2. **실행 순서 의존**: 이전 테스트가 공유 객체를 변경할 수 있음
3. **가독성 저하**: 테스트만 보고 전체 컨텍스트 파악 어려움
4. **유지보수 어려움**: beforeEach 변경 시 모든 테스트 영향

### 권장: Factory Pattern (Object Mother)

**장점:**
- ✅ **테스트 독립성**: 각 테스트가 자체 데이터 생성
- ✅ **명시적**: 테스트 내에서 필요한 데이터가 명확
- ✅ **커스터마이징 용이**: 필요한 필드만 override
- ✅ **타입 안전**: fishery로 타입 체크

**프로젝트에서 사용:**
- `fishery` - Factory 정의
- `faker` - 랜덤 데이터 생성
- 위치: `__tests__/factories/`

```typescript
// ✅ Factory 함수: 명시적 재사용
function createValidParams(overrides = {}) {
	return {
		orderId: 'order-123',
		status: 'PENDING',
		items: [],
		...overrides, // 커스터마이징
	};
}

test('케이스1: 독립적', () => {
	const params = createValidParams({
		settings: [{ adKey: 'abc' }],
	});
	// 다른 테스트에 영향 없음
});
```

### Fake Repository Pattern

**언제 사용?**
- 상태 검증이 필요한 CRUD 시나리오
- Mock보다 실제 동작에 가까운 테스트

**장점:**
- ✅ **상태 검증**: 여러 작업 후 최종 상태 확인
- ✅ **실제 동작 시뮬레이션**: Mock보다 현실적
- ✅ **복잡한 시나리오**: Upsert, 중복 방지 등

**프로젝트에서 사용:**
- 위치: `__tests__/fakes/`
- In-memory 데이터 구조 (Map, Array)
- 테스트 헬퍼 메서드 (`clear()`, `givenSettingsExist()`)

**Mock vs Fake 선택:**
- 단순 호출 검증 → Mock
- CRUD 시나리오 → Fake
- 상태 전이 검증 → Fake

### beforeEach 사용이 적절한 경우

```typescript
// ✅ beforeEach: 부작용 없는 초기화만
beforeEach(() => {
	jest.clearAllMocks();  // Mock 초기화
	jest.useFakeTimers();  // 타이머 설정
});
```

**원칙**: 테스트 데이터는 Factory로, 환경 설정만 beforeEach로

---

## ✂️ CanExecute/Execute 패턴

**사용 시기**: 검증과 실행 로직이 복잡하고 분리가 필요할 때

### Before: 검증과 실행 혼재

```typescript
export class CreateOrder {
	async exec(params) {
		// 검증 로직
		if (!params.productId) throw new Error('productId required');
		if (!params.customerId) throw new Error('customerId required');
		if (params.quantity > 100) throw new Error('quantity exceeds limit');

		// 실행 로직
		return await repository.save(params);
	}
}
```

### After: CanExecute/Execute 분리

```typescript
export class CreateOrder {
	canExecute(params): { valid: boolean; error?: string } {
		if (!params.productId) return { valid: false, error: 'productId required' };
		if (!params.customerId) return { valid: false, error: 'customerId required' };
		if (params.quantity > 100) {
			return { valid: false, error: 'quantity exceeds limit' };
		}
		return { valid: true };
	}

	async exec(params) {
		const validation = this.canExecute(params);
		if (!validation.valid) throw new Error(validation.error);

		return await repository.save(params);
	}
}

// 테스트: 검증 로직만 독립 테스트
test('productId 누락 시 검증 실패', () => {
	const usecase = new CreateOrder();
	const result = usecase.canExecute({ customerId: 'cust-1' });
	expect(result).toEqual({ valid: false, error: 'productId required' });
});
```

**주의**: 간단한 검증은 과도한 분리보다 inline 검증이 나음

---

## 🧪 참조 투명성 (Referential Transparency)

**정의**: 같은 입력 → 항상 같은 출력, 부작용 없음

### 참조 불투명: 테스트 어려움

```typescript
// ❌ 참조 불투명
export class CalculateAdRevenue {
	private cache = new Map(); // 내부 상태

	exec(performanceData) {
		// 캐시 확인 (부작용)
		if (this.cache.has(performanceData.id)) {
			return this.cache.get(performanceData.id);
		}

		const revenue = performanceData.revenue * 0.7;
		this.cache.set(performanceData.id, revenue); // 상태 변경
		return revenue;
	}
}
```

### 참조 투명: 테스트 쉬움

```typescript
// ✅ 참조 투명
export class CalculateAdRevenue {
	exec(performanceData) {
		// 순수 함수: 입력만으로 출력 결정
		return performanceData.revenue * 0.7;
	}
}

// 캐시는 Service 레이어에서 처리 (Humble)
export const getAdRevenue = async (id: string) => {
	const cached = cache.get(id);
	if (cached) return cached;

	const data = await repository.selectPerformance(id);
	const usecase = new CalculateAdRevenue();
	const revenue = usecase.exec(data); // 순수 함수 호출

	cache.set(id, revenue);
	return revenue;
};

// 테스트: 매우 간단
test('매출 70% 계산', () => {
	const usecase = new CalculateAdRevenue();
	const result = usecase.exec({ revenue: 100 });
	expect(result).toBe(70); // 항상 같은 결과
});
```

**원칙**: UseCase는 순수 함수로, 부작용(DB, 캐시)은 Service로

---

## 🚫 도메인 지식 유출 - 상세

**문제**: 테스트 코드가 프로덕션 코드와 **같은 비즈니스 로직**을 중복 구현

### 왜 문제인가?

1. **회귀 방지 실패**: 프로덕션 로직 버그가 테스트에도 복사됨
2. **이중 유지보수**: 로직 변경 시 프로덕션 + 테스트 모두 수정
3. **테스트 의미 상실**: 같은 로직으로 같은 로직 검증

### 나쁜 예시

```typescript
// ❌ 테스트가 도메인 로직을 알고 있음
test('광고 설정 필터링', () => {
	const allSettings = [
		{ type: 1, isDisplay: 1, adKey: 'abc' },
		{ type: 2, isDisplay: 0, adKey: 'def' },
		{ type: 2, isDisplay: 1, adKey: 'ghi', exposureWeight: 50 },
	];

	// 테스트가 필터링 로직을 재구현! (도메인 지식 유출)
	const expected = allSettings
		.filter((s) => s.type === 2 && s.isDisplay === 1)
		.map((s) => ({ ...s, exposureWeight: s.exposureWeight / 100 }));

	const result = usecase.filterBuzzvilSettings(allSettings);
	expect(result).toEqual(expected);
});
```

**문제점**:

- 프로덕션 로직이 `s.type === 3`으로 버그가 있어도
- 테스트도 같은 버그로 통과함

### 좋은 예시

```typescript
// ✅ 구체적 입출력으로 검증
test('Buzzvil 설정 필터링: type=2, isDisplay=1만 반환', () => {
	const input = [
		{ type: 1, isDisplay: 1, adKey: 'abc' },
		{ type: 2, isDisplay: 0, adKey: 'def' },
		{ type: 2, isDisplay: 1, adKey: 'ghi', exposureWeight: 50 },
	];

	const result = usecase.filterBuzzvilSettings(input);

	// 구체적인 예상 결과 (로직 재구현 없음)
	expect(result).toEqual([
		{ type: 2, isDisplay: 1, adKey: 'ghi', exposureWeight: 0.5 },
	]);
});
```

**장점**:

- 프로덕션 로직 버그 시 테스트 실패 (회귀 방지)
- 예상 결과가 명확
- 유지보수 용이

### 원칙

테스트는:

- **"무엇을 반환해야 하는가"**만 알고
- **"어떻게 계산하는가"**는 모름

---

## 정리

### 핵심 원칙

1. **관찰 가능한 동작**만 테스트 (구현 세부사항 제외)
2. **고전파 우선** (외부 의존성만 Mock)
3. **신호 최대화, 소음 최소화** (테스트 정확도 1.0 목표)
4. **Humble Object**로 비즈니스 로직 분리
5. **참조 투명성** 확보 (순수 함수)

### 피해야 할 것

1. 도메인 지식 유출 (로직 재구현)
2. Stub 호출 검증 (불필요)
3. 과잉 명세 (내부 구현 검증)
4. private 메서드 테스트
5. 코드 오염 (테스트를 위한 프로덕션 변경)

---

**빠른 참조**: `SKILL.md`로 돌아가기
