import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Dimensions, Animated, Image, PanResponder, Linking, Platform, Alert, } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as MediaLibrary from "expo-media-library";
import { Asset } from "expo-media-library";
import { Accelerometer } from "expo-sensors";

const { width, height } = Dimensions.get("window");

type SegmentData = {
  id: string;
  fg: string;
  bg: string;
  mask: string;
  outline: string | null;
  fgOpacity: number;
  bgOpacity: number;
  outlineEnabled: boolean;
  outlineColor: string;
  fillEnable: boolean;
  fillColor: string;
  fillOpacity: number;
  createdAt: string;
};

type CameraScreenProps = {
  onOpenGallery: () => void;
  overlaySegment?: SegmentData | null;
  onUpdateOverlay: (overlay: SegmentData | null) => void;
  onChangeBackground?: () => void;
};

type FlashMode = "off" | "on" | "auto";

export default function CameraScreen({ onOpenGallery, overlaySegment = null, onUpdateOverlay, onChangeBackground }: CameraScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<CameraType>("back");
  const [flashMode, setFlashMode] = useState<FlashMode>("off");
  const [flashOn, setFlashOn] = useState(false);
  const [tilt, setTilt] = useState(0);
  const cameraRef = useRef<CameraView | null>(null);
  const [showHorizon, setShowHorizon] = useState(true);
  const [gridMode, setGridMode] = useState<0 | 3 | 4>(0);
  const [layerSize, setLayerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0, });

  //overlay
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current; // radian
  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const [editingOverlay, setEditingOverlay] = useState(false);
  const mode = useRef<'none' | 'drag' | 'pinch'>('none'); // track current gesture

  // Lưu trạng thái pinch trước đó
  const lastRotate = useRef(0); // góc overlay trước khi bắt đầu pinch
  const initialPinchDistance = useRef(0); // khoảng cách pinch ban đầu
  const [currentRotate, setCurrentRotate] = useState(0);
  const startAngle = useRef(0);
  useEffect(() => {
    const id = rotate.addListener(({ value }) => {
      setCurrentRotate(value);
    });
    return () => rotate.removeListener(id);
  }, []);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt, gestureState) => {
        setEditingOverlay(true);

        const touches = evt.nativeEvent.touches;

        if (touches.length === 2) {
          // Bắt đầu pinch
          mode.current = 'pinch';
          lastRotate.current = currentRotate;
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          initialPinchDistance.current = Math.sqrt(dx * dx + dy * dy);
        } else if (touches.length === 1) {
          // Bắt đầu drag
          if (mode.current === 'none') mode.current = 'drag';
        }
      },

      onPanResponderMove: (evt, gestureState) => {
        const { dx, dy, moveX, moveY, numberActiveTouches } = gestureState;
        const DEL_X = width / 2;
        const DEL_Y = height - 75;
        const RADIUS = 70;
        const dist = Math.sqrt((moveX - DEL_X) ** 2 + (moveY - DEL_Y) ** 2);

        const touches = evt.nativeEvent.touches;

        // ---- Handle pinch ----
        if (numberActiveTouches === 2 && mode.current !== 'pinch') {
          mode.current = 'pinch';

          // Tính góc ban đầu giữa hai ngón tay
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          startAngle.current = Math.atan2(dy, dx);

          lastRotate.current = currentRotate; // currentRotate lấy từ addListener
          initialPinchDistance.current = Math.sqrt(dx * dx + dy * dy);
        }

        // Khi move pinch
        if (numberActiveTouches === 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          // scale dựa trên distance ban đầu
          const scaleFactor = distance / initialPinchDistance.current;
          scale.setValue(scaleFactor);

          // rotate dựa trên delta giữa góc hiện tại và startAngle
          const deltaAngle = angle - startAngle.current;
          rotate.setValue(lastRotate.current + deltaAngle);

          return;
        }

        // ---- Handle drag ----
        if (mode.current === 'drag' && numberActiveTouches === 1) {
          position.setValue({ x: dx, y: dy });
        }

        // ---- Handle shrink near delete area ----
        if (dist < RADIUS) {
          Animated.timing(scale, {
            toValue: 0.2,
            duration: 100,
            useNativeDriver: true,
          }).start();
        } else if (dist > RADIUS + 5) {
          Animated.timing(scale, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }).start();
        }
      },

      onPanResponderRelease: (evt, gestureState) => {
        const { moveX, moveY, numberActiveTouches } = gestureState;
        const DEL_X = width / 2;
        const DEL_Y = height - 75;
        const RADIUS = 70;
        const dist = Math.sqrt((moveX - DEL_X) ** 2 + (moveY - DEL_Y) ** 2);

        if (dist < RADIUS) onUpdateOverlay(null);

        // Reset mode
        if (mode.current === 'pinch' && numberActiveTouches === 0) {
          mode.current = 'none';
        } else if (mode.current === 'drag') {
          mode.current = 'none';
        }

        setEditingOverlay(false);
      },

      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  //zoom
  const zoomAnim = useRef(new Animated.Value(0.5)).current;
  const [zoom, setZoom] = useState(0.5);

  useEffect(() => {
    const listener = zoomAnim.addListener(({ value }) => setZoom(value));
    return () => zoomAnim.removeListener(listener);
  }, []);

  //horizon
  useEffect(() => {
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const tiltValue =
        Math.atan2(x, Math.sqrt(y * y + z * z)) * (180 / Math.PI);
      setTilt(tiltValue);
    });
    Accelerometer.setUpdateInterval(100);
    return () => subscription.remove();
  }, []);
  //flash
  useEffect(() => {
    if (flashMode !== "auto" || !cameraRef.current) return;
    const interval = setInterval(async () => {
      try {
        const photo = await cameraRef.current?.takePictureAsync({
          quality: 0.1,
          skipProcessing: true,
        });
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

  useEffect(() => {
    if (flashMode === "on") setFlashOn(true);
    else if (flashMode === "off") setFlashOn(false);
  }, [flashMode]);

  const getAverageBrightness = async (uri: string) => {
    return Math.random();
  };

  //album
  const [latestImage, setLatestImage] = useState<Asset | null>(null);
  const [latestImageUri, setLatestImageUri] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);

  const getLocalUri = useCallback(async (asset: Asset) => {
    if (asset.uri.startsWith("ph://")) {
      const localUri = FileSystem.cacheDirectory + asset.filename;
      await FileSystem.copyAsync({ from: asset.uri, to: localUri });
      return localUri;
    }
    return asset.uri;
  }, []);
  // Load ảnh gần nhất từ album
  const loadLatestImage = useCallback(async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") return;

    const assets = await MediaLibrary.getAssetsAsync({
      first: 1,
      sortBy: MediaLibrary.SortBy.creationTime,
      mediaType: ["photo"],
    });

    if (assets.assets.length > 0) {
      setLatestImage(assets.assets[0]);
    }
  }, []);

  useEffect(() => {
    if (!latestImage) return;

    const loadUri = async () => {
      const uri = await getLocalUri(latestImage);
      setLatestImageUri(uri);
    };

    loadUri();
  }, [latestImage, getLocalUri]);

  // Chụp ảnh và lưu vào album
  const takePhoto = useCallback(async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: true,
      });

      const asset = await MediaLibrary.createAssetAsync(photo.uri);
      await MediaLibrary.createAlbumAsync("CameraApp", asset, false);

      // Cập nhật ảnh mới nhất
      await loadLatestImage();
    } catch (err) {
      console.error("Error taking photo:", err);
    }
  }, [cameraRef, loadLatestImage]);

  // Mở album ảnh
  const openInAlbum = async () => {
    if (isOpening) return;
    setIsOpening(true);

    try {
      if (Platform.OS === "ios") {
        const url = "photos-redirect://";
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert("Không thể mở Photos", "Ứng dụng Photos không khả dụng trên thiết bị này.");
        }
      } else if (Platform.OS === "android") {
        // Android: có thể dùng Linking hoặc IntentLauncher
        const uri = "content://media/internal/images/media";
        const supported = await Linking.canOpenURL(uri);
        if (supported) {
          await Linking.openURL(uri);
        } else {
          Alert.alert("Không thể mở Album", "Ứng dụng Album không khả dụng trên thiết bị này.");
        }
      }
    } catch (err) {
      console.error("Error opening album app:", err);
      Alert.alert("Lỗi", "Không thể mở album. Vui lòng thử lại.");
    } finally {
      // Sau khi mở xong hoặc lỗi, cho phép nhấn tiếp
      setIsOpening(false);
    }
  };

  /* ================= Permission ================= */
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

  /* ================= Main UI ================= */
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
        enableTorch={flashOn}
        zoom={(zoom - 0.5) / 9.5}
      />
      {overlaySegment && (
        <Animated.View style={[
          styles.overlayLayer,
          {
            transform: [
              { translateX: position.x },
              { translateY: position.y },
              { scale: scale },
              { rotate: rotate.interpolate({ inputRange: [-Math.PI, Math.PI], outputRange: ["-180deg", "180deg"] }) },
            ],
          },
        ]}
          {...panResponder.panHandlers}
        >
          <View
            style={StyleSheet.absoluteFillObject}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              // Lưu kích thước để OutlineLayer dùng
              setLayerSize({ width, height });
            }}
          >
            {/* 1. Background trong suốt */}
            {overlaySegment.bg && (
              <Image
                source={{ uri: overlaySegment.bg }}
                style={[styles.overlayImage, { opacity: overlaySegment.bgOpacity ?? 1 }]}
                resizeMode="cover"
              />
            )}

            {/* 2. Người gốc */}
            {overlaySegment.fg && (
              <Image
                source={{ uri: overlaySegment.fg }}
                style={[styles.overlayImage, { opacity: overlaySegment.fgOpacity ?? 1 }]}
                resizeMode="cover"
              />
            )}

            {/* 3. Fill màu */}
            {overlaySegment.fillEnable && overlaySegment.mask && (
              <Image
                source={{ uri: overlaySegment.mask }}
                style={[
                  styles.overlayImage,
                  {
                    tintColor: overlaySegment.fillColor,
                    opacity: overlaySegment.fillOpacity ?? 0.5,
                  },
                ]}
                resizeMode="cover"
              />
            )}

            {/* 4. OUTLINE REALTIME – ĐẸP NHẤT, CHUẨN NHẤT */}
            {overlaySegment.outlineEnabled && overlaySegment.outline && (
              <Image
                source={{ uri: overlaySegment.outline }}
                style={[
                  styles.fullImage,
                  {
                    tintColor: overlaySegment.outlineColor,
                    opacity: 1,
                  },
                ]}
                resizeMode="cover"
              />
            )}

          </View>
        </Animated.View>
      )}
      {editingOverlay && (
        <View
          style={{
            position: "absolute",
            bottom: 75,
            left: "50%",
            transform: [{ translateX: -45 }],
            zIndex: 20,
          }}
        >
          <View style={styles.deleteOverlay}>
            <Ionicons name="close" size={40} color="white" />
          </View>
        </View>
      )}

      {!editingOverlay && (
        <ZoomSlider zoom={zoom} zoomAnim={zoomAnim} />
      )}

      {/* Frame corners */}
      <View style={styles.overlayFrame}>
        <View style={styles.cornerTL} />
        <View style={styles.cornerTR} />
        <View style={styles.cornerBL} />
        <View style={styles.cornerBR} />
      </View>

      {/* Horizon */}
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

      {/* Grid */}
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

      {!editingOverlay && (
        <View style={styles.leftSidebar}>
          <TouchableOpacity onPress={() => setCameraType((prev) => (prev === "back" ? "front" : "back"))}>
            <Ionicons name="camera-reverse-outline" style={styles.leftIcon} />
          </TouchableOpacity>

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

          <TouchableOpacity onPress={() => setShowHorizon((p) => !p)}>
            <Ionicons name="remove-outline" style={styles.leftIcon} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setGridMode((prev) => (prev === 0 ? 3 : prev === 3 ? 4 : 0))}>
            <Ionicons name="grid-outline" style={styles.leftIcon} />
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom bar */}
      {!editingOverlay && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={{
              width: 45,
              height: 45,
              marginTop: 18,
              borderRadius: 10,
              overflow: "hidden",
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={openInAlbum}
          >
            {latestImage ? (
              <Image
                source={{ uri: latestImageUri ?? undefined }}
                style={{ width: "100%", height: "100%" }}
              />

            ) : (
              <Ionicons name="albums-outline" size={32} color="white" />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureButton} onPress={takePhoto} />

          <View style={styles.wrappedIcon}>
            <TouchableOpacity style={[styles.sideIcon, { marginRight: 20 }]} onPress={onChangeBackground}>
              <Ionicons name="images-outline" size={32} color="white" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sideIcon} onPress={onOpenGallery}>
              <Ionicons name="person-add-outline" size={32} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

/* ======================== ZOOM SLIDER =========================== */
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

  useEffect(() => {
    const index = zoomValues.indexOf(Number(zoom.toFixed(1)));
    if (listRef.current && index >= 0) {
      listRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    }
  }, []);

  const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: false,
    listener: (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const totalWidth = itemWidth * (zoomValues.length - 1);
      let ratio = offsetX / totalWidth;
      ratio = Math.min(Math.max(ratio, 0), 1);
      const value = +(minZoom + ratio * (maxZoom - minZoom)).toFixed(1);
      zoomAnim.setValue(value);
    },
  });

  const renderItem = ({ item, index }: { item: number; index: number }) => {
    const centerIndex = zoomValues.indexOf(Number(zoom.toFixed(1)));
    const scale = index === centerIndex ? 1.3 : 1;
    const color = index === centerIndex ? "#C259FF" : "#fff";
    return (
      <View style={{ width: itemWidth, justifyContent: "center", alignItems: "center" }}>
        <Animated.Text style={{ fontSize: 12, transform: [{ scale }], color }}>{item.toFixed(1)}</Animated.Text>
      </View>
    );
  };

  return (
    <View style={styles.zoomWrapper} >
      <View style={styles.zoomOverlay}>
        <Text style={styles.markerTop}>▼</Text>
        <Animated.FlatList
          ref={listRef}
          data={zoomValues}
          horizontal
          keyExtractor={(item) => item.toString()}
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          snapToInterval={itemWidth}
          decelerationRate="fast"
          getItemLayout={(data, index) => ({ length: itemWidth, offset: itemWidth * index, index })}
          contentContainerStyle={{ paddingHorizontal: width / 2.7 }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />
        <Text style={styles.markerBottom}>▲</Text>
      </View>
    </View>
  );
};

/* ============================== STYLES ============================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { position: "absolute", width: "100%", height: "100%" },

  overlayLayer: { position: "absolute", top: "15%", left: 0, right: 0, bottom: "25%", zIndex: 5, justifyContent: "center", alignItems: "center" },
  overlayImage: { position: "absolute", width: "100%", height: "100%" },

  overlayFrame: { position: "absolute", top: "15%", left: 0, right: 0, bottom: "25%", borderRadius: 16, borderWidth: 1, borderColor: "#fff" },
  cornerTL: { position: "absolute", top: 0, left: 0, width: 40, height: 40, borderTopWidth: 4, borderLeftWidth: 4, borderColor: "#fff", borderTopLeftRadius: 20 },
  cornerTR: { position: "absolute", top: 0, right: 0, width: 40, height: 40, borderTopWidth: 4, borderRightWidth: 4, borderColor: "#fff", borderTopRightRadius: 20 },
  cornerBL: { position: "absolute", bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: "#fff", borderBottomLeftRadius: 20 },
  cornerBR: { position: "absolute", bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 4, borderRightWidth: 4, borderColor: "#fff", borderBottomRightRadius: 20 },

  gridContainer: { position: "absolute", top: "15%", left: 0, right: 0, bottom: "30%", width: "100%", height: "60%", zIndex: 10, pointerEvents: "none" },
  gridLineV: { position: "absolute", width: 1, height: "100%", backgroundColor: "rgba(255,255,255,0.7)" },
  gridLineH: { position: "absolute", height: 1, width: "100%", backgroundColor: "rgba(255,255,255,0.7)" },

  horizonWrapper: { position: "absolute", top: "44.8%", left: 0, right: 0, alignItems: "center", zIndex: 10, pointerEvents: "none" },
  horizonContainer: { width: 200, alignItems: "center" },
  horizonRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  horizonShort: { width: 35, height: 3, backgroundColor: "rgba(255,60,0,1)", borderRadius: 3, marginHorizontal: 10 },
  horizonLong: { width: 120, height: 3, backgroundColor: "rgba(255,60,0,1)", borderRadius: 3 },
  horizonConnected: { width: 180, height: 4, backgroundColor: "#00ffea", borderRadius: 4 },

  leftSidebar: { position: "absolute", top: "40%", left: 15, zIndex: 10, transform: [{ translateY: -55 }], alignItems: "center" },
  leftIcon: { color: "#fff", fontSize: 32, marginBottom: 20 },
  leftIconButton: { color: "#fff", fontSize: 32, marginBottom: 20 },
  bottomBar: { position: "absolute", bottom: 75, width: "100%", zIndex: 10, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 40 },
  sideIcon: { width: 50, height: 50, justifyContent: "center", alignItems: "center" },
  captureButton: { marginLeft: 75, width: 85, height: 85, borderRadius: 50, backgroundColor: "#C259FF", borderWidth: 3, borderColor: "#fff" },
  wrappedIcon: { flexDirection: "row", alignItems: "center" },

  permissionCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
  permissionText: { color: "#fff", marginBottom: 10, fontSize: 16 },
  permissionButton: { backgroundColor: "#2196f3", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, color: "#fff" },

  zoomWrapper: { position: "absolute", bottom: 170, width: "100%", alignItems: "center" },
  zoomOverlay: { width: "85%", height: 55, backgroundColor: "rgba(0,0,0,0.25)", borderRadius: 100, alignItems: "center", justifyContent: "space-between", paddingVertical: 0 },
  markerTop: { fontSize: 18, color: "#fff", lineHeight: 18 },
  markerBottom: { fontSize: 18, color: "#fff", lineHeight: 20 },

  fullImage: { position: "absolute", width: "100%", height: "100%", },
  deleteOverlay: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: "white", backgroundColor: "red", justifyContent: "center", alignItems: "center", opacity: 0.9, }
});