import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/ui/components';
import { t } from '@/ui/strings';
import { color, radius, size, space, type } from '@/ui/tokens';

import { LessonDiagram } from './LessonDiagram';
import { LESSONS, type LessonId } from './lessons';

/**
 * Tab "Bố cục" của Thư viện (design.md §6.15, thẻ học A): lưới 2 cột, mỗi ô một kỹ thuật với
 * hình minh họa nhỏ, tên và nhãn "Có trên Camera" / "Chỉ đọc".
 */
export function LearnGrid({ width, onOpen }: { width: number; onOpen: (id: LessonId) => void }) {
  const cellW = (width - size.edge * 2 - CARD_GAP) / 2;
  return (
    <View style={styles.grid}>
      {LESSONS.map((l) => {
        const item = t.lessons.items[l.id];
        return (
          <PressableScale
            key={l.id}
            accessibilityRole="button"
            accessibilityLabel={t.lessons.open(item.name)}
            onPress={() => onOpen(l.id)}
            style={[styles.card, { width: cellW }]}
          >
            <View style={styles.thumb}>
              <LessonDiagram scene={l.right} ok width={THUMB_W} />
            </View>
            <View style={styles.text}>
              <Text style={[type.label, styles.ink]} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={[styles.tag, l.onCamera ? styles.accent : styles.muted]}>
                {l.onCamera ? t.lessons.onCamera : t.lessons.readOnly}
              </Text>
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

const CARD_GAP = 10;
const THUMB_W = 42;

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    paddingHorizontal: size.edge,
  },
  card: {
    minHeight: 128,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
    justifyContent: 'space-between',
    gap: space[3],
  },
  thumb: { borderRadius: 8, overflow: 'hidden', alignSelf: 'flex-start' },
  text: { gap: 4 },
  tag: { ...type.caption },
  ink: { color: color.ink },
  accent: { color: color.accent },
  muted: { color: color.muted },
});
