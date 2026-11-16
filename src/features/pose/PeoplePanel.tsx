import { Check } from 'lucide-react-native';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/ui/components/PressableScale';
import type { ImageSource } from './types';
import { t } from '@/ui/strings';
import { color, personPick as P, radius, space, type } from '@/ui/tokens';

type Box = [number, number, number, number];

type Props = {
  /** Ảnh gốc của pose (pose mẫu là ảnh đóng gói, require()). */
  source: ImageSource;
  imageWidth: number;
  imageHeight: number;
  /** Khung từng người, chuẩn hóa 0..1 theo ảnh: [x0, y0, x1, y1]. */
  boxes: Box[];
  present: boolean[];
  onToggle: (k: number) => void;
};

/**
 * Panel tab Người (góp ý Phase 4 vòng 4): mỗi người một ô ảnh cắt sát người đó, chạm để giữ hoặc
 * bỏ, cùng việc với chạm lên preview. Ô đang giữ viền màu nhấn và dấu tích; ô bị bỏ mờ đi.
 */
export function PeoplePanel({ source, imageWidth, imageHeight, boxes, present, onToggle }: Props) {
  const kept = present.filter(Boolean).length;
  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <Text style={[type.label, styles.ink]}>{t.editor.peopleTitle}</Text>
        <Text style={[type.num, styles.muted]}>{t.editor.peopleKept(kept, boxes.length)}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {boxes.map((b, k) => (
          <PersonTile
            key={k}
            index={k}
            box={b}
            on={!!present[k]}
            source={source}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            onPress={() => onToggle(k)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function PersonTile({
  index,
  box,
  on,
  source,
  imageWidth,
  imageHeight,
  onPress,
}: {
  index: number;
  box: Box;
  on: boolean;
  source: ImageSource;
  imageWidth: number;
  imageHeight: number;
  onPress: () => void;
}) {
  // Khung người trong ảnh (px ảnh), nới thêm một chút cho thoáng.
  const bw = (box[2] - box[0]) * imageWidth;
  const bh = (box[3] - box[1]) * imageHeight;
  const pad = Math.max(bw, bh) * P.tilePad;
  const cw = bw + pad * 2;
  const ch = bh + pad * 2;
  const inner = P.tileH - P.tileBorder * 2;
  const w = Math.min(P.tileMaxW, Math.max(P.tileMinW, (cw / ch) * P.tileH));
  const innerW = w - P.tileBorder * 2;
  // Ảnh phủ kín ô, tâm là tâm người.
  const k = Math.max(innerW / cw, inner / ch);
  const cx = ((box[0] + box[2]) / 2) * imageWidth;
  const cy = ((box[1] + box[3]) / 2) * imageHeight;
  const left = innerW / 2 - cx * k;
  const top = inner / 2 - cy * k;

  return (
    <PressableScale
      accessibilityRole="checkbox"
      accessibilityLabel={t.library.personN(index + 1)}
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={[styles.tile, { width: w }, on && styles.tileOn]}
    >
      <View style={[styles.crop, !on && styles.off]}>
        <Image
          source={typeof source === 'number' ? source : { uri: source }}
          style={{
            position: 'absolute',
            left,
            top,
            width: imageWidth * k,
            height: imageHeight * k,
          }}
        />
      </View>
      {on && (
        <View style={styles.check}>
          <Check size={14} strokeWidth={3} color={color.accentInk} />
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: space[3] },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ink: { color: color.ink },
  muted: { color: color.muted },
  row: { gap: space[2] },
  tile: {
    height: P.tileH,
    borderRadius: radius.lg,
    borderWidth: P.tileBorder,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  tileOn: { borderColor: color.accent },
  crop: { flex: 1, borderRadius: radius.md, overflow: 'hidden', backgroundColor: color.surfaceAlt },
  off: { opacity: P.tileOffOpacity },
  check: {
    position: 'absolute',
    top: space[1],
    right: space[1],
    width: P.check,
    height: P.check,
    borderRadius: radius.full,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
