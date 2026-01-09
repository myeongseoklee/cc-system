# 테스트 목록 예제

## 예시: UCI 필드 추가

### Backend (DTO/Service)
□ [정상] UCI 포함하여 작품 등록 성공
□ [정상] UCI 없이 작품 등록 성공 (nullable)
□ [정상] UCI 포함하여 작품 수정 성공
□ [경계] UCI 최대 길이(64자) 입력 시 성공
□ [예외] UCI 최대 길이 초과 시 에러

### Frontend (Hook/컴포넌트)
□ [Hook] UCI 초기값 빈 문자열
□ [Hook] setValue('uci', value) 동작 확인
□ [컴포넌트] UCI 입력란 렌더링 확인
□ [컴포넌트] UCI 입력 시 상태 업데이트
