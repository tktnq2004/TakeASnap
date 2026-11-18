import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { color, type } from '@/ui/tokens';

import { DIAGRAM, type Figure, type Scene } from './lessons';

const { w: W, h: H } = DIAGRAM;

/**
 * Người vẽ kiểu biểu tượng (phiếu Phase 5 lần 4: bản thân hình thang trông thô): đầu tròn, thân,
 * tay, chân là các nét bo tròn đầu, cùng một màu đặc. Tọa độ theo tâm đầu, cỡ `s`; gối nằm
 * khoảng 47·s dưới tâm đầu, hông 32·s.
 */
function person(f: Figure, ok: boolean, i: number) {
  const s = f.s ?? 1;
  const legs = f.legs ?? 1;
  const { x, y } = f;
  const hip = y + 32 * s;
  const foot = hip + 30 * s * legs;
  const fill = f.dark ? color.surface : color.ink;
  const dir = f.facing === 'right' ? 1 : f.facing === 'left' ? -1 : 0;
  const limb = { stroke: fill, strokeLinecap: 'round' as const, fill: 'none' };
  return (
    <G key={i}>
      <G opacity={f.dark ? 1 : 0.88}>
        {/* Hai chân hơi choãi, hai tay buông dọc thân. */}
        <Path d={`M${x - 2.6 * s} ${hip}L${x - 4 * s} ${foot}`} {...limb} strokeWidth={4.6 * s} />
        <Path d={`M${x + 2.6 * s} ${hip}L${x + 4 * s} ${foot}`} {...limb} strokeWidth={4.6 * s} />
        <Path
          d={`M${x - 6 * s} ${y + 12 * s}L${x - 9 * s} ${y + 29 * s}`}
          {...limb}
          strokeWidth={3.6 * s}
        />
        <Path
          d={`M${x + 6 * s} ${y + 12 * s}L${x + 9 * s} ${y + 29 * s}`}
          {...limb}
          strokeWidth={3.6 * s}
        />
        <Path d={`M${x} ${y + 12 * s}L${x} ${hip - 1 * s}`} {...limb} strokeWidth={10 * s} />
        <Circle cx={x} cy={y} r={5.6 * s} fill={fill} />
        {dir !== 0 && (
          <Path
            d={`M${x + dir * 5 * s} ${y - 1.6 * s}L${x + dir * 7.6 * s} ${y + 0.8 * s}L${x + dir * 5 * s} ${y + 2 * s}Z`}
            fill={fill}
          />
        )}
      </G>
      {dir !== 0 && (
        <Path
          d={`M${x + dir * 10 * s} ${y}H${x + dir * 26 * s}`}
          stroke={ok ? color.accent : color.danger}
          strokeWidth={1.5}
          strokeDasharray={[3, 3]}
        />
      )}
    </G>
  );
}

/**
 * Hình minh họa một thẻ học (design.md §6.15): khung 3:4 vẽ cảnh đơn giản. `ok` tô màu nhấn cho
 * phần đạt, màu đỏ nhạt cho phần chưa đạt.
 */
export function LessonDiagram({ scene, ok, width }: { scene: Scene; ok: boolean; width: number }) {
  const mark = ok ? color.accent : color.danger;
  const guide = { stroke: color.muted, strokeOpacity: 0.55, strokeWidth: 0.8 };
  const height = (width * H) / W;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={0} y={0} width={W} height={H} fill={scene.bright ? color.ink : color.surfaceAlt} />

      {scene.guides === 'thirds' &&
        [1, 2].map((k) => (
          <G key={k}>
            <Path d={`M${(W * k) / 3} 0V${H}`} {...guide} />
            <Path d={`M0 ${(H * k) / 3}H${W}`} {...guide} />
          </G>
        ))}
      {scene.guides === 'center' && <Path d={`M${W / 2} 0V${H}`} {...guide} />}

      {scene.horizon && (
        <Path
          d={`M0 ${scene.horizon.y1}L${W} ${scene.horizon.y2}`}
          stroke={mark}
          strokeWidth={2}
        />
      )}
      {scene.lines?.map(([x1, y1, x2, y2], i) => (
        <Path key={i} d={`M${x1} ${y1}L${x2} ${y2}`} stroke={mark} strokeWidth={2} />
      ))}
      {scene.pole && (
        <Path
          d={`M${scene.pole.x} 0V${scene.pole.to}`}
          stroke={ok ? color.muted : color.danger}
          strokeWidth={3}
        />
      )}
      {scene.inner && (
        <Rect
          x={scene.inner.x}
          y={scene.inner.y}
          width={scene.inner.w}
          height={scene.inner.h}
          rx={scene.inner.w / 2}
          fill="none"
          stroke={color.muted}
          strokeWidth={5}
        />
      )}

      {scene.people?.map((f, i) => person(f, ok, i))}

      {scene.triangle && scene.people && (
        <Path
          d={`M${scene.people.map((p) => `${p.x} ${p.y}`).join('L')}Z`}
          fill="none"
          stroke={mark}
          strokeWidth={1.2}
          strokeDasharray={[3, 3]}
        />
      )}

      {scene.face && (
        <G>
          <Circle
            cx={scene.face.x}
            cy={scene.face.y}
            r={scene.face.r}
            fill={color.ink}
            fillOpacity={0.85}
          />
          {[-1, 1].map((d) => (
            <Circle
              key={d}
              cx={scene.face!.x + d * scene.face!.r * 0.35}
              cy={scene.face!.y - scene.face!.r * 0.15}
              r={Math.max(1.5, scene.face!.r * 0.08)}
              fill={color.surfaceAlt}
            />
          ))}
        </G>
      )}
      {scene.phone && scene.face && (
        <G>
          <Path
            d={`M${scene.phone.x} ${scene.phone.y}L${scene.face.x + scene.face.r * 0.6} ${scene.face.y}`}
            stroke={mark}
            strokeWidth={1.5}
            strokeDasharray={[3, 3]}
          />
          <Rect
            x={scene.phone.x - 5}
            y={scene.phone.y - 8}
            width={10}
            height={16}
            rx={2}
            fill={mark}
          />
        </G>
      )}

      {scene.leaves && (
        <G>
          <Ellipse cx={6} cy={112} rx={18} ry={7} fill={color.muted} transform="rotate(-35 6 112)" />
          <Ellipse cx={14} cy={120} rx={16} ry={6} fill={color.faint} transform="rotate(-15 14 120)" />
        </G>
      )}

      {scene.cut && (
        <Path d={`M0 ${scene.cut.y - 1.5}H${W}`} stroke={mark} strokeWidth={3} />
      )}

      {scene.label && (
        <SvgText
          x={W - 6}
          y={14}
          textAnchor="end"
          fontSize={11}
          fontFamily={type.label.fontFamily}
          fill={scene.bright ? color.bg : color.ink}
        >
          {scene.label}
        </SvgText>
      )}
    </Svg>
  );
}
