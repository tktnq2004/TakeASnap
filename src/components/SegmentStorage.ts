import * as FileSystem from "expo-file-system/legacy";

const FileSys = FileSystem as unknown as {
  documentDirectory?: string;
  cacheDirectory?: string;
};

const ROOT = FileSys.documentDirectory || FileSys.cacheDirectory || "";
const SEGMENTS_DIR = `${ROOT}segments/`;
const SEGMENTS_JSON = `${SEGMENTS_DIR}segments.json`;

export type SegmentData = {
  id: string;

  fgUri: string;
  bgUri: string;    
  maskUri: string;  

  overlayColor: string;
  overlayOpacity: number;
  overlayBlur: number;
  outlineSize: number;

  createdAt: string;
};

/* ------------------------------------------------------
   🔧 Đảm bảo thư mục segments/ luôn tồn tại
-------------------------------------------------------*/
async function ensureDirExists() {
  try {
    const info = await FileSystem.getInfoAsync(SEGMENTS_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(SEGMENTS_DIR, { intermediates: true });
    }
  } catch (err) {
    console.error("ensureDirExists error:", err);
  }
}

/* ------------------------------------------------------
   📌 LOAD tất cả segment
-------------------------------------------------------*/
export async function loadSegments(): Promise<SegmentData[]> {
  try {
    await ensureDirExists();

    const fileInfo = await FileSystem.getInfoAsync(SEGMENTS_JSON);
    if (!fileInfo.exists) {
      await FileSystem.writeAsStringAsync(SEGMENTS_JSON, "[]");
      return [];
    }

    const text = await FileSystem.readAsStringAsync(SEGMENTS_JSON);
    return JSON.parse(text) as SegmentData[];
  } catch (err) {
    console.error("loadSegments error:", err);
    return [];
  }
}

/* ------------------------------------------------------
   💾 LƯU 1 segment (append vào JSON)
-------------------------------------------------------*/
export async function saveSegment(seg: SegmentData): Promise<void> {
  try {
    await ensureDirExists();

    const list = await loadSegments();
    list.push(seg);

    await FileSystem.writeAsStringAsync(
      SEGMENTS_JSON,
      JSON.stringify(list, null, 2)
    );
  } catch (err) {
    console.error("saveSegment error:", err);
  }
}

/* ------------------------------------------------------
   🗑 XÓA 1 segment theo ID
-------------------------------------------------------*/
export async function deleteSegment(id: string): Promise<void> {
  try {
    await ensureDirExists();

    const list = await loadSegments();
    const removed = list.find((x) => x.id === id);

    if (removed) {
      // xóa fg/bg/mask
      const files = [removed.fgUri, removed.bgUri, removed.maskUri];

      for (const file of files) {
        const f = await FileSystem.getInfoAsync(file);
        if (f.exists) {
          await FileSystem.deleteAsync(file, { idempotent: true });
        }
      }
    }

    const filtered = list.filter((item) => item.id !== id);

    await FileSystem.writeAsStringAsync(
      SEGMENTS_JSON,
      JSON.stringify(filtered, null, 2)
    );
  } catch (err) {
    console.error("deleteSegment error:", err);
  }
}

/* ------------------------------------------------------
   ♻ XÓA TOÀN BỘ
-------------------------------------------------------*/
export async function clearAllSegments(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(SEGMENTS_DIR);

    if (info.exists) {
      await FileSystem.deleteAsync(SEGMENTS_DIR, { idempotent: true });
    }

    await FileSystem.makeDirectoryAsync(SEGMENTS_DIR, { intermediates: true });
    await FileSystem.writeAsStringAsync(SEGMENTS_JSON, "[]");
  } catch (err) {
    console.error("clearAllSegments error:", err);
  }
}

/* ------------------------------------------------------
   🔑 Tạo ID duy nhất
-------------------------------------------------------*/
export function generateSegmentId() {
  return `seg_${Date.now()}`;
}
