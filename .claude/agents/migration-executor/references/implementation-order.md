# 구현 순서 가이드

## 의존성 순서

**Exception → DTO → Repository → UseCase → Service**

이유: 
- DTO는 Exception을 사용 (검증 실패 시)
- Repository는 DTO 타입 사용
- UseCase는 Repository 호출
- Service는 UseCase 조합

## 각 단계별 검증

1. Exception 구현 → 단독 import 확인
2. DTO 구현 → DTO 테스트 실행
3. Repository 구현 → Repository Mock 가능 확인
4. UseCase 구현 → UseCase 테스트 실행
5. Service 구현 → Service 테스트 실행
