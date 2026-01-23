# 테스트 우선순위 가이드

## 1. UseCase 테스트 (최우선, 90% 커버리지)

**이유:** 비즈니스 로직의 핵심

**테스트 대상:**
- Public 메서드: `exec()`
- Private 메서드: 복잡한 로직이 있는 경우

**Mock 대상:**
- Repository (완전 Mock)
- 외부 의존성 (HTTP, S3 등)

**커버리지:**
- 성공 케이스: 최소 1개
- 실패 케이스: 각 검증별 1개
- 예외 케이스: 각 예외별 1개

## 2. DTO 테스트 (100% 커버리지)

**이유:** 타입 안전성 보장

**테스트 대상:**
- 필수 필드 검증
- 타입 변환 (z.coerce.number 등)
- 기본값 (z.default)
- 최대/최소값 검증
- enum 검증

## 3. Service 테스트 (80% 커버리지)

**이유:** UseCase 조합 및 트랜잭션 검증

**테스트 대상:**
- 단순 Service: UseCase 호출만 확인
- 복잡한 Service: 트랜잭션 시나리오, 여러 UseCase 조합

**Mock 대상:**
- UseCase (완전 Mock)
- DB Transaction Manager
