import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  View, Text, TouchableOpacity, StyleSheet, Alert, Animated, FlatList, Dimensions 
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import Ionicons from '@expo/vector-icons/Ionicons';
import * as MediaLibrary from "expo-media-library";
import { Accelerometer } from "expo-sensors";

const { width } = Dimensions.get("window");

type CameraScreenProps = {
  onOpenGallery: () => void;
};

type FlashMode = "off" | "on" | "auto";

export default function CameraScreen({ onOpenGallery }: CameraScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<CameraType>("back");
  const [flashMode, setFlashMode] = useState<FlashMode>("off");
  const [flashOn, setFlashOn] = useState(false);
  const [tilt, setTilt] = useState(0);
  const cameraRef = useRef<CameraView | null>(null);
  const [showHorizon, setShowHorizon] = useState(true);
  const [gridMode, setGridMode] = useState<0 | 3 | 4>(0);

  // Zoom realtime
  const zoomAnim = useRef(new Animated.Value(0.5)).current;
  const [zoom, setZoom] = useState(0.5);

  useEffect(() => {
    const listener = zoomAnim.addListener(({ value }) => setZoom(value));
    return () => zoomAnim.removeListener(listener);
  }, []);

  // Tilt reading
  useEffect(() => {
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const tiltValue = Math.atan2(x, Math.sqrt(y*y + z*z)) * (180 / Math.PI);
      setTilt(tiltValue);
    });
    Accelerometer.setUpdateInterval(100);
    return () => subscription.remove();
  }, []);

  // Auto Flash
  useEffect(() => {
    if (flashMode !== "auto" || !cameraRef.current) return;

    const interval = setInterval(async () => {
      try {
        const photo = await cameraRef.current?.takePictureAsync({ quality: 0.1, skipProcessing: true });
        if (!photo) return;
        const brightness = await getAverageBrightness(photo.uri);

        if (brightness < 0.3 && flashMode === "auto") setFlashOn(true);
        else if (brightness >= 0.3 && flashMode === "auto") setFlashOn(false);
      } catch (err) {
        console.log(err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [flashMode, flashOn]);

  // Sync flashOn với flashMode khi flashMode = on/off
  useEffect(() => {
    if (flashMode === "on") setFlashOn(true);
    else if (flashMode === "off") setFlashOn(false);
  }, [flashMode]);

  const getAverageBrightness = async (uri: string) => {
    // TODO: xử lý ảnh nhỏ và tính độ sáng trung bình
    return Math.random(); // 0 = tối, 1 = sáng (demo)
  };

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1, skipProcessing: true });
      const asset = await MediaLibrary.createAssetAsync(photo.uri);
      await MediaLibrary.createAlbumAsync("CameraApp", asset, false);
      Alert.alert("Thành công", "Ảnh đã được lưu vào thư viện!");
    } catch (err) {
      console.log(err);
      Alert.alert("Lỗi", "Không thể chụp ảnh.");
    }
  }, []);

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
      {/* Camera */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
        enableTorch={flashOn}
        zoom={(zoom - 0.5) / 9.5}
      />

      {/* ZoomSlider */}
      <ZoomSlider zoom={zoom} zoomAnim={zoomAnim} />

      {/* Frame corners */}
      <View style={styles.overlayFrame}>
        <View style={styles.cornerTL} />
        <View style={styles.cornerTR} />
        <View style={styles.cornerBL} />
        <View style={styles.cornerBR} />
      </View>

      {/* HORIZON */}
      {showHorizon && (
        <View style={styles.horizonWrapper}>
          <View style={styles.horizonContainer}>
            {Math.abs(tilt) < 2 ? (
              <View style={styles.horizonConnected} />
            ) : (
              <View style={styles.horizonRow}>
                <Animated.View style={[styles.horizonShort, { transform: [{ rotate: `${tilt}deg` }] }]} />
                <Animated.View style={[styles.horizonLong, { transform: [{ rotate: `${tilt}deg` }] }]} />
                <Animated.View style={[styles.horizonShort, { transform: [{ rotate: `${tilt}deg` }] }]} />
              </View>
            )}
          </View>
        </View>
      )}

      {/* GRID */}
      {gridMode !== 0 && (
        <View style={styles.gridContainer}>
          {(gridMode === 3 ? [33, 66] : [25, 50, 75]).map((p) => <View key={`v-${p}`} style={[styles.gridLineV, { left: `${p}%` }]} />)}
          {(gridMode === 3 ? [33, 66] : [25, 50, 75]).map((p) => <View key={`h-${p}`} style={[styles.gridLineH, { top: `${p}%` }]} />)}
        </View>
      )}

      {/* LEFT TOOLBAR */}
      <View style={styles.leftSidebar}>
        <TouchableOpacity onPress={() => setCameraType(prev => (prev === "back" ? "front" : "back"))}>
          <Ionicons name="camera-reverse-outline" style={styles.leftIcon} />
        </TouchableOpacity>

        {/* Flash gộp */}
        <TouchableOpacity
          onPress={() => {
            if (flashMode === "off") setFlashMode("on");
            else if (flashMode === "on") setFlashMode("auto");
            else setFlashMode("off");
          }}
        >
          <Ionicons
            name={flashMode === "off" ? "flash-off" : flashMode === "on" ? "flash" : "eye-outline"}
            style={styles.leftIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowHorizon(p => !p)}>
          <Ionicons name="remove-outline" style={styles.leftIcon} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setGridMode(prev => (prev === 0 ? 3 : prev === 3 ? 4 : 0))}>
          <Ionicons name="grid-outline" style={styles.leftIcon} />
        </TouchableOpacity>
      </View>

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.sideIcon} onPress={onOpenGallery}>
          <Ionicons name="images-outline" size={32} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.captureButton} onPress={takePhoto} />
        <TouchableOpacity style={styles.sideIcon} onPress={onOpenGallery}>
          <Ionicons name="person-add-outline" size={32} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ===================== ZoomSlider và styles giữ nguyên ===================== */
