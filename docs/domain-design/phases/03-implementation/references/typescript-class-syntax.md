# TypeScript 클래스 문법 정리

> curation 도메인 코드 기준

---

## 1. 기본 클래스 선언

```typescript
// 일반 클래스
export class CurationDisplay { ... }

// 추상 클래스 (직접 인스턴스화 불가, 상속용)
export abstract class Recommendation { ... }

// 상속
export class ContentRecommendation extends Recommendation { ... }
```

---

## 2. 접근 제어자 (Access Modifiers)

```typescript
class ContentRecommendation extends Recommendation {
  // private: 이 클래스 내부에서만 접근 가능
  private readonly _contentSN: number;

  // protected: 이 클래스 + 자식 클래스에서 접근 가능
  protected readonly _status: Status;

  // public (기본값): 어디서든 접근 가능
  readonly title: string;  // public 생략됨
}
```

| 제어자 | 클래스 내부 | 자식 클래스 | 외부 |
|--------|------------|------------|------|
| `private` | ✅ | ❌ | ❌ |
| `protected` | ✅ | ✅ | ❌ |
| `public` | ✅ | ✅ | ✅ |

---

## 3. readonly (읽기 전용)

```typescript
class ContentRecommendation {
  // 생성 후 변경 불가
  private readonly _contentSN: number;

  // 상수처럼 사용
  private readonly DEFAULT_EPISODE_NO = 1;
}

// ❌ 변경 시도하면 컴파일 에러
this._contentSN = 123;  // Error!
```

---

## 4. constructor (생성자)

### 일반 방식

```typescript
class ContentRecommendation {
  private readonly _contentSN: number;

  constructor(params: ContentRecommendationParams) {
    super(params);  // 부모 생성자 호출 (상속 시 필수)
    this._contentSN = params.contentSN;
    this.validate();  // 생성 시 검증
  }
}
```

### 축약 방식 (선언과 할당 동시에)

```typescript
class CurationDisplay {
  constructor(
    readonly title: string,           // 자동으로 this.title = title
    readonly description: string,
    readonly thumbnailUrl: string,
  ) {
    this.validateRequired();
  }
}
```

---

## 5. 메서드 종류

```typescript
abstract class Recommendation {
  // === 일반 메서드 ===
  getStatusLabel(): string {
    return Recommendation.toStatusLabel(this._status);
  }

  isActive(): boolean {
    return this._status === 1;
  }

  // === 추상 메서드 (자식이 반드시 구현) ===
  abstract getTypeLabel(): string;
  abstract getGenderLabel(): string;
  protected abstract validate(): void;

  // === 정적 메서드 (인스턴스 없이 호출) ===
  static toStatusLabel(status: Status): string {
    return status === 1 ? 'ON' : 'OFF';
  }
}
```

### 사용법

```typescript
const rec = new ContentRecommendation(params);

// 일반 메서드: 인스턴스.메서드()
rec.getStatusLabel();

// 추상 메서드 구현: 인스턴스.메서드()
rec.getTypeLabel();

// 정적 메서드: 클래스명.메서드()
Recommendation.toStatusLabel(1);
```

---

## 6. Getter (프로퍼티처럼 접근)

```typescript
class ContentRecommendation {
  private readonly _contentSN: number;  // private 필드

  // getter: 메서드처럼 정의, 프로퍼티처럼 접근
  get contentSN(): number {
    return this._contentSN;
  }
}
```

### 사용법

```typescript
const rec = new ContentRecommendation(params);

rec.contentSN;      // ✅ 프로퍼티처럼 접근 (괄호 없음)
rec.contentSN();    // ❌ 메서드 아님
rec._contentSN;     // ❌ private이라 접근 불가
```

### 왜 getter 사용?

```typescript
// private 필드 + getter = 읽기만 허용
private readonly _contentSN: number;  // 외부 접근 불가
get contentSN(): number { ... }        // 읽기만 가능

// vs public readonly = 읽기 가능하지만 네이밍 제약
readonly contentSN: number;  // _없이 바로 노출
```

