/**
 * Đặc trưng bố cục của một ảnh đã chụp (business-flow §6.5), rút từ kết quả tách người: khung
 * từng người, mắt, các khớp, hướng nhìn. Hàm thuần, tọa độ chuẩn hóa 0..1 theo ảnh.
 */
import type { Pt } from './guides';

/** Khớp MediaPipe Pose (33 điểm) dùng cho nhận xét. */
export const J = {
  nose: 0,
  eyeL: 2,
  eyeR: 5,
  shoulderL: 11,
  shoulderR: 12,
  elbowL: 13,
  elbowR: 14,
  wristL: 15,
  wristR: 16,
  hipL: 23,
  hipR: 24,
  kneeL: 25,
  kneeR: 26,
  ankleL: 27,
  ankleR: 28,
} as const;

export type Joint = { x: number; y: number; v: number };

export type PersonBox = {
  /** [x0, y0, x1, y1] chuẩn hóa. */
  box: [number, number, number, number];
  area: number;
};

export type PhotoFeatures = {
  /** Rộng / cao của ảnh. */
  aspect: number;
  /** Mọi người trong ảnh, trái sang phải. */
  people: PersonBox[];
  /** Chỉ số của người chính trong `people` (người có khung xương), -1 khi không có ai. */
  main: number;
  /** Giữa hai mắt của người chính, null khi không thấy rõ. */
  eye: Pt | null;
  /** 33 khớp của người chính, null khi không có khung xương. */
  joints: Joint[] | null;
  /** Người chính nhìn về phía nào của ảnh, null khi nhìn thẳng / không rõ. */
  facing: 'left' | 'right' | null;
  /**
   * Đầu từng người theo khung xương (nhóm người): giữa hai mắt, và cỡ người `scale` theo chiều cao
   * ảnh (thân vai → hông, không thấy hông thì 1,2 × bề ngang vai). Không thấy mắt / vai thì bỏ.
   */
  heads: Head[];
};

export type Head = { x: number; y: number; scale: number };

const MIN_VIS = 0.5;

export function jointsFrom(body: number[] | null | undefined): Joint[] | null {
  if (!body || body.length < 33 * 3) return null;
  const out: Joint[] = [];
  for (let i = 0; i < 33; i++)
    out.push({ x: body[i * 3]!, y: body[i * 3 + 1]!, v: body[i * 3 + 2]! });
  return out;
}

export const visible = (j: Joint | undefined) => !!j && j.v >= MIN_VIS;

/**
 * Hướng nhìn: mũi lệch hẳn khỏi giữa hai vai (quá 30% bề rộng vai) thì người đang nhìn về phía
 * đó. Vai quá hẹp (đứng nghiêng hẳn) thì không đoán.
 */
export function facingOf(joints: Joint[] | null): 'left' | 'right' | null {
  if (!joints) return null;
  const n = joints[J.nose];
  const a = joints[J.shoulderL];
  const b = joints[J.shoulderR];
  if (!visible(n) || !visible(a) || !visible(b)) return null;
  const w = Math.abs(a!.x - b!.x);
  if (w < 0.02) return null;
  const d = n!.x - (a!.x + b!.x) / 2;
  if (Math.abs(d) < 0.3 * w) return null;
  return d > 0 ? 'right' : 'left';
}

/**
 * Gom đặc trưng. `people` là khung theo ô lưới (`gridW` × `gridH`, x1/y1 không tính) như
 * `groupPeople`; `body` là 33 khớp phẳng [x, y, vis, …] chuẩn hóa của người đầu tiên.
 */
export function photoFeatures(input: {
  width: number;
  height: number;
  gridW: number;
  gridH: number;
  people: { bbox: [number, number, number, number]; areaRatio: number }[];
  body: number[] | null | undefined;
  /** Khung xương mọi người (người đầu tiên trùng `body`); không có thì chỉ dùng `body`. */
  bodies?: number[][] | null;
}): PhotoFeatures {
  const people: PersonBox[] = input.people.map((p) => ({
    box: [
      p.bbox[0] / input.gridW,
      p.bbox[1] / input.gridH,
      p.bbox[2] / input.gridW,
      p.bbox[3] / input.gridH,
    ],
    area: p.areaRatio,
  }));
  const joints = jointsFrom(input.body);
  const eyeL = joints?.[J.eyeL];
  const eyeR = joints?.[J.eyeR];
  const eye =
    visible(eyeL) && visible(eyeR)
      ? { x: (eyeL!.x + eyeR!.x) / 2, y: (eyeL!.y + eyeR!.y) / 2 }
      : null;

  // Người chính: khung chứa mũi / mắt của khung xương; không có thì người lớn nhất.
  let main = -1;
  const probe = eye ?? (visible(joints?.[J.nose]) ? joints![J.nose]! : null);
  if (probe) {
    main = people.findIndex(
      (p) =>
        probe.x >= p.box[0] && probe.x <= p.box[2] && probe.y >= p.box[1] && probe.y <= p.box[3],
    );
  }
  if (main < 0 && people.length) {
    main = people.reduce((best, p, i) => (p.area > people[best]!.area ? i : best), 0);
  }

  const aspect = input.width / input.height;
  const all = input.bodies?.length ? input.bodies : input.body ? [input.body] : [];
  const heads = all.flatMap((b) => {
    const h = headOf(jointsFrom(b), aspect);
    return h ? [h] : [];
  });

  return {
    aspect,
    people,
    main,
    eye,
    joints,
    facing: facingOf(joints),
    heads,
  };
}

/** Đầu của một khung xương; khoảng cách đo theo chiều cao ảnh (x nhân `aspect`). */
function headOf(j: Joint[] | null, aspect: number): Head | null {
  if (!j) return null;
  const eL = j[J.eyeL];
  const eR = j[J.eyeR];
  const sL = j[J.shoulderL];
  const sR = j[J.shoulderR];
  if (!visible(eL) || !visible(eR) || !visible(sL) || !visible(sR)) return null;
  const dist = (a: Joint, b: Joint) => Math.hypot((a.x - b.x) * aspect, a.y - b.y);
  const hL = j[J.hipL];
  const hR = j[J.hipR];
  let scale = 1.2 * dist(sL!, sR!);
  if (visible(hL) && visible(hR)) {
    const mid = (a: Joint, b: Joint) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, v: 1 });
    scale = dist(mid(sL!, sR!), mid(hL!, hR!));
  }
  if (!(scale > 0)) return null;
  return { x: (eL!.x + eR!.x) / 2, y: (eL!.y + eR!.y) / 2, scale };
}
