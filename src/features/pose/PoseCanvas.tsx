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
  /** Kích thước canvas; ảnh căn giữa theo `fit`. */
  width: number;
  height: number;
  /**
   * `cover` (mặc định): ảnh phủ kín canvas, không lộ nền thừa (góp ý lần 4).
   * `contain`: cả ảnh nằm vừa trong canvas (dùng cho overlay camera sau này).
   */
  fit?: 'cover' | 'contain';
  /** Kéo/phóng từ usePanZoom (Chỉnh pose). Không có thì ảnh đứng yên ở giữa. */
  view?: { tx: SharedValue<number>; ty: SharedValue<number>; zoom: SharedValue<number> };
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
  /** Nền ô caro sau ảnh (Chỉnh pose). Tắt thì nền trong suốt. */
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
  const scale = (p.fit ?? 'cover') === 'cover' ? Math.max(sx, sy) : Math.min(sx, sy);
  const w = p.imageWidth * scale;
  const h = p.imageHeight * scale;
  const W = p.width;
  const H = p.height;
  const view = p.view;
  const ow = p.outlineWidth;
  const fw = p.faceWidth;

  // Ảnh có tâm lệch (tx, ty) so với tâm canvas, phóng `zoom` lần so với kích thước w × h.
  const transform = useDerivedValue(() => {
    const z = view ? view.zoom.get() : 1;
    const x = W / 2 + (view ? view.tx.get() : 0) - (w * z) / 2;
    const y = H / 2 + (view ? view.ty.get() : 0) - (h * z) / 2;
    return [{ translateX: x }, { translateY: y }, { scale: z }];
  });
  // Nét tính theo px màn hình: chia cho mức phóng để không to lên khi phóng.
  const outlineStroke = useDerivedValue(
    () => (typeof ow === 'number' ? ow : ow.get()) / (view ? view.zoom.get() : 1),
  );
  const faceStroke = useDerivedValue(
    () => (typeof fw === 'number' ? fw : fw.get()) / (view ? view.zoom.get() : 1),
  );

  const path = useMemo(() => makePosePath(p.contours, w, h), [p.contours, w, h]);
  const facePath = useMemo(() => makeSegmentsPath(p.landmarks?.face, w, h), [p.landmarks, w, h]);
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
      <Group transform={transform}>
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
          <Path path={facePath} color={p.faceColor} strokeWidth={faceStroke} {...line} />
        )}
        {path && p.outlineEnabled && (
          <Path path={path} color={p.outlineColor} strokeWidth={outlineStroke} {...line} />
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
