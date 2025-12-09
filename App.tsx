import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import CameraScreen from "./src/screens/CameraScreen";
import SegmentGallery from "./src/screens/SegmentGallery";
import SegmentEditor from "./src/screens/SegmentEditor";
import { SegmentData } from "./src/components/SegmentStorage";

export default function App() {
  const [screen, setScreen] = useState<"camera" | "gallery" | "editor">("camera");
  const [currentSegment, setCurrentSegment] = useState<SegmentData | null>(null);

  const openGallery = () => setScreen("gallery");

  const openEditor = (segment: SegmentData) => {
    setCurrentSegment(segment);
    setScreen("editor");
  };

  const handleUpdateOverlay = (overlay: SegmentData | null) => {
    setCurrentSegment(overlay);
  };

  const goBackToCamera = () => setScreen("camera");

  const handleEditorDone = (updatedSegment: SegmentData) => {
    setCurrentSegment(updatedSegment);
    setScreen("camera");
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {screen === "camera" && (
          <CameraScreen
            onUpdateOverlay={handleUpdateOverlay}
            onOpenGallery={openGallery}
            overlaySegment={currentSegment}
          />
        )}

        {screen === "gallery" && (
          <SegmentGallery
            onClose={goBackToCamera}
            onSelectSegment={openEditor}
          />
        )}

        {screen === "editor" && currentSegment && (
          <SegmentEditor
            segment={currentSegment}
            onDone={handleEditorDone}
          />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
