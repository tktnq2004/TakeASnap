/**
 * 25 ảnh pose mẫu (assets/poses/source) và viền đã tách sẵn (assets/poses/samples.json).
 * Nhóm khớp với t.library.groups trong src/ui/strings.ts.
 */
import type { Contour } from '@/engine/contour';

import samplesJson from '../../../assets/poses/samples.json';
import { DEFAULT_STYLE, type Pose, SAMPLE_PREFIX } from './types';

export type SampleGroup = 'coffee' | 'school' | 'street' | 'travel';

export type SamplePose = { id: string; group: SampleGroup; source: number };

export const samplePoses: SamplePose[] = [
  {
    id: 'coffee1',
    group: 'coffee',
    source: require('../../../assets/poses/source/coffee/coffee1.jpg'),
  },
  {
    id: 'coffee2',
    group: 'coffee',
    source: require('../../../assets/poses/source/coffee/coffee2.jpg'),
  },
  {
    id: 'coffee3',
    group: 'coffee',
    source: require('../../../assets/poses/source/coffee/coffee3.jpg'),
  },
  {
    id: 'coffee4',
    group: 'coffee',
    source: require('../../../assets/poses/source/coffee/coffee4.jpg'),
  },
  {
    id: 'coffee5',
    group: 'coffee',
    source: require('../../../assets/poses/source/coffee/coffee5.jpg'),
  },
  {
    id: 'coffee6',
    group: 'coffee',
    source: require('../../../assets/poses/source/coffee/coffee6.jpg'),
  },
  {
    id: 'school1',
    group: 'school',
    source: require('../../../assets/poses/source/school/school1.jpg'),
  },
  {
    id: 'school2',
    group: 'school',
    source: require('../../../assets/poses/source/school/school2.jpg'),
  },
  {
    id: 'school3',
    group: 'school',
    source: require('../../../assets/poses/source/school/school3.jpg'),
  },
  {
    id: 'school4',
    group: 'school',
    source: require('../../../assets/poses/source/school/school4.jpg'),
  },
  {
    id: 'school5',
    group: 'school',
    source: require('../../../assets/poses/source/school/school5.jpg'),
  },
  {
    id: 'street1',
    group: 'street',
    source: require('../../../assets/poses/source/street/street1.jpg'),
  },
  {
    id: 'street2',
    group: 'street',
    source: require('../../../assets/poses/source/street/street2.jpg'),
  },
  {
    id: 'street3',
    group: 'street',
    source: require('../../../assets/poses/source/street/street3.jpg'),
  },
  {
    id: 'street4',
    group: 'street',
    source: require('../../../assets/poses/source/street/street4.jpg'),
  },
  {
    id: 'street5',
    group: 'street',
    source: require('../../../assets/poses/source/street/street5.jpg'),
  },
  {
    id: 'street6',
    group: 'street',
    source: require('../../../assets/poses/source/street/street6.jpg'),
  },
  {
    id: 'street7',
    group: 'street',
    source: require('../../../assets/poses/source/street/street7.jpg'),
  },
  {
    id: 'travel1',
    group: 'travel',
    source: require('../../../assets/poses/source/travel/travel1.jpg'),
  },
  {
    id: 'travel2',
    group: 'travel',
    source: require('../../../assets/poses/source/travel/travel2.jpg'),
  },
  {
    id: 'travel3',
    group: 'travel',
    source: require('../../../assets/poses/source/travel/travel3.jpg'),
  },
  {
    id: 'travel4',
    group: 'travel',
    source: require('../../../assets/poses/source/travel/travel4.jpg'),
  },
  {
    id: 'travel5',
    group: 'travel',
    source: require('../../../assets/poses/source/travel/travel5.jpg'),
  },
  {
    id: 'travel6',
    group: 'travel',
    source: require('../../../assets/poses/source/travel/travel6.jpg'),
  },
  {
    id: 'travel7',
    group: 'travel',
    source: require('../../../assets/poses/source/travel/travel7.jpg'),
  },
];

// ---- Pose mẫu đã tách sẵn (scripts/build-sample-poses.mts → assets/poses/samples.json) ----

type SampleJson = {
  items: {
    id: string;
    group: SampleGroup;
    width: number;
    height: number;
    areaRatio: number;
    contours: { isHole: boolean; points: [number, number][] }[];
    face?: number[] | null;
    bodyPoints?: number[] | null;
    limbs?: number[][];
  }[];
};

const sourceById = new Map(samplePoses.map((s) => [s.id, s.source]));

/** 25 pose mẫu chỉ đọc (BR-09), theo thứ tự nhóm rồi số. */
export const sampleLibrary: Pose[] = (samplesJson as unknown as SampleJson).items.flatMap((it) => {
  const source = sourceById.get(it.id);
  if (source === undefined) return [];
  const contours: Contour[] = it.contours.map((c) => ({
    isHole: c.isHole,
    points: c.points.map(([x, y]) => ({ x, y })),
  }));
  return [
    {
      id: SAMPLE_PREFIX + it.id,
      photoId: SAMPLE_PREFIX + it.id,
      origin: 'sample' as const,
      sampleId: it.id,
      source,
      width: it.width,
      height: it.height,
      contours,
      landmarks: {
        face: it.face ?? null,
        bodyPoints: it.bodyPoints ?? null,
        limbs: it.limbs ?? null,
      },
      style: DEFAULT_STYLE,
      sampleGroup: it.group,
      maskUri: null,
      createdAt: '1970-01-01T00:00:00.000Z',
      updatedAt: '1970-01-01T00:00:00.000Z',
    },
  ];
});

export const sampleGroups: SampleGroup[] = ['coffee', 'school', 'street', 'travel'];
