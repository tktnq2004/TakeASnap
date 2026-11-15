import { type CameraType, CameraView } from 'expo-camera';
import { memo, type Ref, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import {
  type SharedValue,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { ease } from '@/ui/easing';
import { cameraZoom } from '@/ui/tokens';

import type { FlashMode } from './cameraStore';
import { type ZoomConfig, zoomTarget } from './zoom';

export const ULTRA_WIDE_LENS = 'AVCaptureDeviceTypeBuiltInUltraWideCamera';
const WIDE_LENS = 'AVCaptureDeviceTypeBuiltInWideAngleCamera';
/**
 * Camera ảo của iPhone gộp nhiều ống (expo-camera liệt kê chúng trong danh sách ống). Chọn camera
 * ảo thì máy tự chuyển ống khi zoom, giống app Camera gốc: không chớp khi qua mốc 1×.
 */
const VIRTUAL_LENSES = [
  'AVCaptureDeviceTypeBuiltInTripleCamera',
  'AVCaptureDeviceTypeBuiltInDualWideCamera',
];

type Props = {
  cameraRef: Ref<CameraView>;
  facing: CameraType;
  flash: FlashMode;
  /** Hệ số zoom hiển thị (0,5×…5×) trên UI thread; pinch và thanh kéo cùng ghi vào đây. */
  factor: SharedValue<number>;
  /** Tăng mỗi khi pinch/kéo kết thúc: luôn gửi giá trị cuối, kể cả khi đang trong khoảng chờ. */
  settle: SharedValue<number>;
  /** `deviceType` các ống của camera đang dùng (iOS). */
  lenses: string[];
  onLenses: (deviceTypes: string[]) => void;
  onReady: () => void;
};

type ZoomState = { prop: number; ultra: boolean };

/**
 * Chỉ component này re-render khi zoom đổi (roadmap §3.5): `expo-camera` nhận zoom và ống kính
 * qua prop nên phải có state. Shared value đẩy sang state tối đa mỗi khung hình trên iOS,
 * ~30 lần/giây trên Android (spike A: đẩy mỗi khung hình làm JS Android tụt 15–25 fps). Overlay,
 * lưới, nút nằm ngoài nên không bị kéo theo.
 */
export const CameraLayer = memo(function CameraLayer({
  cameraRef,
  facing,
  flash,
  factor,
  settle,
  lenses,
  onLenses,
  onReady,
}: Props) {
  const [zoom, setZoom] = useState<ZoomState>({ prop: 0, ultra: false });
  const lastSentAt = useSharedValue(0);
  const smooth = useSharedValue(1);
  const ios = Platform.OS === 'ios';
  const interval = ios ? cameraZoom.minIntervalMsIos : cameraZoom.minIntervalMsAndroid;
  const hasUltraWide = ios && facing === 'back' && lenses.includes(ULTRA_WIDE_LENS);
  const virtualLens =
    ios && facing === 'back' ? VIRTUAL_LENSES.find((l) => lenses.includes(l)) : undefined;
  const config: ZoomConfig = {
    platform: ios ? 'ios' : 'android',
    hasUltraWide,
    virtual: virtualLens != null,
    iosMaxFactor: cameraZoom.iosMaxFactor,
    iosVirtualMaxFactor: cameraZoom.iosVirtualMaxFactor,
    androidMaxRatio: cameraZoom.androidMaxRatio,
    precision: cameraZoom.precision,
  };

  // Camera trượt tới hệ số mới thay vì nhảy: nấc 0,1 của thanh kéo và pinch nhanh không giật.
  useAnimatedReaction(
    () => factor.get(),
    (f, prev) => {
      if (prev == null) smooth.set(f);
      else smooth.set(withTiming(f, { duration: cameraZoom.smoothMs, easing: ease }));
    },
  );

  useAnimatedReaction(
    () => {
      const f = smooth.get();
      return { ...zoomTarget(f, config), done: f === factor.get(), s: settle.get() };
    },
    (now, prev) => {
      const t = Date.now();
      const changed = prev == null || now.prop !== prev.prop || now.ultra !== prev.ultra;
      // Đổi ống, lúc nhấc tay, lúc trượt xong (giá trị cuối) và bước nhảy lớn gửi ngay; còn lại
      // giới hạn tần suất.
      const urgent =
        prev == null ||
        now.s !== prev.s ||
        now.ultra !== prev.ultra ||
        (now.done && changed) ||
        Math.abs(now.prop - prev.prop) > 0.05;
      if (urgent || (changed && t - lastSentAt.get() >= interval)) {
        lastSentAt.set(t);
        scheduleOnRN(setZoom, { prop: now.prop, ultra: now.ultra });
      }
    },
  );

  // Có camera ảo thì luôn dùng nó. Không có thì đổi ống thật: ghi rõ ống chính khi có, để quay từ
  // ống góc rộng về được chắc chắn (máy cũ vẫn còn chớp khi qua 1×).
  const lens = !ios
    ? undefined
    : virtualLens
      ? virtualLens
      : zoom.ultra && hasUltraWide
        ? ULTRA_WIDE_LENS
        : lenses.includes(WIDE_LENS)
          ? WIDE_LENS
          : undefined;

  return (
    <CameraView
      ref={cameraRef}
      style={StyleSheet.absoluteFill}
      facing={facing}
      flash={flash}
      zoom={zoom.prop}
      ratio="4:3"
      selectedLens={lens}
      animateShutter={false}
      onCameraReady={onReady}
      onAvailableLensesChanged={(e) => onLenses(e.lenses.map((l) => l.deviceType))}
    />
  );
});
