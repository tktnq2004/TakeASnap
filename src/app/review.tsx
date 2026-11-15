import { StatusBar } from 'expo-status-bar';
import * as Sharing from 'expo-sharing';
import { Share, Trash2 } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  Alert,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { deleteFromLibrary } from '@/features/camera/capture';
import { useSessionPhotos } from '@/features/camera/sessionPhotos';
import { useGoBack } from '@/lib/useGoBack';
import { Button, CloseButton, OverlayHeader } from '@/ui/components';
import { t } from '@/ui/strings';
import { color, elevation, radius, size, space, type } from '@/ui/tokens';

/** Chấm trang chỉ hiện khi ít ảnh; nhiều hơn thì đã có "Ảnh n trên m". */
const MAX_DOTS = 9;

const clock = (ms: number) => {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/**
 * Xem ảnh vừa chụp (business-flow §4.5, design.md §6.12): các ảnh chụp trong lần mở app này, mở
 * ở ảnh mới nhất, vuốt ngang để xem ảnh trước. Xóa ảnh (khỏi album, có xác nhận) và Chia sẻ ảnh.
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

  const current = photos[Math.min(index, photos.length - 1)];
  const top = Platform.OS === 'ios' ? space[5] : insets.top + space[3];

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (page.w <= 0) return;
    setIndex(Math.round(e.nativeEvent.contentOffset.x / page.w));
  };

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
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
      <View style={{ paddingTop: top }}>
        <OverlayHeader title={t.review.title} right={<CloseButton onPress={goBack} />} />
        {current && (
          <Text style={[type.hint, styles.counter]}>
            {t.review.counter(index + 1, photos.length, clock(current.takenAt))}
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
            onMomentumScrollEnd={onScrollEnd}
          >
            {photos.map((p) => {
              const s = imageSize(p.width, p.height);
              return (
                <View key={p.assetId} style={[styles.page, { width: page.w, height: page.h }]}>
                  <View style={[styles.photo, s]}>
                    <Image
                      source={{ uri: p.uri }}
                      style={[styles.image, s]}
                      accessibilityIgnoresInvertColors
                    />
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      {photos.length > 1 && photos.length <= MAX_DOTS && (
        <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no">
          {photos.map((p, i) => (
            <View key={p.assetId} style={[styles.dot, i === index && styles.dotOn]} />
          ))}
        </View>
      )}

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
    </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingTop: space[3],
  },
  dot: { width: 6, height: 6, borderRadius: radius.full, backgroundColor: color.switchOff },
  dotOn: { width: 18, backgroundColor: color.accent },
  actions: {
    flexDirection: 'row',
    gap: space[2],
    paddingHorizontal: size.edge,
    paddingTop: space[4],
  },
  actionSecondary: { flex: 1 },
  actionPrimary: { flex: 1.4 },
});
