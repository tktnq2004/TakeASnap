import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

const SERVER_HOST = "192.168.1.4";
const SERVER_URL = `http://${SERVER_HOST}:5000`;

const CACHE_DIR = FileSystem.cacheDirectory || FileSystem.documentDirectory;
if (!CACHE_DIR) throw new Error("Cannot access cache directory");

// ============================================================
// 🧠 Gửi ảnh đến Flask server để tách nền (FG + BG + MASK)
// ============================================================
export async function segmentImage(
  uri: string
): Promise<{ fg: string; bg: string; mask: string; maskOutline:string } | null> {

  try {
    const fileType = (uri.split(".").pop() || "jpg").split("?")[0];
    const formData = new FormData();

    formData.append("image", {
      uri: Platform.OS === "ios" && uri.startsWith("file://") ? uri : uri,
      name: `photo.${fileType}`,
      type: `image/${fileType}`,
    } as any);

    const response = await fetch(`${SERVER_URL}/segment`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      console.error("❌ Segment server returned:", response.status);
      throw new Error("Segmentation failed");
    }

    const json = await response.json();
    if (!json.fg || !json.bg || !json.mask)
      throw new Error("Server missing fg/bg/mask/maskOutline");

    // 🔹 Lưu file PNG vào cache
    const fgPath = `${CACHE_DIR}fg_${Date.now()}.png`;
    const bgPath = `${CACHE_DIR}bg_${Date.now()}.png`;
    const maskPath = `${CACHE_DIR}mask_${Date.now()}.png`;
    const maskOutlinePath = `${CACHE_DIR}mask_${Date.now()}.png`;

    await FileSystem.writeAsStringAsync(fgPath, json.fg, { encoding: "base64" });
    await FileSystem.writeAsStringAsync(bgPath, json.bg, { encoding: "base64" });
    await FileSystem.writeAsStringAsync(maskPath, json.mask, { encoding: "base64" });
    await FileSystem.writeAsStringAsync(maskOutlinePath, json.mask, { encoding: "base64" });

    console.log("✅ Saved:", fgPath, bgPath, maskPath,maskOutlinePath);

    // 🔹 Trả về path file (hoặc data URI nếu muốn)
    return { fg: fgPath, bg: bgPath, mask: maskPath, maskOutline: maskOutlinePath };

  } catch (err) {
    console.error("Error in segmentImage:", err);
    return null;
  }
}

export default { segmentImage };
