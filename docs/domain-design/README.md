# 객체지향 도메인 설계 가이드라인

> 조영호의 "오브젝트", "객체지향의 사실과 오해"를 기반으로 한 실무 가이드

---

## 설계 Flow

```
Phase 1: 분석     Phase 2: 설계     Phase 3: 구현     Phase 4: 테스트    Phase 5: 검증
    │                 │                 │                 │                 │
    ↓                 ↓                 ↓                 ↓                 ↓
 협력 시나리오    책임 할당       Entity/VO      Red-Green       안티패턴
 메시지 추출     인터페이스      Factory/Repo    Refactor       체크리스트
```

**현재 단계에서 뭘 참조해야 하는가?**

| Phase | 목표 | 바로가기 |
|-------|------|----------|
| [Phase 1: 분석](./phases/01-analysis/PHASE.md) | 도메인 이해, 협력 시나리오, 메시지 추출 | 협력이 먼저 |
| [Phase 2: 설계](./phases/02-design/PHASE.md) | 책임 할당, 인터페이스 정의, 의존성 관리 | GRASP + SOLID |
| [Phase 3: 구현](./phases/03-implementation/PHASE.md) | Entity/VO, Aggregate, Factory, Repository | DDD 패턴 |
| [Phase 4: 테스트](./phases/04-test-refactor/PHASE.md) | TDD 사이클, 리팩토링, 코드 냄새 제거 | Red-Green-Refactor |
| [Phase 5: 검증](./phases/05-verification/PHASE.md) | 안티패턴 점검, 품질 체크리스트 | 최종 검증 |

---

## 빠른 참조

### 핵심 원칙

| 원칙 | 한 줄 설명 | 참조 |
|------|-----------|------|
| 협력, 책임, 역할 | 협력이 먼저, 메시지가 객체를 선택 | [OOP 핵심](./principles/oop-fundamentals.md) |
| Tell, Don't Ask | 객체에게 묻지 말고 시켜라 | [OOP 핵심](./principles/oop-fundamentals.md) |
| SOLID | 단일책임, 개방폐쇄, 리스코프, 인터페이스분리, 의존성역전 | [SOLID](./principles/solid.md) |
| GRASP | 정보전문가, 창조자, 낮은결합, 높은응집, 다형성 | [GRASP](./principles/grasp-patterns.md) |

### 자주 묻는 질문

| 질문 | 답변 위치 |
|------|-----------|
| 협력 시나리오는 어떻게 작성하나? | [Phase 1 > 협력 시나리오](./phases/01-analysis/references/collaboration-scenario.md) |
| 책임은 누구에게 할당하나? | [Phase 2 > 책임 할당](./phases/02-design/references/responsibility-assignment.md) |
| Entity vs Value Object 구분 기준? | [Phase 3 > Entity/VO](./phases/03-implementation/references/entity-vo.md) |
| Factory는 언제 쓰나? | [Phase 3 > Factory & Repository](./phases/03-implementation/references/factory-repository.md) |
| 상속 vs 합성 언제 쓰나? | [Phase 3 > 합성과 상속](./phases/03-implementation/references/composition-inheritance.md) |
| TDD 사이클은 어떻게? | [Phase 4 > TDD Cycle](./phases/04-test-refactor/PHASE.md) |
| 빈약한 도메인 모델이란? | [Phase 5 > 안티패턴](./phases/05-verification/references/anti-patterns.md) |

---

## 책임 할당 순서 (핵심 프로세스)

```
1. 협력 시나리오 작성
   "사용자가 주문을 생성한다" → 필요한 메시지들 추출

2. 메시지 결정
   calculateTotal(), validateStock(), createOrder()

3. 정보 전문가 찾기
   "이 메시지를 처리할 정보를 누가 가지고 있는가?"

4. 책임 할당
   Order가 items 정보를 가짐 → calculateTotal() 책임 할당

5. 협력 완성
   객체들이 메시지를 주고받으며 유스케이스 완성
```

---

## 실무 적용 단계

```
1. 도메인 이해      → 유비쿼터스 언어 정의
2. 협력 시나리오    → 메시지 추출
3. 책임 할당        → GRASP 패턴 적용
4. 인터페이스 정의  → 변경 보호
5. TDD로 구현       → Red-Green-Refactor
6. 리팩토링         → 의존성 관리 개선
7. 반복             → 설계는 진화한다
```

---

## 디렉토리 구조

```
docs/domain-design/
├── README.md                          # 진입점 (현재 문서)
│
├── phases/
│   ├── 01-analysis/                   # Phase 1: 분석/이해
│   ├── 02-design/                     # Phase 2: 설계
│   ├── 03-implementation/             # Phase 3: 구현
│   ├── 04-test-refactor/              # Phase 4: 테스트 & 리팩토링
│   └── 05-verification/               # Phase 5: 검증
│
└── principles/                        # 핵심 원칙 (레퍼런스용)
    ├── oop-fundamentals.md            # 객체지향 핵심
    ├── solid.md                       # SOLID 원칙
    └── grasp-patterns.md              # GRASP 패턴
```

---

## 참고 자료

- **오브젝트** (조영호): 책임, 역할, 협력 / GRASP 패턴 / 의존성 관리 / 상속과 합성
- **객체지향의 사실과 오해** (조영호): 자율적인 객체 / 메시지 기반 설계 / Tell, Don't Ask
- **도메인 주도 설계** (Eric Evans): Aggregate, Entity, Value Object / 유비쿼터스 언어
- **클린 아키텍처** (Robert C. Martin): SOLID 원칙 / 의존성 규칙
- **Effective Java** (Joshua Bloch): 상속보다 합성 / 인터페이스 우선
- **리팩터링** (Martin Fowler): 코드 냄새 / 리팩토링 기법

---

**문서 버전:** 2.0
