import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { color } from '@/ui/tokens';

import type { TechniqueId } from './techniques';

/** Hình nhỏ của một kỹ thuật (bảng Bố cục, thẻ học): khung + đường kẻ + chấm. */
export type IconKind = TechniqueId | 'auto';

export function TechniqueIcon({
  kind,
  width = 24,
  height = 30,
  ink = color.ink,
  accent = color.accent,
}: {
  kind: IconKind;
  width?: number;
  height?: number;
  ink?: string;
  accent?: string;
}) {
  const W = width;
  const H = height;
  const line = { stroke: ink, strokeOpacity: 0.45, strokeWidth: 1 };
  const thirds = [1, 2].flatMap((i) => [
    <Path key={`v${i}`} d={`M${(W * i) / 3} 1V${H - 1}`} {...line} />,
    <Path key={`h${i}`} d={`M1 ${(H * i) / 3}H${W - 1}`} {...line} />,
  ]);

  let body: React.ReactNode = null;
  switch (kind) {
    case 'off':
      body = (
        <Path
          d={`M6 ${H - 6}L${W - 6} 6`}
          stroke={ink}
          strokeOpacity={0.55}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      );
      break;
    case 'grid':
      body = thirds;
      break;
    case 'thirds':
      body = (
        <>
          {thirds}
          <Circle cx={W / 3} cy={H / 3} r={3} fill={accent} />
        </>
      );
      break;
    case 'center':
      body = (
        <>
          <Path d={`M${W / 2} 1V${H - 1}`} {...line} />
          <Circle cx={W / 2} cy={H / 3} r={3} fill={accent} />
        </>
      );
      break;
    case 'horizon':
      body = (
        <>
          <Path d={`M1 ${H / 3}H${W - 1}`} {...line} />
          <Path d={`M1 ${(2 * H) / 3}H${W - 1}`} stroke={accent} strokeWidth={2} />
        </>
      );
      break;
    case 'lead':
      body = (
        <>
          <Path
            d={`M3 ${H - 3}L${W / 3} ${H / 3}M${W - 3} ${H - 3}L${W / 3} ${H / 3}`}
            stroke={accent}
            strokeWidth={1.5}
          />
          <Circle cx={W / 3} cy={H / 3} r={2.5} fill={accent} />
        </>
      );
      break;
    case 'low':
      body = (
        <Path
          d={`M${W / 2} ${H - 5}V${H * 0.3}M${W / 2 - 4} ${H * 0.3 + 5}L${W / 2} ${H * 0.3}L${W / 2 + 4} ${H * 0.3 + 5}`}
          fill="none"
          stroke={accent}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
      break;
    case 'selfie':
      body = (
        <>
          <Circle cx={W / 2} cy={H * 0.42} r={5.5} fill="none" stroke={accent} strokeWidth={2} />
          <Path
            d={`M${W / 2 - 7} ${H - 5}Q${W / 2} ${H * 0.62} ${W / 2 + 7} ${H - 5}`}
            fill="none"
            stroke={accent}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </>
      );
      break;
    case 'group': {
      const pts = [
        [W * 0.28, H * 0.5],
        [W * 0.5, H * 0.32],
        [W * 0.72, H * 0.52],
      ] as const;
      body = (
        <>
          <Path
            d={`M${pts[0][0]} ${pts[0][1]}L${pts[1][0]} ${pts[1][1]}L${pts[2][0]} ${pts[2][1]}`}
            fill="none"
            stroke={accent}
            strokeOpacity={0.6}
            strokeWidth={1.2}
          />
          {pts.map(([x, y]) => (
            <Circle key={x} cx={x} cy={y} r={3} fill={accent} />
          ))}
        </>
      );
      break;
    }
    case 'auto': {
      const cx = W / 2;
      const cy = H / 2;
      const r = Math.min(W, H) * 0.3;
      body = (
        <Path
          d={`M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z`}
          fill={accent}
        />
      );
      break;
    }
  }

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Rect
        x={1}
        y={1}
        width={W - 2}
        height={H - 2}
        rx={5}
        fill="none"
        stroke={ink}
        strokeOpacity={0.55}
        strokeWidth={1.5}
      />
      {body}
    </Svg>
  );
}
