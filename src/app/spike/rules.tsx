import { type NoteId, photoFeatures, type PhotoFeatures, reviewPhoto } from 'composition-critic';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Check, ChevronLeft, Trash2, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { prepareImage } from '@/engine/image';
import { useSegmenter } from '@/engine/segmentation/SegmenterProvider';
import type { TechniqueId } from '@/features/composition/techniques';
import { analyzeImage, PoseCreateError } from '@/features/pose/createFromImage';
import { Button, IconButton } from '@/ui/components';
import { t } from '@/ui/strings';
import { color, radius, size, space, type } from '@/ui/tokens';

/**
 * Đo độ đúng của quy tắc nhận xét (roadmap Phase 5 Bước 3, cổng quyết định: ≥ 70%). Người thử
 * chọn ảnh có người, gán kỹ thuật cho từng ảnh, app chạy nhận xét như ở Xem ảnh vừa chụp, người
 * thử chấm từng dòng Đúng / Sai, khung cắt gợi ý, và đánh dấu khi app bỏ sót lỗi rõ.
 * Độ đúng = dòng đúng / (dòng đã chấm + lần bỏ sót). Ảnh (thu nhỏ 1024) và kết quả chấm lưu trong
 * Paths.document/spike-rules/, không rời máy. Xóa cùng màn spike khi xong Phase 5.
 */

type Tech = Extract<
  TechniqueId,
  'thirds' | 'center' | 'fill' | 'group' | 'low' | 'selfie' | 'grid'
>;
const TECHS: Tech[] = ['thirds', 'center', 'fill', 'group', 'low', 'selfie', 'grid'];

type Verdict = 'right' | 'wrong';
type Key = NoteId | 'crop';

type Item = {
  id: string;
  /** Tên file trong thư mục spike (không lưu đường dẫn tuyệt đối: đổi theo bản cài). */
  file: string;
  width: number;
  height: number;
  technique: Tech;
  status: 'queued' | 'running' | 'done' | 'none' | 'error';
  features?: PhotoFeatures;
  verdicts: Partial<Record<Key, Verdict>>;
  missed: boolean;
};

const dir = () => new Directory(Paths.document, 'spike-rules');
const store = () => new File(dir(), 'items.json');

function load(): Item[] {
  try {
    const f = store();
    if (!f.exists) return [];
    const items = JSON.parse(f.textSync()) as Item[];
    // Đang chạy dở khi thoát app: chạy lại.
    return items.map((i) => (i.status === 'running' ? { ...i, status: 'queued' } : i));
  } catch {
    return [];
  }
}

function save(items: Item[]) {
  const d = dir();
  d.create({ intermediates: true, idempotent: true });
  const f = store();
  if (!f.exists) f.create();
  f.write(JSON.stringify(items));
}

type Tally = { right: number; wrong: number; missed: number };
const pct = (x: Tally) => {
  const n = x.right + x.wrong + x.missed;
  return n ? `${Math.round((x.right / n) * 100)}% (${x.right}/${n})` : '–';
};

