import { TRASH_SCALE, trashTransform } from '../trash';

/** Tâm overlay sau transform (tính từ tâm khung): a + s·t. */
function center(p: number, t: { x: number; y: number }, goal: { x: number; y: number }) {
  const r = trashTransform(p, 0, t, goal);
  const [ax, ay, sc] = r.transform as [
    { translateX: number },
    { translateY: number },
    { scale: number },
  ];
  return { x: ax.translateX + sc.scale * t.x, y: ay.translateY + sc.scale * t.y, s: sc.scale };
}

describe('trashTransform', () => {
  const t = { x: 40, y: 120 };
  const goal = { x: 0, y: 380 };

  it('chưa vào vùng xóa → giữ nguyên chỗ, cỡ và độ hiện', () => {
    const c = center(0, t, goal);
    expect(c.x).toBeCloseTo(40);
    expect(c.y).toBeCloseTo(120);
    expect(c.s).toBe(1);
    expect(trashTransform(0, 0, t, goal).opacity).toBe(1);
  });

  it('vào hẳn vùng xóa → tâm overlay nằm trên thùng rác, thu nhỏ, mờ đi', () => {
    const c = center(1, t, goal);
    expect(c.x).toBeCloseTo(0);
    expect(c.y).toBeCloseTo(380);
    expect(c.s).toBeCloseTo(TRASH_SCALE);
    expect(trashTransform(1, 0, t, goal).opacity).toBeLessThan(1);
  });

  it('thả trong vùng xóa → mờ hẳn', () => {
    expect(trashTransform(1, 1, t, goal).opacity).toBe(0);
  });
});
