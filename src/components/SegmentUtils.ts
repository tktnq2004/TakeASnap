import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
const SERVER_HOST = "192.168.1.6";
// const SERVER_HOST = "172.20.10.3";
const SERVER_URL = `http://${SERVER_HOST}:5000`;
const CACHE_DIR = FileSystem.cacheDirectory || FileSystem.documentDirectory;
if (!CACHE_DIR) throw new Error("Cannot access cache directory");

export async function segmentImage(
  uri: string
): Promise<{
  fg: string;
  bg: string;
  mask: string;
  outline: string;
} | null> {
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

    if (!response.ok) throw new Error("Segmentation failed");
    const json = await response.json();

    if (!json.fg || !json.bg || !json.mask || !json.outline)
      throw new Error("Server missing fg/bg/mask/outline");

    // --- Save PNG files ---
    const fgPath = `${CACHE_DIR}fg_${Date.now()}.png`;
    const bgPath = `${CACHE_DIR}bg_${Date.now()}.png`;
    const maskPath = `${CACHE_DIR}mask_${Date.now()}.png`;
    const outlinePath = `${CACHE_DIR}outline_${Date.now()}.png`;

    await FileSystem.writeAsStringAsync(fgPath, json.fg, { encoding: "base64" });
    await FileSystem.writeAsStringAsync(bgPath, json.bg, { encoding: "base64" });
    await FileSystem.writeAsStringAsync(maskPath, json.mask, { encoding: "base64" });
    await FileSystem.writeAsStringAsync(outlinePath, json.outline, {
      encoding: "base64",
    });

    console.log("✅ Saved segment:", fgPath, bgPath, maskPath, outlinePath);

    return {
      fg: fgPath,
      bg: bgPath,
      mask: maskPath,
      outline: outlinePath,
    };
  } catch (err) {
    console.error("Error in segmentImage:", err);
    return null;
  }
}

export default { segmentImage };
