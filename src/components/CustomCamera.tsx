import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Accelerometer } from "expo-sensors";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isLevel, setIsLevel] = useState(true);
  const [tilt, setTilt] = useState(0);
  const cameraRef = useRef(null);

  useEffect(() => {
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      // Cân bằng ngang (horizon): kiểm tra độ nghiêng trục x
      const tiltValue = Math.atan2(x, Math.sqrt(y * y + z * z)) * (180 / Math.PI);
      setTilt(tiltValue);
      setIsLevel(Math.abs(tiltValue) < 3); // nghiêng dưới 3° coi như cân bằng
    });
    Accelerometer.setUpdateInterval(100);
    return () => subscription && subscription.remove();
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

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} />

      {/* Grid Overlay */}
      <View style={styles.gridContainer}>
        {[1, 2].map((i) => (
          <View key={`v-${i}`} style={[styles.gridLine, { left: `${(i * 100) / 3}%`, width: 1 }]} />
        ))}
        {[1, 2].map((i) => (
          <View key={`h-${i}`} style={[styles.gridLine, { top: `${(i * 100) / 3}%`, height: 1 }]} />
        ))}
      </View>

      {/* Horizon Indicator */}
      <View style={styles.levelIndicatorContainer}>
        <View
          style={[
            styles.levelLine,
            {
              transform: [{ rotate: `${-tilt}deg` }],
              backgroundColor: isLevel ? "#00ff00" : "#ff4444",
            },
          ]}
        />
        <Text style={[styles.levelText, { color: isLevel ? "#0f0" : "#f44" }]}>
          {isLevel ? "Level" : `${tilt.toFixed(1)}°`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  levelIndicatorContainer: {
    position: "absolute",
    bottom: 60,
    alignSelf: "center",
    alignItems: "center",
  },
  levelLine: {
    width: 100,
    height: 3,
    borderRadius: 3,
  },
  levelText: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "bold",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { color: "#fff" },
  button: {
    marginTop: 10,
    backgroundColor: "#2196f3",
    color: "#fff",
    padding: 8,
    borderRadius: 6,
  },
});
