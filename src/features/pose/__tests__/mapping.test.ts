import {
  bboxOf,
  contoursToRows,
  poseToPhotoRow,
  poseToVariantRow,
  rowsToContours,
  rowsToPose,
  rowToStyle,
  type VariantRow,
} from '../mapping';
import { DEFAULT_STYLE, type Pose } from '../types';

const contours = [
  {
    isHole: false,
    points: [
      { x: 0.2, y: 0.1 },
      { x: 0.8, y: 0.1 },
      { x: 0.5, y: 0.9 },
    ],
  },
  {
    isHole: true,
    points: [
      { x: 0.4, y: 0.3 },
      { x: 0.6, y: 0.3 },
      { x: 0.5, y: 0.5 },
    ],
  },
];

const pose: Pose & { source: string } = {
  id: 'v1',
  photoId: 'ph1',
  origin: 'library',
  sampleId: 'coffee2',
  source: 'file:///poses/ph1/source.jpg',
  width: 736,
  height: 981,
  contours,
  landmarks: { face: [0.1, 0.2, 0.3, 0.4], body: null },
  sampleGroup: 'coffee',
  maskUri: null,
  style: {
    ...DEFAULT_STYLE,
    subjectOpacity: 0.5,
    backgroundOpacity: 0.25,
    bodyEnabled: true,
    linesWidth: 3.5,
  },
  createdAt: '2026-11-08T00:00:00.000Z',
  updatedAt: '2026-11-08T01:00:00.000Z',
};

describe('pose ↔ dòng SQLite', () => {
  it('đi và về giữ nguyên, kể cả nét mặt, khung xương và style mới', () => {
    const back = rowsToPose(
      poseToPhotoRow(pose),
      poseToVariantRow(pose),
      contoursToRows(pose.photoId, pose.contours),
    );
    expect(back).toEqual(pose);
  });

  it('ảnh và bản pose là hai dòng khác nhau', () => {
    expect(poseToPhotoRow(pose).id).toBe('ph1');
    expect(poseToVariantRow(pose).photo_id).toBe('ph1');
    expect(poseToVariantRow(pose).id).toBe('v1');
  });

  it('dữ liệu chép từ v2 (thiếu cột mới) nhận giá trị mặc định', () => {
    const old = {
      ...poseToVariantRow(pose),
      background_opacity: undefined,
      lines_color: undefined,
      lines_width: undefined,
    } as unknown as VariantRow;
    const s = rowToStyle(old);
    expect(s.backgroundOpacity).toBe(DEFAULT_STYLE.backgroundOpacity);
    expect(s.linesColor).toBe(DEFAULT_STYLE.linesColor);
    expect(s.linesWidth).toBe(DEFAULT_STYLE.linesWidth);
  });
});

describe('contours', () => {
  it('đi và về giữ nguyên, kể cả cờ lỗ và thứ tự', () => {
    const rows = contoursToRows('ph1', contours);
    expect(rowsToContours([...rows].reverse())).toEqual(contours);
  });
});

describe('bboxOf', () => {
  it('chỉ tính đường bao ngoài', () => {
    const b = bboxOf(contours);
    expect(b.x).toBeCloseTo(0.2);
    expect(b.y).toBeCloseTo(0.1);
    expect(b.w).toBeCloseTo(0.6);
    expect(b.h).toBeCloseTo(0.8);
  });
  it('không có viền → cả ảnh', () => {
    expect(bboxOf([])).toEqual({ x: 0, y: 0, w: 1, h: 1 });
  });
});
