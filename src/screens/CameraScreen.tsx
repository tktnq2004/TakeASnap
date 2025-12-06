import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  Animated,
  Image,
  PanResponder,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as MediaLibrary from "expo-media-library";
import { Accelerometer } from "expo-sensors";

const { width, height } = Dimensions.get("window");


type SegmentData = {
  id: string;
  fgUri: string;
  bgUri: string | null;
  maskUri: string | null;
  maskOutlineUri: string | null;
  fgOpacity: number;
  bgOpacity: number;
  outlineEnabled: boolean;
  outlineSize: number;
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
};

type FlashMode = "off" | "on" | "auto";

export default function CameraScreen({ onOpenGallery, overlaySegment = null, onUpdateOverlay }: CameraScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<CameraType>("back");
  const [flashMode, setFlashMode] = useState<FlashMode>("off");
  const [flashOn, setFlashOn] = useState(false);
  const [tilt, setTilt] = useState(0);
  const cameraRef = useRef<CameraView | null>(null);
  const [showHorizon, setShowHorizon] = useState(true);
  const [gridMode, setGridMode] = useState<0 | 3 | 4>(0);

  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current; // radian
  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const [editingOverlay, setEditingOverlay] = useState(false);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setEditingOverlay(true),
      onPanResponderMove: (evt, gestureState) => {
        const { dx, dy, numberActiveTouches, moveX, moveY } = gestureState;
        const DEL_X = width / 2;
        const DEL_Y = height - 75;
        const RADIUS = 70;
        const dist = Math.sqrt((moveX - DEL_X) ** 2 + (moveY - DEL_Y) ** 2);

        if (numberActiveTouches === 1) {
          position.setValue({ x: dx, y: dy });

        } else if (numberActiveTouches === 2) {
          const touches = evt.nativeEvent.touches;
          const dxTouches = touches[0].pageX - touches[1].pageX;
          const dyTouches = touches[0].pageY - touches[1].pageY;
          const distance = Math.sqrt(dxTouches ** 2 + dyTouches ** 2);
          const angle = Math.atan2(dyTouches, dxTouches);
          scale.setValue(distance / 200);
          rotate.setValue(angle);
        }
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
        const { moveX, moveY } = gestureState;
        const DEL_X = width / 2;
        const DEL_Y = height - 75;
        const RADIUS = 70;
        const dist = Math.sqrt((moveX - DEL_X) ** 2 + (moveY - DEL_Y) ** 2);

        if (dist < RADIUS)
          onUpdateOverlay(null);

        setEditingOverlay(false);
      },
    })
  ).current;

  //zoom
  const zoomAnim = useRef(new Animated.Value(0.5)).current;
  const [zoom, setZoom] = useState(0.5);

  useEffect(() => {
    const listener = zoomAnim.addListener(({ value }) => setZoom(value));
    return () => zoomAnim.removeListener(listener);
  }, []);

  useEffect(() => {
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const tiltValue =
        Math.atan2(x, Math.sqrt(y * y + z * z)) * (180 / Math.PI);
      setTilt(tiltValue);
    });
    Accelerometer.setUpdateInterval(100);
    return () => subscription.remove();
  }, []);

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

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: true,
      });
      const asset = await MediaLibrary.createAssetAsync(photo.uri);
      await MediaLibrary.createAlbumAsync("CameraApp", asset, false);
    } catch (err) {
      console.log(err);
    }
  }, []);

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
          {overlaySegment.bgUri && (
            <Image
              source={{ uri: overlaySegment.bgUri }}
              style={[
                styles.overlayImage,
                { opacity: overlaySegment.bgOpacity ?? 1 }
              ]}
              resizeMode="cover"
            />
          )}
          {overlaySegment.fgUri && (
            <Image
              source={{ uri: overlaySegment.fgUri }}
              style={[
                styles.overlayImage,
                { opacity: overlaySegment.fgOpacity ?? 1 }
              ]}
              resizeMode="cover"
            />
          )}

          {overlaySegment.fillEnable && overlaySegment.maskUri && (
            <Image
              source={{ uri: overlaySegment.maskUri }}
              style={[
                styles.overlayImage,
                {
                  tintColor: overlaySegment.fillColor,
                  opacity: overlaySegment.fillOpacity ?? 0.5
                }
              ]}
              resizeMode="cover"
            />
          )}
          {overlaySegment.outlineEnabled && overlaySegment.maskOutlineUri && (
            <Image
              source={{ uri: overlaySegment.maskOutlineUri }}
              style={[
                styles.overlayImage,
                {
                  tintColor: overlaySegment.outlineColor,
                  opacity: 1
                }
              ]}
              resizeMode="cover"
            />
          )}
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
          <TouchableOpacity style={styles.sideIcon} onPress={onOpenGallery}>
            <Ionicons name="images-outline" size={32} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButton} onPress={takePhoto} />

          <TouchableOpacity style={styles.sideIcon} onPress={onOpenGallery}>
            <Ionicons name="person-add-outline" size={32} color="white" />
          </TouchableOpacity>
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

  horizonWrapper: { position: "absolute", top: "44.8%", left: 0, right: 0, alignItems: "center" },
  horizonContainer: { width: 200, alignItems: "center" },
  horizonRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  horizonShort: { width: 35, height: 3, backgroundColor: "rgba(255,60,0,1)", borderRadius: 3, marginHorizontal: 10 },
  horizonLong: { width: 120, height: 3, backgroundColor: "rgba(255,60,0,1)", borderRadius: 3 },
  horizonConnected: { width: 180, height: 4, backgroundColor: "#00ffea", borderRadius: 4 },

  leftSidebar: { position: "absolute", top: "40%", left: 15, zIndex: 10, transform: [{ translateY: -55 }], alignItems: "center" },
  leftIcon: { color: "#fff", fontSize: 32, marginBottom: 20 },

  bottomBar: { position: "absolute", bottom: 75, width: "100%", zIndex: 10, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 40 },
  sideIcon: { width: 50, height: 50, justifyContent: "center", alignItems: "center" },
  captureButton: { width: 85, height: 85, borderRadius: 50, backgroundColor: "#C259FF", borderWidth: 3, borderColor: "#fff" },

  permissionCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
  permissionText: { color: "#fff", marginBottom: 10, fontSize: 16 },
  permissionButton: { backgroundColor: "#2196f3", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, color: "#fff" },

  zoomWrapper: { position: "absolute", bottom: 170, width: "100%", alignItems: "center" },
  zoomOverlay: { width: "85%", height: 55, backgroundColor: "rgba(0,0,0,0.25)", borderRadius: 100, alignItems: "center", justifyContent: "space-between", paddingVertical: 0 },
  markerTop: { fontSize: 18, color: "#fff", lineHeight: 18 },
  markerBottom: { fontSize: 18, color: "#fff", lineHeight: 20 },

  deleteOverlay: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: "white", backgroundColor: "red", justifyContent: "center", alignItems: "center", opacity: 0.9, }
});
