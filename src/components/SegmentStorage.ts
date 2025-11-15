import * as FileSystem from "expo-file-system/legacy";

const FileSys = FileSystem as unknown as {
  documentDirectory?: string;
  cacheDirectory?: string;
};

const DOC_DIR = FileSys.documentDirectory || FileSys.cacheDirectory || "";
const SEGMENTS_DIR = `${DOC_DIR}segments/`;
const SEGMENTS_JSON = `${SEGMENTS_DIR}segments.json`;

export type SegmentData = {
  id: string;
  imageUri: string;   
  backgroundUri?: string; 
  overlayColor: string;
  overlayOpacity: number;
  overlayBlur: number;
  outlineSize: number;
  createdAt: string;
};

async function ensureDirExists() {
  try {
    const dirInfo = await FileSystem.getInfoAsync(SEGMENTS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(SEGMENTS_DIR, { intermediates: true });
    }
  } catch (err) {
    console.error("❌ ensureDirExists error:", err);
  }
}

export async function loadSegments(): Promise<SegmentData[]> {
  try {
    await ensureDirExists();
    const fileInfo = await FileSystem.getInfoAsync(SEGMENTS_JSON);
    if (!fileInfo.exists) {
      await FileSystem.writeAsStringAsync(SEGMENTS_JSON, "[]");
      return [];
    }
    const content = await FileSystem.readAsStringAsync(SEGMENTS_JSON);
    return JSON.parse(content) as SegmentData[];
  } catch (err) {
    console.error("❌ loadSegments error:", err);
    return [];
  }
}

export async function saveSegment(segment: SegmentData): Promise<void> {
  try {
    await ensureDirExists();
    const segments = await loadSegments();
    segments.push(segment);
    await FileSystem.writeAsStringAsync(
      SEGMENTS_JSON,
      JSON.stringify(segments, null, 2)
    );
  } catch (err) {
    console.error("❌ saveSegment error:", err);
  }
}

export async function deleteSegment(id: string): Promise<void> {
  try {
    await ensureDirExists();
    const segments = await loadSegments();
    const filtered = segments.filter((s) => s.id !== id);
    const removed = segments.find((s) => s.id === id);

    if (removed) {
      const fileInfo = await FileSystem.getInfoAsync(removed.imageUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(removed.imageUri, { idempotent: true });
      }
    }

    await FileSystem.writeAsStringAsync(
      SEGMENTS_JSON,
      JSON.stringify(filtered, null, 2)
    );
  } catch (err) {
    console.error("❌ deleteSegment error:", err);
  }
}

/** 🧹 Xoá toàn bộ dữ liệu */
export async function clearAllSegments(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(SEGMENTS_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(SEGMENTS_DIR, { idempotent: true });
    }
    await FileSystem.makeDirectoryAsync(SEGMENTS_DIR, { intermediates: true });
    await FileSystem.writeAsStringAsync(SEGMENTS_JSON, "[]");
  } catch (err) {
    console.error("❌ clearAllSegments error:", err);
  }
}

/** 🪄 Tạo id duy nhất */
export function generateSegmentId() {
  return `seg_${Date.now()}`;
}
