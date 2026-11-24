import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { Rect } from '@/features/camera/frame';
import { color, compositionUi, gridLine } from '@/ui/tokens';

import type { Target } from './guidance';
import { combinedShape, type Pt } from './guides';
import type { TechniqueId } from './techniques';

/**
 * Lớp bố cục trên khung ngắm (design.md §6.15): đường kẻ, chấm đích, đường chân trời tô màu
 * nhấn, đường chéo của đường dẫn. Vẽ TRONG vùng ảnh sẽ được lưu. Bố cục chính và bố cục phụ
 * (Phase 5b) vẽ chung một lớp; đang hướng dẫn liên tục thì đích của tiêu chí đang làm sáng lên.
 */
export function CompositionGuide({
  frame,
  technique,
  scene = null,
  anchor,
  focus = null,
}: {
  frame: Rect;
  technique: TechniqueId;
  scene?: TechniqueId | null;
  /** Mắt người mẫu của pose trên khung (0..1), null khi chưa có pose. */
  anchor: Pt | null;
  /** Đích sáng của tiêu chí đang hướng dẫn (Phase 5b). */
  focus?: Target | null;
}) {
  if (technique === 'off' && !scene) return null;
  const g = combinedShape(technique, scene, anchor);
  const { v, h } = g;
  const W = frame.width;
  const H = frame.height;
  const T = compositionUi.target;
  const P = compositionUi.point;
  // Mắt người mẫu đã nằm trong vòng đích thì ẩn vòng; lệch ra mới hiện lại (phiếu Phase 5 lần 4).
  const reached =
    g.target != null &&
    anchor != null &&
    Math.hypot((anchor.x - g.target.x) * W, (anchor.y - g.target.y) * H) <= T / 2;

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
      {g.accentH.map((f) => (
        <View key={`a${f}`} style={[styles.accentH, { top: `${f * 100}%` }]} />
      ))}
      {g.diagonals.length > 0 && (
        <Svg style={StyleSheet.absoluteFill} width={W} height={H}>
          {g.diagonals.map((d, i) => (
            <Path
              key={i}
              d={`M${d.from.x * W} ${d.from.y * H}L${d.to.x * W} ${d.to.y * H}`}
              stroke={color.camAccent}
              strokeOpacity={0.85}
              strokeWidth={compositionUi.accentStroke}
              strokeDasharray={[...compositionUi.leadDash]}
            />
          ))}
        </Svg>
      )}
      {g.points.map((p) => (
        <View
          key={`p${p.x}${p.y}`}
          style={[styles.point, { left: p.x * W - P / 2, top: p.y * H - P / 2 }]}
        />
      ))}
      {focus && <Focus target={focus} width={W} height={H} />}
      {g.target && !reached && focus?.kind !== 'point' && (
        <View
          style={[styles.target, { left: g.target.x * W - T / 2, top: g.target.y * H - T / 2 }]}
        >
          <View style={styles.targetDot} />
        </View>
      )}
    </View>
  );
}

/** Đích sáng (design.md §6.15, Hướng dẫn liên tục): đường hoặc vòng `camAccent` đậm. */
function Focus({ target, width, height }: { target: Target; width: number; height: number }) {
  const T = compositionUi.target;
  switch (target.kind) {
    case 'vline':
      return <View style={[styles.focusV, { left: target.x * width }]} />;
    case 'hline':
      return <View style={[styles.focusH, { top: target.y * height }]} />;
    case 'point':
      return (
        <View
          style={[
            styles.target,
            styles.focusRing,
            { left: target.x * width - T / 2, top: target.y * height - T / 2 },
          ]}
        >
          <View style={styles.targetDot} />
        </View>
      );
    default:
      return null;
  }
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
  accentH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: compositionUi.accentStroke,
    marginTop: -compositionUi.accentStroke / 2,
    backgroundColor: color.camAccent,
  },
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
  focusRing: { borderWidth: compositionUi.focusStroke },
  target: {
    position: 'absolute',
    width: compositionUi.target,
    height: compositionUi.target,
    borderRadius: compositionUi.target / 2,
    borderWidth: compositionUi.targetStroke,
    borderColor: color.camAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  point: {
    position: 'absolute',
    width: compositionUi.point,
    height: compositionUi.point,
    borderRadius: compositionUi.point / 2,
    borderWidth: compositionUi.targetStroke,
    borderColor: color.camAccent,
  },
  targetDot: {
    width: compositionUi.targetDot,
    height: compositionUi.targetDot,
    borderRadius: compositionUi.targetDot / 2,
    backgroundColor: color.camAccent,
  },
});
