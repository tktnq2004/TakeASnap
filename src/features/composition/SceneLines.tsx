/**
 * Đường của cảnh app tìm được (Phase 5a): chân trời ở kỹ thuật Đường chân trời, các đường hội tụ
 * và vòng ở điểm hội tụ ở Đường dẫn. Vẽ màu trắng (`camInk`) để không lẫn với lớp bố cục xanh
 * (design.md §6.15). Dùng chung cho Kiểm tra bố cục trên khung ngắm và ảnh ở Xem ảnh.
 */
import type { Scene } from 'composition-critic';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { color, compositionUi } from '@/ui/tokens';

import { sceneLines } from './scene';
import type { TechniqueId } from './techniques';

export function SceneLines({
  width,
  height,
  technique,
  scene,
  flip = false,
}: {
  width: number;
  height: number;
  technique: TechniqueId;
  scene: Scene | null | undefined;
  /** Ảnh không lật như chỗ vẽ (camera trước, tắt Lật ảnh camera trước): lật x. */
  flip?: boolean;
}) {
  const { lines, vp } = sceneLines(technique, scene, flip);
  if (lines.length === 0) return null;
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      {lines.map((l, i) => (
        <Line
          key={i}
          x1={l.a.x * width}
          y1={l.a.y * height}
          x2={l.b.x * width}
          y2={l.b.y * height}
          stroke={color.camInk}
          strokeWidth={compositionUi.accentStroke}
          strokeLinecap="round"
        />
      ))}
      {vp && (
        <Circle
          cx={vp.x * width}
          cy={vp.y * height}
          r={compositionUi.target / 2}
          stroke={color.camInk}
          strokeWidth={compositionUi.targetStroke}
          fill="none"
        />
      )}
    </Svg>
  );
}
