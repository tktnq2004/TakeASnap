/**
 * Thẻ học bố cục (business-flow §6.6, design.md §6.15). Dữ liệu thuần: thứ tự thẻ, kỹ thuật bật
 * khi bấm Chụp thử, và hình minh họa đúng / sai (vẽ bằng SVG trong khung 90 × 120, tỉ lệ 3:4).
 * Chữ của từng thẻ ở `t.lessons.items` (src/ui/strings.ts).
 */
import type { TechniqueId } from './techniques';

export type LessonId =
  | 'thirds'
  | 'center'
  | 'fill'
  | 'headroom'
  | 'lookroom'
  | 'edges'
  | 'joints'
  | 'level'
  | 'low'
  | 'selfie'
  | 'lens'
  | 'group'
  | 'lead'
  | 'background'
  | 'frame'
  | 'foreground'
  | 'balance'
  | 'repetition'
  | 'light';

/** Khung hình minh họa. */
export const DIAGRAM = { w: 90, h: 120 } as const;

/** Một người vẽ đơn giản: tâm đầu (x, y), cỡ, hướng nhìn, chân dài / ngắn, tối (ngược sáng). */
export type Figure = {
  x: number;
  y: number;
  s?: number;
  facing?: 'left' | 'right';
  legs?: number;
  dark?: boolean;
};

export type Scene = {
  guides?: 'thirds' | 'center';
  people?: Figure[];
  /** Mặt cận (selfie, ống kính): tâm + bán kính. */
  face?: { x: number; y: number; r: number };
  /** Máy ảnh nhỏ nhìn về phía mặt (selfie). */
  phone?: { x: number; y: number };
  /** Chữ nhỏ ở góc (mức zoom). */
  label?: string;
  /** Chân trời: từ (0, y1) tới (90, y2). */
  horizon?: { y1: number; y2: number };
  /** Đường dẫn: các đoạn [x1, y1, x2, y2]. */
  lines?: [number, number, number, number][];
  /** Cột dọc từ trên xuống tới `to`. */
  pole?: { x: number; to: number };
  /** Mép khung cắt ngang chỗ này (dấu ở mép dưới). */
  cut?: { y: number };
  /** Khung trong khung. */
  inner?: { x: number; y: number; w: number; h: number };
  /** Lá ở góc dưới trái (tiền cảnh). */
  leaves?: boolean;
  /** Nền sáng chói (ngược sáng). */
  bright?: boolean;
  /** Hai lớp đồi xa phía sau (chiều sâu). */
  layers?: boolean;
  /** Vật nhỏ cân lại người (cân bằng): con bướm. */
  object?: { x: number; y: number };
  /** Tam giác nối các đầu (nhóm). */
  triangle?: boolean;
};

/**
 * Nguồn ghi bằng chữ (tên bài + nơi đăng), không có link: app chạy offline (phiếu Phase 5 lần 5).
 * Link đầy đủ nằm trong docs/composition.md. Tên bài giữ nguyên tiếng Anh như bản gốc.
 */
export type Source = { title: string; by: string };

export type Lesson = {
  id: LessonId;
  /** Có hướng dẫn trên Camera ở bản hiện tại (dòng trong bảng Bố cục). */
  onCamera: boolean;
  /** Kỹ thuật bật khi bấm Chụp thử. Thẻ chỉ đọc mở lưới 3×3. */
  tryTechnique: TechniqueId;
  /** Nguồn (lấy từ docs/composition.md). */
  sources: readonly Source[];
  wrong: Scene;
  right: Scene;
};

