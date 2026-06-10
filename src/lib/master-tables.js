/**
 * osystem-masters の各マスタテーブルの構造をここに集約する。
 * 管理画面 (admin.jsx) と CSV インポート / エクスポートが共通で読む。
 *
 * 新しいマスタテーブルを追加するときの手順:
 *   1. migrations/ に CREATE TABLE を追加
 *   2. このファイルの MASTER_TABLES に 1 エントリ足す
 *   3. master_meta に行を追加する INSERT を migration で書く
 *   4. admin.jsx に管理 UI を足す (これはまだ手書き。CSV はメタ定義のおかげで自動)
 *
 * 列の type は CSV のシリアライズ / パースで使う:
 *   - "int":  number に変換、空文字は null (auto/default 列なら除外)
 *   - "text": 文字列。trim 後、空文字は null (nullable のとき) or 空文字 (required のとき)
 */
export const MASTER_TABLES = {
  fellowships: {
    label: "伝道会",
    columns: [
      { name: "id",         type: "int",  auto: true },
      { name: "code",       type: "text", required: true },
      { name: "old_code",   type: "text", nullable: true },
      { name: "name",       type: "text", required: true },
      { name: "short_name", type: "text", required: true },
      { name: "color_code", type: "text", nullable: true },
      { name: "active",     type: "int",  default: 1 },
      { name: "sort_order", type: "int",  default: 0 },
    ],
    uniqueKey: "code", // id が空の行はこれで突合
  },

  ceremonies: {
    label: "護摩供",
    columns: [
      { name: "id",         type: "int",  auto: true },
      { name: "code",       type: "text", required: true },
      { name: "name",       type: "text", required: true },
      { name: "active",     type: "int",  default: 1 },
      { name: "sort_order", type: "int",  default: 0 },
    ],
    uniqueKey: "code",
  },

  items: {
    label: "商品",
    columns: [
      { name: "id",         type: "int",  auto: true },
      { name: "code",       type: "text", required: true },
      { name: "name",       type: "text", required: true },
      { name: "value",      type: "int",  default: 0 },
      { name: "refund",     type: "int",  default: 0 },
      { name: "unit",       type: "text", nullable: true },
      { name: "category",   type: "text", nullable: true },
      { name: "active",     type: "int",  default: 1 },
      { name: "sort_order", type: "int",  default: 0 },
    ],
    uniqueKey: "code",
  },
};

export function getTable(name) {
  return MASTER_TABLES[name] || null;
}

export function listTables() {
  return Object.entries(MASTER_TABLES).map(([name, def]) => ({ name, ...def }));
}
