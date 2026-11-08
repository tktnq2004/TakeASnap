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
import { type SharedValue, useDerivedValue } from 'react-native-reanimated';

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
  /** Kích thước canvas; ảnh được đặt vừa (contain) và căn giữa. */
  width: number;
  height: number;
  outlineEnabled: boolean;
  outlineColor: string;
  /** px màn hình. */
  outlineWidth: Num;
  fillEnabled: boolean;
  fillColor: string;
  fillOpacity: Num;
  subjectOpacity: Num;
  backgroundOpacity: Num;
  /** Nét mặt: cùng màu viền, độ dày = FACE_RATIO × độ dày viền. */
  faceEnabled: boolean;
  /** Ống tay chân: cùng màu và độ dày viền, cắt theo bóng người. */
  limbsEnabled: boolean;
  /** Nền ô caro sau ảnh (Chỉnh pose). Tắt thì nền trong suốt. */
  checker?: boolean;
};

const CHECKER = 12;
/** Mắt, mũi, môi là chi tiết nhỏ: nét mặt mảnh hơn viền. */
const FACE_RATIO = 0.6;

/**
 * Vẽ một bản pose trên một canvas Skia (roadmap §3.4), từ dưới lên:
 * nền (ảnh cắt NGƯỢC theo viền) → người (ảnh cắt theo viền) → phủ (evenOdd, lỗ tay–thân trống)
 * → ống tay chân → nét mặt → viền. Viền, nét mặt và ống tay chân dùng chung màu và độ dày (góp ý
 * sau Phase 1: chỉnh chung trong tab Viền).
 * Các giá trị số nhận shared value để slider đổi hình mà không re-render React.
 */
export function PoseCanvas(p: PoseCanvasProps) {
  const ow = p.outlineWidth;
  const faceWidth = useDerivedValue(() => (typeof ow === 'number' ? ow : ow.get()) * FACE_RATIO);
  const image = useImage(p.source);
  const scale = Math.min(p.width / p.imageWidth, p.height / p.imageHeight);
  const w = p.imageWidth * scale;
  const h = p.imageHeight * scale;
  const ox = (p.width - w) / 2;
  const oy = (p.height - h) / 2;

  const path = useMemo(() => makePosePath(p.contours, w, h), [p.contours, w, h]);
  const facePath = useMemo(() => makeSegmentsPath(p.landmarks?.face, w, h), [p.landmarks, w, h]);
  const limbsPath = useMemo(() => makePolylinesPath(p.landmarks?.limbs, w, h), [p.landmarks, w, h]);
  const checker = useMemo(
    () => (p.checker ? makeCheckerPath(p.width, p.height, CHECKER) : null),
    [p.checker, p.width, p.height],
  );
  const box = { x: 0, y: 0, width: w, height: h };
  const line = {
    style: 'stroke' as const,
    strokeJoin: 'round' as const,
    strokeCap: 'round' as const,
  };

  return (
    <Canvas style={{ width: p.width, height: p.height }}>
      {checker && (
        <>
          <Rect x={0} y={0} width={p.width} height={p.height} color={color.checkerA} />
          <Path path={checker} color={color.checkerB} />
        </>
      )}
      <Group transform={[{ translateX: ox }, { translateY: oy }]}>
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
        {path && limbsPath && p.limbsEnabled && (
          <Group clip={path}>
            <Path path={limbsPath} color={p.outlineColor} strokeWidth={p.outlineWidth} {...line} />
          </Group>
        )}
        {facePath && p.faceEnabled && (
          <Path path={facePath} color={p.outlineColor} strokeWidth={faceWidth} {...line} />
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

/** Polyline phẳng [x, y, x, y, …] chuẩn hóa → SkPath nét, nối điểm bằng đường cong bậc hai. */
export function makePolylinesPath(
  lines: number[][] | null | undefined,
  width: number,
  height: number,
): SkPath | null {
  if (!lines || !lines.length) return null;
  const b = Skia.PathBuilder.Make();
  for (const l of lines) {
    if (l.length < 4) continue;
    const X = (i: number) => l[i]! * width;
    const Y = (i: number) => l[i + 1]! * height;
    b.moveTo(X(0), Y(0));
    // Đi qua trung điểm của từng cặp điểm, lấy điểm gốc làm điểm điều khiển → mượt, không gãy góc.
    for (let i = 2; i + 3 < l.length; i += 2) {
      b.quadTo(X(i), Y(i), (X(i) + X(i + 2)) / 2, (Y(i) + Y(i + 2)) / 2);
    }
    b.lineTo(X(l.length - 2), Y(l.length - 2));
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
