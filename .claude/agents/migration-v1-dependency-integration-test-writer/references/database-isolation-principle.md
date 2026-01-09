# Database Isolation Principle

## 핵심 원칙

**각 도메인은 고립되어 마이그레이션됩니다.**

```
도메인 마이그레이션 시:
✅ 현재 도메인의 @databases 사용처만 테스트
❌ 다른 도메인의 @databases 사용은 무시
✅ v2 마이그레이션 시 각 도메인이 독립적으로 @databases 함수를 복사
```

## 문제 시나리오

### v1 상황: 여러 도메인이 공용 함수 공유

```typescript
// @databases/tc/common/index.ts (공용 인프라)
export const selectChannelAppList = async (channelSN: number) => {
  return await executeQuery('Webtoon.admin_SelectChannelAppList', [channelSN]);
};
```

**7개 도메인이 사용 중:**
```typescript
// v1: tag domain
import { selectChannelAppList } from '@databases/tc/common';
export const selectTagsWithChannel = async (channelSN) => {
  const apps = await selectChannelAppList(channelSN); // ← 공용 함수
  const tags = await DB_TC.tag.selectAllTags();
  return filterTagsByApps(tags, apps);
};

// v1: content domain
import { selectChannelAppList } from '@databases/tc/common';
export const selectContentsByChannel = async (channelSN) => {
  const apps = await selectChannelAppList(channelSN); // ← 같은 함수!
  const contents = await DB_TC.content.selectAll();
  return filterContentsByApps(contents, apps);
};

// v1: feed, stats, charge, ticket, account 도메인도 동일하게 사용
```

### 잘못된 접근: Cross-domain 의존성 생성

```typescript
// ❌ 절대 안 됨!
// v2: tag domain 마이그레이션 후
import tagRepository from '@modules/domain_v2/tag/repository';

// v2: content domain (아직 v1)
const apps = await tagRepository.selectChannelAppList(channelSN); // ← FORBIDDEN!
```

**문제:**
1. Content domain이 Tag domain에 의존
2. Clean Architecture 위반 (domain간 직접 의존)
3. Tag domain 변경 시 Content domain 영향
4. 마이그레이션 순서 강제됨 (Tag 먼저 → Content 나중)

## 올바른 접근: Progressive Migration with Isolation

### Principle

```
각 도메인 마이그레이션 시:
1. @databases 공용 함수를 자신의 v2 repository로 복사
2. 다른 도메인은 여전히 v1 @databases 사용
3. 모든 도메인 마이그레이션 완료 후 v1 @databases 제거
```

### 구현 예시

#### Step 1: Tag 도메인 마이그레이션

```typescript
// ✅ v2: tag domain
// src/modules/domain_v2/tag/repository/tc/channel-app.repository.ts
export default {
  selectChannelAppList: async (channelSN: number) => {
    return (await database.tc.executeQuery(
      'Webtoon.admin_SelectChannelAppList',
      [channelSN]
    )).rows;
  },
};

// ✅ v2: tag service
import tagRepository from './repository/tc/channel-app.repository';
export const selectTagsWithChannel = async ({ channelSN }) => {
  const apps = await tagRepository.selectChannelAppList(channelSN); // v2 repository
  const tags = await tagRepository.selectAllTags();
  return filterTagsByApps(tags, apps);
};
```

**다른 도메인들:**
```typescript
// ✅ v1: content domain (여전히 v1 @databases 사용)
import { selectChannelAppList } from '@databases/tc/common'; // ← v1 유지!
export const selectContentsByChannel = async (channelSN) => {
  const apps = await selectChannelAppList(channelSN); // ← v1 database 함수
  const contents = await DB_TC.content.selectAll();
  return filterContentsByApps(contents, apps);
};
```

#### Step 2: Content 도메인 마이그레이션 (나중에)

```typescript
// ✅ v2: content domain (독립적으로 복사)
// src/modules/domain_v2/content/repository/tc/channel-app.repository.ts
export default {
  selectChannelAppList: async (channelSN: number) => {
    return (await database.tc.executeQuery(
      'Webtoon.admin_SelectChannelAppList',
      [channelSN]
    )).rows;
  },
};
```

**코드 중복?**
- ✅ 각 도메인이 독립적
- ✅ 마이그레이션 순서 자유로움
- ✅ Clean Architecture 유지
- ⚠️ 코드 중복 있지만 isolation의 대가

#### Step 3: 모든 도메인 마이그레이션 완료 후

```typescript
// @databases/tc/common/index.ts
/**
 * @deprecated ALL domains migrated to v2! ✅
 * @v1-dependencies: 0 domains remaining
 *
 * Migrated domains (7):
 *   - ✅ tag, account, content, feed, stats, charge, ticket
 *
 * @safe-to-remove true
 * @removal-date 2026-02-01
 */
export const selectChannelAppList = async (channelSN: number) => {
  throw new Error('This v1 function is deprecated. Use domain_v2 repositories.');
};
```

