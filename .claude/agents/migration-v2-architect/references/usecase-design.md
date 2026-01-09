# UseCase 설계 가이드 (실제 코드베이스 기반)

## 패턴 1: 간단한 UseCase (파라미터 직접 나열)

```typescript
export class CancelChargeBlock {
  async exec(accountSN: number, connection?: Base.MySQL.Connection) {
    return await tc.accountBlockRepository.deleteChargeBlock(
      accountSN,
      connection,
    );
  }
}
```

## 패턴 2: 복잡한 UseCase (private 메서드 + lodash.chain)

**실제 account 도메인 예제:**
```typescript
import _ from 'lodash';
import { tc } from '../repository';

export class SelectAccountForListFilterdBy {
  async exec(
    accountSNs: number[],
    channelSN: number,
    status: number,
    offset: number,
    limit: number,
  ) {
    const appList = await this.getAppListByChannelSN(channelSN);
    const accountList = await this.getAccountListByAccountSNs(
      accountSNs,
      channelSN,
      appList,
      status,
      offset,
      limit,
    );
    return this.accountWithAppListMapper(accountList, appList);
  }

  private async getAppListByChannelSN(channelSN: number) {
    return _.chain(
      await tc.channelAppRepository.selectChannelAppList(channelSN),
    ).value();
  }

  private async getAccountListByAccountSNs(...) {
    const appSNs = channelSN ? appList.map((app) => app.appSN) : null;
    return await tc.accountRepository.selectAccountForListFilterdBy(...);
  }

  private accountWithAppListMapper(accountList, appList) {
    return accountList.map((account) => {
      const app = appList.find((app) => app.appSN === account.appSN);
      return {
        ...account,
        channelSN: app.channelSN,
        appID: app.appID,
        appName: app.appName,
      };
    });
  }
}
```

**핵심 패턴:**
- exec(): 플로우 조정
- get*(): 데이터 조회
- *Mapper(): 데이터 변환
- lodash.chain 활용

## exec() 파라미터 선택

- **3개 이하:** 직접 나열 (권장)
- **4개 이상:** destructured object
- **connection:** 항상 마지막 optional

## usecase/index.ts

```typescript
import { SelectList } from './select-list.usecase';

export default {
  selectList: new SelectList(),
};
```
