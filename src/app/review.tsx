import { StatusBar } from 'expo-status-bar';
import * as Sharing from 'expo-sharing';
import { Check, Crop, Share, Trash2, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  GestureDetector,
  usePanGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { POSE_PACK, packBytes } from '@/engine/models/packs';
import { cropNormalized, deleteFromLibrary, saveToAlbum } from '@/features/camera/capture';
import { type SessionPhoto, useSessionPhotos } from '@/features/camera/sessionPhotos';
import { CompositionGuide } from '@/features/composition/CompositionGuide';
import { SceneLines } from '@/features/composition/SceneLines';
import type { Crop as CropRect } from 'composition-critic';
import {
  type ReviewEntry,
  usePhotoReview,
  useReviewNotes,
} from '@/features/composition/usePhotoReview';
import { haptic } from '@/lib/haptics';
import { useGoBack } from '@/lib/useGoBack';
import { Button, CloseButton, OverlayHeader } from '@/ui/components';
import { t } from '@/ui/strings';
import { ease } from '@/ui/easing';
import { color, compositionUi, elevation, motion, radius, size, space, type } from '@/ui/tokens';

/** Hàng chấm trang: mỗi ảnh một ô, cả hàng rộng tối đa chừng này (nhiều ảnh thì ô hẹp lại). */
const SCRUB_MAX_W = 300;
const SCRUB_CELL = 24;

const clock = (ms: number) => {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/**
 * Xem ảnh vừa chụp (business-flow §4.5, design.md §6.12): các ảnh chụp trong lần mở app này, mở
 * ở ảnh mới nhất, vuốt ngang để xem ảnh trước. Xóa ảnh (khỏi album, có xác nhận) và Chia sẻ ảnh.
 *
 * Ảnh chụp lúc bật một kỹ thuật bố cục có nhận xét (business-flow §6.5, design.md §6.15 bản A):
 * lớp bố cục trên ảnh (chạm ảnh để bật / tắt), thẻ đạt / chưa đạt dưới ảnh, khung cắt gợi ý lưu
 * thành ảnh mới.
 */
export default function ReviewScreen() {
  const insets = useSafeAreaInsets();
  const goBack = useGoBack();
  const photos = useSessionPhotos((s) => s.photos);
  const [page, setPage] = useState({ w: 0, h: 0 });
  const [index, setIndex] = useState(Math.max(0, photos.length - 1));
  const scrollRef = useRef<ScrollViewInstance>(null);
  const placed = useRef(false);
  const [busy, setBusy] = useState(false);
  /** Người dùng đã bấm tải bộ tách người cho nhận xét. */
  const [allowDownload, setAllowDownload] = useState(false);
  /** Lớp bố cục trên ảnh (chạm ảnh để bật / tắt). */
  const [guide, setGuide] = useState(true);
  /** Đang xem khung cắt gợi ý của ảnh này. */
  const [cropFor, setCropFor] = useState<string | null>(null);
  const reviews = useReviewNotes((s) => s.byId);

  const current = photos[Math.min(index, photos.length - 1)];
  const top = Platform.OS === 'ios' ? space[5] : insets.top + space[3];
  const { entry, wanted, packReady } = usePhotoReview(current, allowDownload);
  const cropping = !!current && cropFor === current.assetId;

  // Rung nhẹ một lần khi nhận xét vừa xong mà mọi dòng đều đạt. Chỉ khi thấy đúng lúc chuyển từ
  // đang phân tích sang xong trên ảnh đang xem: vuốt lại ảnh đã nhận xét thì không rung.
  const lastReview = useRef<{ id?: string; status?: string }>({});
  useEffect(() => {
    const id = current?.assetId;
    const prev = lastReview.current;
    if (
      id &&
      prev.id === id &&
      prev.status === 'running' &&
      entry?.status === 'done' &&
      entry.review.notes.every((n) => n.ok)
    ) {
      haptic.levelReached();
    }
    lastReview.current = { id, status: entry?.status };
  }, [current?.assetId, entry]);
  const crop = cropping && entry?.status === 'done' ? entry.review.crop : null;

  // Chấm trang chạy cùng lúc với ảnh khi vuốt, không đợi ảnh dừng (góp ý Phase 4, mục 5.2).
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (page.w <= 0) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / page.w);
    if (i !== index && i >= 0 && i < photos.length) setIndex(i);
  };

  // Chạm hoặc kéo trên hàng chấm để tua nhanh tới ảnh khác.
  const goTo = (i: number) => {
    if (i === index || page.w <= 0) return;
    setIndex(i);
    scrollRef.current?.scrollTo({ x: i * page.w, animated: false });
  };
  const cellW = Math.min(SCRUB_CELL, SCRUB_MAX_W / Math.max(1, photos.length));
  const n = photos.length;
  const lastPick = useSharedValue(-1);
  const pickAt = (x: number) => {
    'worklet';
    const i = Math.min(n - 1, Math.max(0, Math.floor(x / cellW)));
    if (i === lastPick.get()) return;
    lastPick.set(i);
    scheduleOnRN(goTo, i);
  };
  const scrubPan = usePanGesture({
    minDistance: 0,
    onActivate: () => {
      'worklet';
      lastPick.set(-1);
    },
    onUpdate: (e) => {
      'worklet';
      pickAt(e.x);
    },
  });
  const scrubTap = useTapGesture({
    onActivate: (e) => {
      'worklet';
      lastPick.set(-1);
      pickAt(e.x);
    },
  });
  const scrub = useSimultaneousGestures(scrubPan, scrubTap);

  const share = async () => {
    if (!current) return;
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert(t.review.shareUnavailable);
      return;
    }
    await Sharing.shareAsync(current.uri, { mimeType: 'image/jpeg', UTI: 'public.jpeg' });
  };

  const remove = () => {
    if (!current) return;
    Alert.alert(t.review.remove, t.review.removeConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.review.remove,
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await deleteFromLibrary(current.assetId);
            const left = photos.length - 1;
            useSessionPhotos.getState().remove(current.assetId);
            useReviewNotes.getState().clear(current.assetId);
            if (left === 0) goBack();
            else setIndex((i) => Math.min(i, left - 1));
          } catch {
            // Người dùng bấm Không cho phép ở hộp thoại của iOS cũng rơi vào đây: ảnh còn nguyên.
            Alert.alert(t.review.removeFailed);
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  /** Lưu bản cắt thành ảnh mới trong album (ảnh gốc giữ nguyên, BR-15) rồi chuyển tới ảnh đó. */
  const saveCrop = async (photo: SessionPhoto, c: CropRect) => {
    setBusy(true);
    try {
      const out = await cropNormalized(photo, c);
      const assetId = await saveToAlbum(out.uri);
      useSessionPhotos
        .getState()
        .add({ ...out, assetId, technique: photo.technique, scene: photo.scene ?? null });
      haptic.saved();
      setCropFor(null);
      const last = useSessionPhotos.getState().photos.length - 1;
      setIndex(last);
      requestAnimationFrame(() =>
        scrollRef.current?.scrollTo({ x: last * page.w, animated: true }),
      );
    } catch {
      Alert.alert(t.errors.saveFailed);
    } finally {
      setBusy(false);
    }
  };

  // Ảnh vừa khít vùng xem, đúng tỉ lệ chụp, bo góc.
  const imageSize = (w: number, h: number) => {
    const aw = page.w - size.edge * 2;
    const ah = page.h;
    if (aw <= 0 || ah <= 0) return { width: 0, height: 0 };
    const k = Math.min(aw / w, ah / h);
    return { width: w * k, height: h * k };
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={{ paddingTop: top }}>
        <OverlayHeader title={t.review.title} right={<CloseButton onPress={goBack} />} />
        {current && (
          <Text style={[type.hint, styles.counter]}>
            {!hasLayer(current)
              ? t.review.counter(index + 1, photos.length, clock(current.takenAt))
              : t.review.counterTech(index + 1, photos.length, layerName(current))}
          </Text>
        )}
      </View>

      <View
        style={styles.pager}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setPage({ w: width, h: height });
          // Mở ở ảnh mới nhất (một lần, khi đã biết bề rộng trang).
          if (!placed.current && width > 0) {
            placed.current = true;
            requestAnimationFrame(() =>
              scrollRef.current?.scrollTo({ x: index * width, animated: false }),
            );
          }
        }}
      >
        {page.w > 0 && (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            scrollEnabled={!cropping}
          >
            {photos.map((p) => {
              const s = imageSize(p.width, p.height);
              return (
                <View key={p.assetId} style={[styles.page, { width: page.w, height: page.h }]}>
                  <Pressable
                    accessibilityRole={hasLayer(p) ? 'button' : 'image'}
                    accessibilityLabel={hasLayer(p) ? t.review.toggleGuide : undefined}
                    disabled={!hasLayer(p) || cropFor === p.assetId}
                    onPress={() => setGuide((g) => !g)}
                    style={[styles.photo, s]}
                  >
                    <Image
                      source={{ uri: p.uri }}
                      style={[styles.image, s]}
                      accessibilityIgnoresInvertColors
                    />
                    {cropFor === p.assetId ? (
                      <CropFrame size={s} crop={crop} />
                    ) : (
                      guide &&
                      hasLayer(p) && (
                        <View pointerEvents="none" style={[styles.guide, s]}>
                          <CompositionGuide
                            frame={{ x: 0, y: 0, width: s.width, height: s.height }}
                            technique={p.technique}
                            scene={p.scene ?? null}
                            anchor={eyeOf(reviews[p.assetId])}
                          />
                          <SceneLines
                            width={s.width}
                            height={s.height}
                            technique={p.scene ?? p.technique}
                            scene={sceneOf(reviews[p.assetId])}
                          />
                        </View>
                      )
                    )}
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      {n > 1 && (
        <GestureDetector gesture={scrub}>
          <View
            style={[styles.dots, { width: cellW * n }]}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            {photos.map((p, i) => (
              <View key={p.assetId} style={[styles.cell, { width: cellW }]}>
                <View
                  style={[
                    styles.dot,
                    cellW < 10 && styles.dotSmall,
                    i === index && (cellW < 10 ? styles.dotOnSmall : styles.dotOn),
                  ]}
                />
              </View>
            ))}
          </View>
        </GestureDetector>
      )}

      {current && wanted && (
        <ReviewCard
          entry={entry}
          packReady={packReady || allowDownload}
          cropping={cropping}
          onDownload={() => setAllowDownload(true)}
          onRetry={() => useReviewNotes.getState().clear(current.assetId)}
          onShowCrop={() => setCropFor(current.assetId)}
        />
      )}

      {cropping ? (
        <View style={[styles.actions, { paddingBottom: insets.bottom + space[3] }]}>
          <View style={styles.actionSecondary}>
            <Button
              label={t.review.cropOriginal}
              variant="secondary"
              onPress={() => setCropFor(null)}
              disabled={busy}
              fullWidth
            />
          </View>
          <View style={styles.actionPrimary}>
            <Button
              label={t.review.saveCrop}
              icon={Crop}
              onPress={() => current && crop && saveCrop(current, crop)}
              disabled={!crop || busy}
              fullWidth
            />
          </View>
        </View>
      ) : (
        <View style={[styles.actions, { paddingBottom: insets.bottom + space[3] }]}>
          <View style={styles.actionSecondary}>
            <Button
              label={t.review.remove}
              icon={Trash2}
              variant="dangerText"
              onPress={remove}
              disabled={!current || busy}
              fullWidth
            />
          </View>
          <View style={styles.actionPrimary}>
            <Button
              label={t.review.share}
              icon={Share}
              onPress={share}
              disabled={!current || busy}
              fullWidth
            />
          </View>
        </View>
      )}
    </View>
  );
}

const eyeOf = (e: ReviewEntry | undefined) => (e?.status === 'done' ? e.features.eye : null);
const sceneOf = (e: ReviewEntry | undefined) => (e?.status === 'done' ? e.scene : null);
/** Ảnh chụp lúc có bố cục bật (chính hoặc phụ, Phase 5b). */
const hasLayer = (p: SessionPhoto) => p.technique !== 'off' || !!p.scene;
/** Tên bố cục lúc chụp: chính + phụ. */
const layerName = (p: SessionPhoto) =>
  [p.technique !== 'off' ? p.technique : null, p.scene ?? null]
    .filter((x) => x != null)
    .map((x) => t.composition.names[x])
    .join(' + ');

/** Khung cắt gợi ý trên ảnh: viền nét đứt màu nhấn, phần bị cắt bỏ tối đi. */
function CropFrame({
  size: s,
  crop,
}: {
  size: { width: number; height: number };
  crop: CropRect | null;
}) {
  if (!crop) return null;
  const x = crop.x * s.width;
  const y = crop.y * s.height;
  const w = crop.w * s.width;
  const h = crop.h * s.height;
  return (
    <View pointerEvents="none" style={[styles.guide, s]}>
      <View style={[styles.shade, { left: 0, top: 0, width: s.width, height: y }]} />
      <View style={[styles.shade, { left: 0, top: y + h, width: s.width, bottom: 0 }]} />
      <View style={[styles.shade, { left: 0, top: y, width: x, height: h }]} />
      <View style={[styles.shade, { left: x + w, top: y, right: 0, height: h }]} />
      <View style={[styles.cropBox, { left: x, top: y, width: w, height: h }]} />
    </View>
  );
}

/** Thẻ nhận xét dưới ảnh (design.md §6.15, bản A). */
function ReviewCard({
  entry,
  packReady,
  cropping,
  onDownload,
  onRetry,
  onShowCrop,
}: {
  entry: ReviewEntry | undefined;
  packReady: boolean;
  cropping: boolean;
  onDownload: () => void;
  onRetry: () => void;
  onShowCrop: () => void;
}) {
  let body: React.ReactNode;
  if (cropping) {
    body = <Text style={[type.body, styles.ink]}>{t.review.cropHint}</Text>;
  } else if (!entry && !packReady) {
    const mb = (packBytes(POSE_PACK) / 1e6).toFixed(1).replace('.', ',');
    body = (
      <>
        <Text style={[type.body, styles.muted]}>{t.review.needPack}</Text>
        <Button label={t.review.downloadPack(mb)} variant="soft" small onPress={onDownload} />
      </>
    );
  } else if (!entry || entry.status === 'running') {
    const text =
      entry?.stage === 'download'
        ? t.status.downloadingModel
        : entry?.stage === 'load'
          ? t.status.loadingModel
          : t.review.analyzing;
    body = (
      <View style={styles.row}>
        <ActivityIndicator color={color.accent} />
        <Text style={[type.body, styles.muted]}>{text}</Text>
      </View>
    );
  } else if (entry.status === 'none') {
    body = <Text style={[type.body, styles.muted]}>{t.review.noPerson}</Text>;
  } else if (entry.status === 'error') {
    body = (
      <>
        <Text style={[type.body, styles.muted]}>{t.review.failed}</Text>
        <Button label={t.common.retry} variant="soft" small onPress={onRetry} />
      </>
    );
  } else {
    const { notes, crop } = entry.review;
    body = (
      <>
        {notes.length === 0 ? (
          <NoteRow ok text={t.review.allGood} />
        ) : (
          notes.map((n, i) => (
            <NoteRow key={n.id} ok={n.ok} text={t.review.notes[n.id]} order={i} />
          ))
        )}
        {crop && <Button label={t.review.showCrop} variant="soft" small onPress={onShowCrop} />}
      </>
    );
  }
  return (
    <View style={styles.card} accessibilityLiveRegion="polite">
      {body}
    </View>
  );
}

function NoteRow({ ok, text, order = 0 }: { ok: boolean; text: string; order?: number }) {
  const Icon = ok ? Check : X;
  return (
    <Animated.View
      entering={FadeIn.duration(motion.in)
        .delay(order * compositionUi.noteStagger)
        .easing(ease)}
      style={styles.row}
    >
      <View style={[styles.mark, ok ? styles.markOk : styles.markBad]}>
        <Icon size={16} strokeWidth={3} color={ok ? color.accent : color.danger} />
      </View>
      <Text style={[type.label, styles.ink, styles.flex]}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  counter: { color: color.muted, paddingHorizontal: size.gutter, marginTop: space[1] },
  pager: { flex: 1, marginTop: space[4] },
  page: { alignItems: 'center', justifyContent: 'center' },
  photo: {
    borderRadius: radius.xl,
    backgroundColor: color.surface,
    ...elevation.float,
    shadowOpacity: 0.12,
    shadowColor: color.shadow,
  },
  image: { borderRadius: radius.xl },
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    marginTop: space[2],
  },
  cell: { height: 32, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: radius.full, backgroundColor: color.switchOff },
  dotOn: { width: 18, backgroundColor: color.accent },
  dotSmall: { width: 3, height: 3 },
  dotOnSmall: { width: 6, height: 6, backgroundColor: color.accent },
  actions: {
    flexDirection: 'row',
    gap: space[2],
    paddingHorizontal: size.edge,
    paddingTop: space[4],
  },
  guide: { position: 'absolute', left: 0, top: 0, borderRadius: radius.xl, overflow: 'hidden' },
  shade: { position: 'absolute', backgroundColor: color.popoverScrim },
  cropBox: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: color.accent,
    borderRadius: 4,
  },
  card: {
    marginHorizontal: size.edge,
    marginTop: space[3],
    padding: space[4],
    gap: space[3],
    minHeight: 96,
    justifyContent: 'center',
    borderRadius: radius.xl,
    backgroundColor: color.surface,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  mark: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markOk: { backgroundColor: color.accentSoft },
  markBad: { backgroundColor: 'rgba(242,139,130,0.16)' },
  ink: { color: color.ink },
  muted: { color: color.muted },
  flex: { flex: 1 },
  actionSecondary: { flex: 1 },
  actionPrimary: { flex: 1.4 },
});
