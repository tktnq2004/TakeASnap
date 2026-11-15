import { nextOpacity } from '../cameraStore';
import {
  clampRailTop,
  formatPercent,
  opacityFromDrag,
  railLeft,
  railTopFromY,
  railYFromTop,
  snapSide,
} from '../rail';
import {
  crossedPreset,
  factorFromTape,
  presetIndex,
  tapeOffset,
  TAPE_PX_PER_DOUBLING,
} from '../zoom';

jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: { getItemSync: () => null, setItemSync: () => {}, removeItemSync: () => {} },
}));

const frame = { x: 0, y: 112, width: 390, height: 520 };

describe('cột công cụ', () => {
  it('thả chậm thì dính mép gần hơn', () => {
    expect(snapSide(100, 0, 390)).toBe('left');
    expect(snapSide(300, 0, 390)).toBe('right');
  });

  it('quăng nhanh thì dính mép theo hướng quăng', () => {
    expect(snapSide(300, -2000, 390)).toBe('left');
    expect(snapSide(100, 2000, 390)).toBe('right');
  });

  it('mép trái của cột theo bên', () => {
    expect(railLeft('left', frame, 52, 6)).toBe(6);
    expect(railLeft('right', frame, 52, 6)).toBe(390 - 52 - 6);
  });

  it('luôn nằm trong khung ngắm', () => {
    expect(clampRailTop(0, frame, 264, 6)).toBe(118);
    expect(clampRailTop(9999, frame, 264, 6)).toBe(112 + 520 - 264 - 6);
    expect(clampRailTop(300, frame, 264, 6)).toBe(300);
  });

  it('khung thấp hơn cột thì đặt giữa khung', () => {
    const short = { ...frame, height: 200 };
    expect(clampRailTop(0, short, 264, 6)).toBe(112 + (200 - 264) / 2);
  });

  it('lưu rồi đọc lại vị trí ra đúng chỗ', () => {
    const top = railTopFromY(0.3, frame, 264, 6);
    expect(railYFromTop(top, frame, 264)).toBeCloseTo(0.3);
  });
});

describe('độ hiện', () => {
  it('chạm đổi 100% → 60% → 30% → 100%', () => {
    expect(nextOpacity(1)).toBe(0.6);
    expect(nextOpacity(0.6)).toBe(0.3);
    expect(nextOpacity(0.3)).toBe(1);
    expect(nextOpacity(0.75)).toBe(0.3);
  });

  it('kéo lên tăng, kéo xuống giảm, bước 5%, kẹp 0–100%', () => {
    expect(opacityFromDrag(0.6, -46, 230)).toBeCloseTo(0.8);
    expect(opacityFromDrag(0.6, 46, 230)).toBeCloseTo(0.4);
    expect(opacityFromDrag(0.6, -999, 230)).toBe(1);
    expect(opacityFromDrag(0.6, 999, 230)).toBe(0);
    expect(formatPercent(0.45)).toBe('45%');
  });
});

describe('thước zoom cuộn', () => {
  it('mỗi lần gấp đôi cách nhau một khoảng cố định', () => {
    expect(tapeOffset(1)).toBe(0);
    expect(tapeOffset(2)).toBeCloseTo(TAPE_PX_PER_DOUBLING);
    expect(tapeOffset(0.5)).toBeCloseTo(-TAPE_PX_PER_DOUBLING);
  });

  it('kéo sang trái tăng zoom, làm tròn 0,1, kẹp trong khoảng', () => {
    expect(factorFromTape(1, -TAPE_PX_PER_DOUBLING, 0.5, 5)).toBe(2);
    expect(factorFromTape(2, TAPE_PX_PER_DOUBLING, 0.5, 5)).toBe(1);
    expect(factorFromTape(1, 9999, 0.5, 5)).toBe(0.5);
    expect(factorFromTape(1, -9999, 1, 5)).toBe(5);
  });

  it('nút nhanh đang chứa hệ số hiện tại', () => {
    const p = [0.5, 1, 2, 3];
    expect(presetIndex(0.5, p)).toBe(0);
    expect(presetIndex(1.4, p)).toBe(1);
    expect(presetIndex(2, p)).toBe(2);
    expect(presetIndex(4.2, p)).toBe(3);
  });

  it('rung khi đi qua mốc', () => {
    const p = [0.5, 1, 2, 3];
    expect(crossedPreset(0.9, 1, p)).toBe(true);
    expect(crossedPreset(1.1, 1.3, p)).toBe(false);
    expect(crossedPreset(2.1, 1.9, p)).toBe(true);
  });
});
