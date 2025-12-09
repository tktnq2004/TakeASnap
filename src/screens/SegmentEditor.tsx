import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Dimensions, ScrollView, Switch, TouchableOpacity, Image } from "react-native";
import { Slider } from "@miblanchard/react-native-slider";
import { SegmentData, saveSegment } from "../components/SegmentStorage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  segment: SegmentData;
  onDone?: (updatedSegment: SegmentData) => void;
};

const TILE_SIZE = 43;

export default function SegmentEditor({ segment, onDone }: Props) {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;

  // Layout: 60% preview, 40% controls
  const totalHeight = screenHeight - insets.top - insets.bottom;
  const previewHeight = totalHeight * 0.6;
  const controlHeight = totalHeight * 0.4;

  const [fillEnable, setFillEnable] = useState<boolean>(segment.fillEnable ?? false);
  const [fillColor, setFillColor] = useState<string>(segment.fillColor ?? "#fc4747ff");
  const [fillOpacity, setFillOpacity] = useState<number>(segment.fillOpacity ?? 0.5);
  const [fgOpacity, setFgOpacity] = useState<number>(segment.fgOpacity ?? 1);
  const [bgOpacity, setBgOpacity] = useState<number>(segment.bgOpacity ?? 1);
  const [outlineEnabled, setOutlineEnabled] = useState<boolean>(segment.outlineEnabled ?? true);
  const [outlineColor, setOutlineColor] = useState<string>(segment.outlineColor ?? "#ffffff");

  const tiles = useMemo(() => {
    const rows = Math.ceil(previewHeight / TILE_SIZE);
    const cols = Math.ceil(screenWidth / TILE_SIZE);
    const generatedTiles = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const isLight = (x + y) % 2 === 0;
        generatedTiles.push(
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
    return generatedTiles;
  }, [screenWidth, previewHeight]);

  const handleDone = async () => {
    const updatedSegment: SegmentData = {
      ...segment,
      fillEnable,
      fillColor,
      fillOpacity,
      fgOpacity,
      bgOpacity,
      outlineEnabled,
      outlineColor,
    };
    await saveSegment(updatedSegment);
    onDone?.(updatedSegment);
  };

  const fillPresets = ["#0047AB", "#0ea5e9", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6"];
  const outlinePresets = ["white", "#000000", "#ffffff", "#f3f4f6", "#ef4444", "#10b981"];

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      
      {/* ===== Preview Section ===== */}
      <View style={[styles.preview, { height: previewHeight }]}>
        {tiles}

        {segment.bg && <Image source={{ uri: segment.bg }} style={[styles.fullImage, { opacity: bgOpacity }]} resizeMode="cover" />}
        {segment.fg && <Image source={{ uri: segment.fg }} style={[styles.fullImage, { opacity: fgOpacity }]} resizeMode="cover" />}
        {fillEnable && segment.mask && <Image source={{ uri: segment.mask }} style={[styles.fullImage, { tintColor: fillColor, opacity: fillOpacity }]} resizeMode="cover" />}
        {outlineEnabled && segment.outline && <Image source={{ uri: segment.outline }} style={[styles.fullImage, { tintColor: outlineColor, opacity: 1 }]} resizeMode="cover" />}
      </View>

      {/* ===== Controls Section ===== */}
      <ScrollView style={[styles.controls, { height: controlHeight }]} contentContainerStyle={{ paddingBottom: 30 }}>
        
        {/* Foreground Opacity */}
        <Text style={styles.sectionTitle}>Foreground Opacity</Text>
        <Text style={styles.label}>{(fgOpacity * 100).toFixed(0)}%</Text>
        <Slider value={fgOpacity} minimumValue={0} maximumValue={1} onValueChange={v => setFgOpacity(Array.isArray(v) ? v[0] : v)} thumbTintColor="#2196F3" minimumTrackTintColor="#2196F3" />
        <View style={styles.separator} />

        {/* Background Opacity */}
        <Text style={styles.sectionTitle}>Background Opacity</Text>
        <Text style={styles.label}>{(bgOpacity * 100).toFixed(0)}%</Text>
        <Slider value={bgOpacity} minimumValue={0} maximumValue={1} onValueChange={v => setBgOpacity(Array.isArray(v) ? v[0] : v)} thumbTintColor="#2196F3" minimumTrackTintColor="#2196F3" />
        <View style={styles.separator} />

        {/* Fill Section */}
        <View style={styles.row}>
          <Text style={styles.sectionTitle}>Enable Fill</Text>
          <Switch value={fillEnable} onValueChange={setFillEnable} />
        </View>

        {fillEnable && (
          <>
            <Text style={styles.sectionTitle}>Fill Opacity</Text>
            <Text style={styles.label}>{(fillOpacity * 100).toFixed(0)}%</Text>
            <Slider value={fillOpacity} minimumValue={0} maximumValue={1} onValueChange={v => setFillOpacity(Array.isArray(v) ? v[0] : v)} thumbTintColor="#2196F3" minimumTrackTintColor="#2196F3" />

            <Text style={styles.sectionTitle}>Fill Color</Text>
            <View style={styles.colorRow}>
              {fillPresets.map(c => (
                <TouchableOpacity key={c} onPress={() => setFillColor(c)} style={[styles.colorCircle, { backgroundColor: c, borderWidth: fillColor === c ? 3 : 0 }]} />
              ))}
              <TouchableOpacity onPress={() => alert("Open color picker")} style={[styles.colorCircle, { backgroundColor: "#222", justifyContent: "center", alignItems: "center" }]}>
                <Text style={{ color: "#fff", fontSize: 14 }}>+</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.separator} />

        {/* Outline Section */}
        <View style={styles.row}>
          <Text style={styles.sectionTitle}>Outline</Text>
          <Switch value={outlineEnabled} onValueChange={setOutlineEnabled} />
        </View>

        {outlineEnabled && (
          <>
            <Text style={styles.sectionTitle}>Outline Color</Text>
            <View style={styles.colorRow}>
              {outlinePresets.map(c => (
                <TouchableOpacity key={c} onPress={() => setOutlineColor(c)} style={[styles.colorCircle, { backgroundColor: c === "white" ? "#fff" : c, borderWidth: outlineColor === c ? 3 : 0 }]} />
              ))}
              <TouchableOpacity onPress={() => alert("Open outline color picker")} style={[styles.colorCircle, { backgroundColor: "#222", justifyContent: "center", alignItems: "center" }]}>
                <Text style={{ color: "#fff", fontSize: 14 }}>+</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.separator} />

        {/* Done Button */}
        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  preview: { width: "100%", overflow: "hidden", marginBottom: 8 },
  fullImage: { position: "absolute", width: "100%", height: "100%" },
  controls: { backgroundColor: "#1c1c1e", paddingHorizontal: 16, paddingTop: 12 },
  label: { color: "#ccc", marginBottom: 6 },
  sectionTitle: { color: "#fff", fontWeight: "600", fontSize: 16, marginBottom: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 8 },
  separator: { height: 1, backgroundColor: "#333", marginVertical: 12 },
  colorRow: { flexDirection: "row", flexWrap: "wrap", marginVertical: 8 },
  colorCircle: { width: 36, height: 36, borderRadius: 18, marginRight: 10, borderColor: "#fff" },
  doneButton: { marginTop: 20, paddingVertical: 14, borderRadius: 12, alignItems: "center", backgroundColor: "#2196F3" },
  doneText: { color: "#fff", fontWeight: "700", fontSize: 18 },
});
