/**
 * Gợi ý từ cảm biến (business-flow §6.4): máy thẳng, góc thấp, selfie. Hàm thuần, chạy được
 * trên UI thread. Vector trọng lực theo quy ước của `level.ts` (iOS hướng xuống, Android hướng
 * lên); đổi về quy ước Android trước khi tính.
 */
import type { TechniqueId } from './techniques';

/**
 * Góc ngửa của ống kính so với mặt đất, độ. Dương = ống kính nhìn lên trên đường chân trời.
 * Camera sau nhìn ra sau lưng máy (−z), camera trước nhìn ra phía màn hình (+z).
 */
export function cameraPitchDeg(x: number, y: number, z: number, ios: boolean, front: boolean) {
  'worklet';
  const ux = ios ? -x : x;
  const uy = ios ? -y : y;
  const uz = ios ? -z : z;
  const along = front ? uz : -uz;
  return (Math.atan2(along, Math.sqrt(ux * ux + uy * uy)) * 180) / Math.PI;
}

export type SensorHintId =
  | 'level'
  | 'levelOk'
  | 'lowDown'
  | 'lowTooUp'
  | 'lowOk'
  | 'selfieFront'
  | 'selfieUp'
  | 'selfieDown'
  | 'selfieOk';

/** Ngưỡng (độ). Có độ trễ: vào một trạng thái ở ngưỡng chặt, ra ở ngưỡng lỏng, để không nhảy. */
export const SENSOR = {
  /** Máy nghiêng từ chừng này thì nhắc; về dưới `levelOut` thì thôi. */
  levelIn: 3,
  levelOut: 1.5,
  /** Góc thấp: ống kính ngửa lên trong khoảng này. */
  lowMin: 6,
  lowMax: 35,
  /** Selfie: camera trước nhìn xuống mặt trong khoảng này (âm = nhìn xuống). */
  selfieMin: -35,
  selfieMax: -6,
  hysteresis: 2,
} as const;

/**
 * Gợi ý cảm biến cho kỹ thuật đang chọn, hoặc null. `prev` là gợi ý lần trước (độ trễ).
 * Thứ tự ưu tiên: máy thẳng → góc thấp / selfie.
 */
export function sensorHint(
  tech: TechniqueId,
  rollDeg: number,
  pitchDeg: number,
  front: boolean,
  prev: SensorHintId | null,
): SensorHintId | null {
  'worklet';
  if (tech === 'off') return null;
  if (tech === 'selfie' && !front) return 'selfieFront';

  const roll = Math.abs(rollDeg);
  const tilted = prev === 'level' ? roll > SENSOR.levelOut : roll >= SENSOR.levelIn;
  if (tilted) return 'level';

  const m = SENSOR.hysteresis;
  if (tech === 'low' && !front) {
    // Đang đạt thì nới khoảng thêm `m` để rung không lặp khi tay run quanh ngưỡng.
    const ok = prev === 'lowOk' ? 1 : 0;
    if (pitchDeg < SENSOR.lowMin - ok * m) return 'lowDown';
    if (pitchDeg > SENSOR.lowMax + ok * m) return 'lowTooUp';
    return 'lowOk';
  }
  if (tech === 'selfie') {
    const ok = prev === 'selfieOk' ? 1 : 0;
    if (pitchDeg > SENSOR.selfieMax + ok * m) return 'selfieUp';
    if (pitchDeg < SENSOR.selfieMin - ok * m) return 'selfieDown';
    return 'selfieOk';
  }
  if (tech === 'horizon') return 'levelOk';
  return null;
}

/** Gợi ý này là trạng thái "đạt" (viên màu nhấn, rung một lần, tự ẩn). */
export const isAchieved = (h: SensorHintId) => h === 'levelOk' || h === 'lowOk' || h === 'selfieOk';
