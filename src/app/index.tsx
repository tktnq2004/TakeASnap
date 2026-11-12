import { type CameraView, useCameraPermissions } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  Contrast,
  EyeOff,
  FlipHorizontal2,
  Grid3x3,
  type LucideIcon,
  PersonStanding,
  Ruler,
  Settings,
  SwitchCamera,
  Timer,
  Trash2,
  Zap,
  ZapOff,
} from 'lucide-react-native';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
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
  OVERLAY_OPACITY,
  savePlacement,
  useCameraStore,
} from '@/features/camera/cameraStore';
import { cropToFrame, PhotoPermissionError, saveToAlbum } from '@/features/camera/capture';
import { ASPECTS, type Rect, viewfinderRect } from '@/features/camera/frame';
import { FrameGrid, LevelGuide } from '@/features/camera/FrameGuides';
import { containSize, hitOverlay } from '@/features/camera/overlayHit';
import { PoseOverlay } from '@/features/camera/PoseOverlay';
import { trashTransform } from '@/features/camera/trash';
import { nextZoomFactor, ULTRA_WIDE_FACTOR } from '@/features/camera/zoom';
import { ZoomSlider } from '@/features/camera/ZoomSlider';
import { PoseCanvas } from '@/features/pose/PoseCanvas';
import { getPose } from '@/features/pose/repository';
import type { Pose } from '@/features/pose/types';
import { type Placement, useTransformGesture } from '@/gestures/useTransformGesture';
import { haptic } from '@/lib/haptics';
import { Button, PressableScale, Screen } from '@/ui/components';
import { ease, easeIO } from '@/ui/easing';
import { t } from '@/ui/strings';
import { cameraUi, cameraZoom, color, motion, radius, size, space, type } from '@/ui/tokens';

const IDENTITY: Placement = { x: 0, y: 0, scale: 1, rotation: 0 };

