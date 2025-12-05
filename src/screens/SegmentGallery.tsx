import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";

import segmentUtils from "../components/SegmentUtils";
import {
  loadSegments,
  saveSegment,
  deleteSegment,
  generateSegmentId,
  SegmentData,
} from "../components/SegmentStorage";

export type SegmentGalleryProps = {
  onClose: () => void;
  onSelectSegment: (data: {
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
  }) => void;
};

const { width } = Dimensions.get("window");
const NUM_COLUMNS = 2;
const PADDING_HORIZONTAL = 20;
const SPACING = 10;
const ITEM_WIDTH = Math.floor(
  (width - PADDING_HORIZONTAL * 2 - SPACING * (NUM_COLUMNS - 1)) / NUM_COLUMNS
);

export default function SegmentGallery({ onClose, onSelectSegment }: SegmentGalleryProps) {
  const [segments, setSegments] = useState<SegmentData[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [processingLoading, setProcessingLoading] = useState(false);

  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const data = await loadSegments();
        setSegments(data.reverse());
      } catch (error) {
        console.error("Lỗi khi tải segments:", error);
        Alert.alert("Lỗi", "Không thể tải dữ liệu ảnh.");
      } finally {
        setInitialLoading(false);
      }
    };
    fetchSegments();
  }, []);

  const pickImage = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Lỗi", "Cần quyền truy cập thư viện ảnh để chọn ảnh.");
        return;
      }
    }

    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!res.canceled && res.assets?.length > 0) {
      const uri = res.assets[0].uri;
      setProcessingLoading(true);
      try {
        const result = await segmentUtils.segmentImage(uri);
        if (result && result.fg && result.bg && result.mask) {
          const newSegment: SegmentData = {
            id: generateSegmentId(),
            fgUri: result.fg,
            bgUri: result.bg,
            maskUri: result.mask,
            maskOutlineUri: result.maskOutline,
            fgOpacity: 1,
            bgOpacity: 1,
            outlineEnabled: true,
            outlineSize: 2,
            outlineColor: "white",
            fillEnable: true,
            fillColor: "#fc4747ff",
            fillOpacity: 0.5,
            createdAt: new Date().toISOString(),
          };
          await saveSegment(newSegment);
          setSegments(prev => [newSegment, ...prev]);
          handleSelectSegment(newSegment);
        } else {
          Alert.alert("Lỗi", "Xử lý ảnh không tạo ra kết quả hợp lệ.");
        }
      } catch (err) {
        console.error("Segmentation failed:", err);
        Alert.alert("Lỗi", "Không thể xử lý ảnh.");
      } finally {
        setProcessingLoading(false);
      }
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Xoá ảnh", "Bạn có chắc muốn xoá ảnh này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: async () => {
          await deleteSegment(id);
          setSegments(prev => prev.filter(s => s.id !== id));
        },
      },
    ]);
  };

  const handleSelectSegment = (item: SegmentData) => {
    onSelectSegment({
      id: item.id,
      fgUri: item.fgUri,
      bgUri: item.bgUri,
      maskUri: item.maskUri,
      maskOutlineUri: item.maskOutlineUri,
      fgOpacity: item.fgOpacity,
      bgOpacity: item.bgOpacity,
      outlineEnabled: item.outlineEnabled,
      outlineSize: item.outlineSize,
      outlineColor: item.outlineColor,
      fillEnable: item.fillEnable,
      fillColor: item.fillColor,
      fillOpacity: item.fillOpacity,
      createdAt: item.createdAt,
    });
  };

  const dataWithAddButton = useMemo(() => {
    if (segments.length === 0) return ["add" as const];
    return ["add" as const, ...segments];
  }, [segments]);

  const numColumns = Math.min(NUM_COLUMNS, dataWithAddButton.length);

  const renderItem = ({ item }: { item: SegmentData | "add" }) => {
    if (item === "add") {
      return (
        <View style={styles.itemWrapper}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={pickImage}
            disabled={processingLoading}
          >
            {processingLoading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <Text style={styles.addBtnText}>+</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    if (!item || !item.fgUri) return null;

    return (
      <View style={styles.itemWrapper}>
        <Image source={{ uri: item.fgUri }} style={styles.imageItem} />
        <View style={styles.overlay}>

          <TouchableOpacity style={styles.iconButton} onPress={() => handleSelectSegment(item)}>
            <Text style={styles.iconText}>📸</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => handleSelectSegment(item)}>
            <Text style={styles.iconText}>✏️</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.iconButton, styles.deleteButton]} onPress={() => handleDelete(item.id)}>
            <Text style={styles.iconText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <Text style={styles.title}>Danh sách Form</Text>

        {initialLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0a84ff" />
            <Text style={styles.loadingText}>Đang tải thư viện...</Text>
          </View>
        ) : (
          <FlatList
            data={dataWithAddButton} // ["add"] nếu rỗng, ["add", ...segments] nếu có segment
            numColumns={Math.min(NUM_COLUMNS, dataWithAddButton.length)}
            keyExtractor={(item, index) => (typeof item === "string" ? `add-${index}` : item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.flatListContent}
            columnWrapperStyle={dataWithAddButton.length > 1 ? styles.columnWrapper : undefined}
          />
        )}

        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Đóng</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#1c1c1e" },
  container: { flex: 1, paddingTop: Platform.OS === "ios" ? 0 : 20, backgroundColor: "#1c1c1e" },
  title: { fontSize: 22, fontWeight: "bold", marginVertical: 15, color: "#fff", textAlign: "center" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#fff", marginTop: 10, fontSize: 16 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  emptyText: { color: "#aaa", fontSize: 18, textAlign: "center", lineHeight: 28 },
  flatListContent: { paddingHorizontal: PADDING_HORIZONTAL - SPACING / 2, paddingBottom: 20, flexGrow: 1 },
  columnWrapper: { justifyContent: "space-between" },
  itemWrapper: { width: ITEM_WIDTH, height: ITEM_WIDTH, marginHorizontal: SPACING / 2, borderRadius: 15, overflow: "hidden", backgroundColor: "#333333", marginBottom: SPACING },
  addBtn: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center", backgroundColor: "#3a3a3c", borderWidth: 2, borderColor: "#4a4a4c" },
  addBtnText: { fontSize: 40, color: "#fff", fontWeight: "300" },
  imageItem: { width: "100%", height: "100%", resizeMode: "cover" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0, 0, 0, 0.4)", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 15, alignItems: "flex-end", paddingBottom: 10 },
  iconButton: { backgroundColor: "rgba(255, 255, 255, 0.25)", borderRadius: 10, padding: 6 },
  iconText: { fontSize: 20 },
  deleteButton: {},
  closeBtn: { alignSelf: "center", backgroundColor: "#0a84ff", paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10, marginTop: 10, marginBottom: 5 },
  closeBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
