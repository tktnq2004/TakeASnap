import {
  Canvas,
  FillType,
  Group,
  Image,
  Path,
  Skia,
  type SkPath,
  useImage,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';
import type { SharedValue } from 'react-native-reanimated';

import { type Contour, contoursToSvgPath } from '@/engine/contour';

import type { ImageSource } from './types';

type Num = number | SharedValue<number>;

type Props = {
  source: ImageSource;
  /** Kích thước ảnh gốc (để giữ tỉ lệ). */
  imageWidth: number;
  imageHeight: number;
  contours: Contour[];
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
  /** Đặt ảnh gốc mờ 30% phía sau để so (chip "Xem trên ảnh gốc", design.md §6.4). */
  showOriginal?: boolean;
};

/**
 * Vẽ pose 3 lớp trên một canvas Skia (roadmap §3.4), từ dưới lên:
 * người (ảnh cắt theo viền) → phủ (tô viền, evenOdd để lỗ tay–thân trống) → viền (nét).
 * Các giá trị số nhận shared value để slider đổi hình mà không re-render React.
 */
export function PoseCanvas(p: Props) {
  const image = useImage(p.source);
  const scale = Math.min(p.width / p.imageWidth, p.height / p.imageHeight);
  const w = p.imageWidth * scale;
  const h = p.imageHeight * scale;
  const ox = (p.width - w) / 2;
  const oy = (p.height - h) / 2;

  const path = useMemo(() => makePosePath(p.contours, w, h), [p.contours, w, h]);
  const box = { x: 0, y: 0, width: w, height: h };

  return (
    <Canvas style={{ width: p.width, height: p.height }}>
      <Group transform={[{ translateX: ox }, { translateY: oy }]}>
        {image && p.showOriginal && <Image image={image} {...box} fit="fill" opacity={0.3} />}
        {image && path && (
          <Group clip={path}>
            <Image image={image} {...box} fit="fill" opacity={p.subjectOpacity} />
          </Group>
        )}
        {path && p.fillEnabled && <Path path={path} color={p.fillColor} opacity={p.fillOpacity} />}
        {path && p.outlineEnabled && (
          <Path
            path={path}
            color={p.outlineColor}
            style="stroke"
            strokeWidth={p.outlineWidth}
            strokeJoin="round"
            strokeCap="round"
          />
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
