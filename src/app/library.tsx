import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { X } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
// Cuộn dọc dùng ScrollView của Gesture Handler: vuốt ngang chọn pose thắng cuộn, vuốt dọc thì cuộn.
import { ScrollView as GestureScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSegmenter } from '@/engine/segmentation/SegmenterProvider';
import { clearPlacement, useCameraStore } from '@/features/camera/cameraStore';
import {
  analyzeImage,
  type CreateProgress,
  type ImageAnalysis,
  peopleContours,
  PoseCreateError,
  savePose,
} from '@/features/pose/createFromImage';
import { MineGrid } from '@/features/pose/MineGrid';
import { PersonPicker } from '@/features/pose/PersonPicker';
import { PoseTile } from '@/features/pose/PoseTile';
import { deleteVariant, listUserPoses } from '@/features/pose/repository';
import { sampleGroups, sampleLibrary } from '@/features/pose/samples';
import { applyRange } from '@/features/pose/selection';
import type { Pose } from '@/features/pose/types';
import { haptic } from '@/lib/haptics';
import { useGoBack } from '@/lib/useGoBack';
import { Button, IconButton, Segmented } from '@/ui/components';
import { t } from '@/ui/strings';
import { color, processing, size, space, type } from '@/ui/tokens';

const tabs = [
  { key: 'samples', label: t.library.tabSamples },
  { key: 'mine', label: t.library.tabMine },
] as const;

type Picked = { uri: string; width: number; height: number };

const SAMPLE_W = 104;
const SAMPLE_H = 138;
const MINE_COLS = 4;
const MINE_GAP = space[2];

/**
 * Thư viện pose (design.md §6.3), mở dạng sheet trên Camera. Chạm một pose = "Dùng để chụp" (đặt
 * làm overlay rồi đóng sheet); giữ lâu = Sửa / Xóa. "Thêm ảnh từ máy" tạo pose mới rồi mở Chỉnh
 * pose (business-flow §5.1).
 */
