import React, { useState } from "react";
import { View, Text, StyleSheet, Dimensions, ScrollView, Switch, TouchableOpacity, Image } from "react-native";
import { Slider } from "@miblanchard/react-native-slider";
import { SegmentData, saveSegment } from "../components/SegmentStorage";

type Props = {
  segment: SegmentData;           // ✅ truyền segment object đầy đủ
  onDone?: (updatedSegment: SegmentData) => void;
};

const TILE_SIZE = 30;

export default function SegmentEditor({ segment, onDone }: Props) {
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const previewHeight = (screenHeight * 3) / 5;
  const controlHeight = (screenHeight * 2) / 5;

  const [fgOpacity, setFgOpacity] = useState(segment.fgOpacity);
  const [bgOpacity, setBgOpacity] = useState(segment.bgOpacity);
  const [outlineEnabled, setOutlineEnabled] = useState(segment.outlineEnabled);
  const [outlineWidth, setOutlineWidth] = useState(segment.outlineSize);

  const rows = Math.ceil(previewHeight / TILE_SIZE);
  const cols = Math.ceil(screenWidth / TILE_SIZE);
  const tiles = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const isLight = (x + y) % 2 === 0;
      tiles.push(
        <View key={`${x}-${y}`} style={{
          position: "absolute",
          width: TILE_SIZE,
          height: TILE_SIZE,
          left: x * TILE_SIZE,
          top: y * TILE_SIZE,
          backgroundColor: isLight ? "#eee" : "#ccc",
        }} />
      );
    }
  }

  const handleDone = async () => {
    const updatedSegment: SegmentData = {
      ...segment,
      fgOpacity,
      bgOpacity,
      outlineEnabled,
      outlineSize: outlineWidth,
    };
    await saveSegment(updatedSegment);   // ✅ lưu vào storage
    onDone?.(updatedSegment);            // ✅ callback trả về App
  };

  return (
    <View style={styles.root}>
      <View style={[styles.preview, { height: previewHeight }]}>
        {tiles}
        {segment.bgUri && <Image source={{ uri: segment.bgUri }} style={[styles.fullImage, { opacity: bgOpacity }]} resizeMode="cover" />}
        {segment.fgUri && <Image source={{ uri: segment.fgUri }} style={[styles.fullImage, { opacity: fgOpacity }]} resizeMode="cover" />}
        {outlineEnabled && segment.maskUri && <Image source={{ uri: segment.maskUri }} style={[styles.fullImage, { borderWidth: outlineWidth, borderColor: "white" }]} resizeMode="cover" />}
      </View>

      <ScrollView style={[styles.controls, { height: controlHeight }]}>
        <Text style={styles.label}>Background Opacity: {(bgOpacity * 100).toFixed(0)}%</Text>
        <Slider value={bgOpacity} minimumValue={0} maximumValue={1} onValueChange={v => setBgOpacity(Array.isArray(v) ? v[0] : v)} />

        <Text style={[styles.label, { marginTop: 12 }]}>Foreground Opacity: {(fgOpacity * 100).toFixed(0)}%</Text>
        <Slider value={fgOpacity} minimumValue={0} maximumValue={1} onValueChange={v => setFgOpacity(Array.isArray(v) ? v[0] : v)} />

        <View style={[styles.row, { marginTop: 12 }]}>
          <Text style={styles.sectionTitle}>Outline</Text>
          <Switch value={outlineEnabled} onValueChange={setOutlineEnabled} />
        </View>
        {outlineEnabled && (
          <>
            <Text style={styles.label}>Outline Size: {outlineWidth.toFixed(0)}</Text>
            <Slider value={outlineWidth} minimumValue={0} maximumValue={40} onValueChange={v => setOutlineWidth(Array.isArray(v) ? v[0] : v)} />
          </>
        )}

        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  preview: { width: "100%", overflow: "hidden" },
  fullImage: { position: "absolute", width: "100%", height: "100%" },
  controls: { backgroundColor: "#111", paddingHorizontal: 16, paddingVertical: 12 },
  label: { color: "#fff", marginVertical: 8 },
  sectionTitle: { color: "#fff", fontWeight: "600" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 8 },
  doneButton: { marginTop: 18, backgroundColor: "#2196F3", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  doneText: { color: "#fff", fontWeight: "700" },
});
