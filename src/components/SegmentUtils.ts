import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

const SERVER_HOST = "192.168.1.5"; // ⚠️ đổi thành IP LAN thật (không dùng localhost)
const SERVER_URL = `http://${SERVER_HOST}:5000`;

// 🔹 Helper: blob → base64
async function blobToBase64(response: Response): Promise<string> {
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.prototype.slice.call(bytes, i, i + chunk)
    );
  }
  return typeof btoa !== "undefined"
    ? btoa(binary)
    : Buffer.from(binary, "binary").toString("base64");
}

// 🔹 Xác định thư mục cache
const CACHE_DIR = FileSystem.cacheDirectory || FileSystem.documentDirectory;
if (!CACHE_DIR) throw new Error("Cannot access cache or document directory");

// ============================================================
// 🧠 Gửi ảnh đến Flask server để tách nền
// ============================================================
export async function segmentImage(
  uri: string
): Promise<{ fg: string; bg: string } | null> {
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

    // 📦 Nhận JSON từ Flask (chứa fg và bg)
    const json = await response.json();
    if (!json.fg || !json.bg) throw new Error("Server did not return fg/bg");

    // 🔹 Lưu base64 thành file PNG trong cache
    const fgPath = `${CACHE_DIR}fg_${Date.now()}.png`;
    const bgPath = `${CACHE_DIR}bg_${Date.now()}.png`;

    await FileSystem.writeAsStringAsync(fgPath, json.fg, { encoding: "base64" });
    await FileSystem.writeAsStringAsync(bgPath, json.bg, { encoding: "base64" });

    console.log("✅ Segmented images saved:", fgPath, bgPath);

    return { fg: fgPath, bg: bgPath };
  } catch (err) {
    console.error("Error in segmentImage:", err);
    return null;
  }
}

// ============================================================
// 🧩 Áp dụng hiệu ứng màu phủ, viền, độ mờ (trên ảnh fg)
// ============================================================
export async function applyEffect(
  fgUri: string,
  color: string,
  opacity: number,
  outline: number
): Promise<string | null> {
  try {
    let base64 = "";

    if (fgUri.startsWith("file://")) {
      base64 = await FileSystem.readAsStringAsync(fgUri, { encoding: "base64" });
    } else {
      base64 = fgUri.replace(/^data:image\/\w+;base64,/, "");
    }

    const payload = { fg: base64, color, opacity, outline };

    const res = await fetch(`${SERVER_URL}/compose`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("❌ Compose server returned:", res.status);
      throw new Error("Compose failed");
    }

    const data = await res.json();
    if (!data.image) throw new Error("Server did not return an image");

    return `data:image/png;base64,${data.image}`;
  } catch (err) {
    console.error("Error in applyEffect:", err);
    return null;
  }
}

export default { segmentImage, applyEffect };
