import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
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
  onSelectSegment: (data: { fg: string; bg: string }) => void;
};

export default function SegmentGallery({ onClose, onSelectSegment }: SegmentGalleryProps) {
  const [segments, setSegments] = useState<SegmentData[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Load dữ liệu khi mở gallery
  useEffect(() => {
    (async () => {
      const data = await loadSegments();
      setSegments(data.reverse()); // hiển thị ảnh mới lên đầu
    })();
  }, []);

  // 🔹 Chọn ảnh từ thư viện
  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!res.canceled && res.assets?.length > 0) {
      const uri = res.assets[0].uri;
      setLoading(true);
      try {
        const result = await segmentUtils.segmentImage(uri);
        if (result && result.fg && result.bg) {
          const newSegment: SegmentData = {
            id: generateSegmentId(),
            imageUri: result.fg, // ảnh người
            backgroundUri: result.bg, // ảnh nền tách riêng
            overlayColor: "#00FF00",
            overlayOpacity: 0.5,
            overlayBlur: 0,
            outlineSize: 2,
            createdAt: new Date().toISOString(),
          };
          await saveSegment(newSegment);
          setSegments((prev) => [newSegment, ...prev]);
          onSelectSegment({ fg: result.fg, bg: result.bg }); // ⚙️ truyền cả 2
        }
      } catch (err) {
        console.error("Segmentation failed:", err);
        Alert.alert("Lỗi", "Không thể xử lý ảnh.");
      } finally {
        setLoading(false);
      }
    }
  };

  // 🔹 Xóa ảnh (giữ lâu)
  const handleDelete = (id: string) => {
    Alert.alert("Xoá ảnh", "Bạn có chắc muốn xoá ảnh này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: async () => {
          await deleteSegment(id);
          setSegments((prev) => prev.filter((s) => s.id !== id));
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: SegmentData | "add" }) => {
    if (item === "add") {
      return (
        <TouchableOpacity style={styles.addBtn} onPress={pickImage} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color="#555" /> : <Text style={{ fontSize: 30 }}>＋</Text>}
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        onPress={() => onSelectSegment({ fg: item.imageUri, bg: item.backgroundUri ?? "" })}
        onLongPress={() => handleDelete(item.id)}
      >
        <Image source={{ uri: item.imageUri }} style={styles.imageItem} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Text style={styles.title}>📁 Ảnh đã tách nền</Text>

      <FlatList
        data={["add", ...segments]}
        numColumns={3}
        keyExtractor={(item, index) =>
          typeof item === "string" ? `add-${index}` : item.id
        }
        renderItem={renderItem}
        contentContainerStyle={{ padding: 10 }}
      />

      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <Text style={{ color: "#fff" }}>Đóng</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 10,
    color: "#fff",
    textAlign: "center",
  },
  addBtn: {
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
  },
  imageItem: {
    width: 100,
    height: 100,
    borderRadius: 10,
    margin: 5,
  },
  closeBtn: {
    marginTop: 15,
    alignSelf: "center",
    backgroundColor: "#333",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
});
