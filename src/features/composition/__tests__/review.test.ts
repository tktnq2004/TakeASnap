import { facingOf, J, type Joint, photoFeatures, type PhotoFeatures } from '../features';
import { reviewPhoto, suggestCrop } from '../review';

/** 33 khớp, mặc định khuất; `set` gán một số khớp thấy rõ. */
function body(set: Record<number, [number, number]>): number[] {
  const out: number[] = [];
  for (let i = 0; i < 33; i++) {
    const p = set[i];
    out.push(p ? p[0] : 0, p ? p[1] : 0, p ? 0.95 : 0.1);
  }
  return out;
}

/** Người đứng, mắt ở (x, y), cao `h`. */
function standing(x: number, y: number, extra: Record<number, [number, number]> = {}) {
  return body({
    [J.nose]: [x, y + 0.02],
    [J.eyeL]: [x - 0.02, y],
    [J.eyeR]: [x + 0.02, y],
    [J.shoulderL]: [x - 0.08, y + 0.1],
    [J.shoulderR]: [x + 0.08, y + 0.1],
    ...extra,
  });
}

function features(
  people: [number, number, number, number][],
  b: number[] | null,
): PhotoFeatures {
  // Lưới 100 × 100 cho dễ đọc.
  return photoFeatures({
    width: 300,
    height: 400,
    gridW: 100,
    gridH: 100,
    people: people.map((bb) => ({
      bbox: bb.map((v) => v * 100) as [number, number, number, number],
      areaRatio: (bb[2] - bb[0]) * (bb[3] - bb[1]),
    })),
    body: b,
  });
}

describe('photoFeatures', () => {
  it('mắt = giữa hai mắt; người chính là khung chứa mắt', () => {
    const f = features(
      [
        [0.05, 0.3, 0.25, 0.95],
        [0.4, 0.2, 0.6, 0.95],
      ],
      standing(0.5, 0.3),
    );
    expect(f.eye).toEqual({ x: 0.5, y: 0.3 });
    expect(f.main).toBe(1);
    expect(f.aspect).toBeCloseTo(0.75);
  });

  it('không có khung xương: người chính là người lớn nhất, không có mắt', () => {
    const f = features(
      [
        [0.05, 0.3, 0.15, 0.6],
        [0.4, 0.2, 0.7, 0.95],
      ],
      null,
    );
    expect(f.main).toBe(1);
    expect(f.eye).toBeNull();
  });

  it('hướng nhìn theo mũi so với giữa hai vai', () => {
    const j = (nose: number): Joint[] => {
      const b = body({ [J.nose]: [nose, 0.3], [J.shoulderL]: [0.4, 0.4], [J.shoulderR]: [0.6, 0.4] });
      return Array.from({ length: 33 }, (_, i) => ({ x: b[i * 3]!, y: b[i * 3 + 1]!, v: b[i * 3 + 2]! }));
    };
    expect(facingOf(j(0.58))).toBe('right');
    expect(facingOf(j(0.42))).toBe('left');
    expect(facingOf(j(0.51))).toBeNull();
  });
});