## 테스트 전략

### v1-dependency-integration-test-writer 동작

**Tag 도메인 테스트 시:**

```typescript
// ✅ 현재 도메인(tag)의 @databases 사용만 테스트
test('tag uses @databases/selectChannelAppList', async () => {
  db.mockSelectOnce([{ appSN: 1 }]);
  await tagService.selectTagsWithChannel(1);
  expect(db.executeQuery).toHaveBeenCalledWith(
    'Webtoon.admin_SelectChannelAppList', [1]
  );
});

// ❌ 다른 도메인(content)의 사용은 테스트 안 함
// content domain이 마이그레이션될 때 자체적으로 테스트함
```

### v1-analysis.json 활용

```json
{
  "databaseDependencies": {
    "functionsUsed": ["selectChannelAppList"],
    "crossDomainUsage": {
      "selectChannelAppList": {
        "totalReferences": 7,
        "currentDomain": 1,    // ← 현재 domain만 테스트
        "otherDomains": 6,     // ← 무시 (isolation)
        "domainList": ["content", "feed", "stats", "charge", "ticket", "account"]
      }
    }
  }
}
```

**테스트 작성:**
```typescript
// currentDomain: 1 → 1개 테스트 작성
// otherDomains: 6 → 무시 (각 도메인이 마이그레이션될 때 자체 테스트)
```

## v2 마이그레이션 시 적용

### v2-architect 단계

```markdown
# v2 Architecture for Tag Domain

## Repository: channel-app.repository.ts

**Source:** @databases/tc/common/selectChannelAppList

```typescript
export default {
  selectChannelAppList: async (channelSN: number) => {
    return (await database.tc.executeQuery(
      'Webtoon.admin_SelectChannelAppList',
      [channelSN]
    )).rows;
  },
};
```

**Note:**
- ✅ Tag domain 독립적으로 구현
- ✅ 다른 도메인의 @databases 사용과 무관
- ✅ Content domain은 여전히 v1 @databases 사용 중
```

### migration-executor 단계

**각 도메인이 독립적으로 구현:**
```typescript
// tag domain v2
src/modules/domain_v2/tag/repository/tc/channel-app.repository.ts

// content domain v2 (나중에 마이그레이션 시)
src/modules/domain_v2/content/repository/tc/channel-app.repository.ts

// 동일한 SP 호출이지만 각 도메인에 복사됨
```

## 장단점

### 장점 ✅

1. **Domain Isolation 유지**
   - 각 도메인이 독립적
   - Clean Architecture 원칙 준수

2. **마이그레이션 유연성**
   - 도메인 순서 자유로움
   - 병렬 마이그레이션 가능

3. **안전성**
   - 다른 도메인 영향 없음
   - 롤백 쉬움

4. **테스트 명확성**
   - 각 도메인이 자체 테스트
   - 의존성 추적 쉬움

### 단점 ⚠️

1. **코드 중복**
   - 같은 SP 호출 코드 여러 곳
   - 하지만 isolation의 대가

2. **리팩토링 비용**
   - SP 변경 시 모든 도메인 업데이트
   - 하지만 v2에서는 SP 변경 적음

### 결론

**Isolation > DRY**
- Code duplication은 acceptable
- Domain isolation은 essential
- v2 마이그레이션 안전성이 최우선

## 체크리스트

### v1-dependency-integration-test-writer
- [ ] `databaseDependencies.currentDomain` 참조만 테스트
- [ ] `databaseDependencies.otherDomains` 무시
- [ ] 현재 도메인의 @databases 사용처 100% 커버

### v2-architect
- [ ] @databases 함수를 v2 repository로 복사
- [ ] 다른 도메인 v2 repository 참조 금지
- [ ] Isolation principle 준수

### migration-executor
- [ ] Repository에 @databases 로직 복사 구현
- [ ] 다른 도메인 import 없음
- [ ] 독립적 실행 가능

### migration-validator
- [ ] 현재 도메인의 @databases 사용 검증
- [ ] Cross-domain 참조 0개 확인
- [ ] Isolation 유지 확인

## 참고: v1 @databases 함수 생명주기

```
Tag 마이그레이션 완료
  └─ @databases/selectChannelAppList
      @v1-dependencies: 6 domains remaining (1 migrated)

Content 마이그레이션 완료
  └─ @databases/selectChannelAppList
      @v1-dependencies: 5 domains remaining (2 migrated)

...

모든 도메인 마이그레이션 완료
  └─ @databases/selectChannelAppList
      @v1-dependencies: 0 domains remaining ✅
      @safe-to-remove: true
      → 30일 후 자동 제거
```

이 lifecycle은 `v1-code-cleaner` 에이전트가 관리합니다.
