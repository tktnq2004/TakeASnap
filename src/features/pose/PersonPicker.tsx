import { Canvas, DashPathEffect, Group, Image, Path, useImage } from '@shopify/react-native-skia';
import { Check, ImagePlus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  type GestureResponderEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Contour } from '@/engine/contour';
import { personAt } from '@/engine/regions';
import { haptic } from '@/lib/haptics';
import { Button, Chip, CloseButton, OverlayHeader } from '@/ui/components';
import { t } from '@/ui/strings';
import { color, personPick, radius, size, space, type } from '@/ui/tokens';

import { type ImageAnalysis, PERSON_SLOP } from './createFromImage';
import { makePosePath } from './PoseCanvas';

type Props = {
  analysis: ImageAnalysis;
  /** Viền từng người, cùng thứ tự với `analysis.people`. */
  contours: Contour[][];
  onConfirm: (chosen: number[]) => void;
  /** Bỏ ảnh này (chưa lưu gì) và chọn ảnh khác trong album. */
  onPickAnother: () => void;
  onCancel: () => void;
};

/** Lề trong của thẻ ảnh. */
const CARD_PAD = space[3];
/** Hàng chip dưới thẻ: cao một chip cộng khoảng cách phía trên. */
const CHIPS_H = size.chip + space[3];
const BADGE = 30;

/**
 * Chọn người khi ảnh có nhiều người (business-flow §5.1, Phase 3): chạm vào từng người để chọn
 * hoặc bỏ chọn, hoặc chọn bằng hàng chip. Thẻ ảnh ôm sát ảnh (góp ý Phase 4 vòng 2, mục 9.10).
 */