export default function RulesSpike() {
  const insets = useSafeAreaInsets();
  const { segmentForPose } = useSegmenter();
  const [items, setItems] = useState<Item[]>(load);
  const itemsRef = useRef(items);
  const [nextTech, setNextTech] = useState<Tech>('thirds');
  const [picking, setPicking] = useState(false);
  const busy = useRef(false);

  const commit = (next: Item[]) => {
    itemsRef.current = next;
    setItems(next);
    save(next);
  };
  const update = (id: string, patch: Partial<Item>) =>
    commit(itemsRef.current.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const pump = async () => {
    if (busy.current) return;
    busy.current = true;
    for (;;) {
      const next = itemsRef.current.find((i) => i.status === 'queued');
      if (!next) break;
      update(next.id, { status: 'running' });
      try {
        const a = await analyzeImage(segmentForPose, {
          uri: new File(dir(), next.file).uri,
          width: next.width,
          height: next.height,
        });
        const features = photoFeatures({
          width: next.width,
          height: next.height,
          gridW: a.grid.width,
          gridH: a.grid.height,
          people: a.people,
          body: a.seg.landmarks.bodyPoints,
          bodies: a.seg.bodies,
          faceEyes: a.seg.faceEyes,
        });
        update(next.id, { status: 'done', features });
      } catch (e) {
        update(next.id, { status: e instanceof PoseCreateError ? 'none' : 'error' });
      }
    }
    busy.current = false;
  };

  // Ảnh còn chờ từ lần mở trước. pump chỉ đọc ref nên chạy một lần khi vào màn là đủ.
  useEffect(() => {
    void pump();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 0,
      quality: 1,
    });
    if (res.canceled) return;
    setPicking(true);
    dir().create({ intermediates: true, idempotent: true });
    const added: Item[] = [];
    for (const a of res.assets) {
      try {
        const p = await prepareImage(a.uri, a.width, a.height, 1024);
        const id = `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
        const file = `${id}.jpg`;
        new File(p.uri).copy(new File(dir(), file));
        added.push({
          id,
          file,
          width: p.width,
          height: p.height,
          technique: nextTech,
          status: 'queued',
          verdicts: {},
          missed: false,
        });
      } catch {
        // Ảnh không đọc được: bỏ qua.
      }
    }
    commit([...added, ...itemsRef.current]);
    setPicking(false);
    void pump();
  };

  const remove = (id: string) => {
    const it = itemsRef.current.find((i) => i.id === id);
    if (it) {
      try {
        new File(dir(), it.file).delete();
      } catch {
        // Đã mất file: chỉ bỏ dòng.
      }
    }
    commit(itemsRef.current.filter((i) => i.id !== id));
  };

  const clearAll = () =>
    Alert.alert(t.spike.rulesClear, t.spike.rulesClearBody, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.spike.rulesClear,
        style: 'destructive',
        onPress: () => {
          try {
            dir().delete();
          } catch {
            // Thư mục chưa có.
          }
          commit([]);
        },
      },
    ]);

  const judge = (it: Item, key: Key, v: Verdict) => {
    const verdicts = { ...it.verdicts };
    if (verdicts[key] === v) delete verdicts[key];
    else verdicts[key] = v;
    update(it.id, { verdicts });
  };

  // ---- Tổng hợp ----
  const zero = (): Tally => ({ right: 0, wrong: 0, missed: 0 });
  const total = zero();
  const crop = zero();
  const byTech = new Map<Tech, Tally & { photos: number }>();
  const byNote = new Map<NoteId, Tally>();
  let pending = 0;
  for (const it of items) {
    if (it.status !== 'done' && it.status !== 'none') continue;
    const tech = byTech.get(it.technique) ?? { ...zero(), photos: 0 };
    tech.photos++;
    const r = it.features ? reviewPhoto(it.technique, it.features) : { notes: [], crop: null };
    for (const n of r.notes) {
      const v = it.verdicts[n.id];
      if (!v) {
        pending++;
        continue;
      }
      const note = byNote.get(n.id) ?? zero();
      note[v]++;
      byNote.set(n.id, note);
      total[v]++;
      tech[v]++;
    }
    if (r.crop) {
      const v = it.verdicts.crop;
      if (v) crop[v]++;
      else pending++;
    }
    if (it.missed) {
      total.missed++;
      tech.missed++;
    }
    byTech.set(it.technique, tech);
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{
        paddingTop: insets.top + space[2],
        paddingBottom: insets.bottom + space[6],
      }}
    >
      <View style={styles.header}>
        <IconButton icon={ChevronLeft} label={t.common.back} onPress={() => router.back()} />
        <Text style={[type.head, styles.ink]}>{t.spike.rulesTitle}</Text>
      </View>

      <View style={styles.pad}>
        <Text style={[type.caption, styles.muted]}>{t.spike.rulesIntro}</Text>

        <View style={styles.card}>
          <Row k={t.spike.rulesTotal} v={pct(total)} strong />
          <Row k={t.spike.rulesGate} v="70%" />
          <Row k={t.spike.rulesPhotos} v={String(items.length)} />
          <Row k={t.spike.rulesPending} v={String(pending)} />
          <Row k={t.spike.rulesCropTotal} v={pct(crop)} />
          <Text style={[type.caption, styles.muted, styles.cardHead]}>{t.spike.rulesByTech}</Text>
          {TECHS.filter((k) => byTech.has(k)).map((k) => {
            const x = byTech.get(k)!;
            return (
              <Row
                key={k}
                k={`${t.composition.names[k]} · ${x.photos} ${t.spike.rulesPhotoUnit}`}
                v={pct(x)}
              />
            );
          })}
          <Text style={[type.caption, styles.muted, styles.cardHead]}>{t.spike.rulesByNote}</Text>
          {[...byNote.entries()].map(([id, x]) => (
            <Row key={id} k={t.review.notes[id]} v={pct(x)} />
          ))}
        </View>

        <Text style={[type.caption, styles.muted]}>{t.spike.rulesNextTech}</Text>
        <TechChips value={nextTech} onChange={setNextTech} />
        <Button
          label={picking ? t.spike.rulesPreparing : t.spike.rulesPick}
          onPress={pick}
          variant="primary"
          disabled={picking}
          fullWidth
        />

        {items.map((it) => (
          <ItemCard
            key={it.id}
            item={it}
            onTech={(tech) => update(it.id, { technique: tech, verdicts: {}, missed: false })}
            onJudge={(key, v) => judge(it, key, v)}
            onMissed={() => update(it.id, { missed: !it.missed })}
            onRemove={() => remove(it.id)}
          />
        ))}

        {items.length > 0 && (
          <Button label={t.spike.rulesClear} onPress={clearAll} variant="dangerText" fullWidth />
        )}
      </View>
    </ScrollView>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[type.caption, strong ? styles.ink : styles.muted, styles.rowKey]}>{k}</Text>
      <Text style={[type.caption, styles.ink]}>{v}</Text>
    </View>
  );
}

function TechChips({ value, onChange }: { value: Tech; onChange: (t: Tech) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chips}
    >
      {TECHS.map((k) => {
        const on = k === value;
        return (
          <Pressable
            key={k}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(k)}
            style={[styles.chip, on && styles.chipOn]}
          >
            <Text style={[type.caption, on ? styles.chipTextOn : styles.ink]}>
              {t.composition.names[k]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const THUMB_W = 132;

function ItemCard({
  item,
  onTech,
  onJudge,
  onMissed,
  onRemove,
}: {
  item: Item;
  onTech: (t: Tech) => void;
  onJudge: (key: Key, v: Verdict) => void;
  onMissed: () => void;
  onRemove: () => void;
}) {
  const f = item.features;
  const review = f ? reviewPhoto(item.technique, f) : null;
  const w = THUMB_W;
  const h = (THUMB_W * item.height) / item.width;
  const box = f && f.main >= 0 ? f.people[f.main]!.box : null;
  const status =
    item.status === 'queued'
      ? t.spike.rulesQueued
      : item.status === 'running'
        ? t.spike.rulesRunning
        : item.status === 'none'
          ? t.spike.rulesNoPerson
          : item.status === 'error'
            ? t.spike.rulesError
            : null;

  return (
    <View style={styles.card}>
      <View style={styles.itemTop}>
        <View style={{ width: w, height: h }}>
          <Image source={{ uri: new File(dir(), item.file).uri }} style={StyleSheet.absoluteFill} />
          {/* Lớp của app để người thử soi: đường 1/3, khung người, mắt, khung cắt. */}
          {[1 / 3, 2 / 3].map((k) => (
            <View key={`h${k}`} style={[styles.lineH, { top: k * h }]} />
          ))}
          {[1 / 3, 2 / 3].map((k) => (
            <View key={`v${k}`} style={[styles.lineV, { left: k * w }]} />
          ))}
          {box && (
            <View
              style={[
                styles.box,
                {
                  left: box[0] * w,
                  top: box[1] * h,
                  width: (box[2] - box[0]) * w,
                  height: (box[3] - box[1]) * h,
                },
              ]}
            />
          )}
          {f?.eye && <View style={[styles.eye, { left: f.eye.x * w - 4, top: f.eye.y * h - 4 }]} />}
          {review?.crop && (
            <View
              style={[
                styles.crop,
                {
                  left: review.crop.x * w,
                  top: review.crop.y * h,
                  width: review.crop.w * w,
                  height: review.crop.h * h,
                },
              ]}
            />
          )}
        </View>
        <View style={styles.itemSide}>
          <IconButton icon={Trash2} label={t.spike.rulesRemove} onPress={onRemove} />
          {status && <Text style={[type.caption, styles.muted]}>{status}</Text>}
        </View>
      </View>

      <TechChips value={item.technique} onChange={onTech} />

      {review && review.notes.length === 0 && (
        <Text style={[type.caption, styles.muted]}>{t.spike.rulesNoNotes}</Text>
      )}
      {review?.notes.map((n) => (
        <Judge
          key={n.id}
          label={t.review.notes[n.id]}
          ok={n.ok}
          value={item.verdicts[n.id]}
          onChange={(v) => onJudge(n.id, v)}
        />
      ))}
      {review?.crop && (
        <Judge
          label={t.spike.rulesCrop}
          value={item.verdicts.crop}
          onChange={(v) => onJudge('crop', v)}
        />
      )}
      {(item.status === 'done' || item.status === 'none') && (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.missed }}
          onPress={onMissed}
          style={styles.missed}
        >
          <View style={[styles.box16, item.missed && styles.box16On]}>
            {item.missed && <Check size={12} color={color.accentInk} strokeWidth={3} />}
          </View>
          <Text style={[type.caption, styles.ink]}>{t.spike.rulesMissed}</Text>
        </Pressable>
      )}
    </View>
  );
}

function Judge({
  label,
  ok,
  value,
  onChange,
}: {
  label: string;
  ok?: boolean;
  value: Verdict | undefined;
  onChange: (v: Verdict) => void;
}) {
  return (
    <View style={styles.judge}>
      {ok !== undefined &&
        (ok ? (
          <Check size={size.iconSmall} color={color.accent} strokeWidth={2.5} />
        ) : (
          <X size={size.iconSmall} color={color.danger} strokeWidth={2.5} />
        ))}
      <Text style={[type.caption, styles.ink, styles.judgeText]}>{label}</Text>
      {(['right', 'wrong'] as const).map((v) => {
        const on = value === v;
        return (
          <Pressable
            key={v}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(v)}
            style={[styles.vote, on && (v === 'right' ? styles.voteRight : styles.voteWrong)]}
          >
            <Text style={[type.caption, on ? styles.voteTextOn : styles.ink]}>
              {v === 'right' ? t.spike.rulesRight : t.spike.rulesWrong}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingHorizontal: space[2],
    paddingBottom: space[2],
  },
  pad: { paddingHorizontal: space[4], gap: space[4] },
  ink: { color: color.ink },
  muted: { color: color.muted },
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
    padding: space[3],
    gap: space[3],
  },
  cardHead: { marginTop: space[2] },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: space[3] },
  rowKey: { flexShrink: 1 },
  chips: { gap: space[2] },
  chip: {
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderRadius: radius.full,
    backgroundColor: color.surfaceAlt,
  },
  chipOn: { backgroundColor: color.accent },
  chipTextOn: { color: color.accentInk },
  itemTop: { flexDirection: 'row', gap: space[3] },
  itemSide: { flex: 1, alignItems: 'flex-end', gap: space[2] },
  lineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: color.guide,
  },
  lineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: color.guide,
  },
  box: { position: 'absolute', borderWidth: 1.5, borderColor: color.accent },
  eye: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: color.accent,
    borderWidth: 1,
    borderColor: color.onImage,
  },
  crop: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: color.onImage,
    borderStyle: 'dashed',
  },
  judge: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  judgeText: { flex: 1 },
  vote: {
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderRadius: radius.sm,
    backgroundColor: color.surfaceAlt,
  },
  voteRight: { backgroundColor: color.accent },
  voteWrong: { backgroundColor: color.danger },
  voteTextOn: { color: color.accentInk },
  missed: { flexDirection: 'row', alignItems: 'center', gap: space[2], minHeight: size.tap },
  box16: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: color.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box16On: { backgroundColor: color.accent, borderColor: color.accent },
});
