import { Asset as BundledAsset } from 'expo-asset';
import Constants from 'expo-constants';
import { Album, Asset as LibraryAsset, requestPermissionsAsync } from 'expo-media-library';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { haptic, hapticsAvailable } from '@/lib/haptics';
import { Button, Screen } from '@/ui/components';
import { t } from '@/ui/strings';
import { color, radius, space, type } from '@/ui/tokens';

const ALBUM = 'TakeASnap';

/**
 * Spike D (roadmap §4, Phase 0): những thứ Expo Go có thể chặn.
 * 1. Lưu ảnh vào album riêng "TakeASnap" (Android trong Expo Go có thể bị giới hạn quyền).
 * 2. expo-haptics có trong Expo Go không.
 * 3. formSheet của expo-router trên Android.
 */
export default function SaveSpike() {
  const [log, setLog] = useState<string[]>([]);
  const push = (line: string) => setLog((l) => [...l, line]);

  const runSave = async () => {
    setLog([]);
    try {
      const perm = await requestPermissionsAsync();
      push(
        `quyền: ${perm.status}${'accessPrivileges' in perm ? ` (${String(perm.accessPrivileges)})` : ''}`,
      );
      if (perm.status !== 'granted') return;

      const [bundled] = await BundledAsset.loadAsync(
        require('../../../assets/poses/source/travel/travel1.jpg'),
      );
      const uri = bundled?.localUri;
      push(`ảnh mẫu: ${uri ? 'đã có file cục bộ' : 'không có localUri'}`);
      if (!uri) return;

      const existing = await Album.get(ALBUM);
      push(`album có sẵn: ${existing ? 'có' : 'chưa'}`);
      if (existing) {
        await LibraryAsset.create(uri, existing);
        push('đã lưu vào album có sẵn');
      } else {
        const asset = await LibraryAsset.create(uri);
        push('đã lưu vào thư viện');
        await Album.create(ALBUM, [asset]);
        push(`đã tạo album ${ALBUM}`);
      }
      haptic.saved();
      push('KẾT QUẢ: đạt');
    } catch (e) {
      push(`LỖI: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <Screen title={t.spike.saveTitle}>
      <View style={styles.facts}>
        <Fact k="Nền tảng" v={`${Platform.OS} ${String(Platform.Version)}`} />
        <Fact k="Môi trường" v={String(Constants.executionEnvironment)} />
        <Fact k="expo-haptics" v={hapticsAvailable ? 'có' : 'không có'} />
      </View>

      <Button label={t.spike.runSave} onPress={runSave} fullWidth />
      <View style={styles.log}>
        {log.map((l, i) => (
          <Text key={i} style={[type.num, styles.logLine]}>
            {l}
          </Text>
        ))}
      </View>

      <Button label={t.spike.runHaptics} variant="secondary" onPress={haptic.capture} fullWidth />
      <Button
        label={t.spike.openSheet}
        variant="secondary"
        onPress={() => router.push('/spike/sheet')}
        fullWidth
      />
      <Button label={t.common.back} variant="text" onPress={() => router.back()} />
    </Screen>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.fact}>
      <Text style={[type.label, { color: color.muted }]}>{k}</Text>
      <Text style={[type.num, { color: color.ink }]}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  facts: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.line,
    padding: space[4],
    gap: space[2],
  },
  fact: { flexDirection: 'row', justifyContent: 'space-between' },
  log: { gap: space[1], minHeight: 96 },
  logLine: { color: color.ink },
});