/** Camera — màn đầu tiên của app (business-flow §3, §4; design.md §6.1–6.2). */
export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) return <View style={styles.root} />;
  if (!permission.granted) {
    return (
      <Screen title={t.app.name} scroll={false}>
        <Text style={[type.body, styles.ink]}>{t.camera.permissionTitle}</Text>
        <Button
          label={permission.canAskAgain ? t.camera.permissionAllow : t.common.openSettings}
          onPress={permission.canAskAgain ? requestPermission : () => Linking.openSettings()}
          fullWidth
        />
      </Screen>
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
  const opacityLevel = useCameraStore((s) => s.opacityLevel);
  const mirrored = useCameraStore((s) => s.mirrored);
  const store = useCameraStore.getState;

  const [root, setRoot] = useState({ width: 0, height: 0 });
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [lenses, setLenses] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [pose, setPose] = useState<Pose | null>(null);
  const [busy, setBusy] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Bố cục: thanh trên, vùng dưới, khung ngắm theo tỉ lệ (frame.ts) ----
  const topH = insets.top + space[2] + size.iconButton + space[2];
  const bottomH = insets.bottom + space[4] + size.shutter + space[4] + size.tap + space[3];
  const frame: Rect = viewfinderRect(root.width, root.height, topH, bottomH, ASPECTS[aspect]);
  const frameCx = frame.x + frame.width / 2;
  const frameCy = frame.y + frame.height / 2;
  const overTop = frame.y < topH;
  const overBottom = frame.y + frame.height > root.height - bottomH;
  // Tâm vùng xóa (design.md §6.2: giữa vùng dưới, trên dòng chữ "Thả để gỡ pose").
  const trashX = root.width / 2;
  const trashY =
    root.height - insets.bottom - space[4] - type.label.lineHeight - space[2] - cameraUi.trash / 2;

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

  // ---- Zoom camera: thanh kéo, hoặc pinch khi lượt chạm không bắt đầu trên pose (BR-11) ----
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

  // Đang kéo pose: ẩn điều khiển dưới, hiện vùng xóa.
  const dragging = useDerivedValue(() => moved.get() || inTrash.get());
  const controlsStyle = useAnimatedStyle(() => ({
    opacity: withTiming(dragging.get() ? 0 : 1, { duration: motion.in, easing: ease }),
  }));
  const trashZoneStyle = useAnimatedStyle(() => ({
    opacity: withTiming(dragging.get() ? 1 : 0, { duration: motion.in, easing: ease }),
  }));

  // ---- Chụp ----
  const flashOpacity = useSharedValue(0);
  const flashStyle = useAnimatedStyle(() => ({ opacity: flashOpacity.get() }));

  const save = async (uri: string) => {
    try {
      await saveToAlbum(uri);
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
        { text: t.common.retry, onPress: () => save(uri) },
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
      setLastPhoto(out.uri);
      await save(out.uri);
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
  const pct = Math.round(OVERLAY_OPACITY[opacityLevel] * 100);
  const flashIcon = flash === 'off' ? ZapOff : Zap;
  const flashLabel =
    flash === 'off' ? t.camera.flashOff : flash === 'on' ? t.camera.flashOn : t.camera.flashAuto;
  const gridLabel =
    grid === 'off' ? t.camera.gridOff : grid === '3' ? t.camera.grid3 : t.camera.grid4;
  const timerLabel = timer === 0 ? t.camera.timerOff : t.camera.timerSec(timer);
  const frameBox = { left: frame.x, top: frame.y, width: frame.width, height: frame.height };

  return (
    <View
      style={styles.root}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setRoot({ width, height });
      }}
    >
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
              ảnh (trên cả vùng xám ngoài khung) nhưng dưới thanh điều khiển (góp ý Phase 2). */}
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
                    opacity={OVERLAY_OPACITY[opacityLevel]}
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
        </>
      )}

      {/* Thanh trên (design.md §6.1). */}
      <View style={[styles.top, { paddingTop: insets.top + space[2] }]} pointerEvents="box-none">
        <View style={styles.row}>
          <BarButton
            icon={flashIcon}
            label={flashLabel}
            onPress={store().cycleFlash}
            active={flash !== 'off'}
            badge={flash === 'auto' ? 'A' : undefined}
            onScrim={overTop}
          />
          <BarButton
            icon={Grid3x3}
            label={gridLabel}
            onPress={store().cycleGrid}
            active={grid !== 'off'}
            badge={grid === 'off' ? undefined : grid}
            onScrim={overTop}
          />
          <BarButton
            icon={Ruler}
            label={levelOn ? t.camera.levelOn : t.camera.levelOff}
            onPress={store().toggleLevel}
            active={levelOn}
            onScrim={overTop}
          />
          <BarButton
            icon={Timer}
            label={timerLabel}
            onPress={store().cycleTimer}
            active={timer > 0}
            badge={timer > 0 ? String(timer) : undefined}
            onScrim={overTop}
          />
          <BarButton
            label={t.camera.aspect(aspect)}
            onPress={store().cycleAspect}
            onScrim={overTop}
            wide
          >
            <Text style={[type.num, styles.ink]}>{aspect}</Text>
          </BarButton>
        </View>
        <BarButton
          icon={Settings}
          label={t.camera.openSpikes}
          onPress={() => router.push('/spike')}
          onScrim={overTop}
        />
      </View>

      {/* Rail điều khiển nhanh cho overlay (business-flow §4.4), chỉ khi có pose. */}
      {pose && root.height > 0 && (
        <Animated.View
          style={[
            styles.rail,
            {
              top: Math.min(frame.y + frame.height, root.height - bottomH) - railHeight - space[3],
            },
            controlsStyle,
          ]}
        >
          <BarButton
            icon={Contrast}
            label={t.camera.opacity(pct)}
            onPress={store().cycleOpacity}
            badge={pct === 100 ? undefined : String(pct)}
            onScrim
          />
          <BarButton
            icon={FlipHorizontal2}
            label={t.camera.mirror}
            onPress={store().toggleMirror}
            active={mirrored}
            onScrim
          />
          <BarButton
            icon={EyeOff}
            label={t.camera.holdToHide}
            onPressIn={() => setHidden(true)}
            onPressOut={() => setHidden(false)}
            active={hidden}
            onScrim
          />
        </Animated.View>
      )}

      {/* Vùng xóa: chỉ hiện khi đang kéo pose. */}
      <Animated.View
        pointerEvents="none"
        style={[styles.trashZone, { bottom: insets.bottom + space[4] }, trashZoneStyle]}
      >
        <TrashZone inTrash={inTrash} />
      </Animated.View>

      {/* Vùng dưới. */}
      <Animated.View
        style={[styles.bottom, { paddingBottom: insets.bottom + space[4] }, controlsStyle]}
        pointerEvents="box-none"
      >
        <ZoomSlider
          factor={factor}
          min={zoomMin}
          onChangeEnd={() => settle.set(settle.get() + 1)}
        />
        <View style={styles.shutterRow}>
          <View style={styles.side}>
            <View
              style={[styles.thumb, overBottom && styles.thumbScrim]}
              accessible
              accessibilityLabel={t.camera.lastPhoto}
            >
              {busy ? (
                <ActivityIndicator size="small" color={color.ink} />
              ) : lastPhoto ? (
                <Image source={{ uri: lastPhoto }} style={styles.thumbImage} />
              ) : null}
            </View>
          </View>

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={countdown != null ? t.camera.cancelTimer : t.camera.capture}
            accessibilityState={{ disabled: !ready || busy }}
            onPress={onShutter}
            style={styles.shutter}
          >
            <View style={[styles.shutterInner, countdown != null && styles.shutterCounting]} />
          </PressableScale>

          <View style={[styles.side, styles.sideRight]}>
            <PoseButton pose={pose} onPress={() => router.push('/library')} />
            <BarButton
              icon={SwitchCamera}
              label={t.camera.switchCamera}
              onPress={switchCamera}
              onScrim={overBottom}
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const railHeight = size.iconButton * 3 + space[2] * 2;

