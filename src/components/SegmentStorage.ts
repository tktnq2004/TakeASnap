import * as FileSystem from "expo-file-system/legacy";

const ROOT = FileSystem.documentDirectory || FileSystem.cacheDirectory || "";
const SEGMENTS_DIR = `${ROOT}segments/`;
const SEGMENTS_JSON = `${SEGMENTS_DIR}segments.json`;

export type SegmentData = {
  id: string;
  fgUri: string;
  bgUri: string | null;
  maskUri: string | null;
  maskOutlineUri: string | null;

  fgOpacity: number;
  bgOpacity: number;

  outlineEnabled: boolean;
  outlineSize: number;
  outlineColor: string;

  fillEnable: boolean;
  fillColor: string;
  fillOpacity: number;

  createdAt: string;
};

async function ensureDirExists() {
  const info = await FileSystem.getInfoAsync(SEGMENTS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(SEGMENTS_DIR, { intermediates: true });
  }
}

export async function loadSegments(): Promise<SegmentData[]> {
  await ensureDirExists();
  const fileInfo = await FileSystem.getInfoAsync(SEGMENTS_JSON);
  if (!fileInfo.exists) {
    await FileSystem.writeAsStringAsync(SEGMENTS_JSON, "[]");
    return [];
  }
  const text = await FileSystem.readAsStringAsync(SEGMENTS_JSON);
  return JSON.parse(text) as SegmentData[];
}

export async function saveSegment(seg: SegmentData): Promise<void> {
  await ensureDirExists();
  const list = await loadSegments();
  const existingIndex = list.findIndex((x) => x.id === seg.id);
  if (existingIndex >= 0) {
    list[existingIndex] = seg; // ✅ Update
  } else {
    list.push(seg);            // ✅ New
  }
  await FileSystem.writeAsStringAsync(
    SEGMENTS_JSON,
    JSON.stringify(list, null, 2)
  );
}

export async function deleteSegment(id: string): Promise<void> {
  await ensureDirExists();
  const list = await loadSegments();
  const removed = list.find((x) => x.id === id);
  if (removed) {
    const files = [removed.fgUri, removed.bgUri, removed.maskUri];
    for (const file of files) {
      if (!file) continue;
      const f = await FileSystem.getInfoAsync(file);
      if (f.exists) await FileSystem.deleteAsync(file, { idempotent: true });
    }
  }
  const filtered = list.filter((item) => item.id !== id);
  await FileSystem.writeAsStringAsync(SEGMENTS_JSON, JSON.stringify(filtered, null, 2));
}

export async function clearAllSegments(): Promise<void> {
  const info = await FileSystem.getInfoAsync(SEGMENTS_DIR);
  if (info.exists) await FileSystem.deleteAsync(SEGMENTS_DIR, { idempotent: true });
  await FileSystem.makeDirectoryAsync(SEGMENTS_DIR, { intermediates: true });
  await FileSystem.writeAsStringAsync(SEGMENTS_JSON, "[]");
}

export function generateSegmentId() {
  return `seg_${Date.now()}`;
}
