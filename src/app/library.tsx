import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ChevronLeft } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSegmenter } from '@/engine/segmentation/SegmenterProvider';
import {
  type CreateProgress,
  createPoseFromImage,
  PoseCreateError,
} from '@/features/pose/createFromImage';
import { PoseCanvas } from '@/features/pose/PoseCanvas';
import { deleteVariant, listUserPoses } from '@/features/pose/repository';
import { sampleGroups, sampleLibrary } from '@/features/pose/samples';
import type { Pose } from '@/features/pose/types';
import { Button, IconButton, Segmented } from '@/ui/components';
import { t } from '@/ui/strings';
import { color, radius, size, space, type } from '@/ui/tokens';

const tabs = [
  { key: 'samples', label: t.library.tabSamples },
  { key: 'mine', label: t.library.tabMine },
] as const;

const SAMPLE_W = 104;
const SAMPLE_H = 138;
const MINE_COLS = 4;
const MINE_GAP = space[2];

/**
 * Thư viện pose (design.md §6.3). Phase 1: chạm một pose để mở Chỉnh pose; "Thêm ảnh từ máy" tạo
 * pose mới (business-flow §5.1). Phase 2 đổi chạm thành "Dùng để chụp" và mở màn này dạng sheet
 * trên Camera.
 */
export default function LibraryScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const [tab, setTab] = useState<'samples' | 'mine'>('samples');
  const [mine, setMine] = useState<Pose[]>([]);
  const [progress, setProgress] = useState<CreateProgress | null>(null);
  const { segmentForPose } = useSegmenter();

  useFocusEffect(
    useCallback(() => {
      listUserPoses(db).then(setMine);
    }, [db]),
  );

  const confirmDelete = (p: Pose) =>
    Alert.alert(t.library.remove, t.library.removeConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.library.remove,
        style: 'destructive',
        onPress: async () => {
          await deleteVariant(db, p.id);
          setMine((list) => list.filter((x) => x.id !== p.id));
        },
      },
    ]);

  const addFromDevice = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    const a = res.canceled ? null : res.assets[0];
    if (!a) return;
    setProgress({ stage: 'segment' });
    try {
      const pose = await createPoseFromImage(
        db,
        segmentForPose,
        { uri: a.uri, width: a.width, height: a.height },
        setProgress,
      );
      setTab('mine');
      router.push(`/editor/${pose.id}`);
    } catch (e) {
      Alert.alert(t.errors.title, errorMessage(e));
    } finally {
      setProgress(null);
    }
  };

  // "Pose của bạn": 4 ảnh một hàng (góp ý lần 3).
  const gridW = (screenW - size.gutter * 2 - MINE_GAP * (MINE_COLS - 1)) / MINE_COLS;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <IconButton icon={ChevronLeft} label={t.common.back} onPress={() => router.back()} />
        <Text accessibilityRole="header" style={[type.title, styles.ink]}>
          {t.library.title}
        </Text>
      </View>
      <View style={styles.tabs}>
        <Segmented options={tabs} value={tab} onChange={setTab} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space[5] }}>
        {tab === 'samples' &&
          sampleGroups.map((g) => (
            <View key={g} style={styles.group}>
              <Text style={[type.head, styles.ink, styles.groupTitle]}>{t.library.groups[g]}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rowContent}
              >
                {sampleLibrary
                  .filter((p) => p.sampleGroup === g)
                  .map((p) => (
                    <PoseTile key={p.id} pose={p} width={SAMPLE_W} height={SAMPLE_H} plain />
                  ))}
              </ScrollView>
            </View>
          ))}

        {tab === 'mine' &&
          (mine.length === 0 ? (
            <Text style={[type.body, styles.muted, styles.empty]}>{t.library.empty}</Text>
          ) : (
            <View style={styles.grid}>
              {mine.map((p) => (
                <PoseTile
                  key={p.id}
                  pose={p}
                  width={gridW}
                  height={gridW * 1.33}
                  onLongPress={() => confirmDelete(p)}
                />
              ))}
            </View>
          ))}
      </ScrollView>

      {/* Nút ghim ở đáy; đang xử lý thì thay bằng dòng trạng thái (design.md §6.6). */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + space[3] }]}>
        {progress ? (
          <View style={styles.status} accessibilityLiveRegion="polite">
            <ActivityIndicator size="small" color={color.muted} />
            <Text style={[type.label, styles.muted]}>{progressText(progress)}</Text>
          </View>
        ) : (
          <Button label={t.library.addFromDevice} onPress={addFromDevice} fullWidth />
        )}
      </View>
    </View>
  );
}

