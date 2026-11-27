import { StyleSheet, View } from 'react-native';

import type { Rect } from '@/features/camera/frame';
import { color, compositionUi, gridLine } from '@/ui/tokens';

import type { Target } from './guidance';
import { guideShape, type Pt } from './guides';
import type { TechniqueId } from './techniques';

/**
 * Lớp bố cục trên khung ngắm (design.md §6.15): đường kẻ, chấm đích, đường chân trời tô màu
 * nhấn, đường chéo của đường dẫn. Vẽ TRONG vùng ảnh sẽ được lưu. Bố cục chính và bố cục phụ
 * (Phase 5b) vẽ chung một lớp; đang hướng dẫn liên tục thì đích của tiêu chí đang làm sáng lên.
 */
export function CompositionGuide({
  frame,
  technique,
  anchor,
  focus = null,
  focusBand = 0,
  focusOk = false,
}: {
  frame: Rect;
  technique: TechniqueId;
  /** Mắt người mẫu của pose trên khung (0..1), null khi chưa có pose. */
  anchor: Pt | null;
  /** Đích sáng của tiêu chí đang hướng dẫn (Phase 5b). */
  focus?: Target | null;
  /** Nửa bề rộng dải đích (phần khung): vào dải là đạt. 0: chỉ vẽ đường. */
  focusBand?: number;
  /** Đang đúng, chờ xác nhận: dải màu nhấn thay cho đỏ. */
  focusOk?: boolean;
}) {
  if (technique === 'off') return null;
  const g = guideShape(technique, anchor);
  const { v, h } = g;
  const W = frame.width;
  const H = frame.height;

  return (
    <View
      pointerEvents="none"
      style={[styles.abs, { left: frame.x, top: frame.y, width: W, height: H }]}
    >
      {v.map((f) => (
        <View key={`v${f}`} style={[styles.v, { left: `${f * 100}%` }]}>
          <View style={styles.halo} />
          <View style={styles.stroke} />
          <View style={styles.halo} />
        </View>
      ))}
      {h.map((f) => (
        <View key={`h${f}`} style={[styles.h, { top: `${f * 100}%` }]}>
          <View style={styles.halo} />
          <View style={styles.stroke} />
          <View style={styles.halo} />
        </View>
      ))}
      {/* Không vẽ chấm xanh nào (phiếu Phase 5b lần 3, mục 11.5: bỏ ở mọi bố cục). */}
      {focus && <Focus target={focus} band={focusBand} ok={focusOk} width={W} height={H} />}
    </View>
  );
}

/**
 * Dải đích (cách C, phiếu Phase 5b lần 8, mục 16): dải đỏ mờ đúng bằng vùng đạt + đường đích đỏ,
 * đứng yên; người dùng nhìn khung ngắm (realtime) để đưa người vào dải. Không vẽ mũi tên trên dải
 * (phiếu Phase 5b lần 9, kiểu 6): chiều chỉ ở đầu câu hướng dẫn. Đang đúng chờ xác nhận: màu nhấn.
 */
function Focus({
  target,
  band,
  ok,
  width,
  height,
}: {
  target: Target;
  band: number;
  ok: boolean;
  width: number;
  height: number;
}) {
  const line = ok ? color.camAccent : color.camTarget;
  const fill = ok ? color.camOkBand : color.camTargetBand;
  if (target.kind === 'vline') {
    const half = band * width;
    return (
      <>
        {half > 0 && (
          <View
            style={[
              styles.bandV,
              { left: target.x * width - half, width: 2 * half, backgroundColor: fill },
            ]}
          />
        )}
        <View style={[styles.focusV, { left: target.x * width, backgroundColor: line }]} />
      </>
    );
  }
  if (target.kind === 'hline') {
    const half = band * height;
    return (
      <>
        {half > 0 && (
          <View
            style={[
              styles.bandH,
              { top: target.y * height - half, height: 2 * half, backgroundColor: fill },
            ]}
          />
        )}
        <View style={[styles.focusH, { top: target.y * height, backgroundColor: line }]} />
      </>
    );
  }
  return null;
}

const GRID_THICK = gridLine.width + gridLine.halo * 2;

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  v: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    width: GRID_THICK,
    marginLeft: -GRID_THICK / 2,
  },
  h: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: GRID_THICK,
    marginTop: -GRID_THICK / 2,
  },
  halo: { flexBasis: gridLine.halo, backgroundColor: color.guideHalo },
  stroke: { flexBasis: gridLine.width, backgroundColor: color.guide },
  bandV: { position: 'absolute', top: 0, bottom: 0 },
  bandH: { position: 'absolute', left: 0, right: 0 },
  focusV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: compositionUi.focusStroke,
    marginLeft: -compositionUi.focusStroke / 2,
    backgroundColor: color.camAccent,
  },
  focusH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: compositionUi.focusStroke,
    marginTop: -compositionUi.focusStroke / 2,
    backgroundColor: color.camAccent,
  },
});
