# Stored Procedure 작성 가이드

## 위치

```
scripts/deploy/[branch]/[schema]/
```

## 신규 테이블

```sql
-- scripts/deploy/[branch]/tc/CREATE_TABLE_EntityTable.sql
CREATE TABLE IF NOT EXISTS `EntityTable` (
  `seq` BIGINT NOT NULL AUTO_INCREMENT,
  `appSN` BIGINT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`seq`),
  UNIQUE KEY `EntityTable_appSN_name` (`appSN`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## SP 작성

```sql
-- scripts/deploy/[branch]/tc/admin_SelectEntityList.sql
DROP PROCEDURE IF EXISTS Webtoon.admin_SelectEntityList;

DELIMITER $$
CREATE PROCEDURE Webtoon.admin_SelectEntityList (
    IN _page INT,
    IN _limit INT
) BEGIN
    SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

    SELECT
        seq,
        appSN,
        name,
        createdAt
    FROM EntityTable
    ORDER BY createdAt DESC
    LIMIT _limit OFFSET (_page - 1) * _limit;

END $$
DELIMITER ;
```

## 네이밍 규칙

- **Prefix**: `admin_` (관리자용)
- **동사**: Select / Insert / Update / Delete / Upsert
- **대상**: 명확한 엔티티명

예시:

- `admin_SelectEntityList`
- `admin_InsertEntity`
- `admin_UpdateMonthlySettlementStatus`

## 상세 가이드

- `scripts/sp/CLAUDE.md` 참조