export function PersonPicker({ analysis, contours, onConfirm, onPickAnother, onCancel }: Props) {
  const { seg, labeling, people } = analysis;
  const insets = useSafeAreaInsets();
  const image = useImage(seg.prepared.uri);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [chosen, setChosen] = useState<number[]>([]);

  // Ảnh vừa khít phần còn trống (trừ lề thẻ và hàng chip), thẻ ôm theo ảnh.
  const maxW = stage.w - size.edge * 2 - CARD_PAD * 2;
  const maxH = stage.h - CARD_PAD * 2 - CHIPS_H;
  const scale =
    maxW > 0 && maxH > 0
      ? Math.min(maxW / seg.prepared.width, maxH / seg.prepared.height)
      : 0;
  const w = seg.prepared.width * scale;
  const h = seg.prepared.height * scale;
  const paths = useMemo(() => contours.map((c) => makePosePath(c, w, h)), [contours, w, h]);

  const allChosen = chosen.length === people.length;

  const toggle = (i: number) => {
    haptic.select();
    setChosen((cur) =>
      cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i].sort((a, b) => a - b),
    );
  };

  const toggleAll = () => {
    haptic.select();
    setChosen(allChosen ? [] : people.map((_, i) => i));
  };

  const onTap = (e: GestureResponderEvent) => {
    if (w <= 0) return;
    const gx = (e.nativeEvent.locationX / w) * labeling.width;
    const gy = (e.nativeEvent.locationY / h) * labeling.height;
    const i = personAt(labeling, people, gx, gy, PERSON_SLOP);
    if (i != null) toggle(i);
  };

  // Đầu mỗi người (điểm cao nhất của dáng, chuẩn hóa 0..1) để đặt huy hiệu số.
  const heads = useMemo(
    () =>
      contours.map((cs) => {
        let top = { x: 0.5, y: 1 };
        let minX = 1;
        let maxX = 0;
        for (const c of cs) {
          if (c.isHole) continue;
          for (const p of c.points) {
            if (p.y < top.y) top = p;
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
          }
        }
        return { x: (minX + maxX) / 2, y: top.y };
      }),
    [contours],
  );

  return (
    <View style={styles.root}>
      {/* Như Thư viện: iOS là thẻ dưới thanh trạng thái, Android toàn màn hình. */}
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === 'ios' ? space[5] : insets.top + space[3] },
        ]}
      >
        <OverlayHeader
          title={t.library.pickTitle}
          right={<CloseButton onPress={onCancel} label={t.common.cancel} />}
        />
        <Text style={[type.hint, styles.muted, styles.hint]}>{t.library.pickHint}</Text>
      </View>

      <View
        style={styles.stage}
        onLayout={(e) =>
          setStage({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
        }
      >
        {w > 0 && (
          <View style={styles.card}>
            <Pressable
              accessibilityRole="image"
              accessibilityLabel={t.library.pickHint}
              accessibilityValue={{ text: t.library.pickedCount(chosen.length, people.length) }}
              style={[styles.preview, { width: w, height: h }]}
              onPress={onTap}
            >
              {image && (
                <Canvas style={StyleSheet.absoluteFill}>
                  <Image image={image} x={0} y={0} width={w} height={h} fit="fill" />
                  {paths.map((p, i) => {
                    if (!p) return null;
                    const on = chosen.includes(i);
                    return (
                      <Group key={i}>
                        {on && <Path path={p} color={color.accent} opacity={personPick.fill} />}
                        {/* Chưa chọn: viền nét đứt như dáng mẫu; đã chọn: viền trắng liền. */}
                        <Path
                          path={p}
                          color={color.surface}
                          style="stroke"
                          strokeWidth={on ? personPick.strokeOn : personPick.strokeOff}
                          strokeJoin="round"
                        >
                          {!on && <DashPathEffect intervals={[8, 6]} />}
                        </Path>
                      </Group>
                    );
                  })}
                </Canvas>
              )}
              {heads.map((hd, i) => {
                const on = chosen.includes(i);
                const left = Math.min(w - BADGE - 4, Math.max(4, hd.x * w - BADGE / 2));
                const top = Math.max(4, hd.y * h - BADGE - 6);
                return (
                  <View
                    key={i}
                    pointerEvents="none"
                    style={[styles.badge, on && styles.badgeOn, { left, top }]}
                  >
                    {on ? (
                      <Check size={16} strokeWidth={3} color={color.accentInk} />
                    ) : (
                      <Text style={[type.caption, styles.badgeText]}>{i + 1}</Text>
                    )}
                  </View>
                );
              })}
            </Pressable>
          </View>
        )}

        {/* Chọn bằng tên, cho người khó chạm trúng trên ảnh nhỏ. */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chips}
        >
          <Chip
            label={t.library.pickAll}
            icon={allChosen ? Check : undefined}
            selected={allChosen}
            onPress={toggleAll}
          />
          {people.map((_, i) => (
            <Chip
              key={i}
              label={t.library.personN(i + 1)}
              icon={chosen.includes(i) ? Check : undefined}
              selected={chosen.includes(i)}
              onPress={() => toggle(i)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space[3] }]}>
        <View style={styles.action}>
          <Button
            label={t.library.chooseAnother}
            icon={ImagePlus}
            variant="secondary"
            onPress={onPickAnother}
            fullWidth
          />
        </View>
        <View style={styles.actionPrimary}>
          <Button
            label={t.library.pickUse}
            onPress={() => onConfirm(chosen)}
            disabled={!chosen.length}
            fullWidth
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: color.bg },
  header: { paddingBottom: space[3] },
  hint: { paddingHorizontal: size.gutter, marginTop: space[1] },
  muted: { color: color.muted },
  stage: { flex: 1, justifyContent: 'center' },
  card: {
    alignSelf: 'center',
    padding: CARD_PAD,
    borderRadius: radius.xl,
    backgroundColor: color.surface,
  },
  preview: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: color.surfaceAlt },
  badge: {
    position: 'absolute',
    width: BADGE,
    height: BADGE,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: color.surface,
    backgroundColor: 'rgba(16,33,63,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOn: { backgroundColor: color.accent },
  badgeText: { color: color.surface },
  chipsScroll: { flexGrow: 0 },
  chips: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: space[2],
    paddingHorizontal: size.edge,
    paddingTop: space[3],
  },
  footer: {
    flexDirection: 'row',
    gap: space[2],
    paddingHorizontal: size.edge,
    paddingTop: space[3],
  },
  action: { flex: 1 },
  actionPrimary: { flex: 1.4 },
});
