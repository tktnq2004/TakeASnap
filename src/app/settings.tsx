import Constants from 'expo-constants';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronRight } from 'lucide-react-native';
import { type ReactNode, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { deletePack, packDiskBytes } from '@/engine/models/modelStore';
import { POSE_PACK, TECHNIQUE_PACK } from '@/engine/models/packs';
import { useSettings } from '@/features/settings/settingsStore';
import { useGoBack } from '@/lib/useGoBack';
import { Button, CloseButton, OverlayHeader, Segmented, Toggle } from '@/ui/components';
import { t } from '@/ui/strings';
import { color, radius, size, space, type } from '@/ui/tokens';

const mirrorOptions = [
  { key: 'real', label: t.settings.saveReal },
  { key: 'mirror', label: t.settings.saveMirror },
] as const;

const mb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1048576))} MB`;

/**
 * Cài đặt (business-flow §7.4, design.md §6.11), mở đè lên Camera bằng nút bánh răng. Ba nhóm:
 * Chụp, Dung lượng, Giới thiệu; nhóm Nhà phát triển (màn thử nghiệm) chỉ có trong bản dev.
 */
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const goBack = useGoBack();
  const frontMirror = useSettings((s) => s.frontMirror);
  const haptics = useSettings((s) => s.haptics);
  const autoScene = useSettings((s) => s.autoScene);
  const store = useSettings.getState;
  const [poseBytes, setPoseBytes] = useState(() => packDiskBytes(POSE_PACK));
  const [sceneBytes, setSceneBytes] = useState(() => packDiskBytes(TECHNIQUE_PACK));
  const top = Platform.OS === 'ios' ? space[5] : insets.top + space[3];

  const removePosePack = () =>
    Alert.alert(t.settings.deletePack, t.settings.deletePackConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.settings.deletePack,
        style: 'destructive',
        onPress: () => {
          deletePack(POSE_PACK);
          setPoseBytes(packDiskBytes(POSE_PACK));
        },
      },
    ]);

  const removeScenePack = () =>
    Alert.alert(t.settings.deleteScenePack, t.settings.deleteScenePackConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.settings.deleteScenePack,
        style: 'destructive',
        onPress: () => {
          deletePack(TECHNIQUE_PACK);
          setSceneBytes(packDiskBytes(TECHNIQUE_PACK));
        },
      },
    ]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ paddingTop: top, paddingBottom: insets.bottom + space[6] }}
      >
        <OverlayHeader title={t.settings.title} right={<CloseButton onPress={goBack} />} />

        <Group title={t.settings.groupCapture}>
          <View style={styles.stack}>
            <Text style={[type.label, styles.ink]}>{t.settings.frontCamera}</Text>
            <Segmented
              tone="card"
              options={mirrorOptions}
              value={frontMirror ? 'mirror' : 'real'}
              onChange={(k) => store().setFrontMirror(k === 'mirror')}
            />
          </View>
          <Line />
          <Row label={t.settings.haptics}>
            <Toggle value={haptics} onChange={store().setHaptics} label={t.settings.haptics} />
          </Row>
        </Group>

        <Group title={t.settings.groupComposition}>
          <Row label={t.settings.autoScene} detail={t.settings.autoSceneHint}>
            <Toggle
              value={autoScene}
              onChange={store().setAutoScene}
              label={t.settings.autoScene}
            />
          </Row>
        </Group>

        <Group title={t.settings.groupStorage}>
          <Row
            label={t.settings.posePack}
            detail={poseBytes > 0 ? mb(poseBytes) : t.settings.notDownloaded}
          >
            {poseBytes > 0 && (
              <Button
                label={t.settings.deletePack}
                variant="dangerText"
                small
                onPress={removePosePack}
              />
            )}
          </Row>
          <Line />
          <Row
            label={t.settings.scenePack}
            detail={sceneBytes > 0 ? mb(sceneBytes) : t.settings.notDownloaded}
          >
            {sceneBytes > 0 && (
              <Button
                label={t.settings.deleteScenePack}
                variant="dangerText"
                small
                onPress={removeScenePack}
              />
            )}
          </Row>
        </Group>

        <Group title={t.settings.groupAbout}>
          <Row label={t.settings.version}>
            <Text style={[type.hint, styles.muted]}>
              {Constants.expoConfig?.version ?? '1.0.0'}
            </Text>
          </Row>
          <Line />
          <LinkRow
            label={t.settings.sampleSource}
            onPress={() => Alert.alert(t.settings.sampleSource, t.settings.sampleSourceBody)}
          />
          <Line />
          <LinkRow
            label={t.settings.modelLicense}
            onPress={() => Alert.alert(t.settings.modelLicense, t.settings.modelLicenseBody)}
          />
        </Group>

        {__DEV__ && (
          <Group title={t.settings.groupDev}>
            <LinkRow label={t.settings.spike} onPress={() => router.push('/spike')} />
          </Group>
        )}
      </ScrollView>
    </View>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View>
      <Text style={[type.caption, styles.groupTitle]} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.group}>{children}</View>
    </View>
  );
}

function Row({
  label,
  detail,
  children,
}: {
  label: string;
  detail?: string;
  children?: ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={[type.label, styles.ink]}>{label}</Text>
        {detail && <Text style={[type.hint, styles.muted]}>{detail}</Text>}
      </View>
      {children}
    </View>
  );
}

function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Text style={[type.label, styles.ink]}>{label}</Text>
      <ChevronRight size={size.iconSmall} strokeWidth={2.25} color={color.faint} />
    </Pressable>
  );
}

const Line = () => <View style={styles.line} />;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  ink: { color: color.ink },
  muted: { color: color.muted },
  groupTitle: {
    color: color.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: space[6],
    marginBottom: space[2],
    marginHorizontal: size.gutter,
  },
  group: {
    marginHorizontal: size.edge,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: color.surface,
  },
  row: {
    minHeight: 56,
    paddingHorizontal: space[4],
    paddingVertical: space[2],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
  },
  rowText: { flexShrink: 1, gap: 2 },
  stack: { padding: space[4], gap: space[3] },
  pressed: { backgroundColor: color.surfaceAlt },
  line: { height: 1, marginLeft: space[4], backgroundColor: color.line },
});
