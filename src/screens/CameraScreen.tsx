import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated } from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import Ionicons from '@expo/vector-icons/Ionicons';
import * as MediaLibrary from "expo-media-library";
import { Accelerometer } from "expo-sensors";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [zoom, setZoom] = useState(0); // zoom bình thường 0
  const [cameraType, setCameraType] = useState<CameraType>("back");
  const [flashOn, setFlashOn] = useState(false);
  const [tilt, setTilt] = useState(0);
  const cameraRef = useRef<CameraView | null>(null);
  const [showHorizon, setShowHorizon] = useState(true);
  const [gridMode, setGridMode] = useState<0 | 3 | 4>(0);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);

  // Focus animation
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = (event: any) => {
    const { locationX, locationY, target } = event.nativeEvent;
    const { width, height } = target;
    const x = locationX / width;
    const y = locationY / height;

    setFocusPoint({ x, y });
    focusAnim.setValue(0);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => setFocusPoint(null));
  };

  useEffect(() => {
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const tiltValue = Math.atan2(x, Math.sqrt(y * y + z * z)) * (180 / Math.PI);
      setTilt(tiltValue);
    });
    Accelerometer.setUpdateInterval(100);
    return () => subscription.remove();
  }, []);

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1, skipProcessing: true });
      const asset = await MediaLibrary.createAssetAsync(photo.uri);
      await MediaLibrary.createAlbumAsync("CameraApp", asset, false);
      Alert.alert("Thành công", "Ảnh đã được lưu vào thư viện!");
      console.log(photo);
    } catch (err) {
      console.log(err);
      Alert.alert("Lỗi", "Không thể chụp ảnh.");
    }
  }, []);

  const onOpenGallery = async() => {
    // Logic mở gallery bằng expo-image-picker
    console.log("Open Gallery");
  };

  if (!permission) return <View />;
  if (!permission.granted)
    return (
      <View style={styles.permissionCenter}>
        <Text style={styles.permissionText}>Ứng dụng cần quyền Camera</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text style={styles.permissionButton}>Cấp quyền</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
        zoom={zoom}
        enableTorch={flashOn}
        onTouchEnd={handleFocus} // focus point
      />

      {/* Focus point */}
      {focusPoint && (
        <Animated.View
          style={[
            styles.focusCircle,
            {
              left: `${focusPoint.x * 100}%`,
              top: `${focusPoint.y * 100}%`,
              opacity: focusAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
              transform: [{ scale: focusAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }],
            },
          ]}
        />
      )}

      {/* Khung viền bo góc */}
      <View style={styles.overlayFrame}>
        <View style={styles.cornerTL} />
        <View style={styles.cornerTR} />
        <View style={styles.cornerBL} />
        <View style={styles.cornerBR} />
      </View>

      {/* Đường ngang hiển thị độ nghiêng */}
      {showHorizon && (
        <View style={styles.horizonWrapper}>
          <View
            style={[
              styles.horizonLine,
              {
                transform: [{ rotate: `${-tilt}deg` }],
                backgroundColor: Math.abs(tilt) < 1 ? "#ff02e1fa" : "rgba(246, 64, 3, 1)",
              },
            ]}
          />
        </View>
      )}

      {/* Grid 3x3 hoặc 4x4 */}
      {gridMode !== 0 && (
        <View style={styles.gridContainer}>
          {(gridMode === 3 ? [33, 66] : [25, 50, 75]).map((p) => (
            <View key={`v-${p}`} style={[styles.gridLineV, { left: `${p}%` }]} />
          ))}
          {(gridMode === 3 ? [33, 66] : [25, 50, 75]).map((p) => (
            <View key={`h-${p}`} style={[styles.gridLineH, { top: `${p}%` }]} />
          ))}
        </View>
      )}

      {/* Thanh công cụ bên trái */}
      <View style={styles.leftSidebar}>
        <TouchableOpacity onPress={() => setCameraType((prev) => (prev === "back" ? "front" : "back"))}>
          <Ionicons name="camera-reverse" style={styles.leftIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFlashOn((p) => !p)}>
          <Ionicons name={flashOn ? "flash" : "flash-off"} style={styles.leftIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowHorizon((p) => !p)}>
          <Ionicons name="remove-outline" style={styles.leftIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setGridMode((prev) => (prev === 0 ? 3 : prev === 3 ? 4 : 0))}>
          <Ionicons name="grid" style={styles.leftIcon} />
        </TouchableOpacity>
      </View>

      {/* Thanh dưới – Gallery + Chụp ảnh + Person-add */}
    <View style={styles.bottomBar}>
      {/* Mở gallery */}
      <TouchableOpacity style={styles.sideIcon} onPress={onOpenGallery}>
      <Ionicons name="images-outline" size={32} color="white" />
    </TouchableOpacity>

      {/* Nút chụp ảnh */}
    <TouchableOpacity style={styles.captureButton} onPress={takePhoto} />

      {/* Person-add */}
    <TouchableOpacity style={styles.sideIcon} onPress={() => console.log("Add Person")}>
      <Ionicons name="person-add-outline" size={32} color="white" />
    </TouchableOpacity>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { position: "absolute", width: "100%", height: "100%" },

  overlayFrame: {
    position: "absolute",
    top: "15%",
    left: "0%",
    right: "0%",
    bottom: "25%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  cornerTL: { 
    position: "absolute",
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#fff",
    borderTopLeftRadius: 20 
  },
  cornerTR: { 
    position: "absolute", 
    top: 0, 
    right: 0, 
    width: 40, 
    height: 40, 
    borderTopWidth: 4, 
    borderRightWidth: 4, 
    borderColor: "#fff", 
    borderTopRightRadius: 20 },
  cornerBL: { 
    position: "absolute", 
    bottom: 0, 
    left: 0, 
    width: 40, 
    height: 40, 
    borderBottomWidth: 4, 
    borderLeftWidth: 4, 
    borderColor: "#fff", 
    borderBottomLeftRadius: 20 
  },
  cornerBR: { 
    position: "absolute", 
    bottom: 0, 
    right: 0, 
    width: 40, 
    height: 40, 
    borderBottomWidth: 4, 
    borderRightWidth: 4, 
    borderColor: "#fff", 
    borderBottomRightRadius: 20 
  },

  gridContainer: { 
    position: "absolute", 
    top: "15%", 
    left: "0%", 
    right: "0%", 
    bottom: "30%", 
    width: "100%", 
    height: "60%" 
  },
  gridLineV: { 
    position: "absolute", 
    width: 1, 
    height: "100%", 
    backgroundColor: "rgba(255, 255, 255, 0.69)" 
  },
  gridLineH: { 
    position: "absolute", 
    height: 1, 
    width: "100%", 
    backgroundColor: "rgba(255, 255, 255, 0.69)" 
  },

  horizonWrapper: { 
    position: "absolute", 
    top: "45%", 
    left: "0%", 
    right: "0%", 
    alignItems: "center" 
  },

  horizonLine: { 
    width: 160, 
    height: 2, 
    backgroundColor: "rgba(255,255,255,0.6)" 
  },

  leftSidebar: { 
    position: "absolute", 
    top: "50%", 
    left: 20, 
    transform: [{ translateY: -60 }], 
    alignItems: "center" 
  },

  leftIcon: { 
    color: "#fff", 
    fontSize: 32, 
    marginBottom: 20 
  },

  bottomBar: { 
    position: "absolute",
    bottom: 30,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 40, // khoảng cách 2 icon ra 2 bên
  },

  sideIcon: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },

  captureButton: { 
    width: 85, 
    height: 85, 
    borderRadius: 50, 
    backgroundColor: "#C259FF", 
    borderWidth: 3, 
    borderColor: "#fff" 
  },

  focusCircle: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#00ffff",
    backgroundColor: "rgba(0,255,255,0.2)",
    marginLeft: -30,
    marginTop: -30,
  },

  permissionCenter: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  permissionText: { 
    color: "#fff", 
    marginBottom: 10, 
    fontSize: 16 
  },
  permissionButton: { 
    backgroundColor: "#2196f3", 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 8, color: "#fff"
   },
});
