import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";

const { height } = Dimensions.get("window");

type SlideUpPanelProps = {
  visible: boolean;
  onClose?: () => void;
  children: React.ReactNode;
};

export default function SlideUpPanel({ visible, onClose, children }: SlideUpPanelProps) {
  const translateY = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : height,
      useNativeDriver: true,
      bounciness: 10,
    }).start();
  }, [visible]);

  return (
    <Animated.View style={[styles.panel, { transform: [{ translateY }] }]}>
      <TouchableOpacity style={styles.overlay} onPress={onClose} />
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  content: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    minHeight: height * 0.5,
  },
});
