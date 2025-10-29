// src/screens/CameraScreen.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import CustomCamera from "../components/CustomCamera";

export default function CameraScreen() {
  return (
    <View style={styles.container}>
      <CustomCamera />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
