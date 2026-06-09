-- 伝道会の色コード (各アプリの表示色を統一するため master が source of truth)
-- liberation 由来の 9 件分の色を初期値として設定する。残り 85 件は NULL。
ALTER TABLE fellowships ADD COLUMN color_code TEXT;

UPDATE fellowships SET color_code = '#C8C4C1' WHERE id = 18; -- 大江戸
UPDATE fellowships SET color_code = '#EFB184' WHERE id = 20; -- お台場
UPDATE fellowships SET color_code = '#E88E86' WHERE id = 19; -- 羽田
UPDATE fellowships SET color_code = '#A9D3A9' WHERE id = 24; -- かながわ
UPDATE fellowships SET color_code = '#EFD77A' WHERE id = 27; -- 富士山
UPDATE fellowships SET color_code = '#8FB6DE' WHERE id = 28; -- 駿天
UPDATE fellowships SET color_code = '#9FD2D6' WHERE id = 15; -- 埼玉
UPDATE fellowships SET color_code = '#E9AFC2' WHERE id = 16; -- 千葉
UPDATE fellowships SET color_code = '#C2B0D9' WHERE id = 25; -- 山梨

UPDATE master_meta SET updated_at = CURRENT_TIMESTAMP WHERE table_name = 'fellowships';
