/**
 * 25 ảnh pose mẫu (assets/poses/source). Phase 1 sẽ tách sẵn mask + contour cho từng ảnh.
 * Nhóm khớp với t.library.groups trong src/ui/strings.ts.
 */
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
