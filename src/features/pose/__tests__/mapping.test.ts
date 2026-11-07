import {
  bboxOf,
  contoursToRows,
  poseToRow,
  rowsToContours,
  rowToPose,
  rowToStyle,
  styleToRow,
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

describe('style', () => {
  it('đi và về giữ nguyên', () => {
    const s = { ...DEFAULT_STYLE, outlineEnabled: false, fillOpacity: 0.73 };
    expect(rowToStyle(styleToRow('p1', s))).toEqual(s);
  });
});

describe('contours', () => {
  it('đi và về giữ nguyên, kể cả cờ lỗ và thứ tự', () => {
    const rows = contoursToRows('p1', contours);
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

describe('pose', () => {
  it('đi và về giữ nguyên', () => {
    const pose: Pose & { source: string } = {
      id: 'p1',
      origin: 'library',
      source: 'file:///poses/p1/source.jpg',
      width: 736,
      height: 981,
      contours,
      style: { ...DEFAULT_STYLE, subjectOpacity: 0.5 },
      sampleGroup: 'coffee',
      maskUri: null,
      createdAt: '2026-11-08T00:00:00.000Z',
      updatedAt: '2026-11-08T00:00:00.000Z',
    };
    const back = rowToPose(
      poseToRow(pose),
      styleToRow(pose.id, pose.style),
      contoursToRows(pose.id, pose.contours),
    );
    expect(back).toEqual(pose);
  });
});