function progressText(p: CreateProgress): string {
  switch (p.stage) {
    case 'download':
      return `${t.status.downloadingModel}, ${mb(p.bytes)} trên ${mb(p.total)} MB`;
    case 'load':
      return t.status.loadingModel;
    case 'segment':
      return t.status.segmenting;
    case 'landmarks':
      return t.status.detectingFace;
    case 'contour':
      return t.status.contouring;
    case 'save':
      return t.status.savingPose;
  }
}

const mb = (bytes: number) => (bytes / 1048576).toFixed(1);

function errorMessage(e: unknown): string {
  if (e instanceof PoseCreateError) return t.errors[e.code];
  const msg = e instanceof Error ? e.message : String(e);
  if (/tải|network|internet|offline|timed out|Hủy/i.test(msg)) return t.errors.downloadFailed;
  return t.errors.segmentFailed;
}

/**
 * Ô pose: luôn là ẢNH GỐC đầy đủ màu (người + nền), vì người dùng chọn pose nhờ nhìn cả người
 * mẫu lẫn bối cảnh (góp ý Phase 1).
 * - `plain` (Pose mẫu): chỉ thêm viền trắng mảnh.
 * - Pose của bạn: phủ style của chính bản đó lên ảnh gốc (thu nhỏ độ dày cho vừa ô), để các bản
 *   từ cùng một ảnh vẫn phân biệt được.
 */
function PoseTile({
  pose,
  width,
  height,
  plain,
  onLongPress,
}: {
  pose: Pose;
  width: number;
  height: number;
  plain?: boolean;
  onLongPress?: () => void;
}) {
  const s = pose.style;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t.library.edit} ${pose.sampleId ?? pose.id}`}
      onPress={() => router.push(`/editor/${pose.id}`)}
      onLongPress={onLongPress}
      style={[styles.tile, { width, height }]}
    >
      <PoseCanvas
        fit="cover"
        source={pose.source}
        imageWidth={pose.width}
        imageHeight={pose.height}
        contours={pose.contours}
        landmarks={pose.landmarks}
        width={width}
        height={height}
        subjectOpacity={1}
        backgroundOpacity={1}
        outlineEnabled={plain ? true : s.outlineEnabled}
        outlineColor={plain ? '#ffffff' : s.outlineColor}
        outlineWidth={plain ? 1.5 : Math.min(s.outlineWidth, 2)}
        fillEnabled={plain ? false : s.fillEnabled}
        fillColor={s.fillColor}
        fillOpacity={s.fillOpacity}
        faceEnabled={plain ? false : s.faceEnabled}
        faceColor={s.faceColor}
        faceWidth={Math.min(s.faceWidth, 1)}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingHorizontal: space[2],
    paddingVertical: space[2],
  },
  tabs: { paddingHorizontal: size.gutter, paddingBottom: space[4] },
  ink: { color: color.ink },
  muted: { color: color.muted },
  group: { marginBottom: space[5] },
  groupTitle: { paddingHorizontal: size.gutter, marginBottom: space[3] },
  rowContent: { paddingHorizontal: size.gutter, gap: space[3] },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: MINE_GAP,
    paddingHorizontal: size.gutter,
  },
  footer: {
    paddingHorizontal: size.gutter,
    paddingTop: space[3],
    borderTopWidth: 1,
    borderTopColor: color.line,
    backgroundColor: color.bg,
  },
  status: {
    minHeight: size.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
  },
  tile: { borderRadius: radius.md, overflow: 'hidden', backgroundColor: color.surface },
  empty: { paddingHorizontal: size.gutter },
});
