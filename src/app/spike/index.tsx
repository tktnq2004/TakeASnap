import { type Href, Link } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/ui/components';
import { t } from '@/ui/strings';
import { color, radius, size, space, type } from '@/ui/tokens';

/**
 * Màn thử nghiệm: danh sách spike để đo trên máy thật. Từ Phase 2 mở bằng nút cài đặt trên
 * Camera.
 */
const spikes: { href: Href; title: string }[] = [
  { href: '/spike/camera', title: t.spike.cameraTitle },
  { href: '/spike/segment', title: t.spike.segmentTitle },
  { href: '/spike/overlay', title: t.spike.overlayTitle },
  { href: '/spike/save', title: t.spike.saveTitle },
];

export default function SpikeMenu() {
  return (
    <Screen title={t.spike.title}>
      <Text style={[type.body, styles.intro]}>{t.spike.intro}</Text>
      <View style={styles.list}>
        {spikes.map((s) => (
          <Link key={s.title} href={s.href} asChild>
            <Pressable accessibilityRole="link" style={styles.row}>
              <Text style={[type.body, styles.rowText]}>{s.title}</Text>
              <ChevronRight size={size.iconSmall} color={color.muted} strokeWidth={1.75} />
            </Pressable>
          </Link>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { color: color.muted },
  list: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.line,
    overflow: 'hidden',
  },
  row: {
    minHeight: 56,
    paddingHorizontal: space[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: color.line,
    backgroundColor: color.surface,
  },
  rowText: { color: color.ink },
  disabled: { color: color.muted },
});
