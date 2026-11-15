import { type CameraView, useCameraPermissions } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { SwitchCamera, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  GestureDetector,
  usePinchGesture,
  useSimultaneousGestures,
} from 'react-native-gesture-handler';
import Animated, {
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { CameraLayer, ULTRA_WIDE_LENS } from '@/features/camera/CameraLayer';
import {
  clearPlacement,
  loadPlacement,
  nextOpacity,
  savePlacement,
  useCameraStore,
} from '@/features/camera/cameraStore';
import { CameraTopBar, TOP_BAR_H } from '@/features/camera/CameraTopBar';
import {
  cropToFrame,
  PhotoPermissionError,
  saveToAlbum,
  type Shot,
} from '@/features/camera/capture';
import { ASPECTS, type Rect, viewfinderRect } from '@/features/camera/frame';
import { FrameGrid, LevelGuide } from '@/features/camera/FrameGuides';
import { containSize, hitOverlay } from '@/features/camera/overlayHit';
import { PoseOverlay } from '@/features/camera/PoseOverlay';
import { useSessionPhotos } from '@/features/camera/sessionPhotos';
import { ToolRail } from '@/features/camera/ToolRail';
import { trashTransform } from '@/features/camera/trash';
import { nextZoomFactor, ULTRA_WIDE_FACTOR } from '@/features/camera/zoom';
import { ZoomControl, zoomControlHeight } from '@/features/camera/ZoomControl';
import { getPose } from '@/features/pose/repository';
import type { Pose } from '@/features/pose/types';
import { type Placement, useTransformGesture } from '@/gestures/useTransformGesture';
import { haptic } from '@/lib/haptics';
import { EmptyState, PressableScale } from '@/ui/components';
import { ease, easeIO } from '@/ui/easing';
import { t } from '@/ui/strings';
import {
  cameraRail,
  cameraUi,
  cameraZoom,
  color,
  motion,
  radius,
  size,
  space,
  type,
} from '@/ui/tokens';

const IDENTITY: Placement = { x: 0, y: 0, scale: 1, rotation: 0 };

/** Khoảng giữa các khối ở vùng dưới (design.md §6.1). */
const BOTTOM_PAD = space[4];
const ROW_GAP = 14;

/** Camera — màn đầu tiên của app (business-flow §3, §4; design.md §6.1–6.4). */
export default function CameraScreen() {
  // Quyền camera: gọi thẳng hộp thoại của máy khi mở app, không có màn riêng (design.md §6.4).
  const [permission, requestPermission] = useCameraPermissions({ request: true });

  if (!permission) return <View style={styles.root} />;
  if (!permission.granted) {
    // Bị từ chối: một câu + một nút trên nền tối (iOS không hiện lại hộp thoại, phải mở Cài đặt).
    return (
      <View style={[styles.root, styles.denied]}>
        <StatusBar style="light" />
        <EmptyState
          dark
          message={t.camera.permissionTitle}
          action={{
            label: permission.canAskAgain ? t.camera.permissionAllow : t.common.openSettings,
            onPress: permission.canAskAgain ? requestPermission : () => Linking.openSettings(),
          }}
        />
      </View>
    );
  }
  return <CameraBody />;
}

function CameraBody() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);

  const flash = useCameraStore((s) => s.flash);
  const grid = useCameraStore((s) => s.grid);
  const levelOn = useCameraStore((s) => s.level);
  const timer = useCameraStore((s) => s.timer);
  const aspect = useCameraStore((s) => s.aspect);
  const poseId = useCameraStore((s) => s.poseId);
  const storedOpacity = useCameraStore((s) => s.opacity);
  const mirrored = useCameraStore((s) => s.mirrored);
  const store = useCameraStore.getState;

  const [root, setRoot] = useState({ width: 0, height: 0 });
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [lenses, setLenses] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  // Ẩn pose: nút bật / tắt (góp ý Phase 4, thay cho giữ để ẩn). Nhớ theo id pose nên đổi pose
  // thì pose mới luôn hiện.
  const [hiddenFor, setHiddenFor] = useState<string | null>(null);
  const hidden = poseId != null && hiddenFor === poseId;
  const setHidden = (h: boolean) => setHiddenFor(h ? poseId : null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [pose, setPose] = useState<Pose | null>(null);
  const [busy, setBusy] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  // Ảnh vừa chụp: ảnh mới nhất đã lưu trong lần mở app này; chạm để mở màn Xem ảnh vừa chụp.
  const lastPhoto = useSessionPhotos((s) => s.photos[s.photos.length - 1]?.uri ?? null);
  const countdownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Bố cục (design.md §6.1): thanh trên, khung ngắm, zoom, hàng chụp ----
  const barTop = insets.top + space[2];
  const topH = barTop + TOP_BAR_H + space[2];
  const shutterBottom = insets.bottom + BOTTOM_PAD;
  const zoomBottom = shutterBottom + size.shutter + ROW_GAP;
  const bottomH = zoomBottom + zoomControlHeight + space[3];
  const frame: Rect = viewfinderRect(root.width, root.height, topH, bottomH, ASPECTS[aspect]);
  const frameCx = frame.x + frame.width / 2;
  const frameCy = frame.y + frame.height / 2;
  // Vùng xóa nằm đúng chỗ cụm zoom (design.md §6.3).
  const trashX = root.width / 2;
  const trashY = root.height - zoomBottom - zoomControlHeight / 2;

  // ---- Pose đang dùng: đọc lại mỗi lần quay về Camera (có thể vừa sửa hoặc xóa) ----
  const loadPose = useCallback(() => {
    if (!poseId) {
      setPose(null);
      return;
    }
    getPose(db, poseId).then((p) => {
      if (p) setPose(p);
      else {
        setPose(null);
        useCameraStore.getState().clearPose();
      }
    });
  }, [db, poseId]);
  useFocusEffect(loadPose);

  // ---- Độ hiện: shared value để giữ nút rồi kéo không gây re-render ----
  const opacity = useSharedValue(storedOpacity);
  useEffect(() => {
    opacity.set(storedOpacity);
  }, [storedOpacity, opacity]);

  // ---- Overlay: chạm trúng pose là kéo/pinch/xoay ngay, nhấc tay là xong (góp ý Phase 2) ----
  const hitW = useSharedValue(0);
  const hitH = useSharedValue(0);
  const inTrash = useSharedValue(false);
  const vanish = useSharedValue(0);

  const hitTest = (x: number, y: number, p: Placement) => {
    'worklet';
    if (hitW.get() <= 0) return false;
    return hitOverlay(x - frameCx, y - frameCy, p, hitW.get(), hitH.get(), space[3]);
  };

  const finishRemove = () => {
    if (poseId) clearPlacement(poseId);
    store().clearPose();
    inTrash.set(false);
  };

  const onPlacementEnd = (p: Placement) => {
    if (inTrash.get()) {
      // Thả trong vùng xóa: mờ hẳn rồi mới gỡ.
      haptic.capture();
      vanish.set(
        withTiming(1, { duration: cameraUi.trashVanishMs, easing: ease }, (done) => {
          if (done) scheduleOnRN(finishRemove);
        }),
      );
      return;
    }
    if (poseId) savePlacement(poseId, p, frame.height);
  };

  const overlay = useTransformGesture({
    enabled: pose != null,
    onEnd: onPlacementEnd,
    onSnap: haptic.snap,
    hitTest,
  });
  const { tx, ty, scale, rotation, setArea, engaged, moved, fingerX, fingerY } = overlay;

  // Vùng nhận là cả màn hình; tâm-lúc-nghỉ của pose là tâm khung ngắm.
  useEffect(() => {
    setArea(root.width, root.height, frameCx, frameCy);
  }, [root.width, root.height, frameCx, frameCy, setArea]);

  // Đặt overlay về placement đã nhớ khi đổi pose (hoặc khi khung đổi cỡ).
  useEffect(() => {
    if (!pose || frame.height <= 0) return;
    const p = loadPlacement(pose.id, frame.height) ?? IDENTITY;
    tx.set(p.x);
    ty.set(p.y);
    scale.set(p.scale);
    rotation.set(p.rotation);
    vanish.set(0);
  }, [pose, frame.height, tx, ty, scale, rotation, vanish]);

  useEffect(() => {
    const box = pose
      ? containSize(pose.width, pose.height, frame.width, frame.height)
      : { width: 0, height: 0 };
    hitW.set(box.width);
    hitH.set(box.height);
  }, [pose, frame.width, frame.height, hitW, hitH]);

  // Vùng xóa ăn theo NGÓN TAY: ngón vào vòng tròn mới đỏ và rung (một lần mỗi lần vào).
  // Nhấc tay giữ nguyên trạng thái để onPlacementEnd đọc được.
  useAnimatedReaction(
    () =>
      moved.get()
        ? Math.hypot(fingerX.get() - trashX, fingerY.get() - trashY) < cameraUi.trashRadius
        : null,
    (now) => {
      if (now === null || now === inTrash.get()) return;
      inTrash.set(now);
      if (now) scheduleOnRN(haptic.enterTrash);
    },
  );

  // Khi ở vùng xóa: overlay mờ đi và thu nhỏ về phía thùng rác.
  const trashP = useDerivedValue(() =>
    withTiming(inTrash.get() ? 1 : 0, { duration: cameraUi.trashInMs, easing: easeIO }),
  );
  const trashStyle = useAnimatedStyle(() =>
    trashTransform(
      trashP.get(),
      vanish.get(),
      { x: tx.get(), y: ty.get() },
      { x: trashX - frameCx, y: trashY - frameCy },
    ),
  );

  // ---- Zoom camera: cụm nút / thước cuộn, hoặc pinch khi lượt chạm không bắt đầu trên pose ----
  // 0,5× chỉ có trên iPhone có ống góc rộng (đổi ống qua selectedLens, CameraLayer lo).
  const hasUltraWide =
    Platform.OS === 'ios' && facing === 'back' && lenses.includes(ULTRA_WIDE_LENS);
  const zoomMin = hasUltraWide ? ULTRA_WIDE_FACTOR : 1;
  const factor = useSharedValue(1);
  const settle = useSharedValue(0);
  const camPinch = usePinchGesture({
    onUpdate: (e) => {
      'worklet';
      if (engaged.get()) return;
      factor.set(nextZoomFactor(factor.get(), e.scaleChange, zoomMin, cameraZoom.max));
    },
    onFinalize: () => {
      'worklet';
      settle.set(settle.get() + 1);
    },
  });
  const gesture = useSimultaneousGestures(camPinch, overlay.gesture);

  // Danh sách ống báo lại mỗi lần đổi ống: chỉ cập nhật khi thật sự khác.
  const onLenses = useCallback(
    (next: string[]) => setLenses((cur) => (cur.join() === next.join() ? cur : next)),
    [],
  );

  const switchCamera = () => {
    setFacing((f) => (f === 'back' ? 'front' : 'back'));
    setLenses([]);
    factor.set(1);
    settle.set(settle.get() + 1);
  };

  // Đang kéo pose: cụm zoom nhường chỗ cho vùng xóa; cột công cụ và hàng chụp mờ đi.
  const dragging = useDerivedValue(() => moved.get() || inTrash.get());
  const zoomStyle = useAnimatedStyle(() => ({
    opacity: withTiming(dragging.get() ? 0 : 1, { duration: motion.in, easing: ease }),
  }));
  const shutterRowStyle = useAnimatedStyle(() => ({
    opacity: withTiming(dragging.get() ? cameraRail.dimOpacity : 1, {
      duration: motion.in,
      easing: ease,
    }),
  }));
  const trashZoneStyle = useAnimatedStyle(() => ({
    opacity: withTiming(dragging.get() ? 1 : 0, { duration: motion.in, easing: ease }),
  }));

  // ---- Chụp ----
  const flashOpacity = useSharedValue(0);
  const flashStyle = useAnimatedStyle(() => ({ opacity: flashOpacity.get() }));

  const save = async (shot: Shot) => {
    try {
      const assetId = await saveToAlbum(shot.uri);
      useSessionPhotos.getState().add({ ...shot, assetId });
      haptic.saved();
    } catch (e) {
      if (e instanceof PhotoPermissionError) {
        Alert.alert(t.camera.photoPermissionTitle, t.camera.photoPermission, [
          { text: t.common.cancel, style: 'cancel' },
          { text: t.common.openSettings, onPress: () => Linking.openSettings() },
        ]);
        return;
      }
      // BR-12: ảnh đã cắt vẫn nằm trong file tạm, cho thử lại.
      Alert.alert(t.errors.saveFailed, undefined, [
        { text: t.common.cancel, style: 'cancel' },
        { text: t.common.retry, onPress: () => save(shot) },
      ]);
    }
  };

  const shoot = async () => {
    const cam = cameraRef.current;
    if (!cam || busy) return;
    setBusy(true);
    try {
      haptic.capture();
      flashOpacity.set(
        withSequence(
          withTiming(0.7, { duration: cameraUi.shutterFlashMs / 2, easing: ease }),
          withTiming(0, { duration: cameraUi.shutterFlashMs * 2, easing: ease }),
        ),
      );
      const pic = await cam.takePictureAsync({ quality: 1, shutterSound: true });
      const out = await cropToFrame(pic, frame, root);
      await save(out);
    } catch {
      Alert.alert(t.errors.saveFailed);
    } finally {
      setBusy(false);
    }
  };

  // Hẹn giờ gọi bản shoot mới nhất (khung có thể đổi trong lúc đếm).
  const shootRef = useRef(shoot);
  useEffect(() => {
    shootRef.current = shoot;
  });

  const cancelCountdown = () => {
    if (countdownTimer.current) clearTimeout(countdownTimer.current);
    countdownTimer.current = null;
    setCountdown(null);
  };

  const onShutter = () => {
    if (countdown != null) {
      cancelCountdown();
      return;
    }
    if (!ready || busy) return;
    if (timer === 0) {
      shoot();
      return;
    }
    const tick = (left: number) => {
      if (left === 0) {
        countdownTimer.current = null;
        setCountdown(null);
        shootRef.current();
        return;
      }
      setCountdown(left);
      countdownTimer.current = setTimeout(() => tick(left - 1), 1000);
    };
    tick(timer);
  };

  useEffect(() => () => cancelCountdown(), []);

  // ---- Giao diện ----
  const frameBox = { left: frame.x, top: frame.y, width: frame.width, height: frame.height };

  return (
    <View
      style={styles.root}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setRoot({ width, height });
      }}
    >
      <StatusBar style="light" />
      <CameraLayer
        cameraRef={cameraRef}
        facing={facing}
        flash={flash}
        factor={factor}
        settle={settle}
        lenses={lenses}
        onLenses={onLenses}
        onReady={() => setReady(true)}
      />

      {root.height > 0 && (
        <>
          <FrameMask frame={frame} root={root} />
          <FrameGrid frame={frame} mode={grid} />
          {levelOn && <LevelGuide frame={frame} />}

          {/* Vùng nhận cử chỉ phủ cả màn hình, nằm dưới các nút. Pose là lớp trên cùng của
              ảnh (trên cả vùng tối ngoài khung) nhưng dưới các nút (góp ý Phase 2). */}
          <GestureDetector gesture={gesture}>
            <View collapsable={false} style={StyleSheet.absoluteFill}>
              {pose && (
                <Animated.View pointerEvents="none" style={[styles.abs, frameBox, trashStyle]}>
                  <PoseOverlay
                    pose={pose}
                    width={frame.width}
                    height={frame.height}
                    transform={overlay.style}
                    scale={scale}
                    opacity={opacity}
                    mirrored={mirrored}
                    hidden={hidden}
                    showBox={moved}
                  />
                </Animated.View>
              )}
            </View>
          </GestureDetector>

          <Animated.View
            pointerEvents="none"
            style={[styles.abs, styles.shutterFlash, frameBox, flashStyle]}
          />
          {countdown != null && (
            <View pointerEvents="none" style={[styles.abs, styles.center, frameBox]}>
              <Text style={styles.countdown} accessibilityLiveRegion="assertive">
                {countdown}
              </Text>
            </View>
          )}

          {/* Cột công cụ pose: dọc, kéo được, nằm trong khung ngắm (design.md §6.1). */}
          <ToolRail
            frame={frame}
            pose={pose}
            opacity={opacity}
            mirrored={mirrored}
            hidden={hidden}
            dim={dragging}
            onOpenLibrary={() => router.push('/library')}
            onEdit={() => pose && router.push(`/editor/${pose.id}?from=camera`)}
            onCycleOpacity={() => store().setOpacity(nextOpacity(opacity.get()))}
            onOpacityEnd={(v) => store().setOpacity(v)}
            onToggleMirror={store().toggleMirror}
            onHide={setHidden}
          />
        </>
      )}

      {/* Vùng xóa: hiện đúng chỗ cụm zoom khi đang kéo pose. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.trashZone,
          { top: trashY - TRASH_LABEL_H - cameraUi.trash / 2 },
          trashZoneStyle,
        ]}
      >
        <TrashZone inTrash={inTrash} />
      </Animated.View>

      {/* Zoom: 4 nút nhanh, kéo ngang thành thước cuộn (design.md §6.1). */}
      <Animated.View
        style={[styles.zoomRow, { bottom: zoomBottom }, zoomStyle]}
        pointerEvents="box-none"
      >
        <ZoomControl factor={factor} settle={settle} min={zoomMin} />
      </Animated.View>

      {/* Hàng chụp: ảnh vừa chụp · nút chụp · đổi camera. */}
      <Animated.View
        style={[styles.shutterRow, { bottom: shutterBottom }, shutterRowStyle]}
        pointerEvents="box-none"
      >
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={t.camera.lastPhoto}
          accessibilityState={{ disabled: !lastPhoto }}
          disabled={!lastPhoto}
          hitSlop={4}
          onPress={() => router.push('/review')}
          style={[styles.thumb, lastPhoto ? styles.thumbOn : styles.thumbEmpty]}
        >
          {busy ? (
            <ActivityIndicator size="small" color={color.camInk} />
          ) : lastPhoto ? (
            <Image source={{ uri: lastPhoto }} style={styles.thumbImage} />
          ) : null}
        </PressableScale>

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={countdown != null ? t.camera.cancelTimer : t.camera.capture}
          accessibilityState={{ disabled: !ready || busy }}
          onPress={onShutter}
          style={styles.shutter}
        >
          <View style={[styles.shutterInner, countdown != null && styles.shutterCounting]} />
        </PressableScale>

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={t.camera.switchCamera}
          hitSlop={4}
          onPress={switchCamera}
          style={styles.switch}
        >
          <SwitchCamera size={22} strokeWidth={2} color={color.camInk} />
        </PressableScale>
      </Animated.View>

      {/* Thanh trên vẽ sau cùng để bảng mở thêm nằm trên mọi thứ. */}
      <CameraTopBar
        top={barTop}
        open={toolsOpen}
        onToggleOpen={() => setToolsOpen((o) => !o)}
        onSettings={() => router.push('/spike')}
      />
    </View>
  );
}

