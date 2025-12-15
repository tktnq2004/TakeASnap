import React, { useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Dimensions, PanResponder, GestureResponderEvent, PanResponderGestureState, } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH - 40;
const CANVAS_HEIGHT = 500;
// const SERVER_HOST = '172.20.10.3';
const SERVER_HOST = "192.168.1.6";
const API_URL = `http://${SERVER_HOST}:5000`;

export default function ChangeBackground({ onClose }: { onClose: () => void }) {
    const [foreground, setForeground] = useState<string | null>(null);
    const [backgroundUri, setBackgroundUri] = useState<string | null>(null);
    const [finalImage, setFinalImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [scrollEnabled, setScrollEnabled] = useState(true);
    // Vị trí & kích thước ảnh người
    const [fgX, setFgX] = useState((CANVAS_WIDTH - 260) / 2);
    const [fgY, setFgY] = useState((CANVAS_HEIGHT - 360) / 2);
    const [fgWidth, setFgWidth] = useState(260);
    const [fgHeight, setFgHeight] = useState(360);
    // Gesture refs
    const translationX = useRef(0);
    const translationY = useRef(0);
    const lastScale = useRef(1);
    const baseWidth = 260;
    const baseHeight = 360;
    // Refs for simultaneous gestures

    // 1. Chọn ảnh người
    const pickForeground = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });
        if (result.canceled) return;
        setLoading(true);
        setStatus('Đang tách nền...');
        const uri = result.assets[0].uri;
        try {
            const formData = new FormData();
            formData.append('image', { uri, type: 'image/jpeg', name: 'photo.jpg' } as any);
            const res = await fetch(`${API_URL}/segment`, { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                setForeground(data.fg);
                setFgX((CANVAS_WIDTH - baseWidth) / 2);
                setFgY((CANVAS_HEIGHT - baseHeight) / 2);
                setFgWidth(baseWidth);
                setFgHeight(baseHeight);
                lastScale.current = 1;
                setStatus('Tách nền thành công! Chọn nền nào');
            } else {
                Alert.alert('Lỗi', data.error || 'Không thể tách nền');
            }
        } catch (err: any) {
            Alert.alert('Lỗi mạng', err.message);
        } finally {
            setLoading(false);
        }
    };
    // 2. Chọn ảnh nền
    const pickBackground = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });
        if (!result.canceled) {
            setBackgroundUri(result.assets[0].uri);
            setFinalImage(null);
        }
    };
    // 3. Tạo ảnh cuối
    const generateFinalImage = async () => {
        if (!foreground || !backgroundUri) return;
        setLoading(true);
        setStatus('Đang tạo bóng đổ & ánh sáng...');
        try {
            const bgBase64 = await FileSystem.readAsStringAsync(backgroundUri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            const payload = {
                fg_data: foreground,
                bg_data: bgBase64.includes(',') ? bgBase64.split(',')[1] : bgBase64,
                fgX: Math.round(fgX),
                fgY: Math.round(fgY),
                fgW: Math.round(fgWidth),
                fgH: Math.round(fgHeight),
                canvasW: CANVAS_WIDTH,
                canvasH: CANVAS_HEIGHT,
            };
            const res = await fetch(`${API_URL}/changebackground`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                setFinalImage(data.final_image);
                setStatus('Hoàn thành! Ảnh đẹp lung linh');
            } else {
                Alert.alert('Lỗi server', data.error || 'Không rõ');
            }
        } catch (err: any) {
            Alert.alert('Lỗi', err.message);
        } finally {
            setLoading(false);
        }
    };
    // Lưu ảnh (chỉ khi nhấn nút)
    const saveToGallery = async () => {
        if (!finalImage) return;
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') return Alert.alert('Cần quyền lưu ảnh!');
            const uri = FileSystem.cacheDirectory + 'final_photo.png';
            await FileSystem.writeAsStringAsync(uri, finalImage, {
                encoding: FileSystem.EncodingType.Base64,
            });
            await MediaLibrary.saveToLibraryAsync(uri);
            Alert.alert('Thành công', 'Đã lưu vào Thư viện ảnh!');
        } catch (e) {
            Alert.alert('Lưu thất bại', 'Thử chia sẻ thay nhé');
        }
    };

    // DRAG SIÊU MƯỢT
    const pan = useRef({ x: 0, y: 0 }).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,

            onPanResponderGrant: () => {
                pan.x = fgX;
                pan.y = fgY;
            },

            onPanResponderMove: (
                _evt: GestureResponderEvent,
                gesture: PanResponderGestureState
            ) => {
                const newX = pan.x + gesture.dx;
                const newY = pan.y + gesture.dy;

                setFgX(newX);
                setFgY(newY);
            },

            onPanResponderRelease: () => { },
        })
    ).current;

    const lastDist = useRef<number | null>(null);

    const handleZoomTouch = (e: any) => {
        if (e.nativeEvent.touches.length < 2) {
            lastDist.current = null;
            return;
        }

        const [t1, t2] = e.nativeEvent.touches;
        const dx = t1.pageX - t2.pageX;
        const dy = t1.pageY - t2.pageY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (lastDist.current === null) {
            lastDist.current = dist;
            return;
        }

        const scale = dist / lastDist.current;

        // update fgWidth & fgHeight
        setFgWidth(prev => Math.max(40, Math.min(prev * scale, CANVAS_WIDTH * 2)));
        setFgHeight(prev => Math.max(40, Math.min(prev * scale, CANVAS_HEIGHT * 2)));

        lastDist.current = dist;
    };


    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
            {/* 2. 💡 Dùng style động cho ScrollView để đảm bảo có padding dưới */}
            <ScrollView scrollEnabled={scrollEnabled}
                style={{ flex: 1 }}
            >
                <View style={styles.container}>
                    <Text style={styles.title}>Change Background</Text>

                    {/* ... (Giữ nguyên nội dung bên trong View/ScrollView) */}

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.btn, loading && styles.disabled]}
                            onPress={pickForeground}
                            disabled={loading}
                        >
                            <Text style={styles.btnText}>1. Chọn ảnh người</Text>
                        </TouchableOpacity>

                        <View style={{ width: 15 }} />

                        <TouchableOpacity
                            style={[styles.btn, (!foreground || loading) && styles.disabled]}
                            onPress={pickBackground}
                            disabled={!foreground || loading}
                        >
                            <Text style={styles.btnText}>2. Chọn ảnh nền</Text>
                        </TouchableOpacity>
                    </View>

                    {loading && <ActivityIndicator size="large" color="#007bff" style={{ marginVertical: 20 }} />}

                    {/* CANVAS */}
                    {foreground && (
                        <>
                            <Text style={styles.label}>
                                {backgroundUri ? 'Kéo & phóng to người:' : 'Đã tách nền – Chọn nền nào!'}
                            </Text>

                            <View
                                style={styles.canvas}
                                onTouchStart={() => setScrollEnabled(false)}
                                onTouchEnd={() => {
                                    setScrollEnabled(true);
                                    lastDist.current = null;
                                }}
                                onTouchCancel={() => setScrollEnabled(true)}
                                onTouchMove={handleZoomTouch}
                            >
                                {/* Background */}
                                {backgroundUri ? (
                                    <Image
                                        source={{ uri: backgroundUri }}
                                        style={StyleSheet.absoluteFill}
                                        resizeMode="contain"
                                    />
                                ) : (
                                    <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: '#e0e0e0' }} />
                                )}

                                {/* Foreground – drag & scale */}
                                <View
                                    {...panResponder.panHandlers}
                                    style={{
                                        position: 'absolute',
                                        left: fgX,
                                        top: fgY,
                                        width: fgWidth,
                                        height: fgHeight,
                                    }}
                                >
                                    <Image
                                        source={{ uri: `data:image/png;base64,${foreground}` }}
                                        style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                                    />
                                </View>
                            </View>

                            {backgroundUri && (
                                <TouchableOpacity style={styles.generateBtn} onPress={generateFinalImage} disabled={loading}>
                                    <Text style={styles.generateText}>Xác nhận</Text>
                                </TouchableOpacity>
                            )}

                        </>
                    )}

                    {/* FINAL RESULT */}
                    {finalImage && (
                        <>
                            <Text style={styles.label}>Xem kết quả</Text>
                            <Image
                                source={{ uri: `data:image/png;base64,${finalImage}` }}
                                style={styles.finalImage}
                                resizeMode="stretch"
                            />
                            <View style={{ flexDirection: 'row', gap: 20, marginTop: 25 }}>
                                <TouchableOpacity style={styles.saveBtn} onPress={saveToGallery}>
                                    <Text style={styles.btnText}>Lưu vào máy</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                    <View style={{ height: 20 }} />
                    <TouchableOpacity style={styles.shareBtn} onPress={onClose}>
                        <Text style={styles.btnText}>Quay lại</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({

    container: { padding: 20, alignItems: 'center' },
    title: { fontSize: 30, fontWeight: '900', color: '#222', marginBottom: 20 },
    buttonRow: { flexDirection: 'row', justifyContent: 'center', marginVertical: 20 },
    btn: { backgroundColor: '#007bff', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 30 },
    disabled: { backgroundColor: '#aaa' },
    btnText: { color: 'white', fontWeight: '700', fontSize: 16 },
    status: { fontSize: 17, color: '#555', textAlign: 'center', marginVertical: 12 },
    label: { fontSize: 20, fontWeight: '700', marginVertical: 20, color: '#333' },
    canvas: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT, borderRadius: 20, overflow: 'hidden', elevation: 12, backgroundColor: '#fff', },
    generateBtn: { backgroundColor: '#28a745', paddingHorizontal: 50, paddingVertical: 18, borderRadius: 35, marginTop: 30, },
    generateText: { color: 'white', fontSize: 19, fontWeight: 'bold' },
    finalImage: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT, borderRadius: 20, marginVertical: 20 },
    saveBtn: { backgroundColor: '#ff9500', paddingHorizontal: 35, paddingVertical: 16, borderRadius: 30 },
    shareBtn: { backgroundColor: '#1da1f2', paddingHorizontal: 35, paddingVertical: 16, borderRadius: 30 },
});