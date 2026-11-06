import { CameraView, type CameraType, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { ChevronLeft, SwitchCamera } from 'lucide-react-native';
import { memo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  GestureDetector,
  usePinchGesture,
  useSimultaneousGestures,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { FpsMeter } from '@/features/spike/FpsMeter';
import { useTransformGesture } from '@/gestures/useTransformGesture';
import { haptic } from '@/lib/haptics';
import { AnimatedText, Button, IconButton, Screen } from '@/ui/components';
import { t } from '@/ui/strings';
import { color, radius, size, space, type } from '@/ui/tokens';

/**
 * Spike A (roadmap §4, Phase 0): expo-camera nhận zoom qua prop nên bắt buộc có state.
 * Đo xem khi zoom làm CameraLayer re-render thì overlay (UI thread) có còn ~60 fps không.
 */
export default function CameraSpike() {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) return <View style={styles.root} />;
  if (!permission.granted) {
    return (
      <Screen title={t.spike.cameraTitle} scroll={false}>
        <Text style={[type.body, { color: color.ink }]}>{t.camera.permissionTitle}</Text>
        <Button label={t.camera.permissionAllow} onPress={requestPermission} fullWidth />
      </Screen>
    );
  }
  return <CameraSpikeBody />;
}

function CameraSpikeBody() {
  const insets = useSafeAreaInsets();
  const [facing, setFacing] = useState<CameraType>('back');
  const [editMode, setEditMode] = useState(false);

  // Zoom: shared value trên UI thread → state (tối đa 100 nấc) → prop của CameraView.
  const zoomSV = useSharedValue(0);
  const [zoom, setZoom] = useState(0);
  useAnimatedReaction(
    () => Math.round(zoomSV.value * 100) / 100,
    (now, prev) => {
      if (now !== prev) scheduleOnRN(setZoom, now);
    },
  );
  const zoomText = useDerivedValue(() => `zoom ${Math.round(zoomSV.value * 100)}%`);

  const camPinch = usePinchGesture({
    enabled: !editMode,
    onUpdate: (e) => {
      'worklet';
      zoomSV.value = Math.min(1, Math.max(0, zoomSV.value + (e.scaleChange - 1) * 0.6));
    },
  });

  const overlay = useTransformGesture({ enabled: editMode, onSnap: haptic.snap });
  const gesture = useSimultaneousGestures(camPinch, overlay.gesture);

  return (
    <View style={styles.root}>
      <CameraLayer facing={facing} zoom={zoom} />

      <GestureDetector gesture={gesture}>
        <View
          style={StyleSheet.absoluteFill}
          onLayout={(e) => overlay.setArea(e.nativeEvent.layout.width, e.nativeEvent.layout.height)}
        >
          <View style={styles.center} pointerEvents="none">
            <Animated.View
              style={[styles.overlayBox, editMode && styles.overlayEdit, overlay.style]}
            />
          </View>
        </View>
      </GestureDetector>

      <View style={[styles.top, { paddingTop: insets.top + space[2] }]} pointerEvents="box-none">
        <IconButton
          icon={ChevronLeft}
          label={t.common.back}
          onPress={() => router.back()}
          onScrim
        />
        <FpsMeter />
        <IconButton
          icon={SwitchCamera}
          label={t.camera.switchCamera}
          onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          onScrim
        />
      </View>

      <View
        style={[styles.bottom, { paddingBottom: insets.bottom + space[4] }]}
        pointerEvents="box-none"
      >
        <AnimatedText text={zoomText} style={[type.num, styles.zoom]} />
        <Text style={[type.label, styles.hint]}>{t.spike.cameraHint}</Text>
        <Button
          label={editMode ? t.spike.editOff : t.spike.editOn}
          variant={editMode ? 'primary' : 'secondary'}
          onPress={() => setEditMode((v) => !v)}
        />
      </View>
    </View>
  );
}

/**
 * Chỉ component này re-render khi zoom đổi (roadmap §3.5). Overlay, lưới và điều khiển nằm
 * ngoài nên không bị kéo theo.
 */
const CameraLayer = memo(function CameraLayer({
  facing,
  zoom,
}: {
  facing: CameraType;
  zoom: number;
}) {
  return <CameraView style={StyleSheet.absoluteFill} facing={facing} zoom={zoom} flash="auto" />;
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  center: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayBox: {
    width: 160,
    height: 280,
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: color.ink,
  },
  overlayEdit: { borderColor: color.accent },
  top: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: size.edge,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: size.edge,
    alignItems: 'center',
    gap: space[3],
  },
  zoom: { color: color.ink },
  hint: {
    color: color.ink,
    textAlign: 'center',
    backgroundColor: color.scrim,
    padding: space[2],
    borderRadius: radius.sm,
  },
});
