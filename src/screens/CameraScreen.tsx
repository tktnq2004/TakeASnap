import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { Accelerometer } from "expo-sensors";

type CameraScreenProps = {
  onOpenGallery: () => void;
  onOpenEditor: (uri: string) => void;
};

export default function CameraScreen({ onOpenGallery, onOpenEditor }: CameraScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [tilt, setTilt] = useState(0);
  const [cameraType, setCameraType] = useState<CameraType>("back");
  const [enableTorch, setEnableTorch] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const [showGrid, setShowGrid] = useState(true);

  // Lắng nghe tilt
  useEffect(() => {
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const tiltValue = Math.atan2(x, Math.sqrt(y * y + z * z)) * (180 / Math.PI);
      setTilt(tiltValue);
    });
    Accelerometer.setUpdateInterval(100);
    return () => subscription.remove();
  }, []);

  if (!permission) return <View />;
  if (!permission.granted)
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Camera permission not granted</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text style={styles.button}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );

  const flipCamera = () => setCameraType(prev => (prev === "back" ? "front" : "back"));
  const toggleTorch = () => setEnableTorch(prev => !prev);

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo.uri) onOpenEditor(photo.uri);
    } catch (err) {
      console.error("Take picture error:", err);
    }
  };

  return (
    <View style={styles.container}>
      {/* Camera view */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraType}
          enableTorch={enableTorch} // ✅ Dùng enableTorch, không dùng flashMode
        />

        {/* Horizon Line */}
        <View style={styles.horizonWrapper}>
          <View style={[styles.horizonLine, { transform: [{ rotate: `${-tilt}deg` }] }]} />
        </View>

        {/* Grid Overlay */}
        {showGrid && (
          <View style={styles.gridOverlay}>
            <View style={[styles.gridLine, { left: "33%" }]} />
            <View style={[styles.gridLine, { left: "66%" }]} />
            <View style={[styles.gridLine, { top: "33%", width: "100%", height: 1, left: 0 }]} />
            <View style={[styles.gridLine, { top: "66%", width: "100%", height: 1, left: 0 }]} />
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.btn} onPress={toggleTorch}>
          <Text style={styles.btnText}>Torch: {enableTorch ? "On" : "Off"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={flipCamera}>
          <Text style={styles.btnText}>Flip</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.snapBtn} onPress={takePicture}>
          <View style={styles.innerCircle} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={() => setShowGrid(!showGrid)}>
          <Text style={styles.btnText}>{showGrid ? "Hide Grid" : "Show Grid"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={onOpenGallery}>
          <Text style={styles.btnText}>🖼️ Gallery</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  cameraContainer: { flex: 4, position: "relative", overflow: "hidden" },
  camera: { flex: 1, borderRadius: 16 },
  horizonWrapper: { position: "absolute", top: "50%", left: 0, right: 0, alignItems: "center" },
  horizonLine: { width: 120, height: 1, backgroundColor: "rgba(255,255,255,0.6)" },
  controls: { flex: 1, backgroundColor: "#111", flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  btn: { backgroundColor: "#333", padding: 10, borderRadius: 8 },
  btnText: { color: "#fff", fontSize: 12 },
  snapBtn: { borderWidth: 3, borderColor: "#fff", borderRadius: 50, width: 70, height: 70, alignItems: "center", justifyContent: "center" },
  innerCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { color: "#fff" },
  button: { marginTop: 10, backgroundColor: "#2196f3", color: "#fff", padding: 8, borderRadius: 6 },
  gridOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  gridLine: { position: "absolute", backgroundColor: "rgba(255,255,255,0.3)", width: 1, height: "100%" },
});
