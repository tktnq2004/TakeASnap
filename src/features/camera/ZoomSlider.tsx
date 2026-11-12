import { StyleSheet, View } from 'react-native';
import { type SharedValue, useDerivedValue } from 'react-native-reanimated';

import { AnimatedText, Slider } from '@/ui/components';
import { t } from '@/ui/strings';
import { cameraZoom, color, radius, size, space, type } from '@/ui/tokens';

import { formatZoom } from './zoom';

type Props = {
  factor: SharedValue<number>;
  /** 0,5× khi máy có ống góc rộng, còn lại 1×. */
  min: number;
  onChangeEnd: () => void;
};

/**
 * Thanh kéo zoom 0,5×–5×, bước 0,1 (góp ý Phase 2: thay chip 0,5× / 1× / 2×, vì pinch trên pose
 * giờ chỉnh pose). Chạy trên UI thread; pinch ngoài pose vẫn zoom và thanh chạy theo.
 */
export function ZoomSlider({ factor, min, onChangeEnd }: Props) {
  const text = useDerivedValue(() => formatZoom(factor.get()));
  return (
    <View style={styles.pill}>
      <AnimatedText text={text} style={[type.num, styles.value]} />
      <View style={styles.track}>
        <Slider
          compact
          label={t.camera.zoomLabel}
          value={factor}
          min={min}
          max={cameraZoom.max}
          step={cameraZoom.step}
          format={formatZoom}
          onChangeEnd={onChangeEnd}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    height: size.tap,
    paddingLeft: space[3],
    paddingRight: space[2],
    borderRadius: radius.full,
    backgroundColor: color.scrim,
  },
  value: { color: color.ink, minWidth: 40, textAlign: 'right' },
  track: { width: cameraZoom.sliderWidth, flexDirection: 'row' },
});