/**
 * Phần ngoài khung ngắm phủ nền tối, khung bo góc 28 (design.md §3.4). Ảnh lưu vẫn là đúng hình
 * chữ nhật khung (BR-02). Một view viền dày bo góc tạo lỗ khung: bán kính trong = bán kính ngoài
 * trừ bề dày viền.
 */
function FrameMask({ frame, root }: { frame: Rect; root: { width: number; height: number } }) {
  const b = Math.max(root.width, root.height);
  return (
    <View
      pointerEvents="none"
      style={[
        styles.mask,
        {
          left: frame.x - b,
          top: frame.y - b,
          width: frame.width + b * 2,
          height: frame.height + b * 2,
          borderWidth: b,
          borderRadius: radius.xxl + b,
        },
      ]}
    />
  );
}

const TRASH_LABEL_H = 28;

/** Vùng xóa (design.md §6.3): ngón tay vào thì vòng đỏ, nền đỏ nhạt và phóng nhẹ. */
function TrashZone({ inTrash }: { inTrash: SharedValue<boolean> }) {
  const ringStyle = useAnimatedStyle(() => {
    const on = inTrash.get();
    const cfg = { duration: motion.in, easing: ease };
    return {
      borderColor: withTiming(on ? color.danger : color.camLine, cfg),
      backgroundColor: withTiming(on ? 'rgba(220,38,38,0.25)' : color.camScrim, cfg),
      transform: [{ scale: withTiming(on ? cameraUi.trashActiveScale : 1, cfg) }],
    };
  });
  return (
    <View style={styles.trashWrap}>
      <Text style={[type.label, styles.ink]}>{t.camera.dropToRemove}</Text>
      <Animated.View style={[styles.trash, ringStyle]}>
        <Trash2 size={26} strokeWidth={2} color={color.camInk} />
      </Animated.View>
    </View>
  );
}

