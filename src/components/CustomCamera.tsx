// src/components/CustomCamera.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  FlatList,
  Animated,
  Easing,
} from "react-native";
import {
  CameraView,
  CameraType,
  FlashMode,
  useCameraPermissions,
} from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { PinchGestureHandler, State } from "react-native-gesture-handler";

export default function CustomCamera() {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [hasMediaPermission, setHasMediaPermission] = useState<boolean | null>(
    null
  );
  const [cameraType, setCameraType] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [zoom, setZoom] = useState<number>(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      if (!permission) await requestPermission();
      const media = await MediaLibrary.requestPermissionsAsync();
      setHasMediaPermission(media.status === "granted");
    })();
  }, []);

  const handleFlashToggle = () => {
    setFlash((prev) =>
      prev === "off" ? "on" : prev === "on" ? "auto" : "off"
    );
  };

  const handleFlip = () => {
    Animated.sequence([
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      Animated.timing(flipAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
    ]).start(() => {
      setCameraType((prev) => (prev === "back" ? "front" : "back"));
    });
  };

  const handlePinch = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      const newZoom = Math.min(Math.max(zoom * event.nativeEvent.scale, 0), 1);
      setZoom(newZoom);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync();
      if (hasMediaPermission) {
        await MediaLibrary.saveToLibraryAsync(photo.uri);
      }
      setPhotos((prev) => [photo.uri, ...prev]);
    } catch (err) {
      console.warn("Error capturing:", err);
    }
  };

  if (!permission) return <Text>Requesting permissions...</Text>;
  if (!permission.granted) return <Text>No access to camera</Text>;

  return (
    <View style={styles.container}>
      <PinchGestureHandler onGestureEvent={handlePinch}>
        <Animated.View
          style={[
            styles.cameraContainer,
            {
              transform: [
                {
                  rotateY: flipAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "180deg"],
                  }),
                },
              ],
            },
          ]}
        >
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={cameraType}
            flash={flash}
            zoom={zoom}
          />
        </Animated.View>
      </PinchGestureHandler>

      <View style={styles.controls}>
        {/* Flash */}
        <TouchableOpacity style={styles.btn} onPress={handleFlashToggle}>
          <Text style={styles.btnText}>Flash: {flash}</Text>
        </TouchableOpacity>

        {/* Flip */}
        <TouchableOpacity style={styles.btn} onPress={handleFlip}>
          <Text style={styles.btnText}>Flip</Text>
        </TouchableOpacity>

        {/* Snap */}
        <TouchableOpacity style={styles.snapBtn} onPress={takePicture}>
          <View style={styles.innerCircle} />
        </TouchableOpacity>

        {/* Gallery */}
        {photos.length > 0 && (
          <TouchableOpacity
            onPress={() => setGalleryVisible(true)}
            style={styles.previewWrapper}
          >
            <Image source={{ uri: photos[0] }} style={styles.preview} />
          </TouchableOpacity>
        )}
      </View>

      {/* Gallery Modal */}
      <Modal visible={galleryVisible} animationType="slide">
        <View style={styles.galleryContainer}>
          <TouchableOpacity
            onPress={() => setGalleryVisible(false)}
            style={styles.closeBtn}
          >
            <Text style={styles.btnText}>Close</Text>
          </TouchableOpacity>
          <FlatList
            data={photos}
            keyExtractor={(uri) => uri}
            horizontal
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.galleryImage} />
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  cameraContainer: { flex: 3, overflow: "hidden" },
  camera: { flex: 1 },
  controls: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
  },
  btn: {
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 8,
    margin: 5,
  },
  btnText: { color: "#fff", fontWeight: "600" },
  snapBtn: {
    borderWidth: 3,
    borderColor: "#fff",
    borderRadius: 50,
    width: 70,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  innerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff",
  },
  previewWrapper: { marginTop: 10 },
  preview: { width: 60, height: 60, borderRadius: 8 },
  galleryContainer: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 50,
    alignItems: "center",
  },
  closeBtn: {
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  galleryImage: {
    width: 300,
    height: 400,
    margin: 10,
    borderRadius: 12,
  },
});