/** Phần ngoài khung ngắm phủ nền đặc: ảnh lưu chỉ là phần trong khung (BR-02). */
function FrameMask({ frame, root }: { frame: Rect; root: { width: number; height: number } }) {
  const below = frame.y + frame.height;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.mask, { top: 0, left: 0, right: 0, height: Math.max(0, frame.y) }]} />
      <View style={[styles.mask, { top: below, left: 0, right: 0, height: root.height - below }]} />
      {frame.x > 0 && (
        <>
          <View
            style={[styles.mask, { top: frame.y, left: 0, width: frame.x, height: frame.height }]}
          />
          <View
            style={[styles.mask, { top: frame.y, right: 0, width: frame.x, height: frame.height }]}
          />
        </>
      )}
    </View>
  );
}

function BarButton({
  icon: Icon,
  label,
  onPress,
  onPressIn,
  onPressOut,
  active,
  badge,
  onScrim,
  wide,
  children,
}: {
  icon?: LucideIcon;
  label: string;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  active?: boolean;
  badge?: string;
  onScrim?: boolean;
  wide?: boolean;
  children?: ReactNode;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      hitSlop={4}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[styles.barButton, wide && styles.barButtonWide, onScrim && styles.scrim]}
    >
      {Icon && (
        <Icon size={size.icon} strokeWidth={1.75} color={active ? color.accent : color.ink} />
      )}
      {children}
      {badge && (
        <Text style={[styles.badge, { color: active ? color.accent : color.ink }]}>{badge}</Text>
      )}
    </PressableScale>
  );
}