const ZoomSlider = ({ zoom, zoomAnim }: { zoom: number; zoomAnim: Animated.Value }) => {
  const minZoom = 0.5;
  const maxZoom = 10;
  const step = 0.1;

  const zoomValues = Array.from(
    { length: Math.floor((maxZoom - minZoom) / step) + 1 },
    (_, i) => +(minZoom + i * step).toFixed(1)
  );

  const listRef = useRef<FlatList>(null);
  const itemWidth = 50;
  const scrollX = useRef(new Animated.Value(0)).current;

  const getVisibleZoomValues = () => {
    const centerIndex = zoomValues.indexOf(Number(zoom.toFixed(1)));
    const start = Math.max(centerIndex - 2, 0);
    const end = Math.min(centerIndex + 2, zoomValues.length - 1);
    return zoomValues.slice(start, end + 1);
  };

  useEffect(() => {
    const index = zoomValues.indexOf(Number(zoom.toFixed(1)));
    if (listRef.current && index >= 0) {
      listRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    }
  }, []);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const totalWidth = itemWidth * (zoomValues.length - 1);
        let ratio = offsetX / totalWidth;
        ratio = Math.min(Math.max(ratio, 0), 1);
        const value = +(minZoom + ratio * (maxZoom - minZoom)).toFixed(1);
        zoomAnim.setValue(value);
      }
    }
  );

  const renderItem = ({ item, index }: { item: number; index: number }) => {
    const centerIndex = zoomValues.indexOf(Number(zoom.toFixed(1)));
    if (Math.abs(index - centerIndex) > 2) return <View style={{ width: itemWidth }} />;

    const scale = index === centerIndex ? 1.3 : 1;
    const color = index === centerIndex ? "#C259FF" : "#fff";

    return (
      <View style={{ width: itemWidth, justifyContent: "center", alignItems: "center" }}>
        <Animated.Text style={{ fontSize: 12, transform: [{ scale }], color }}>
          {item.toFixed(1)}
        </Animated.Text>
      </View>
    );
  };

  return (
    <View style={zoomStyles.zoomWrapper}>
      <View style={zoomStyles.zoomOverlay}>
        <Text style={zoomStyles.markerTop}>▼</Text>

        

        <Animated.FlatList
          ref={listRef}
          data={zoomValues}
          horizontal
          keyExtractor={(item) => item.toString()}
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          snapToInterval={itemWidth}
          decelerationRate="fast"
          getItemLayout={(data, index) => ({
            length: itemWidth,
            offset: itemWidth * index,
            index,
          })}
          contentContainerStyle={{ paddingHorizontal: width / 2.7 }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />

        <Text style={zoomStyles.markerBottom}>▲</Text>
      </View>
    </View>
  );
};

