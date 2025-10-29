import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { Accelerometer } from "expo-sensors";

export default function CameraScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [tilt, setTilt] = useState(0);
    const [cameraType, setCameraType] = useState<CameraType>("back");
    const [flash, setFlash] = useState<"on" | "off" | "auto">("off");
    const cameraRef = useRef<CameraView | null>(null);
    const [showGrid, setShowGrid] = useState(true);

    useEffect(() => {
        const subscription = Accelerometer.addListener(({ x, y, z }) => {
            const tiltValue =
                Math.atan2(x, Math.sqrt(y * y + z * z)) * (180 / Math.PI);
            setTilt(tiltValue);
        });
        Accelerometer.setUpdateInterval(100);
        return () => subscription && subscription.remove();
    }, []);

    if (!permission) return <View />;
    if (!permission.granted)
        return (
            <View style={styles.center}>
                <Text style={styles.text}>Camera permission not granted</Text>
                <TouchableOpacity onPress={requestPermission}>
                    <Text style={styles.button}>Grant permission</Text>
                </TouchableOpacity>
            </View>
        );

    const toggleFlash = () => {
        setFlash((prev) => (prev === "off" ? "on" : prev === "on" ? "auto" : "off"));
    };

    const flipCamera = () => {
        setCameraType((prev) => (prev === "back" ? "front" : "back"));
    };

    const takePicture = async () => {
        if (!cameraRef.current) return;
        const photo = await cameraRef.current.takePictureAsync();
        console.log("Captured:", photo.uri);
    };
    const toggleGrid = () => {
        setShowGrid((prev) => !prev);
    };

    return (
        <View style={styles.container}>
            {/* Camera view */}
            <View style={styles.cameraContainer}>
                <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing={cameraType}
                    flash={flash}
                />

                {/* Horizon Line */}
                <View style={styles.horizonWrapper}>
                    <View
                        style={[
                            styles.horizonLine,
                            { transform: [{ rotate: `${-tilt}deg` }] },
                        ]}
                    />
                </View>

                {/* Grid Overlay */}
                {showGrid && (
                    <View style={styles.gridOverlay}>
                        {/* 2 vertical lines */}
                        <View style={[styles.gridLine, { left: "33%" }]} />
                        <View style={[styles.gridLine, { left: "66%" }]} />

                        {/* 2 horizontal lines */}
                        <View
                            style={[
                                styles.gridLine,
                                { top: "33%", width: "100%", height: 1, left: 0 },
                            ]}
                        />
                        <View
                            style={[
                                styles.gridLine,
                                { top: "66%", width: "100%", height: 1, left: 0 },
                            ]}
                        />
                    </View>
                )}
            </View>

            {/* Controls */}
            <View style={styles.controls}>
                <TouchableOpacity style={styles.btn} onPress={toggleFlash}>
                    <Text style={styles.btnText}>Flash: {flash}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.btn} onPress={flipCamera}>
                    <Text style={styles.btnText}>Flip</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.snapBtn} onPress={takePicture}>
                    <View style={styles.innerCircle} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.btn} onPress={toggleGrid}>
                    <Text style={styles.btnText}>{showGrid ? "Hide Grid" : "Show Grid"}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },

    cameraContainer: { flex: 4, position: "relative" },
    camera: { flex: 1, borderRadius: 16, overflow: "hidden" },

    horizonWrapper: {
        position: "absolute",
        top: "50%",
        left: 0,
        right: 0,
        alignItems: "center",
    },
    horizonLine: {
        width: 120,
        height: 1,
        backgroundColor: "rgba(255,255,255,0.6)",
    },

    controls: {
        flex: 1,
        backgroundColor: "#111",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
    },

    btn: {
        backgroundColor: "#333",
        padding: 10,
        borderRadius: 8,
    },
    btnText: { color: "#fff" },

    snapBtn: {
        borderWidth: 3,
        borderColor: "#fff",
        borderRadius: 50,
        width: 70,
        height: 70,
        alignItems: "center",
        justifyContent: "center",
    },
    innerCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#fff",
    },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    text: { color: "#fff" },
    button: {
        marginTop: 10,
        backgroundColor: "#2196f3",
        color: "#fff",
        padding: 8,
        borderRadius: 6,
    },
    gridOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    gridLine: {
        position: "absolute",
        backgroundColor: "rgba(255,255,255,0.3)",
        width: 1,
        height: "100%",
    },

});