export const LESSONS: readonly Lesson[] = [
  {
    id: 'thirds',
    onCamera: true,
    tryTechnique: 'thirds',
    sources: [
      {
        title: '3 portrait composition tips for framing your subject perfectly',
        by: 'Photography Mad',
      },
      {
        title: 'Evaluating the rule of thirds in photographs and paintings',
        by: 'Amirshahi và cộng sự, Art & Perception, 2014',
      },
    ],
    wrong: { guides: 'thirds', people: [{ x: 45, y: 46 }] },
    right: { guides: 'thirds', people: [{ x: 30, y: 40 }] },
  },
  {
    id: 'center',
    onCamera: true,
    tryTechnique: 'center',
    sources: [
      {
        title: 'Evaluating the rule of thirds in photographs and paintings',
        by: 'Amirshahi và cộng sự, Art & Perception, 2014',
      },
      { title: 'Aesthetics of spatial composition', by: 'Palmer lab, UC Berkeley' },
    ],
    wrong: { guides: 'center', people: [{ x: 36, y: 40 }] },
    right: { guides: 'center', people: [{ x: 45, y: 40 }] },
  },
  {
    id: 'fill',
    onCamera: true,
    tryTechnique: 'fill',
    sources: [
      { title: '30 photography composition techniques', by: 'Imaginated' },
      { title: "Wildlife photography when you can't fill the frame", by: 'Adorama' },
    ],
    wrong: { people: [{ x: 45, y: 60, s: 0.6 }] },
    right: { people: [{ x: 45, y: 40, s: 2.4 }] },
  },
  {
    id: 'headroom',
    onCamera: false,
    tryTechnique: 'thirds',
    sources: [{ title: 'Headroom (photographic framing)', by: 'Wikipedia' }],
    wrong: { guides: 'thirds', people: [{ x: 45, y: 72, s: 0.7 }] },
    right: { guides: 'thirds', people: [{ x: 45, y: 40, s: 1.1 }] },
  },
  {
    id: 'lookroom',
    onCamera: false,
    tryTechnique: 'thirds',
    sources: [{ title: 'Headroom', by: 'Photography Icon' }],
    wrong: { guides: 'thirds', people: [{ x: 66, y: 40, facing: 'right' }] },
    right: { guides: 'thirds', people: [{ x: 28, y: 40, facing: 'right' }] },
  },
  {
    id: 'edges',
    onCamera: false,
    tryTechnique: 'grid',
    sources: [{ title: 'Photography tips for landscapes with people in them', by: 'PetaPixel' }],
    wrong: { people: [{ x: 6, y: 40 }] },
    right: { people: [{ x: 32, y: 40 }] },
  },
  {
    id: 'joints',
    onCamera: false,
    tryTechnique: 'grid',
    sources: [
      { title: 'How to crop portraits: an essential guide', by: 'PhotographyTalk' },
      {
        title: 'Portrait cropping guide: bad portrait crops and how to fix them',
        by: 'SLR Lounge',
      },
    ],
    // Gối ở 6,7u = 43,6·s dưới tâm đầu; giữa đùi ở 5,9u = 38,4·s (figurePath).
    wrong: { people: [{ x: 45, y: 120 - 43.6 * 1.6, s: 1.6 }], cut: { y: 120 } },
    right: { people: [{ x: 45, y: 120 - 38.4 * 1.6, s: 1.6 }], cut: { y: 120 } },
  },
  {
    id: 'level',
    onCamera: true,
    tryTechnique: 'horizon',
    sources: [
      {
        title: "In portrait photography, beware lines intersecting your subject's head",
        by: 'PetaPixel, 2022',
      },
    ],
    wrong: { horizon: { y1: 66, y2: 86 }, people: [{ x: 30, y: 40 }] },
    right: { guides: 'thirds', horizon: { y1: 80, y2: 80 }, people: [{ x: 30, y: 40 }] },
  },
  {
    id: 'low',
    onCamera: true,
    tryTechnique: 'low',
    sources: [
      { title: '30 photography composition techniques', by: 'Imaginated' },
      { title: 'Low angle shot', by: 'Adorama' },
      { title: 'Low angle photography without kneeling', by: 'iPhotography' },
    ],
    wrong: { people: [{ x: 45, y: 30, s: 1.1, legs: 0.6 }] },
    right: { people: [{ x: 45, y: 18, s: 1.1, legs: 1.3 }] },
  },
  {
    id: 'selfie',
    onCamera: true,
    tryTechnique: 'selfie',
    sources: [{ title: 'Take better selfies', by: 'Popular Science' }],
    wrong: { face: { x: 40, y: 60, r: 18 }, phone: { x: 74, y: 100 } },
    right: { face: { x: 40, y: 60, r: 18 }, phone: { x: 74, y: 22 } },
  },
  {
    id: 'lens',
    onCamera: false,
    tryTechnique: 'grid',
    sources: [
      {
        title: 'Why people look different in photos taken with different lenses',
        by: 'How-To Geek',
      },
      { title: 'How you can take better portrait pictures on your smartphone', by: 'PhoneArena' },
    ],
    wrong: { face: { x: 45, y: 62, r: 34 }, label: '0,5×' },
    right: { people: [{ x: 45, y: 34, s: 1.3 }], label: '2×' },
  },
  {
    id: 'group',
    onCamera: true,
    tryTechnique: 'group',
    sources: [{ title: 'Group photos', by: 'Daily Photo Tips' }],
    wrong: {
      people: [
        { x: 22, y: 42, s: 0.8 },
        { x: 45, y: 42, s: 0.8 },
        { x: 68, y: 42, s: 0.8 },
      ],
    },
    right: {
      people: [
        { x: 22, y: 50, s: 0.8 },
        { x: 45, y: 34, s: 0.8 },
        { x: 68, y: 50, s: 0.8 },
      ],
      triangle: true,
    },
  },
  {
    id: 'lead',
    onCamera: true,
    tryTechnique: 'lead',
    sources: [{ title: '30 photography composition techniques', by: 'Imaginated' }],
    wrong: {
      lines: [
        [8, 120, 76, 46],
        [60, 120, 76, 46],
      ],
      people: [{ x: 24, y: 46, s: 0.8 }],
    },
    right: {
      lines: [
        [6, 120, 30, 50],
        [84, 120, 30, 50],
      ],
      people: [{ x: 30, y: 40, s: 0.8 }],
    },
  },
  {
    id: 'background',
    onCamera: false,
    tryTechnique: 'grid',
    sources: [
      {
        title: "In portrait photography, beware lines intersecting your subject's head",
        by: 'PetaPixel, 2022',
      },
      { title: 'A common, easily fixed mistake in portrait photography', by: 'Fstoppers' },
    ],
    wrong: { pole: { x: 45, to: 38 }, people: [{ x: 45, y: 44 }] },
    right: { pole: { x: 72, to: 120 }, people: [{ x: 34, y: 44 }] },
  },
  {
    id: 'frame',
    onCamera: false,
    tryTechnique: 'grid',
    sources: [{ title: 'Frame within a frame', by: 'Imaginated' }],
    wrong: { people: [{ x: 45, y: 40 }] },
    right: { inner: { x: 16, y: 14, w: 58, h: 106 }, people: [{ x: 45, y: 40, s: 0.9 }] },
  },
  {
    id: 'foreground',
    onCamera: false,
    tryTechnique: 'grid',
    sources: [{ title: '30 photography composition techniques', by: 'Imaginated' }],
    wrong: { people: [{ x: 50, y: 40 }] },
    right: { layers: true, leaves: true, people: [{ x: 50, y: 40 }] },
  },
  {
    id: 'balance',
    onCamera: false,
    tryTechnique: 'thirds',
    sources: [{ title: '30 photography composition techniques', by: 'Imaginated' }],
    wrong: { guides: 'thirds', people: [{ x: 30, y: 44 }] },
    right: { guides: 'thirds', people: [{ x: 30, y: 44 }], object: { x: 68, y: 30 } },
  },
  {
    id: 'repetition',
    onCamera: false,
    tryTechnique: 'grid',
    sources: [{ title: '30 photography composition techniques', by: 'Imaginated' }],
    wrong: { people: [{ x: 45, y: 46 }] },
    right: {
      people: [12, 25, 38, 51, 64, 77].map((x) => ({ x, y: 70, s: 0.42 })),
    },
  },
  {
    id: 'light',
    onCamera: false,
    tryTechnique: 'grid',
    sources: [{ title: 'How to improve your smartphone photography', by: 'Engadget' }],
    wrong: { bright: true, people: [{ x: 45, y: 40, dark: true }] },
    right: { people: [{ x: 45, y: 40 }] },
  },
];

export const lessonById = (id: string): Lesson | undefined => LESSONS.find((l) => l.id === id);