/* ====================== STYLES giữ nguyên ====================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { position: "absolute", width: "100%", height: "100%" },
  overlayFrame: { position: "absolute", top: "15%", left: 0, right: 0, bottom: "25%", borderRadius: 16, borderWidth: 1, borderColor: "#fff" },
  cornerTL: { position: "absolute", top: 0, left: 0, width: 40, height: 40, borderTopWidth: 4, borderLeftWidth: 4, borderColor: "#fff", borderTopLeftRadius: 20 },
  cornerTR: { position: "absolute", top: 0, right: 0, width: 40, height: 40, borderTopWidth: 4, borderRightWidth: 4, borderColor: "#fff", borderTopRightRadius: 20 },
  cornerBL: { position: "absolute", bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: "#fff", borderBottomLeftRadius: 20 },
  cornerBR: { position: "absolute", bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 4, borderRightWidth: 4, borderColor: "#fff", borderBottomRightRadius: 20 },

  gridContainer: { position: "absolute", top: "15%", left: 0, right: 0, bottom: "30%", width: "100%", height: "60%" },
  gridLineV: { position: "absolute", width: 1, height: "100%", backgroundColor: "rgba(255,255,255,0.7)" },
  gridLineH: { position: "absolute", height: 1, width: "100%", backgroundColor: "rgba(255,255,255,0.7)" },

  horizonWrapper: { position: "absolute", top: "44.8%", left: 0, right: 0, alignItems: "center" },
  horizonContainer: { width: 200, alignItems: "center" },
  horizonRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  horizonShort: { width: 35, height: 3, backgroundColor: "rgba(255,60,0,1)", borderRadius: 3, marginHorizontal: 10 },
  horizonLong: { width: 120, height: 3, backgroundColor: "rgba(255,60,0,1)", borderRadius: 3 },
  horizonConnected: { width: 180, height: 4, backgroundColor: "#00ffea", borderRadius: 4 },

  leftSidebar: { position: "absolute", top: "40%", left: 15, transform: [{ translateY: -55 }], alignItems: "center" },
  leftIcon: { color: "#fff", fontSize: 32, marginBottom: 20 },

  bottomBar: { position: "absolute", bottom: 75, width: "100%", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 40 },
  sideIcon: { width: 50, height: 50, justifyContent: "center", alignItems: "center" },
  captureButton: { width: 85, height: 85, borderRadius: 50, backgroundColor: "#C259FF", borderWidth: 3, borderColor: "#fff" },

  permissionCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
  permissionText: { color: "#fff", marginBottom: 10, fontSize: 16 },
  permissionButton: { backgroundColor: "#2196f3", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, color: "#fff" },
});

const zoomStyles = StyleSheet.create({
  zoomWrapper: { position: "absolute", bottom: 170, width: "100%", alignItems: "center" },
  zoomOverlay: { width: "85%", height: 55, backgroundColor: "rgba(0,0,0,0.25)", borderRadius: 100, alignItems: "center", justifyContent: "space-between", paddingVertical: 0 },
  markerTop: { fontSize: 18, color: "#fff", lineHeight: 18 },
  markerBottom: { fontSize: 18, color: "#fff", lineHeight: 20 },
});

