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
import {
  SAMPLE_CATEGORIES,
  SampleImage,
} from "../components/sampleImages";



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
  }) => void;
};


const { width } = Dimensions.get("window");

const NUM_COLUMNS = 2;
const PADDING_HORIZONTAL = 20;
const SPACING = 10;
const ITEM_WIDTH = Math.floor(
  (width - PADDING_HORIZONTAL * 2 - SPACING * (NUM_COLUMNS - 1)) / NUM_COLUMNS
);

export default function SegmentGallery({
  onClose,
  onSelectSegment,
}: SegmentGalleryProps) {

  const [activeTab, setActiveTab] = useState<"sample" | "saved">("sample");
  const [segments, setSegments] = useState<SegmentData[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [processingLoading, setProcessingLoading] = useState(false);

  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const data = await loadSegments();
        setSegments(data.reverse());
      } catch {
        Alert.alert("Lỗi", "Không thể tải dữ liệu ảnh.");
      } finally {
        setInitialLoading(false);
      }
    };
    fetchSegments();
  }, []);

  /* =======================
     PICK IMAGE (SAVED TAB)
  ======================== */
  const pickImage = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Lỗi", "Cần quyền truy cập thư viện ảnh.");
        return;
      }
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!res.canceled && res.assets?.length > 0) {
      createSegmentFromUri(res.assets[0].uri);
    }
  };

  /* =======================
     CREATE SEGMENT (COMMON)
  ======================== */
  const createSegmentFromUri = async (uri: string) => {
    setProcessingLoading(true);
    try {
      const result = await segmentUtils.segmentImage(uri);

      if (!result?.fg || !result?.bg || !result?.mask) {
        throw new Error("Invalid result");
      }

      const newSegment: SegmentData = {
        id: generateSegmentId(),
        fg: result.fg,
        bg: result.bg,
        mask: result.mask,
        outline: result.outline,
        fgOpacity: 1,
        bgOpacity: 1,
        outlineEnabled: true,
        outlineColor: "white",
        fillEnable: true,
        fillColor: "#fc4747ff",
        fillOpacity: 0.5,
        createdAt: new Date().toISOString(),
      };

      await saveSegment(newSegment);
      setSegments(prev => [newSegment, ...prev]);

      handleSelectSegment(newSegment);
    } catch {
      Alert.alert("Lỗi", "Không thể xử lý ảnh.");
    } finally {
      setProcessingLoading(false);
    }
  };

  /* =======================
     SAMPLE SELECT
  ======================== */
  const handleSelectSample = async (item: SampleImage) => {
    const asset = Image.resolveAssetSource(item.source);
    createSegmentFromUri(asset.uri);
  };

  /* =======================
     SELECT / DELETE
  ======================== */
  const handleSelectSegment = (item: SegmentData) => {
    onSelectSegment({ ...item });
  };

  const handleDelete = (id: string) => {
    Alert.alert("Xoá ảnh", "Bạn có chắc muốn xoá ảnh này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSegment(id);
            setSegments(prev => prev.filter(s => s.id !== id));
          } catch {
            Alert.alert("Lỗi", "Không thể xoá ảnh.");
          }
        }
      },
    ]);
  };

  /* =======================
     DATA + RENDER
  ======================== */
  const dataSaved = useMemo(() => {
    if (segments.length === 0) return ["add" as const];
    return ["add" as const, ...segments];
  }, [segments]);

  const renderSavedItem = ({ item }: { item: SegmentData | "add" }) => {
    if (item === "add") {
      return (
        <TouchableOpacity
          style={styles.itemWrapper}
          onPress={pickImage}
          disabled={processingLoading}
        >
          <View style={styles.addBtn}>
            {processingLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.addBtnText}>+</Text>
            )}
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.itemWrapper}>
        <Image source={{ uri: item.fg }} style={styles.imageItem} />
        <View style={styles.overlay}>
          <TouchableOpacity onPress={() => { handleSelectSegment(item); onClose(); }}>
            <Text>📸</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleSelectSegment(item)}>
            <Text>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Text>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSampleItem = ({ item }: { item: SampleImage }) => (
    <TouchableOpacity
      style={styles.itemWrapper}
      onPress={() => handleSelectSample(item)}
    >
      <Image source={item.source} style={styles.imageItem} />
    </TouchableOpacity>
  );

  /* =======================
     UI
  ======================== */
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        <Text style={styles.title}>Danh sách Form</Text>

        {/* Tabs */}
        <View style={styles.tabWrapper}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "sample" && styles.tabActive]}
            onPress={() => setActiveTab("sample")}
          >
            <Text style={styles.tabText}>Mẫu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "saved" && styles.tabActive]}
            onPress={() => setActiveTab("saved")}
          >
            <Text style={styles.tabText}>Đã lưu</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {initialLoading ? (
          <ActivityIndicator color="#fff" />
        ) : activeTab === "sample" ? (
          <FlatList
            data={SAMPLE_CATEGORIES}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.categoryBlock}>
                <Text style={styles.categoryTitle}>
                  {item.title.toUpperCase()}
                </Text>

                <FlatList
                  key="sample"
                  data={item.images}
                  horizontal
                  keyExtractor={img => img.id}
                  renderItem={renderSampleItem}
                  showsHorizontalScrollIndicator={false}
                />
              </View>
            )}
          />
        ) : (
          <FlatList<SegmentData | "add">
            key="saved"
            data={dataSaved}
            numColumns={NUM_COLUMNS}
            keyExtractor={(item, index) =>
              typeof item === "string" ? `add-${index}` : item.id
            }
            renderItem={renderSavedItem}
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
  tabWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
  },

  tab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#2c2c2e",
    marginHorizontal: 5,
  },

  tabActive: {
    backgroundColor: "#0a84ff",
  },

  tabText: {
    color: "#fff",
    fontWeight: "600",
  },

  categoryBlock: {
    marginBottom: 20,
  },

  categoryTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 15,
    marginBottom: 10,
  },

  sampleItem: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    marginLeft: 15,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#333",
  },

  sampleImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },


});