---

## 7. 상속과 오버라이드

### 부모 (추상)

```typescript
abstract class Recommendation {
  protected abstract validate(): void;  // 추상 메서드

  getStatusLabel(): string {            // 일반 메서드
    return Recommendation.toStatusLabel(this._status);
  }
}
```

### 자식

```typescript
class ContentRecommendation extends Recommendation {
  // 추상 메서드 구현 (필수)
  protected validate(): void {
    if (_.isNil(this._contentSN)) {
      throw new Error('contentSN is required');
    }
  }

  // 일반 메서드 오버라이드 (선택)
  getStatusLabel(): string {
    // super로 부모 메서드 호출
    return '커스텀: ' + super.getStatusLabel();
  }
}
```

---

## 8. 전체 구조 요약

### 추상 클래스 (부모)

```typescript
export abstract class Recommendation {
  // 1. protected 필드 (자식 접근 가능)
  protected readonly _status: Status;
  protected readonly _display: CurationDisplay;

  // 2. 생성자
  constructor(params: RecommendationParams) {
    this._status = params.status;
    this._display = params.display;
  }

  // 3. 정적 메서드
  static toStatusLabel(status: Status): string { ... }

  // 4. 일반 메서드
  getStatusLabel(): string { ... }
  getDisplay(): CurationDisplay { ... }

  // 5. 추상 메서드 (자식이 구현)
  abstract getTypeLabel(): string;
  protected abstract validate(): void;

  // 6. Getter
  get status(): Status { return this._status; }
}
```

### 구체 클래스 (자식)

```typescript
export class ContentRecommendation extends Recommendation {
  // 1. private 필드 (이 클래스만)
  private readonly _contentSN: number;
  private readonly DEFAULT_EPISODE_NO = 1;

  // 2. 생성자 (super 호출 필수)
  constructor(params: ContentRecommendationParams) {
    super(params);
    this._contentSN = params.contentSN;
    this.validate();
  }

  // 3. 정적 메서드
  static toGenderLabel(gender: Gender): string { ... }

  // 4. 추상 메서드 구현
  getTypeLabel(): string { return '작품'; }
  protected validate(): void { ... }

  // 5. Getter
  get contentSN(): number { return this._contentSN; }
}
```

---

## 9. 자주 쓰는 패턴

### 불변 객체 (VO) - constructor 축약

```typescript
class CurationDisplay {
  constructor(
    readonly title: string,
    readonly thumbnailUrl: string,
  ) {}
}
```

### 복사 후 변경 (withXxx 패턴)

```typescript
withTitle(title: string): CurationDisplay {
  return new CurationDisplay(title, this.thumbnailUrl);
}
```

### 널리시 코얼레싱 (??)

```typescript
this._episodeNo = params.episodeNo ?? this.DEFAULT_EPISODE_NO;
```

---

## 10. 용어 정리

| 용어 | 설명 | 예시 |
|------|------|------|
| **클래스** | 객체의 설계도 | `class Recommendation` |
| **인스턴스** | 클래스로 만든 실제 객체 | `new ContentRecommendation()` |
| **필드** | 클래스 내 변수 | `private readonly _contentSN` |
| **메서드** | 클래스 내 함수 | `getStatusLabel()` |
| **생성자** | 인스턴스 생성 시 호출 | `constructor()` |
| **추상 클래스** | 직접 인스턴스화 불가 | `abstract class` |
| **추상 메서드** | 자식이 반드시 구현 | `abstract validate()` |
| **정적 메서드** | 인스턴스 없이 호출 | `static toStatusLabel()` |
| **getter** | 프로퍼티처럼 접근하는 메서드 | `get contentSN()` |
| **상속** | 부모 클래스 확장 | `extends Recommendation` |
| **오버라이드** | 부모 메서드 재정의 | 자식에서 같은 이름 메서드 |
