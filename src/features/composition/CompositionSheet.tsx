import { Check, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { PressableScale } from '@/ui/components';
import { easeIO } from '@/ui/easing';
import { t } from '@/ui/strings';
import { color, compositionUi, motion, radius, size, space, type } from '@/ui/tokens';

import { TechniqueIcon } from './TechniqueIcon';
import { TECHNIQUES, type TechniqueId } from './techniques';

type Props = {
  open: boolean;
  /** Bố cục đang chọn. */
  value: TechniqueId;
  bottomInset: number;
  onChange: (t: TechniqueId) => void;
  onClose: () => void;
  /** Mở tab Bố cục của Thư viện; không có thì ẩn lối "Học các kỹ thuật". */
  onLearn?: () => void;
};

/**
 * Bảng Bố cục (design.md §6.15, bản A): kéo lên từ đáy, mỗi dòng một kỹ thuật. Chạm một dòng là
 * chọn và đóng; chạm ra ngoài hoặc nút đóng thì đóng.
 */
export function CompositionSheet({ open, value, bottomInset, onChange, onClose, onLearn }: Props) {
  const reduceMotion = useReducedMotion();
  // Giữ bảng trong cây tới khi trượt xuống xong.
  const [mounted, setMounted] = useState(open);
  const [height, setHeight] = useState(0);
  const p = useSharedValue(0);

  // Mở: gắn ngay. Đóng khi giảm chuyển động: gỡ ngay (không có hiệu ứng để chờ).
  if (open && !mounted) setMounted(true);
  if (!open && mounted && reduceMotion) setMounted(false);

  useEffect(() => {
    if (!mounted) return;
    const to = open ? 1 : 0;
    if (reduceMotion) {
      p.set(to);
      return;
    }
    p.set(
      withTiming(to, { duration: motion.slide, easing: easeIO }, (done) => {
        if (done && to === 0) scheduleOnRN(setMounted, false);
      }),
    );
  }, [open, mounted, p, reduceMotion]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: p.get() }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - p.get()) * (height || 600) }],
  }));

  if (!mounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={open ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}>
        <Pressable
          accessibilityLabel={t.common.close}
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
      </Animated.View>
      <Animated.View
        accessibilityViewIsModal
        onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
        style={[styles.sheet, { paddingBottom: bottomInset + space[4] }, sheetStyle]}
      >
        <View style={styles.grip} />
        <View style={styles.head}>
          <Text style={[styles.title, styles.ink]} accessibilityRole="header">
            {t.composition.title}
          </Text>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={t.common.close}
            hitSlop={4}
            onPress={onClose}
            style={styles.close}
          >
            <X size={size.iconSmall} strokeWidth={2.25} color={color.ink} />
          </PressableScale>
        </View>
        <View accessibilityRole="radiogroup">
          {TECHNIQUES.map((k) => {
            const on = k === value;
            return (
              <Pressable
                key={k}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={t.composition.names[k]}
                accessibilityHint={t.composition.subs[k]}
                onPress={() => onChange(k)}
                style={({ pressed }) => [styles.row, (on || pressed) && styles.rowOn]}
              >
                <View style={styles.icon}>
                  <TechniqueIcon kind={k} />
                </View>
                <View style={styles.rowText}>
                  <Text style={[type.label, styles.ink]} numberOfLines={1}>
                    {t.composition.names[k]}
                  </Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    {t.composition.subs[k]}
                  </Text>
                </View>
                {on && <Check size={size.icon} strokeWidth={2.5} color={color.accent} />}
              </Pressable>
            );
          })}
        </View>
        {onLearn && (
          <PressableScale accessibilityRole="button" onPress={onLearn} style={styles.learn}>
            <Text style={[type.label, styles.accent]}>{t.composition.learn}</Text>
          </PressableScale>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: color.popoverScrim },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    paddingHorizontal: space[3],
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    backgroundColor: color.surface,
  },
  grip: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: color.faint,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[2],
    paddingTop: space[3],
    paddingBottom: space[2],
  },
  title: { ...type.head, fontSize: 20, lineHeight: 24 },
  close: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    height: compositionUi.sheetRow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: space[3],
    borderRadius: radius.md,
  },
  rowOn: { backgroundColor: color.accentSoft },
  icon: {
    width: compositionUi.sheetIcon,
    height: compositionUi.sheetIcon,
    borderRadius: radius.sm,
    backgroundColor: color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  sub: { ...type.caption, fontFamily: type.hint.fontFamily, color: color.muted },
  ink: { color: color.ink },
  accent: { color: color.accent },
  learn: {
    marginTop: space[3],
    height: 48,
    borderRadius: radius.full,
    backgroundColor: color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
