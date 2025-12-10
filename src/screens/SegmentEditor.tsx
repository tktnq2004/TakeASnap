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
  const coolFillPresets = [
    "#3b82f6", 
    "#0ea5e9", 
    "#38bdf8", 
    "#22d3ee", 
    "#2dd4bf",
    "#4ade80", 
    "#a5b4fc", 
    "#c4b5fd", 
  ];

  const outlinePresets = [
    "#ffffff",
    "#d1d5db",
    "#9ca3af",
    "#6b7280",
    "#4b5563",
    "#000000",
  ];


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
      <ScrollView
        style={[styles.controls, { height: controlHeight }]}
        contentContainerStyle={{ paddingBottom: 40 }}
      >

        {/* FOREGROUND */}
        <Text style={styles.sectionHeader}>Foreground</Text>

        <View style={styles.controlBlock}>
          <Text style={styles.sectionTitle}>Opacity</Text>
          <Text style={styles.label}>{(fgOpacity * 100).toFixed(0)}%</Text>
          <Slider
            value={fgOpacity}
            minimumValue={0}
            maximumValue={1}
            onValueChange={v => setFgOpacity(Array.isArray(v) ? v[0] : v)}
            thumbTintColor="#3b82f6"
            minimumTrackTintColor="#3b82f6"
          />
        </View>

        {/* BACKGROUND */}
        <Text style={styles.sectionHeader}>Background</Text>

        <View style={styles.controlBlock}>
          <Text style={styles.sectionTitle}>Opacity</Text>
          <Text style={styles.label}>{(bgOpacity * 100).toFixed(0)}%</Text>
          <Slider
            value={bgOpacity}
            minimumValue={0}
            maximumValue={1}
            onValueChange={v => setBgOpacity(Array.isArray(v) ? v[0] : v)}
            thumbTintColor="#3b82f6"
            minimumTrackTintColor="#3b82f6"
          />
        </View>

        {/* FILL SECTION */}
        <Text style={styles.sectionHeader}>Fill</Text>

        <View style={styles.row}>
          <Text style={styles.sectionTitle}>Enable Fill</Text>
          <Switch value={fillEnable} onValueChange={setFillEnable} />
        </View>

        {fillEnable && (
          <View style={styles.controlBlock}>
            <Text style={styles.sectionTitle}>Fill Opacity</Text>
            <Text style={styles.label}>{(fillOpacity * 100).toFixed(0)}%</Text>
            <Slider
              value={fillOpacity}
              minimumValue={0}
              maximumValue={1}
              onValueChange={v => setFillOpacity(Array.isArray(v) ? v[0] : v)}
              thumbTintColor="#3b82f6"
              minimumTrackTintColor="#3b82f6"
            />

            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Fill Color</Text>
            <View style={styles.colorRow}>
              {coolFillPresets.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setFillColor(c)}
                  style={[
                    styles.colorCircle,
                    {
                      backgroundColor: c,
                      borderWidth: fillColor === c ? 3 : 1,
                      borderColor: fillColor === c ? "#fff" : "#555",
                    },
                  ]}
                />
              ))}

              <TouchableOpacity
                onPress={() => alert("Open color picker")}
                style={[styles.colorCircle, styles.addColorCircle]}
              >
                <Text style={{ color: "#fff", fontSize: 16 }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* OUTLINE */}
        <Text style={styles.sectionHeader}>Outline</Text>

        <View style={styles.row}>
          <Text style={styles.sectionTitle}>Enable Outline</Text>
          <Switch value={outlineEnabled} onValueChange={setOutlineEnabled} />
        </View>

        {outlineEnabled && (
          <View style={styles.controlBlock}>
            <Text style={styles.sectionTitle}>Outline Color</Text>
            <View style={styles.colorRow}>
              {outlinePresets.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setOutlineColor(c)}
                  style={[
                    styles.colorCircle,
                    {
                      backgroundColor: c,
                      borderWidth: outlineColor === c ? 3 : 1,
                      borderColor: outlineColor === c ? "#fff" : "#555",
                    },
                  ]}
                />
              ))}

              <TouchableOpacity
                onPress={() => alert("Open outline color picker")}
                style={[styles.colorCircle, styles.addColorCircle]}
              >
                <Text style={{ color: "#fff", fontSize: 16 }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  preview: { width: "100%", overflow: "hidden", marginBottom: 8 },
  fullImage: { position: "absolute", width: "100%", height: "100%" },
  controls: { backgroundColor: "#1c1c1e", paddingHorizontal: 16, paddingTop: 12 },
  separator: { height: 1, backgroundColor: "#333", marginVertical: 12 },
  sectionHeader: { color: "#9ca3af", fontSize: 14, fontWeight: "600", marginTop: 10, marginBottom: 4, letterSpacing: 0.4, },
  sectionTitle: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 4, },
  label: { color: "#ccc", fontSize: 14, marginBottom: 8, },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, },
  controlBlock: { paddingVertical: 8, marginBottom: 12, }, 
  colorRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 8, },
  colorCircle: { width: 38, height: 38, borderRadius: 19, marginRight: 12, marginBottom: 12, },
  addColorCircle: { backgroundColor: "#2e2e32", borderWidth: 1, borderColor: "#555", justifyContent: "center", alignItems: "center"},
  doneButton: { marginTop: 26, paddingVertical: 16, borderRadius: 12, alignItems: "center", backgroundColor: "#3b82f6"},
  doneText: { color: "#fff", fontWeight: "700", fontSize: 17, },
});
