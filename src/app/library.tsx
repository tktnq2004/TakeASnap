import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Check, ImagePlus } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  type HostInstance,
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
import { PoseMenu } from '@/features/pose/PoseMenu';
import { PoseTile, type TileRect } from '@/features/pose/PoseTile';
import { deleteVariant, listUserPoses } from '@/features/pose/repository';
import { sampleGroups, sampleLibrary } from '@/features/pose/samples';
import { applyRange } from '@/features/pose/selection';
import type { Pose } from '@/features/pose/types';
import { haptic } from '@/lib/haptics';
import { useGoBack } from '@/lib/useGoBack';
import { Button, CloseButton, OverlayHeader, Segmented } from '@/ui/components';
import { t } from '@/ui/strings';
import { color, elevation, library, processing, radius, size, space, type } from '@/ui/tokens';

const tabs = [
  { key: 'samples', label: t.library.tabSamples },
  { key: 'mine', label: t.library.tabMine },
] as const;

type Picked = { uri: string; width: number; height: number };

/**
 * Thư viện pose (design.md §6.5–6.8), mở dạng modal trên Camera. Chạm một pose = "Dùng để chụp" (đặt
 * làm overlay rồi đóng sheet); giữ lâu = Sửa / Xóa. "Thêm ảnh từ máy" tạo pose mới rồi mở Chỉnh
 * pose (business-flow §5.1).
 */
export default function LibraryScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const rootRef = useRef<HostInstance>(null);
  const [rootW, setRootW] = useState(0);
  const [rootH, setRootH] = useState(0);
  const [menu, setMenu] = useState<{ pose: Pose; mine: boolean; from: TileRect } | null>(null);
  const [tab, setTab] = useState<'samples' | 'mine'>('samples');
  const [mine, setMine] = useState<Pose[]>([]);
  const [progress, setProgress] = useState<CreateProgress | null>(null);
  /** Lần xử lý này có phải tải bộ tách người không (để hiện bước tải trong danh sách bước). */
  const [downloaded, setDownloaded] = useState(false);
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
  const selectAll = () => {
    haptic.select();
    setSelected(new Set(mine.map((p) => p.id)));
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

  // Giữ lâu: menu pose cạnh ô (design.md §6.7). Pose mẫu chỉ sửa được thành bản sao (BR-09);
  // pose của bạn có thêm Xóa. Vị trí ô đo trong cửa sổ, đổi sang khung của màn này (modal iOS
  // không bắt đầu ở mép trên cửa sổ).
  const showActions = (p: Pose, mine: boolean, r: TileRect) =>
    rootRef.current?.measureInWindow((ox, oy) =>
      setMenu({ pose: p, mine, from: { ...r, x: r.x - ox, y: r.y - oy } }),
    );

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

  const track = (p: CreateProgress) => {
    if (p.stage === 'download') setDownloaded(true);
    setProgress(p);
  };

  const processImage = (img: Picked) =>
    run(img, async () => {
      setWork(img);
      setDownloaded(false);
      setProgress({ stage: 'segment' });
      const a = await analyzeImage(segmentForPose, img, track);
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
      track,
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
  const gridW = Math.floor(
    (listW - size.edge * 2 - library.mineGap * (library.mineCols - 1)) / library.mineCols,
  );

  // iOS: modal là thẻ dưới thanh trạng thái nên không cần chừa vùng an toàn trên.
  const top = Platform.OS === 'ios' ? space[5] : insets.top + space[3];
  const canSelect = tab === 'mine' && mine.length > 0 && !work;

  return (
    <View
      ref={rootRef}
      style={styles.root}
      onLayout={(e) => {
        setRootW(e.nativeEvent.layout.width);
        setRootH(e.nativeEvent.layout.height);
      }}
    >
      {/* iOS: thẻ modal nằm trên Camera tối, thanh trạng thái vẫn chữ sáng. */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
      <View style={{ paddingTop: top }}>
        <OverlayHeader
          title={selecting ? t.library.selectedCount(selected.size) : t.library.title}
          right={
            selecting ? (
              <Button label={t.common.cancel} onPress={stopSelecting} variant="secondary" small />
            ) : (
              <>
                {canSelect && (
                  <Button
                    label={t.library.selectMode}
                    onPress={startSelecting}
                    variant="secondary"
                    small
                  />
                )}
                <CloseButton onPress={goBack} />
              </>
            )
          }
        />
      </View>
      <View style={styles.tabs}>
        <Segmented options={tabs} value={tab} onChange={changeTab} />
      </View>

      {work ? (
        <View style={styles.working}>
          <Image
            source={{ uri: work.uri }}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
            style={styles.workingImage}
          />
          {progress && <StatusSteps progress={progress} downloaded={downloaded} />}
        </View>
      ) : (
        <GestureScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + library.listBottom }}
        >
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
                        width={library.sampleW}
                        height={library.sampleH}
                        corner={library.sampleRadius}
                        plain
                        onPress={() => pickForCamera(p)}
                        onLongPress={(r) => showActions(p, false, r)}
                      />
                    ))}
                </ScrollView>
              </View>
            ))}

          {tab === 'mine' &&
            (mine.length === 0 ? (
              <Text style={[type.body, styles.ink, styles.empty]}>{t.library.empty}</Text>
            ) : (
              <MineGrid
                poses={mine}
                layout={{
                  cols: library.mineCols,
                  tileW: gridW,
                  tileH: gridW * 1.33,
                  gap: library.mineGap,
                  padX: size.edge,
                }}
                selecting={selecting}
                selected={selected}
                onPress={selecting ? toggle : pickForCamera}
                onLongPress={(p, r) => showActions(p, true, r)}
                onRange={selectRange}
              />
            ))}
        </GestureScrollView>
      )}

      {/* Đáy: nút nổi "Thêm ảnh từ máy"; chọn nhiều thì thanh nổi Chọn tất cả · Xóa n pose. */}
      {selecting ? (
        <View style={[styles.floatingBar, { bottom: insets.bottom + space[4] }]}>
          <View style={styles.barAction}>
            <Button label={t.library.selectAll} onPress={selectAll} variant="soft" fullWidth />
          </View>
          <View style={styles.barPrimary}>
            <Button
              label={t.library.removeMany(selected.size)}
              onPress={confirmDeleteSelected}
              variant="danger"
              disabled={selected.size === 0}
              fullWidth
            />
          </View>
        </View>
      ) : (
        !work && (
          <View style={[styles.fab, { bottom: insets.bottom + space[5] }]} pointerEvents="box-none">
            <Button label={t.library.addFromDevice} onPress={addFromDevice} icon={ImagePlus} />
          </View>
        )
      )}

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

      {menu && (
        <PoseMenu
          pose={menu.pose}
          mine={menu.mine}
          from={menu.from}
          area={{ width: rootW, height: rootH }}
          insets={{ top: Platform.OS === 'ios' ? space[2] : insets.top, bottom: insets.bottom }}
          onUse={() => pickForCamera(menu.pose)}
          onEdit={() => openEditor(menu.pose)}
          onDelete={() => confirmDelete(menu.pose)}
          onClose={() => setMenu(null)}
        />
      )}
    </View>
  );
}

