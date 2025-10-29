import React from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import CameraScreen from "./src/screens/CameraScreen";

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <CameraScreen />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
