import React, { useState } from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Switch } from "react-native";
import { Slider } from "@miblanchard/react-native-slider";
import { ColorPicker } from "react-native-color-picker";
import { Canvas, useImage, Image as SkiaImage, Group, Rect, Fill, Blur, Blend } from "@shopify/react-native-skia";

type Props = {
  fgUri: string;
  bgUri: string;
  maskUri: string | null;
  onDone?: () => void
};

export default function SegmentEditor({ fgUri, bgUri, maskUri, onDone }: Props) {
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const previewHeight = (screenHeight * 3) / 5;
  const controlHeight = (screenHeight * 2) / 5;

  const W = screenWidth;
  const H = previewHeight;

  const fgImage = useImage(fgUri);
  const bgImage = useImage(bgUri);
  const maskImage = useImage(maskUri);

  const [fgOpacity, setFgOpacity] = useState(1);
  const [bgOpacity, setBgOpacity] = useState(1);
  const [outlineEnabled, setOutlineEnabled] = useState(true);
  const [outlineWidth, setOutlineWidth] = useState(6);

  return (
    <View style={styles.root}>
      {/* Canvas Preview */}
      <View style={[styles.preview, { height: previewHeight }]}>
        <Canvas style={{ width: W, height: H }}>
          <Fill color="#fff" />

          {/* Checkerboard */}
          {Array.from({ length: Math.ceil(H / 20) }).map((_, r) =>
            Array.from({ length: Math.ceil(W / 20) }).map((__, c) => (
              <Rect key={`cb-${r}-${c}`} x={c * 20} y={r * 20} width={20} height={20} color={(r + c) % 2 === 0 ? "#ccc" : "#fff"} />
            ))
          )}

          {/* Background */}
          {bgImage && <SkiaImage image={bgImage} x={0} y={0} width={W} height={H} opacity={bgOpacity} />}

          {/* Foreground */}
          {fgImage && <SkiaImage image={fgImage} x={0} y={0} width={W} height={H} opacity={fgOpacity} />}

          {/* Outline xung quanh người */}
          {outlineEnabled && maskImage && (
            <Group>
              <Group>
                <SkiaImage image={maskImage} x={0} y={0} width={W} height={H} />
                <Blur blur={outlineWidth} />
              </Group>
              <Blend mode="dstOut">
                <SkiaImage image={maskImage} x={0} y={0} width={W} height={H} />
              </Blend>
              <Fill color="#fff" />
            </Group>
          )}
        </Canvas>
      </View>

      {/* Controls */}
      <ScrollView style={[styles.controls, { height: controlHeight }]}>
        <Text style={styles.label}>Background Opacity: {(bgOpacity * 100).toFixed(0)}%</Text>
        <Slider value={bgOpacity} minimumValue={0} maximumValue={1} onValueChange={v => setBgOpacity(Array.isArray(v) ? v[0] : v)} />
        <Text style={[styles.label, { marginTop: 12 }]}>Foreground Opacity: {(fgOpacity * 100).toFixed(0)}%</Text>
        <Slider value={fgOpacity} minimumValue={0} maximumValue={1} onValueChange={v => setFgOpacity(Array.isArray(v) ? v[0] : v)} />

        {/* Outline */}
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

        <TouchableOpacity style={styles.doneButton} onPress={onDone}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  preview: { width: "100%", backgroundColor: "#000", overflow: "hidden" },
  controls: { backgroundColor: "#111", paddingHorizontal: 16, paddingVertical: 12 },
  label: { color: "#fff", marginVertical: 8 },
  sectionTitle: { color: "#fff", fontWeight: "600" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 8 },
  colorPreview: { width: 44, height: 44, borderRadius: 8, borderWidth: 1, borderColor: "#fff", marginVertical: 8 },
  doneButton: { marginTop: 18, backgroundColor: "#2196F3", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  doneText: { color: "#fff", fontWeight: "700" },
});
