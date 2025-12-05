import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Dimensions, ScrollView, Switch, TouchableOpacity, Image } from "react-native";
import { Slider } from "@miblanchard/react-native-slider";
import { SegmentData, saveSegment } from "../components/SegmentStorage";
import Svg, { Image as SvgImage, Rect, Mask } from 'react-native-svg';

type Props = {
  segment: SegmentData;
  onDone?: (updatedSegment: SegmentData) => void;
};

const TILE_SIZE = 45;

export default function SegmentEditor({ segment, onDone }: Props) {
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const previewHeight = (screenHeight * 3) / 5;
  const controlHeight = (screenHeight * 2) / 5;

  // --- State (defaults safe)
  const [fillEnable, setFillEnable] = useState<boolean>(segment.fillEnable ?? false);
  const [fillColor, setFillColor] = useState<string>(segment.fillColor ?? "#fc4747ff");
  const [fillOpacity, setFillOpacity] = useState<number>(segment.fillOpacity ?? 0.5);

  const [fgOpacity, setFgOpacity] = useState<number>(segment.fgOpacity ?? 1);
  const [bgOpacity, setBgOpacity] = useState<number>(segment.bgOpacity ?? 1);

  const [outlineEnabled, setOutlineEnabled] = useState<boolean>(segment.outlineEnabled ?? false);
  const [outlineWidth, setOutlineWidth] = useState<number>(segment.outlineSize ?? 6);
  const [outlineColor, setOutlineColor] = useState<string>(segment.outlineColor ?? "white");

  // tiles with memo for perf
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
      outlineSize: outlineWidth,
      outlineColor,
    };
    await saveSegment(updatedSegment);
    onDone?.(updatedSegment);
  };

  const outlineScale = 1 + outlineWidth / 30;

  const fillPresets = ["#0047AB", "#0ea5e9", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6"];
  const outlinePresets = ["white", "#000000", "#ffffff", "#f3f4f6", "#ef4444", "#10b981"];

  return (
    <View style={styles.root}>
      <View style={[styles.preview, { height: previewHeight }]}>
        {tiles}

        {/* Background */}
        {segment.bgUri && (
          <Image
            source={{ uri: segment.bgUri }}
            style={[styles.fullImage, { opacity: bgOpacity }]}
            resizeMode="cover"
          />
        )}
        {/* Original FG */}
        {segment.fgUri && (
          <Image
            source={{ uri: segment.fgUri }}
            style={[styles.fullImage, { opacity: fgOpacity }]}
            resizeMode="cover"
          />
        )}
        {/* FILL overlay */}
        {fillEnable && segment.maskUri && (
          <Image
            source={{ uri: segment.maskUri }}
            style={[
              styles.fullImage,
              { tintColor: fillColor, opacity: fillOpacity }
            ]}
            resizeMode="cover"
          />
        )}

        {/* OUTLINE - sử dụng outlineMaskUri */}
        {outlineEnabled && segment.maskOutlineUri && (
          <Image
            source={{ uri: segment.maskOutlineUri }}
            style={[
              styles.fullImage,
              { tintColor: outlineColor, opacity: 1 }
            ]}
            resizeMode="cover"
          />
        )}
      </View>

      <ScrollView style={[styles.controls, { height: controlHeight }]}>

        {/* Foreground opacity */}
        <Text style={[styles.label, { marginTop: 4 }]}>
          Foreground Opacity (FG Gốc): {(fgOpacity * 100).toFixed(0)}%
        </Text>
        <Slider value={fgOpacity} minimumValue={0} maximumValue={1} onValueChange={v => setFgOpacity(Array.isArray(v) ? v[0] : v)} />

        <View style={{ height: 1, backgroundColor: '#333', marginVertical: 12 }} />

        {/* Background opacity */}
        <Text style={[styles.label]}>Background Opacity: {(bgOpacity * 100).toFixed(0)}%</Text>
        <Slider value={bgOpacity} minimumValue={0} maximumValue={1} onValueChange={v => setBgOpacity(Array.isArray(v) ? v[0] : v)} />

        <View style={{ height: 1, backgroundColor: '#333', marginVertical: 12 }} />

        {/* Toggle Fill */}
        <View style={[styles.row, { marginTop: 8 }]}>
          <Text style={styles.sectionTitle}>Enable Fill (Tô màu)</Text>
          <Switch value={fillEnable} onValueChange={setFillEnable} />
        </View>

        {fillEnable && (
          <>
            <Text style={[styles.label, { marginTop: 6 }]}>Fill Opacity: {(fillOpacity * 100).toFixed(0)}%</Text>
            <Slider value={fillOpacity} minimumValue={0} maximumValue={1} onValueChange={v => setFillOpacity(Array.isArray(v) ? v[0] : v)} />

            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Fill Color</Text>
            <View style={{ flexDirection: "row", justifyContent: "flex-start", marginVertical: 8 }}>
              {fillPresets.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setFillColor(c)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: c,
                    marginRight: 10,
                    borderWidth: fillColor === c ? 3 : 0,
                    borderColor: "#fff"
                  }}
                />
              ))}
              <TouchableOpacity
                onPress={() => alert("Open color picker here")}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#222",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 12 }}>+ </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 1, backgroundColor: '#333', marginVertical: 12 }} />

        {/* Toggle Outline (independent) */}
        <View style={[styles.row, { marginTop: 8 }]}>
          <Text style={styles.sectionTitle}>Outline (Viền)</Text>
          <Switch value={outlineEnabled} onValueChange={setOutlineEnabled} />
        </View>

        {outlineEnabled && (
          <>
            {/* Thanh trượt điều chỉnh kích thước viền */}
            <Text style={[styles.label, { marginTop: 6 }]}>Outline Size: {outlineWidth.toFixed(1)}</Text>
            <Slider
              value={outlineWidth}
              minimumValue={0}
              maximumValue={30}
              onValueChange={v => setOutlineWidth(Array.isArray(v) ? v[0] : v)}
            />

            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Outline Color</Text>
            <View style={{ flexDirection: "row", justifyContent: "flex-start", marginVertical: 8 }}>
              {outlinePresets.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setOutlineColor(c)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: c === "white" ? "#fff" : c,
                    marginRight: 10,
                    borderWidth: outlineColor === c ? 3 : 0,
                    borderColor: "#fff"
                  }}
                />
              ))}
              <TouchableOpacity
                onPress={() => alert("Open outline color picker here")}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#222",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 12 }}>+ </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 1, backgroundColor: '#333', marginVertical: 12 }} />

        <TouchableOpacity style={[styles.doneButton, { backgroundColor: "#2196F3" }]} onPress={handleDone}>
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
  doneButton: { marginTop: 18, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  doneText: { color: "#fff", fontWeight: "700" },
});