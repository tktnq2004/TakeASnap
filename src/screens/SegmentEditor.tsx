import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
} from "react-native";
import { Slider } from "@miblanchard/react-native-slider";
type Props = {
  fgUri: string;
  bgUri: string;
  maskUri: string | null;
  onDone?: () => void;
};

export default function SegmentEditor({ fgUri, bgUri, maskUri, onDone }: Props) {
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const previewHeight = (screenHeight * 3) / 5;
  const controlHeight = (screenHeight * 2) / 5;

  const [fgOpacity, setFgOpacity] = useState(1);
  const [bgOpacity, setBgOpacity] = useState(1);
  const [outlineEnabled, setOutlineEnabled] = useState(true);
  const [outlineWidth, setOutlineWidth] = useState(6);

  return (
    <View style={styles.root}>
      {/* Canvas Preview */}
      <View style={[styles.preview, { height: previewHeight }]}>
        {/* Background */}
        {bgUri && (
          <Image
            source={{ uri: bgUri }}
            style={[styles.fullImage, { opacity: bgOpacity }]}
            resizeMode="cover"
          />
        )}

        {/* Foreground */}
        {fgUri && (
          <Image
            source={{ uri: fgUri }}
            style={[styles.fullImage, { opacity: fgOpacity }]}
            resizeMode="cover"
          />
        )}

        {/* Outline (mask) */}
        {outlineEnabled && maskUri && (
          <Image
            source={{ uri: maskUri }}
            style={[
              styles.fullImage,
              {
                borderWidth: outlineWidth,
                borderColor: "white",
              },
            ]}
            resizeMode="cover"
          />
        )}
      </View>

      {/* Controls */}
      <ScrollView style={[styles.controls, { height: controlHeight }]}>
        <Text style={styles.label}>
          Background Opacity: {(bgOpacity * 100).toFixed(0)}%
        </Text>
        <Slider
          value={bgOpacity}
          minimumValue={0}
          maximumValue={1}
          onValueChange={(v) => setBgOpacity(Array.isArray(v) ? v[0] : v)}
        />
        <Text style={[styles.label, { marginTop: 12 }]}>
          Foreground Opacity: {(fgOpacity * 100).toFixed(0)}%
        </Text>
        <Slider
          value={fgOpacity}
          minimumValue={0}
          maximumValue={1}
          onValueChange={(v) => setFgOpacity(Array.isArray(v) ? v[0] : v)}
        />

        {/* Outline */}
        <View style={[styles.row, { marginTop: 12 }]}>
          <Text style={styles.sectionTitle}>Outline</Text>
          <Switch value={outlineEnabled} onValueChange={setOutlineEnabled} />
        </View>
        {outlineEnabled && (
          <>
            <Text style={styles.label}>Outline Size: {outlineWidth.toFixed(0)}</Text>
            <Slider
              value={outlineWidth}
              minimumValue={0}
              maximumValue={40}
              onValueChange={(v) => setOutlineWidth(Array.isArray(v) ? v[0] : v)}
            />
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
  fullImage: { position: "absolute", width: "100%", height: "100%" },
  controls: { backgroundColor: "#111", paddingHorizontal: 16, paddingVertical: 12 },
  label: { color: "#fff", marginVertical: 8 },
  sectionTitle: { color: "#fff", fontWeight: "600" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 8 },
  doneButton: { marginTop: 18, backgroundColor: "#2196F3", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  doneText: { color: "#fff", fontWeight: "700" },
});