export default function LibraryScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const [rootW, setRootW] = useState(0);
  const [tab, setTab] = useState<'samples' | 'mine'>('samples');
  const [mine, setMine] = useState<Pose[]>([]);
  const [progress, setProgress] = useState<CreateProgress | null>(null);
  /** Ảnh đang xử lý: hiện mờ thay cho danh sách (design.md §6.6). */
  const [work, setWork] = useState<Picked | null>(null);
  /** Ảnh có nhiều người: đang chờ chọn người. */
  const [picking, setPicking] = useState<ImageAnalysis | null>(null);
  const pickContours = useMemo(() => (picking ? peopleContours(picking) : []), [picking]);
  /** Chọn nhiều để xóa (góp ý Phase 3), chỉ ở "Pose của bạn". */
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const { segmentForPose } = useSegmenter();
  const goBack = useGoBack();

  useFocusEffect(
    useCallback(() => {
      listUserPoses(db).then(setMine);
    }, [db]),
  );

  const remove = async (ids: string[]) => {
    for (const id of ids) {
      await deleteVariant(db, id);
      clearPlacement(id);
      if (useCameraStore.getState().poseId === id) useCameraStore.getState().clearPose();
    }
    setMine((list) => list.filter((x) => !ids.includes(x.id)));
  };

  const confirmDelete = (p: Pose) =>
    Alert.alert(t.library.remove, t.library.removeConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.library.remove, style: 'destructive', onPress: () => remove([p.id]) },
    ]);

  const startSelecting = () => {
    setSelected(new Set());
    setSelecting(true);
  };
  const stopSelecting = () => {
    setSelecting(false);
    setSelected(new Set());
  };
  const toggle = (p: Pose) => {
    haptic.select();
    setSelected((s) => {
      const out = new Set(s);
      if (out.has(p.id)) out.delete(p.id);
      else out.add(p.id);
      return out;
    });
  };
  const selectRange = (a: number, b: number, select: boolean) => {
    haptic.select();
    const ids = mine.map((p) => p.id);
    setSelected((s) => applyRange(s, ids, a, b, select));
  };
  const confirmDeleteSelected = () => {
    const ids = mine.filter((p) => selected.has(p.id)).map((p) => p.id);
    if (!ids.length) return;
    Alert.alert(t.library.removeMany(ids.length), t.library.removeManyConfirm(ids.length), [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.library.remove,
        style: 'destructive',
        onPress: async () => {
          await remove(ids);
          stopSelecting();
        },
      },
    ]);
  };

  const changeTab = (k: 'samples' | 'mine') => {
    if (selecting) stopSelecting();
    setTab(k);
  };

  const pickForCamera = (p: Pose) => {
    useCameraStore.getState().selectPose(p.id);
    goBack();
  };

  const openEditor = (p: Pose) => router.push(`/editor/${p.id}`);

  // Giữ lâu: pose mẫu chỉ sửa được (thành bản sao, BR-09); pose của bạn có thêm Xóa.
  const showActions = (p: Pose, mineTile: boolean) =>
    Alert.alert(t.library.title, undefined, [
      { text: t.library.use, onPress: () => pickForCamera(p) },
      { text: mineTile ? t.library.edit : t.library.duplicate, onPress: () => openEditor(p) },
      ...(mineTile
        ? [
            {
              text: t.library.remove,
              style: 'destructive' as const,
              onPress: () => confirmDelete(p),
            },
          ]
        : []),
      { text: t.common.cancel, style: 'cancel' as const },
    ]);

  const addFromDevice = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    const a = res.canceled ? null : res.assets[0];
    if (!a) return;
    processImage({ uri: a.uri, width: a.width, height: a.height });
  };

  // Luồng tách người (business-flow §10.1). Lỗi nào cũng báo kèm việc làm tiếp (§10.3).
  const run = async (img: Picked, task: () => Promise<void>) => {
    try {
      await task();
    } catch (e) {
      setPicking(null);
      setWork(null);
      showError(e, img);
    } finally {
      setProgress(null);
    }
  };

  const processImage = (img: Picked) =>
    run(img, async () => {
      setWork(img);
      setProgress({ stage: 'segment' });
      const a = await analyzeImage(segmentForPose, img, setProgress);
      if (a.people.length > 1) {
        setPicking(a);
        return;
      }
      await finish(
        a,
        a.people.map((_, i) => i),
      );
    });

  const finish = async (a: ImageAnalysis, chosen: number[]) => {
    setPicking(null);
    setProgress({ stage: 'contour' });
    const pose = await savePose(
      db,
      a,
      chosen.map((i) => a.people[i]!),
      setProgress,
    );
    setWork(null);
    setTab('mine');
    router.push(`/editor/${pose.id}`);
  };

  const showError = (e: unknown, img: Picked) => {
    const kind = errorKind(e);
    const action =
      kind === 'noPerson' || kind === 'personTooSmall'
        ? { text: t.library.chooseAnother, onPress: addFromDevice }
        : {
            text: kind === 'downloadFailed' ? t.library.retryDownload : t.common.retry,
            onPress: () => processImage(img),
          };
    Alert.alert(t.errors.title, t.errors[kind], [
      { text: t.common.cancel, style: 'cancel' },
      action,
    ]);
  };

  // "Pose của bạn": 4 ảnh một hàng (góp ý lần 3).
  // Đo theo bề rộng thật của màn thư viện (modal có thể hẹp hơn cửa sổ trên iPad).
  const listW = rootW || screenW;
  const gridW = Math.floor((listW - size.gutter * 2 - MINE_GAP * (MINE_COLS - 1)) / MINE_COLS);

  return (
    <View style={styles.root} onLayout={(e) => setRootW(e.nativeEvent.layout.width)}>
      {/* iOS: modal là thẻ dưới thanh trạng thái nên không cần chừa vùng an toàn trên. */}
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === 'ios' ? space[4] : insets.top + space[2] },
        ]}
      >
        <Text
          accessibilityRole="header"
          style={[type.title, styles.ink, styles.title]}
          numberOfLines={1}
        >
          {selecting ? t.library.selectedCount(selected.size) : t.library.title}
        </Text>
        {selecting ? (
          <Button label={t.common.cancel} onPress={stopSelecting} variant="text" />
        ) : (
          <View style={styles.headerActions}>
            {tab === 'mine' && mine.length > 0 && !work && (
              <Button label={t.library.selectMode} onPress={startSelecting} variant="text" />
            )}
            <IconButton icon={X} label={t.common.close} onPress={goBack} />
          </View>
        )}
      </View>
      <View style={styles.tabs}>
        <Segmented options={tabs} value={tab} onChange={changeTab} />
        {selecting && (
          <Text style={[type.label, styles.muted, styles.selectHint]}>{t.library.selectHint}</Text>
        )}
      </View>

      {work ? (
        <Image
          source={{ uri: work.uri }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          style={styles.working}
        />
      ) : (
        <GestureScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space[5] }}>
          {tab === 'samples' &&
            sampleGroups.map((g) => (
              <View key={g} style={styles.group}>
                <Text style={[type.head, styles.ink, styles.groupTitle]}>
                  {t.library.groups[g]}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.rowContent}
                >
                  {sampleLibrary
                    .filter((p) => p.sampleGroup === g)
                    .map((p) => (
                      <PoseTile
                        key={p.id}
                        pose={p}
                        width={SAMPLE_W}
                        height={SAMPLE_H}
                        plain
                        onPress={() => pickForCamera(p)}
                        onLongPress={() => showActions(p, false)}
                      />
                    ))}
                </ScrollView>
              </View>
            ))}

          {tab === 'mine' &&
            (mine.length === 0 ? (
              <Text style={[type.body, styles.muted, styles.empty]}>{t.library.empty}</Text>
            ) : (
              <MineGrid
                poses={mine}
                layout={{
                  cols: MINE_COLS,
                  tileW: gridW,
                  tileH: gridW * 1.33,
                  gap: MINE_GAP,
                  padX: size.gutter,
                }}
                selecting={selecting}
                selected={selected}
                onPress={selecting ? toggle : pickForCamera}
                onLongPress={(p) => showActions(p, true)}
                onRange={selectRange}
              />
            ))}
        </GestureScrollView>
      )}

      {/* Nút ghim ở đáy; đang xử lý thì thay bằng dòng trạng thái (design.md §6.6). */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + space[3] }]}>
        {selecting ? (
          <Button
            label={t.library.removeMany(selected.size)}
            onPress={confirmDeleteSelected}
            variant="danger"
            disabled={selected.size === 0}
            fullWidth
          />
        ) : progress ? (
          <View style={styles.status} accessibilityLiveRegion="polite">
            <ActivityIndicator size="small" color={color.muted} />
            <Text style={[type.label, styles.muted]}>{progressText(progress)}</Text>
          </View>
        ) : (
          <Button label={t.library.addFromDevice} onPress={addFromDevice} fullWidth />
        )}
      </View>

      {picking && (
        <PersonPicker
          analysis={picking}
          contours={pickContours}
          onConfirm={(chosen) => {
            const img = work;
            if (img) run(img, () => finish(picking, chosen));
          }}
          onCancel={() => {
            setPicking(null);
            setWork(null);
          }}
        />
      )}
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

type ErrorKind = 'noPerson' | 'personTooSmall' | 'downloadFailed' | 'segmentFailed';

function errorKind(e: unknown): ErrorKind {
  if (e instanceof PoseCreateError) return e.code;
  const msg = e instanceof Error ? e.message : String(e);
  if (/tải|network|internet|offline|timed out|Hủy/i.test(msg)) return 'downloadFailed';
  return 'segmentFailed';
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: size.gutter,
    paddingRight: size.gutter - space[2],
    paddingBottom: space[2],
  },
  tabs: { paddingHorizontal: size.gutter, paddingBottom: space[4] },
  title: { flexShrink: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  selectHint: { marginTop: space[2] },
  ink: { color: color.ink },
  muted: { color: color.muted },
  group: { marginBottom: space[5] },
  groupTitle: { paddingHorizontal: size.gutter, marginBottom: space[3] },
  rowContent: { paddingHorizontal: size.gutter, gap: space[3] },
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
  working: { flex: 1, opacity: processing.imageOpacity, marginHorizontal: size.gutter },
  empty: { paddingHorizontal: size.gutter },
});
