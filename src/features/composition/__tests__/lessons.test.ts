import { t } from '@/ui/strings';

import { lessonById, LESSONS } from '../lessons';
import { isTechnique } from '../techniques';

describe('lessons', () => {
  it('16 thẻ, id không trùng, thẻ nào cũng có đủ chữ', () => {
    expect(LESSONS).toHaveLength(16);
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(16);
    for (const l of LESSONS) {
      const item = t.lessons.items[l.id];
      for (const k of ['name', 'wrong', 'right', 'what', 'when', 'breakRule'] as const) {
        expect(item[k].length).toBeGreaterThan(0);
        expect(item[k]).not.toMatch(/!/);
      }
    }
  });

  it('Chụp thử mở một kỹ thuật có trong bảng Bố cục; thẻ chỉ đọc mở lưới 3×3', () => {
    for (const l of LESSONS) {
      expect(isTechnique(l.tryTechnique)).toBe(true);
      if (!l.onCamera) expect(['grid', 'thirds']).toContain(l.tryTechnique);
    }
  });

  it('thẻ có trên Camera bật đúng kỹ thuật của nó', () => {
    expect(lessonById('level')?.tryTechnique).toBe('horizon');
    expect(lessonById('selfie')?.tryTechnique).toBe('selfie');
    expect(lessonById('nope')).toBeUndefined();
  });
});