describe('reviewPhoto', () => {
  const ids = (r: ReturnType<typeof reviewPhoto>) => r.notes.map((n) => `${n.ok ? '+' : '-'}${n.id}`);

  it('Tắt bố cục hoặc không thấy người: không nhận xét', () => {
    const f = features([[0.3, 0.2, 0.7, 0.95]], standing(0.5, 0.33));
    expect(reviewPhoto('off', f).notes).toEqual([]);
    expect(reviewPhoto('thirds', features([], null)).notes).toEqual([]);
  });

  it('1/3 đạt: mắt trên đường 1/3, người trên đường dọc', () => {
    const f = features([[0.2, 0.25, 0.46, 0.95]], standing(0.33, 0.34));
    const r = reviewPhoto('thirds', f);
    expect(ids(r)).toEqual(['+eyeOnThird', '+onVertical']);
    expect(r.crop).toBeNull();
  });

  it('1/3 chưa đạt: người đứng giữa → có khung cắt đưa mắt về giao điểm', () => {
    const f = features([[0.38, 0.3, 0.62, 0.95]], standing(0.5, 0.42));
    const r = reviewPhoto('thirds', f);
    expect(ids(r)).toContain('-inMiddle');
    expect(ids(r)).toContain('-eyeOffThird');
    // Chưa đạt đứng trước.
    expect(r.notes[0]!.ok).toBe(false);
    const c = r.crop!;
    expect(c).not.toBeNull();
    const ex = (0.5 - c.x) / c.w;
    const ey = (0.42 - c.y) / c.h;
    expect(Math.min(Math.abs(ex - 1 / 3), Math.abs(ex - 2 / 3))).toBeLessThan(0.04);
    expect(Math.abs(ey - 1 / 3)).toBeLessThan(0.035);
    expect(c.x).toBeGreaterThanOrEqual(0);
    expect(c.x + c.w).toBeLessThanOrEqual(1);
    // Không cắt mất đầu.
    expect(c.y).toBeLessThanOrEqual(0.3);
  });

  it('Đặt ở giữa: lệch trục thì chưa đạt', () => {
    expect(ids(reviewPhoto('center', features([[0.4, 0.2, 0.6, 0.95]], standing(0.5, 0.33))))).toEqual([
      '+centered',
    ]);
    expect(ids(reviewPhoto('center', features([[0.2, 0.2, 0.4, 0.95]], standing(0.3, 0.33))))).toContain(
      '-offCenter',
    );
  });

  it('dòng chung: đầu chạm mép trên, sát mép trái, mép dưới cắt gối', () => {
    const f = features(
      [[0, 0, 0.3, 1]],
      standing(0.15, 0.1, { [J.kneeL]: [0.12, 0.99], [J.kneeR]: [0.18, 1.01] }),
    );
    const r = reviewPhoto('center', f);
    expect(ids(r)).toEqual(['-offCenter', '-headTouch', '-edgeLeft']);
    const r2 = reviewPhoto('grid', features([[0.3, 0.1, 0.7, 1]], standing(0.5, 0.2, { [J.kneeL]: [0.48, 0.98] })));
    expect(ids(r2)).toEqual(['-cutKnee']);
  });

  it('Nhóm người: đầu thẳng hàng / so le', () => {
    const level = features(
      [
        [0.05, 0.3, 0.3, 0.95],
        [0.35, 0.31, 0.6, 0.95],
        [0.65, 0.3, 0.9, 0.95],
      ],
      null,
    );
    expect(ids(reviewPhoto('group', level))).toEqual(['-headsLevel']);
    const stag = features(
      [
        [0.05, 0.35, 0.3, 0.95],
        [0.35, 0.2, 0.6, 0.95],
        [0.65, 0.36, 0.9, 0.95],
      ],
      null,
    );
    expect(ids(reviewPhoto('group', stag))).toEqual(['+headsStaggered']);
  });

  it('Góc thấp: thấy cả hai cổ chân là đạt', () => {
    const ok = features(
      [[0.35, 0.1, 0.65, 0.95]],
      standing(0.5, 0.15, { [J.ankleL]: [0.46, 0.88], [J.ankleR]: [0.54, 0.88] }),
    );
    expect(ids(reviewPhoto('low', ok))).toEqual(['+feetIn']);
    const cut = features([[0.35, 0.1, 0.65, 1]], standing(0.5, 0.15));
    expect(ids(reviewPhoto('low', cut))).toEqual(['-feetCut']);
  });

  it('nhìn ra mép gần: nhắc chừa chỗ phía nhìn', () => {
    const f = features(
      [[0.6, 0.2, 0.85, 0.95]],
      standing(0.72, 0.33, { [J.nose]: [0.78, 0.35] }),
    );
    expect(ids(reviewPhoto('grid', f))).toContain('-noLookRoom');
  });

  it('Lấp đầy khung: người nhỏ → chưa đạt, có khung cắt ôm sát người; người to → đạt', () => {
    const small = features([[0.42, 0.4, 0.58, 0.8]], standing(0.5, 0.45));
    const r = reviewPhoto('fill', small);
    expect(ids(r)).toContain('-fillSmall');
    const c = r.crop!;
    expect(c.w).toBeLessThan(0.9);
    expect(c.w).toBeGreaterThanOrEqual(0.45);
    // Khung chứa trọn người.
    expect(c.x).toBeLessThanOrEqual(0.42);
    expect(c.x + c.w).toBeGreaterThanOrEqual(0.58);
    expect(c.y).toBeLessThanOrEqual(0.4);
    expect(c.y + c.h).toBeGreaterThanOrEqual(0.8);
    const big = features([[0.15, 0.05, 0.85, 1]], standing(0.5, 0.3));
    expect(ids(reviewPhoto('fill', big))).toContain('+fillOk');
    expect(reviewPhoto('fill', big).crop).toBeNull();
  });

  // Ba ca dưới rút từ scripts/eval-review.mts (khung cắt có đáp án + ảnh có nhãn của nhiếp ảnh gia).
  it('cắt khớp: model kéo khớp bị cắt vào trong ảnh', () => {
    const at = (knee: number, ankle: number | null) => {
      const legs: Record<number, [number, number]> = {
        [J.kneeL]: [0.47, knee],
        [J.kneeR]: [0.53, knee],
      };
      if (ankle !== null) {
        legs[J.ankleL] = [0.47, ankle];
        legs[J.ankleR] = [0.53, ankle];
      }
      return ids(reviewPhoto('grid', features([[0.35, 0.1, 0.65, 1]], standing(0.5, 0.15, legs))));
    };
    // Mép dưới cắt đúng ngang gối: model đoán gối ở ~0,9.
    expect(at(0.9, null)).toContain('-cutKnee');
    // Cắt giữa đùi: model đoán gối hơi ra ngoài mép (~1,03).
    expect(at(1.03, null)).not.toContain('-cutKnee');
    // Cắt ngang cổ chân: cổ chân đoán ở ~0,95, gối ở trong.
    expect(at(0.75, 0.95)).toEqual(['-cutAnkle']);
  });

  it('Nhóm người theo khung xương: người đứng sát nhau (một vùng người) vẫn so được đầu', () => {
    // Mắt ở y, vai dưới mắt 0,1, hông dưới vai 0,3 (cỡ người 0,3).
    const person = (x: number, y: number) =>
      body({
        [J.eyeL]: [x - 0.02, y],
        [J.eyeR]: [x + 0.02, y],
        [J.shoulderL]: [x - 0.06, y + 0.1],
        [J.shoulderR]: [x + 0.06, y + 0.1],
        [J.hipL]: [x - 0.05, y + 0.4],
        [J.hipR]: [x + 0.05, y + 0.4],
      });
    const group = (ys: number[]) => {
      const bodies = ys.map((y, i) => person(0.25 + i * 0.25, y));
      return photoFeatures({
        width: 400,
        height: 300,
        gridW: 100,
        gridH: 100,
        // Một vùng người cho cả nhóm (dính nhau).
        people: [{ bbox: [10, 20, 90, 100], areaRatio: 0.5 }],
        body: bodies[0]!,
        bodies,
      });
    };
    // Chênh 0,05 / cỡ 0,3 ≈ 0,17: thẳng hàng.
    expect(ids(reviewPhoto('group', group([0.3, 0.33, 0.35])))).toContain('-headsLevel');
    // Một người ngồi: chênh 0,2 / 0,3 ≈ 0,67: so le.
    expect(ids(reviewPhoto('group', group([0.3, 0.5, 0.32])))).toContain('+headsStaggered');
  });

  it('Góc thấp: cổ chân sát mép (bị cắt) thì chưa thấy cả bàn chân', () => {
    const f = features(
      [[0.35, 0.1, 0.65, 1]],
      standing(0.5, 0.15, { [J.ankleL]: [0.46, 0.95], [J.ankleR]: [0.54, 0.95] }),
    );
    expect(ids(reviewPhoto('low', f))).toContain('-feetCut');
  });

  it('Đặt ở giữa: mặt nghiêng nhưng thân ở giữa vẫn đạt', () => {
    // Mắt 0,43, thân 0,38–0,76 (tâm 0,57): trung bình 0,5.
    const f = features([[0.38, 0.2, 0.76, 1]], standing(0.43, 0.35));
    expect(ids(reviewPhoto('center', f))).toEqual(['+centered']);
  });

  it('không cắt được cho đạt thì không có khung cắt', () => {
    // Mắt sát mép trên: đặt mắt vào 1/3 sẽ phải cắt ra ngoài ảnh.
    const f = features([[0.38, 0.02, 0.62, 0.95]], standing(0.5, 0.05));
    expect(suggestCrop('thirds', f)).toBeNull();
  });
});
