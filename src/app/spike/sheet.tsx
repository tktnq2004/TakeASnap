import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Segmented, Slider } from '@/ui/components';
import { t } from '@/ui/strings';
import { color, size, space, type } from '@/ui/tokens';

/**
 * Spike D: formSheet của expo-router (sẽ dùng cho Thư viện pose). Kiểm tra trên Android:
 * sheet có hiện đúng 88% chiều cao, có tay kéo, kéo xuống để đóng, và slider bên trong
 * không bị cử chỉ kéo sheet giành mất.
 */
export default function SheetSpike() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'samples' | 'mine'>('samples');
  const v = useSharedValue(0.5);

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + space[4] }]}>
      <Text accessibilityRole="header" style={[type.title, { color: color.ink }]}>
        {t.library.title}
      </Text>
      <Segmented
        options={[
          { key: 'samples', label: t.library.tabSamples },
          { key: 'mine', label: t.library.tabMine },
        ]}
        value={tab}
        onChange={setTab}
      />
      <Slider
        label={t.editor.visibility}
        value={v}
        min={0}
        max={1}
        format={(x) => {
          'worklet';
          return `${Math.round(x * 100)}%`;
        }}
      />
      <View style={styles.spacer} />
      <Button label={t.common.close} variant="secondary" onPress={() => router.back()} fullWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: space[6],
    paddingHorizontal: size.gutter,
    gap: space[5],
    backgroundColor: color.surface,
  },
  spacer: { flex: 1 },
});
