-- osystem-masters initial schema
-- id PK + code UNIQUE 方針。code はユーザーが後から変更可能。

CREATE TABLE fellowships (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  code        TEXT NOT NULL UNIQUE,
  old_code    TEXT,
  name        TEXT NOT NULL,
  short_name  TEXT NOT NULL,
  active      INTEGER NOT NULL DEFAULT 1,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  updated_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_fellowships_sort ON fellowships(sort_order);

CREATE TABLE ceremonies (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  active      INTEGER NOT NULL DEFAULT 1,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  updated_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_ceremonies_sort ON ceremonies(sort_order);

CREATE TABLE items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  value       INTEGER NOT NULL DEFAULT 0,
  refund      INTEGER NOT NULL DEFAULT 0,
  unit        TEXT,
  category    TEXT,
  active      INTEGER NOT NULL DEFAULT 1,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  updated_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_items_sort ON items(sort_order);

-- 各マスタテーブルの最終更新時刻
-- 消費アプリの「最終同期日時 vs マスタ最終更新」比較に使う
CREATE TABLE master_meta (
  table_name  TEXT PRIMARY KEY,
  updated_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO master_meta (table_name, updated_at) VALUES
  ('fellowships', CURRENT_TIMESTAMP),
  ('ceremonies',  CURRENT_TIMESTAMP),
  ('items',       CURRENT_TIMESTAMP);
