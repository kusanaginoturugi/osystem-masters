/**
 * 軽量 CSV ユーティリティ (RFC 4180 準拠)。
 *
 * - parseCSV: BOM 除去、CRLF/LF 両対応、ダブルクオート囲み + "" エスケープ対応。
 * - toCSV:    Excel が確実に UTF-8 として読めるよう先頭に BOM を付ける。
 *
 * 依存を増やしたくないので csv-parse 等は使わず最小実装。
 */

export function parseCSV(text) {
  if (typeof text !== "string") text = String(text ?? "");

  // BOM
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const rows = [];
  let cell = "";
  let row = [];
  let inQuote = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const ch = text[i];

    if (inQuote) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuote = false;
        i += 1;
        continue;
      }
      cell += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuote = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      i += 1;
      continue;
    }
    if (ch === "\r") {
      i += 1; // CRLF の CR は無視、続く LF で改行扱い
      continue;
    }
    if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      i += 1;
      continue;
    }

    cell += ch;
    i += 1;
  }

  // 末尾の改行が無いケース
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  // 完全に空の末尾行 (改行のみで終わる CSV) は除去
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

export function toCSV(rows) {
  const escape = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (/["\r\n,]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const body = rows.map((r) => r.map(escape).join(",")).join("\r\n");
  return "﻿" + body + "\r\n"; // BOM + 本文
}
