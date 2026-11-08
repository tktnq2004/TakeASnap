import { type CameraType, CameraView } from 'expo-camera';
import { memo, type Ref, useState } from 'react';
import { StyleSheet } from 'react-native';
import { type SharedValue, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { cameraZoom } from '@/ui/tokens';

import type { FlashMode } from './cameraStore';
import { zoomFactorToProp } from './zoom';

type Props = {
  cameraRef: Ref<CameraView>;
  facing: CameraType;
  flash: FlashMode;
  /** Hệ số zoom 1×…max trên UI thread (pinch và chip zoom ghi vào đây). */
  factor: SharedValue<number>;
  /** Tăng mỗi khi pinch kết thúc: luôn gửi giá trị cuối, kể cả khi đang trong khoảng chờ. */
  settle: SharedValue<number>;
  /** `deviceType` của ống kính (iOS); undefined = ống mặc định. */
  lens: string | undefined;
  onLenses: (deviceTypes: string[]) => void;
  onReady: () => void;
};

/**
 * Chỉ component này re-render khi zoom đổi (roadmap §3.5): `expo-camera` nhận zoom qua prop nên
 * phải có state. Shared value đẩy sang state tối đa mỗi `cameraZoom.minIntervalMs` (spike A:
 * đẩy mỗi khung hình làm JS Android tụt 15–25 fps). Overlay, lưới, nút nằm ngoài nên không bị
 * kéo theo.
 */
export const CameraLayer = memo(function CameraLayer({
  cameraRef,
  facing,
  flash,
  factor,
  settle,
  lens,
  onLenses,
  onReady,
}: Props) {
  const [zoom, setZoom] = useState(0);
  const lastSentAt = useSharedValue(0);
  useAnimatedReaction(
    () => ({
      z: zoomFactorToProp(factor.get(), cameraZoom.maxFactor, cameraZoom.precision),
      s: settle.get(),
    }),
    (now, prev) => {
      const t = Date.now();
      // Bước nhảy lớn (chip zoom, về 1×) và lúc nhấc tay gửi ngay; pinch thì giới hạn tần suất.
      const settled = prev != null && now.s !== prev.s;
      const jump = prev != null && Math.abs(now.z - prev.z) > 0.02;
      const changed = prev == null || now.z !== prev.z;
      if (settled || (changed && (jump || t - lastSentAt.get() >= cameraZoom.minIntervalMs))) {
        lastSentAt.set(t);
        scheduleOnRN(setZoom, now.z);
      }
    },
  );

  return (
    <CameraView
      ref={cameraRef}
      style={StyleSheet.absoluteFill}
      facing={facing}
      flash={flash}
      zoom={zoom}
      ratio="4:3"
      selectedLens={lens}
      animateShutter={false}
      onCameraReady={onReady}
      onAvailableLensesChanged={(e) => onLenses(e.lenses.map((l) => l.deviceType))}
    />
  );
});
