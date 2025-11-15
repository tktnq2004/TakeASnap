import React, { useState } from "react";
import { View, Image, StyleSheet, TouchableOpacity, Text, Dimensions } from "react-native";
import { Slider } from "@miblanchard/react-native-slider";

type Props = {
  segmentedUri: string;
  backgroundUri: string | null;
  onDone: () => void;
};

export default function SegmentEditor({ segmentedUri, backgroundUri, onDone }: Props) {
  const [fgOpacity, setFgOpacity] = useState(1);
  const [bgOpacity, setBgOpacity] = useState(1);

  const screenHeight = Dimensions.get("window").height;
  const screenWidth = Dimensions.get("window").width;

  // Checkerboard pattern (caro)
  const renderCheckerboard = () => {
    const size = 20;
    const rows = Math.ceil(screenHeight / size);
    const cols = Math.ceil(screenWidth / size);
    const squares = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        squares.push(
          <View
            key={`${row}-${col}`}
            style={{
              position: "absolute",
              left: col * size,
              top: row * size,
              width: size,
              height: size,
              backgroundColor: (row + col) % 2 === 0 ? "#ccc" : "#fff",
            }}
          />
        );
      }
    }
    return squares;
  };

  return (
    <View style={styles.container}>
      {/* 🔹 Image Area (3/5 screen) */}
      <View style={[styles.imageWrapper, { height: (screenHeight * 3) / 5 }]}>
        {/* Checkerboard */}
        <View style={StyleSheet.absoluteFill}>{renderCheckerboard()}</View>

        {/* Background */}
        {backgroundUri && (
          <Image
            source={{ uri: backgroundUri }}
            style={[StyleSheet.absoluteFill, { opacity: bgOpacity }]}
            resizeMode="cover"
          />
        )}

        {/* Foreground */}
        <Image
          source={{ uri: segmentedUri }}
          style={[StyleSheet.absoluteFill, { opacity: fgOpacity }]}
          resizeMode="cover"
        />
      </View>

      {/* 🔹 Controls (2/5 screen) */}
      <View style={[styles.sliderContainer, { height: (screenHeight * 2) / 5 }]}>
        <Text style={styles.label}>Background Opacity: {(bgOpacity * 100).toFixed(0)}%</Text>
        <Slider
          value={bgOpacity}
          minimumValue={0}
          maximumValue={1}
          onValueChange={(v) => setBgOpacity(Array.isArray(v) ? v[0] : v)}
          minimumTrackTintColor="#2196F3"
          maximumTrackTintColor="#ccc"
          thumbTintColor="#2196F3"
        />

        <Text style={[styles.label, { marginTop: 20 }]}>
          Foreground Opacity: {(fgOpacity * 100).toFixed(0)}%
        </Text>
        <Slider
          value={fgOpacity}
          minimumValue={0}
          maximumValue={1}
          onValueChange={(v) => setFgOpacity(Array.isArray(v) ? v[0] : v)}
          minimumTrackTintColor="#4CAF50"
          maximumTrackTintColor="#ccc"
          thumbTintColor="#4CAF50"
        />

        <TouchableOpacity style={styles.doneButton} onPress={onDone}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  imageWrapper: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  sliderContainer: {
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: "#111",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  label: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 8,
  },
  doneButton: {
    marginTop: 30,
    backgroundColor: "#2196F3",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  doneText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
