import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import CameraScreen from "./src/screens/CameraScreen";
import SegmentGallery from "./src/screens/SegmentGallery";
import SegmentEditor from "./src/screens/SegmentEditor";

// 🔹 Kiểu dữ liệu mới cho ảnh segment
export type SegmentedImageData = {
  fg: string; // ảnh foreground (người, vật thể)
  bg: string | null; // ảnh background
};

export default function App() {
  const [screen, setScreen] = useState<"camera" | "gallery" | "editor">("camera");
  const [selectedImage, setSelectedImage] = useState<SegmentedImageData | null>(null);

  const openGallery = () => setScreen("gallery");

  // ✅ Khi mở editor, nhận object {fg, bg}
  const openEditor = (data: SegmentedImageData) => {
    setSelectedImage(data);
    setScreen("editor");
  };

  const goBackToCamera = () => setScreen("camera");

  return (
    <View style={styles.container}>
      {/* 📸 Màn hình Camera */}
      {screen === "camera" && (
        <CameraScreen
          onOpenGallery={openGallery}
          onOpenEditor={(uri) => openEditor({ fg: uri, bg: null })} // fallback nếu chụp từ camera
        />
      )}

      {/* 🖼️ Thư viện ảnh đã segment */}
      {screen === "gallery" && (
        <SegmentGallery
          onClose={goBackToCamera}
          onSelectSegment={(data) => openEditor(data)} // data = {fg, bg}
        />
      )}

      {/* ✂️ Màn hình chỉnh sửa ảnh segment */}
      {screen === "editor" && selectedImage && (
        <SegmentEditor
          segmentedUri={selectedImage.fg}
          backgroundUri={selectedImage.bg}
          onDone={goBackToCamera}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