/** Nút pose: thumbnail pose đang dùng, viền 2 px màu nhấn khi pose đang bật (design.md §6.1). */
function PoseButton({ pose, onPress }: { pose: Pose | null; onPress: () => void }) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={t.camera.openLibrary}
      hitSlop={4}
      onPress={onPress}
      style={[styles.thumb, pose && styles.poseOn]}
    >
      {pose ? (
        <PoseCanvas
          fit="cover"
          source={pose.source}
          imageWidth={pose.width}
          imageHeight={pose.height}
          contours={pose.contours}
          landmarks={null}
          width={size.thumb - 4}
          height={size.thumb - 4}
          subjectOpacity={1}
          backgroundOpacity={1}
          outlineEnabled
          outlineColor="#ffffff"
          outlineWidth={1}
          fillEnabled={false}
          fillColor={pose.style.fillColor}
          fillOpacity={0}
          faceEnabled={false}
          faceColor={pose.style.faceColor}
          faceWidth={0}
        />
      ) : (
        <PersonStanding size={size.icon} strokeWidth={1.75} color={color.ink} />
      )}
    </PressableScale>
  );
}

/** Vùng xóa (design.md §6.2): ngón tay vào thì viền danger và phóng nhẹ. */
function TrashZone({ inTrash }: { inTrash: SharedValue<boolean> }) {
  const ringStyle = useAnimatedStyle(() => {
    const on = inTrash.get();
    const cfg = { duration: motion.in, easing: ease };
    return {
      borderColor: withTiming(on ? color.danger : color.line, cfg),
      transform: [{ scale: withTiming(on ? cameraUi.trashActiveScale : 1, cfg) }],
    };
  });
  return (
    <View style={styles.trashWrap}>
      <Animated.View style={[styles.trash, ringStyle]}>
        <Trash2 size={size.icon} strokeWidth={1.75} color={color.ink} />
      </Animated.View>
      <Text style={[type.label, styles.ink]}>{t.camera.dropToRemove}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  abs: { position: 'absolute' },
  center: { alignItems: 'center', justifyContent: 'center' },
  ink: { color: color.ink },
  mask: { position: 'absolute', backgroundColor: color.bg },
  shutterFlash: { backgroundColor: color.shutterFlash },
  top: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: size.edge,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: { flexDirection: 'row', gap: space[1] },
  barButton: {
    width: size.iconButton,
    height: size.iconButton,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barButtonWide: { width: size.iconButton + space[3] },
  scrim: { backgroundColor: color.scrim },
  badge: {
    position: 'absolute',
    right: 2,
    bottom: 4,
    fontFamily: type.num.fontFamily,
    fontSize: 10,
    lineHeight: 12,
  },
  rail: { position: 'absolute', right: size.edge, gap: space[2] },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: size.gutter,
    gap: space[4],
  },
  shutterRow: { flexDirection: 'row', alignItems: 'center' },
  // Hai bên cùng flex 1 để nút chụp luôn ở chính giữa.
  side: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  sideRight: { justifyContent: 'flex-end', gap: space[2] },
  thumb: {
    width: size.thumb,
    height: size.thumb,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: color.line,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbScrim: { backgroundColor: color.scrim },
  thumbImage: { width: size.thumb, height: size.thumb },
  poseOn: { borderWidth: 2, borderColor: color.accent },
  shutter: {
    width: size.shutter,
    height: size.shutter,
    borderRadius: radius.full,
    borderWidth: 3,
    borderColor: color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: size.shutter - 14,
    height: size.shutter - 14,
    borderRadius: radius.full,
    backgroundColor: color.ink,
  },
  shutterCounting: { backgroundColor: color.accent },
  countdown: {
    fontFamily: type.num.fontFamily,
    fontSize: cameraUi.countdownSize,
    lineHeight: cameraUi.countdownSize * 1.1,
    color: color.ink,
  },
  trashZone: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  trashWrap: { alignItems: 'center', gap: space[2] },
  trash: {
    width: cameraUi.trash,
    height: cameraUi.trash,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: color.line,
    backgroundColor: color.scrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
