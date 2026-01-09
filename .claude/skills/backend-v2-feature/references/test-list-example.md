# 테스트 목록 예제

## 월별 회계 리포트 기능

### 요구사항
- 일별 매출 데이터를 월별로 집계
- 앱별로 충전코인 데이터 조회
- 집계 데이터를 Excel로 출력

### 테스트 목록

```markdown
## 테스트 목록
□ 일별 데이터 → 월별 데이터 집계
□ 일별 데이터 없고 충전만 있는 앱 → 빈 회계 데이터 생성
□ 회계 데이터를 Excel 행 형식으로 변환
□ 날짜 경계값: 연도 전환 (1월 → 이전 해 12월)
```

## 광고 설정 관리 기능

### 요구사항
- 앱별 광고 설정 CRUD
- Buzzvil exposureWeight는 100으로 나눠 저장
- AdCash type=1 고정

### 테스트 목록

```markdown
## 테스트 목록
□ AdCash: type=1로 저장
□ Buzzvil: exposureWeight를 100으로 나눔 (50 → 0.5)
□ 기존 설정 업데이트 시 중복 생성 방지
□ 앱별 설정 목록 조회
□ 권한 없는 사용자 접근 시 에러
```

## 정산 상태 관리 기능

### 요구사항
- 월별 정산 상태 전환 (NULL → PREPARING → READY → COMPLETED)
- 부가데이터 저장 시 자동 상태 전환
- 상태별 다운로드 권한 검증

### 테스트 목록

```markdown
## 테스트 목록
□ NULL → PREPARING 전환 (부가데이터 저장 시)
□ PREPARING → READY 전환 (준비 완료 버튼)
□ READY → COMPLETED 전환 (Excel 업로드)
□ COMPLETED 상태에서 다운로드 허용
□ PREPARING/READY 상태에서 다운로드 시 에러
□ 부가데이터 삭제 시 NULL로 복구
```
