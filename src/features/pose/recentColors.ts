/**
 * 6 màu dùng gần đây của Bảng màu (design.md §6.10), nhớ qua các lần mở app.
 * expo-sqlite/kv-store ghi đồng bộ nên mở bảng là có ngay, không nháy danh sách rỗng.
 */
import Storage from 'expo-sqlite/kv-store';

const KEY = 'recentColors';
export const RECENT_MAX = 6;

export function loadRecentColors(): string[] {
  try {
    const raw = Storage.getItemSync(KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((c): c is string => typeof c === 'string') : [];
  } catch {
    return [];
  }
}

/** Đưa màu lên đầu, bỏ trùng, giữ tối đa 6. */
export function pushRecent(list: readonly string[], hex: string): string[] {
  const up = hex.toUpperCase();
  return [up, ...list.filter((c) => c.toUpperCase() !== up)].slice(0, RECENT_MAX);
}

export function saveRecentColor(hex: string): string[] {
  const next = pushRecent(loadRecentColors(), hex);
  Storage.setItemSync(KEY, JSON.stringify(next));
  return next;
}
