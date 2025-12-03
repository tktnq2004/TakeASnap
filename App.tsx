import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import CameraScreen from "./src/screens/CameraScreen";
import SegmentGallery from "./src/screens/SegmentGallery";
import SegmentEditor from "./src/screens/SegmentEditor";

export type SegmentedImageData = {
  fg: string;  // base64 png foreground từ server
  bg: string | null; // base64 png background từ server
  mask: string | null; // base64 png mask từ server
};

export default function App() {
  const [screen, setScreen] = useState<
    "camera" | "gallery" | "editor"
  >("camera");

  const [selectedImage, setSelectedImage] = useState<SegmentedImageData | null>(null);

  const openGallery = () => setScreen("gallery");

  const openEditor = (data: SegmentedImageData) => {
    setSelectedImage(data);
    setScreen("editor");
  };

  const goBackToCamera = () => setScreen("camera");

  return (
    <View style={styles.container}>

      {/* 📸 Camera */}
      {screen === "camera" && (
        <CameraScreen
          onOpenGallery={openGallery}
        />
      )}

      {/* 🖼️ Thư viện ảnh đã segment */}
      {screen === "gallery" && (
        <SegmentGallery
          onClose={goBackToCamera}
          // Gallery trả về {fg, bg}
          onSelectSegment={(data) => openEditor(data)}
        />
      )}

      {/* ✂️ Segment Editor (Skia version) */}
      {screen === "editor" && selectedImage && (
        <SegmentEditor
          fgUri={selectedImage.fg}
          bgUri={selectedImage.bg || ""}
          maskUri={selectedImage.mask || ""}
          onDone={goBackToCamera}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
