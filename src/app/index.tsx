import { type CameraView, useCameraPermissions } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  Contrast,
  EyeOff,
  FlipHorizontal2,
  Grid3x3,
  type LucideIcon,
  Move,
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
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, {
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { CameraLayer } from '@/features/camera/CameraLayer';
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
import { nextZoomFactor } from '@/features/camera/zoom';
import { type ZoomChip, ZoomChips } from '@/features/camera/ZoomChips';
import { PoseCanvas } from '@/features/pose/PoseCanvas';
import { getPose } from '@/features/pose/repository';
import type { Pose } from '@/features/pose/types';
import { type Placement, useTransformGesture } from '@/gestures/useTransformGesture';
import { haptic } from '@/lib/haptics';
import { Button, PressableScale, Screen } from '@/ui/components';
import { ease } from '@/ui/easing';
import { t } from '@/ui/strings';
import { cameraUi, cameraZoom, color, motion, radius, size, space, type } from '@/ui/tokens';

const ULTRA_WIDE = 'AVCaptureDeviceTypeBuiltInUltraWideCamera';
const WIDE = 'AVCaptureDeviceTypeBuiltInWideAngleCamera';
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
  const [ultraWide, setUltraWide] = useState(false);
  const [ready, setReady] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [pose, setPose] = useState<Pose | null>(null);
  const [busy, setBusy] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Bố cục: thanh trên, vùng dưới, khung ngắm theo tỉ lệ (frame.ts) ----
  const topH = insets.top + space[2] + size.iconButton + space[2];
  const bottomH = insets.bottom + space[4] + size.shutter + space[4] + size.chip + space[3];
  const frame: Rect = viewfinderRect(root.width, root.height, topH, bottomH, ASPECTS[aspect]);
  const overTop = frame.y < topH;
  const overBottom = frame.y + frame.height > root.height - bottomH;

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

  // ---- Zoom camera: chỉ ở chế độ chụp (BR-11) ----
  const factor = useSharedValue(1);
  const settle = useSharedValue(0);
  const camPinch = usePinchGesture({
    enabled: !editMode,
    onUpdate: (e) => {
      'worklet';
      factor.set(nextZoomFactor(factor.get(), e.scaleChange, cameraZoom.maxFactor));
    },
    onFinalize: () => {
      'worklet';
      settle.set(settle.get() + 1);
    },
  });

  const selectZoom = (chip: ZoomChip) => {
    setUltraWide(chip === '0.5');
    factor.set(chip === '2' ? 2 : 1);
    settle.set(settle.get() + 1);
  };
  const hasUltraWide = Platform.OS === 'ios' && facing === 'back' && lenses.includes(ULTRA_WIDE);
  const lens =
    Platform.OS !== 'ios'
      ? undefined
      : ultraWide && hasUltraWide
        ? ULTRA_WIDE
        : lenses.includes(WIDE)
          ? WIDE
          : undefined;

  const switchCamera = () => {
    setFacing((f) => (f === 'back' ? 'front' : 'back'));
    setUltraWide(false);
    setLenses([]);
    factor.set(1);
    settle.set(settle.get() + 1);
  };

  // ---- Overlay: kéo/pinch/xoay ở chế độ chỉnh, nhớ placement theo pose (BR-10) ----
  const inTrash = useSharedValue(false);
  const trashDy = useSharedValue(0);
  const hitW = useSharedValue(0);
  const hitH = useSharedValue(0);

  const removePose = () => {
    if (poseId) clearPlacement(poseId);
    store().clearPose();
    setEditMode(false);
  };

  const onPlacementEnd = (p: Placement) => {
    if (inTrash.get()) {
      inTrash.set(false);
      removePose();
      return;
    }
    if (poseId) savePlacement(poseId, p, frame.height);
  };

  const overlay = useTransformGesture({
    enabled: editMode,
    onEnd: onPlacementEnd,
    onSnap: haptic.snap,
  });
  const { tx, ty, scale, rotation, setArea } = overlay;

  useEffect(() => {
    setArea(frame.width, frame.height);
  }, [frame.width, frame.height, setArea]);

  // Đặt overlay về placement đã nhớ khi đổi pose (hoặc khi khung đổi cỡ).
  useEffect(() => {
    if (!pose || frame.height <= 0) return;
    const p = loadPlacement(pose.id, frame.height) ?? IDENTITY;
    tx.set(p.x);
    ty.set(p.y);
    scale.set(p.scale);
    rotation.set(p.rotation);
  }, [pose, frame.height, tx, ty, scale, rotation]);

  useEffect(() => {
    if (!pose) return;
    const box = containSize(pose.width, pose.height, frame.width, frame.height);
    hitW.set(box.width);
    hitH.set(box.height);
  }, [pose, frame.width, frame.height, hitW, hitH]);

  // Tâm vùng xóa tính từ tâm khung ngắm (design.md §6.2: vùng xóa ở giữa vùng dưới).
  const trashCenterY =
    root.height - insets.bottom - space[4] - type.label.lineHeight - space[2] - cameraUi.trash / 2;
  useEffect(() => {
    trashDy.set(trashCenterY - (frame.y + frame.height / 2));
  }, [trashCenterY, frame.y, frame.height, trashDy]);

  const editing = useSharedValue(false);
  useEffect(() => {
    editing.set(editMode);
  }, [editMode, editing]);

  useAnimatedReaction(
    () =>
      editing.get() &&
      Math.hypot(tx.get(), ty.get() - trashDy.get()) < cameraUi.trashRadius,
    (now, prev) => {
      inTrash.set(now);
      if (now && prev === false) scheduleOnRN(haptic.enterTrash);
    },
  );

  // Chạm 1 lần: trúng overlay → vào chế độ chỉnh; ở chế độ chỉnh chạm ra ngoài → thoát.
  const onTap = (hit: boolean) => {
    if (!pose) return;
    if (!editMode && hit) setEditMode(true);
    else if (editMode && !hit) setEditMode(false);
  };
  const tap = useTapGesture({
    numberOfTaps: 1,
    onActivate: (e) => {
      'worklet';
      const hit = hitOverlay(
        e.x - frame.width / 2,
        e.y - frame.height / 2,
        { x: tx.get(), y: ty.get(), scale: scale.get(), rotation: rotation.get() },
        hitW.get(),
        hitH.get(),
        space[3],
      );
      scheduleOnRN(onTap, hit);
    },
  });

  const gesture = useSimultaneousGestures(camPinch, overlay.gesture, tap);

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
    haptic.capture();
    flashOpacity.set(
      withSequence(
        withTiming(0.7, { duration: cameraUi.shutterFlashMs / 2, easing: ease }),
        withTiming(0, { duration: cameraUi.shutterFlashMs * 2, easing: ease }),
      ),
    );
    try {
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
        lens={lens}
        onLenses={setLenses}
        onReady={() => setReady(true)}
      />

      {root.height > 0 && (
        <>
          <FrameMask frame={frame} root={root} />
          <FrameGrid frame={frame} mode={grid} />
          {levelOn && <LevelGuide frame={frame} />}

          <GestureDetector gesture={gesture}>
            <View
              collapsable={false}
              style={[
                styles.abs,
                { left: frame.x, top: frame.y, width: frame.width, height: frame.height },
                !editMode && styles.clip,
              ]}
            >
              {pose && (
                <PoseOverlay
                  pose={pose}
                  width={frame.width}
                  height={frame.height}
                  transform={overlay.style}
                  scale={scale}
                  opacity={OVERLAY_OPACITY[opacityLevel]}
                  mirrored={mirrored}
                  hidden={hidden}
                  editMode={editMode}
                />
              )}
              {countdown != null && (
                <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
                  <Text style={styles.countdown} accessibilityLiveRegion="assertive">
                    {countdown}
                  </Text>
                </View>
              )}
            </View>
          </GestureDetector>

          <Animated.View
            pointerEvents="none"
            style={[
              styles.abs,
              styles.shutterFlash,
              { left: frame.x, top: frame.y, width: frame.width, height: frame.height },
              flashStyle,
            ]}
          />
        </>
      )}

      {/* Thanh trên (design.md §6.1). Chế độ chỉnh chỉ còn nút Xong (§6.2). */}
      <View style={[styles.top, { paddingTop: insets.top + space[2] }]} pointerEvents="box-none">
        {editMode ? (
          <>
            <View />
            <Button label={t.common.done} variant="secondary" onPress={() => setEditMode(false)} />
          </>
        ) : (
          <>
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
          </>
        )}
      </View>

      {/* Rail điều khiển nhanh cho overlay (business-flow §4.4), chỉ khi có pose. */}
      {pose && !editMode && root.height > 0 && (
        <View
          style={[
            styles.rail,
            {
              top:
                Math.min(frame.y + frame.height, root.height - bottomH) - railHeight - space[3],
            },
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
          <BarButton
            icon={Move}
            label={t.camera.editPose}
            onPress={() => setEditMode(true)}
            onScrim
          />
        </View>
      )}

      {/* Vùng dưới. */}
      <View
        style={[styles.bottom, { paddingBottom: insets.bottom + space[4] }]}
        pointerEvents="box-none"
      >
        {editMode ? (
          <TrashZone inTrash={inTrash} />
        ) : (
          <>
            <ZoomChips
              factor={factor}
              ultraWideActive={ultraWide && hasUltraWide}
              hasUltraWide={hasUltraWide}
              onSelect={selectZoom}
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
          </>
        )}
      </View>
    </View>
  );
}

const railHeight = size.iconButton * 4 + space[2] * 3;

/** Phần ngoài khung ngắm phủ nền đặc: ảnh lưu chỉ là phần trong khung (BR-02). */
function FrameMask({ frame, root }: { frame: Rect; root: { width: number; height: number } }) {
  const below = frame.y + frame.height;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.mask, { top: 0, left: 0, right: 0, height: Math.max(0, frame.y) }]} />
      <View
        style={[styles.mask, { top: below, left: 0, right: 0, height: root.height - below }]}
      />
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

/** Vùng xóa (design.md §6.2): đổi viền danger khi overlay vào. */
function TrashZone({ inTrash }: { inTrash: SharedValue<boolean> }) {
  const ringStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(inTrash.get() ? color.danger : color.line, {
      duration: motion.in,
      easing: ease,
    }),
  }));
  return (
    <View style={styles.trashWrap} pointerEvents="none">
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
  clip: { overflow: 'hidden' },
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
  // Hai bên cùng flex 1 để nút chụp luôn ở chính giữa.
  side: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  sideRight: { justifyContent: 'flex-end', gap: space[2] },
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
  trashWrap: { alignItems: 'center', gap: space[2], paddingTop: space[4] },
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