const SIDE = 40;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.camBg },
  denied: { justifyContent: 'center' },
  abs: { position: 'absolute' },
  center: { alignItems: 'center', justifyContent: 'center' },
  ink: { color: color.camInk },
  mask: { position: 'absolute', borderColor: color.camBg },
  shutterFlash: { backgroundColor: color.shutterFlash },
  zoomRow: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  shutterRow: {
    position: 'absolute',
    left: SIDE,
    right: SIDE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  thumb: {
    width: size.thumb,
    height: size.thumb,
    borderRadius: 17,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbOn: { borderColor: 'rgba(255,255,255,0.8)' },
  thumbEmpty: { borderColor: color.camLine },
  thumbImage: { width: size.thumb, height: size.thumb },
  shutter: {
    width: size.shutter,
    height: size.shutter,
    borderRadius: radius.full,
    borderWidth: 5,
    borderColor: color.camInk,
    padding: 5,
  },
  shutterInner: { flex: 1, borderRadius: radius.full, backgroundColor: color.accent },
  shutterCounting: { backgroundColor: color.camAccent },
  switch: {
    width: size.thumb,
    height: size.thumb,
    borderRadius: radius.full,
    backgroundColor: color.camGlass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdown: {
    fontFamily: type.num.fontFamily,
    fontSize: cameraUi.countdownSize,
    lineHeight: cameraUi.countdownSize * 1.1,
    color: color.camInk,
  },
  trashZone: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  trashWrap: { alignItems: 'center', gap: space[2] },
  trash: {
    width: cameraUi.trash,
    height: cameraUi.trash,
    borderRadius: radius.full,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