/** Các bước đang xử lý (design.md §6.8): xong = dấu tích, đang chạy = vòng quay, chưa tới = vòng xám. */
const STEPS = [
  { key: 'download', stages: ['download', 'load'] },
  { key: 'segment', stages: ['segment'] },
  { key: 'landmarks', stages: ['landmarks'] },
  { key: 'contour', stages: ['contour', 'save'] },
] as const;

function StatusSteps({ progress, downloaded }: { progress: CreateProgress; downloaded: boolean }) {
  const steps = STEPS.filter((s) => s.key !== 'download' || downloaded);
  const now = steps.findIndex((s) => (s.stages as readonly string[]).includes(progress.stage));
  return (
    <View style={styles.steps} accessibilityLiveRegion="polite">
      {steps.map((s, i) => {
        const state = now < 0 || i > now ? 'todo' : i < now ? 'done' : 'now';
        const label =
          state === 'now' && progress.stage === 'download'
            ? `${t.status.steps.download}, ${mb(progress.bytes)} trên ${mb(progress.total)} MB`
            : t.status.steps[s.key];
        return (
          <View key={s.key} style={styles.step}>
            {state === 'done' ? (
              <View style={styles.stepDone}>
                <Check size={14} strokeWidth={3} color={color.accentInk} />
              </View>
            ) : state === 'now' ? (
              <ActivityIndicator size="small" color={color.accent} style={styles.stepIcon} />
            ) : (
              <View style={styles.stepTodo} />
            )}
            <Text
              style={[
                type.label,
                {
                  color:
                    state === 'todo' ? color.faint : state === 'done' ? color.muted : color.ink,
                },
              ]}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const mb = (bytes: number) => (bytes / 1048576).toFixed(1);

type ErrorKind = 'noPerson' | 'personTooSmall' | 'downloadFailed' | 'segmentFailed';

function errorKind(e: unknown): ErrorKind {
  if (e instanceof PoseCreateError) return e.code;
  const msg = e instanceof Error ? e.message : String(e);
  if (/tải|network|internet|offline|timed out|Hủy/i.test(msg)) return 'downloadFailed';
  return 'segmentFailed';
}

const STEP_DOT = 26;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  tabs: { paddingHorizontal: size.edge, paddingTop: space[4], paddingBottom: space[4] },
  ink: { color: color.ink },
  // Thẻ nhóm pose mẫu: hàng ảnh tràn mép phải thẻ.
  group: {
    marginHorizontal: size.edge,
    marginBottom: space[3],
    paddingVertical: space[4],
    borderRadius: radius.xl,
    backgroundColor: color.surface,
  },
  groupTitle: { paddingHorizontal: space[4], marginBottom: space[3] },
  rowContent: { paddingHorizontal: space[4], gap: 10 },
  empty: { paddingHorizontal: size.gutter, paddingTop: space[2] },
  fab: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  floatingBar: {
    position: 'absolute',
    left: size.edge,
    right: size.edge,
    flexDirection: 'row',
    gap: space[2],
    padding: space[2],
    borderRadius: radius.xxl + 4,
    backgroundColor: color.surface,
    ...elevation.float,
    shadowColor: color.shadow,
  },
  barAction: { flex: 1 },
  barPrimary: { flex: 1.3 },
  working: { flex: 1, paddingHorizontal: size.edge, gap: space[4] },
  workingImage: { flex: 1, opacity: processing.imageOpacity, borderRadius: radius.xl },
  steps: {
    padding: space[5],
    gap: space[4],
    borderRadius: radius.xl,
    backgroundColor: color.surface,
    marginBottom: space[6],
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  stepIcon: { width: STEP_DOT, height: STEP_DOT },
  stepDone: {
    width: STEP_DOT,
    height: STEP_DOT,
    borderRadius: radius.full,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTodo: {
    width: STEP_DOT,
    height: STEP_DOT,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: color.switchOff,
  },
});
