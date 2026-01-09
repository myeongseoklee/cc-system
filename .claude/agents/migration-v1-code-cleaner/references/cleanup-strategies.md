# v1 정리 전략

## Strategy A: deprecated (권장)

**방법:**
```typescript
/**
 * @deprecated Use domain_v2/tag/service instead
 * @see src/modules/domain_v2/tag/service
 * Migration date: 2024-XX-XX
 */
export const selectTagList = async (req, res) => {
  console.warn('⚠️ Deprecated: Use domain_v2/tag/service instead');
  // ... 기존 코드
};
```

**장점:**
- 가장 안전 (롤백 불필요)
- 점진적 전환 가능
- IDE 경고 표시

## Strategy B: comment

**방법:**
전체 코드 주석 처리

**장점:**
- 참고용 보존
- 빌드 에러 없음

## Strategy C: delete

**방법:**
파일 완전 삭제

**장점:**
- 가장 깔끔

**주의:**
- v2 완전 검증 후에만 사용
- Git 히스토리에 남음
