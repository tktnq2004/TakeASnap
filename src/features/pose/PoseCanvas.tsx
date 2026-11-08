import {
  Canvas,
  FillType,
  Group,
  Image,
  Path,
  Rect,
  Skia,
  type SkPath,
  useImage,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';
import type { SharedValue } from 'react-native-reanimated';

import { type Contour, contoursToSvgPath } from '@/engine/contour';
import type { Landmarks } from '@/engine/segmentation/types';
import { color } from '@/ui/tokens';

import type { ImageSource } from './types';

type Num = number | SharedValue<number>;

export type PoseCanvasProps = {
  source: ImageSource;
  /** Kích thước ảnh gốc (để giữ tỉ lệ). */
  imageWidth: number;
  imageHeight: number;
  contours: Contour[];
  landmarks: Landmarks | null;
  /** Kích thước canvas; ảnh căn giữa theo `fit`. */
  width: number;
  height: number;
  /**
   * `contain` (mặc định): cả ảnh nằm vừa trong canvas, hiện đầy đủ trên một màn hình (Chỉnh pose).
   * `cover`: ảnh phủ kín canvas, cắt bớt phần thừa (ô thư viện).
   */
  fit?: 'cover' | 'contain';
  outlineEnabled: boolean;
  outlineColor: string;
  /** px màn hình. */
  outlineWidth: Num;
  fillEnabled: boolean;
  fillColor: string;
  fillOpacity: Num;
  subjectOpacity: Num;
  backgroundOpacity: Num;
  /** Nét mặt: màu và độ dày riêng (góp ý lần 3). */
  faceEnabled: boolean;
  faceColor: string;
  /** px màn hình. */
  faceWidth: Num;
  /**
   * Nền ô caro cho vùng trong suốt (Chỉnh pose). Chỉ vẽ TRONG khung ảnh; phần canvas ngoài mép
   * ảnh để trơn, không lộ caro thừa (góp ý lần 4).
   */
  checker?: boolean;
};

const CHECKER = 12;

/**
 * Vẽ một bản pose trên một canvas Skia (roadmap §3.4), từ dưới lên:
 * nền (ảnh cắt NGƯỢC theo viền) → người (ảnh cắt theo viền) → phủ (evenOdd, lỗ tay–thân trống)
 * → nét mặt → viền. Viền và nét mặt chỉnh riêng (màu, độ dày), cùng nằm trong tab Viền.
 * Các giá trị số nhận shared value để slider đổi hình mà không re-render React.
 */
export function PoseCanvas(p: PoseCanvasProps) {
  const image = useImage(p.source);
  const sx = p.width / p.imageWidth;
  const sy = p.height / p.imageHeight;
  const scale = (p.fit ?? 'contain') === 'cover' ? Math.max(sx, sy) : Math.min(sx, sy);
  const w = p.imageWidth * scale;
  const h = p.imageHeight * scale;
  const ox = (p.width - w) / 2;
  const oy = (p.height - h) / 2;

  const path = useMemo(() => makePosePath(p.contours, w, h), [p.contours, w, h]);
  const facePath = useMemo(() => makeSegmentsPath(p.landmarks?.face, w, h), [p.landmarks, w, h]);
  const checker = useMemo(
    () => (p.checker ? makeCheckerPath(w, h, CHECKER) : null),
    [p.checker, w, h],
  );
  const box = { x: 0, y: 0, width: w, height: h };
  const line = {
    style: 'stroke' as const,
    strokeJoin: 'round' as const,
    strokeCap: 'round' as const,
  };

  return (
    <Canvas style={{ width: p.width, height: p.height }}>
      <Group transform={[{ translateX: ox }, { translateY: oy }]}>
        {checker && (
          <Group clip={Skia.XYWHRect(0, 0, w, h)}>
            <Rect x={0} y={0} width={w} height={h} color={color.checkerA} />
            <Path path={checker} color={color.checkerB} />
          </Group>
        )}
        {image && path && (
          <Group clip={path} invertClip>
            <Image image={image} {...box} fit="fill" opacity={p.backgroundOpacity} />
          </Group>
        )}
        {image && path && (
          <Group clip={path}>
            <Image image={image} {...box} fit="fill" opacity={p.subjectOpacity} />
          </Group>
        )}
        {path && p.fillEnabled && <Path path={path} color={p.fillColor} opacity={p.fillOpacity} />}
        {facePath && p.faceEnabled && (
          <Path path={facePath} color={p.faceColor} strokeWidth={p.faceWidth} {...line} />
        )}
        {path && p.outlineEnabled && (
          <Path path={path} color={p.outlineColor} strokeWidth={p.outlineWidth} {...line} />
        )}
      </Group>
    </Canvas>
  );
}

/** Viền chuẩn hóa → SkPath ở kích thước vẽ, fill rule evenOdd. */
export function makePosePath(contours: Contour[], width: number, height: number): SkPath | null {
  if (!contours.length || width <= 0 || height <= 0) return null;
  const raw = Skia.Path.MakeFromSVGString(contoursToSvgPath(contours, width, height));
  if (!raw) return null;
  return Skia.PathBuilder.MakeFromPath(raw).setFillType(FillType.EvenOdd).build();
}

/** Đoạn thẳng phẳng [x1, y1, x2, y2, …] chuẩn hóa → SkPath nét. */
export function makeSegmentsPath(
  segments: number[] | null | undefined,
  width: number,
  height: number,
): SkPath | null {
  if (!segments || segments.length < 4) return null;
  const b = Skia.PathBuilder.Make();
  for (let i = 0; i + 3 < segments.length; i += 4) {
    b.moveTo(segments[i]! * width, segments[i + 1]! * height);
    b.lineTo(segments[i + 2]! * width, segments[i + 3]! * height);
  }
  return b.build();
}

/** Các ô tối của nền caro gộp trong một path, vẽ một lần. */
function makeCheckerPath(width: number, height: number, cell: number): SkPath {
  const b = Skia.PathBuilder.Make();
  for (let y = 0, row = 0; y < height; y += cell, row++) {
    for (let x = row % 2 ? cell : 0; x < width; x += cell * 2) {
      b.addRect(Skia.XYWHRect(x, y, cell, cell));
    }
  }
  return b.build();
}
