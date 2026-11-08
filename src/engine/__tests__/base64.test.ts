import { base64ToBytes } from '../base64';

describe('base64ToBytes', () => {
  it('khớp btoa với mọi độ dài (0, 1, 2 byte đệm)', () => {
    for (let n = 0; n < 40; n++) {
      const bytes = Uint8Array.from({ length: n }, (_, i) => (i * 37 + n) & 0xff);
      const b64 = btoa(String.fromCharCode(...bytes));
      expect(Array.from(base64ToBytes(b64))).toEqual(Array.from(bytes));
    }
  });

  it('báo lỗi khi gặp ký tự lạ', () => {
    expect(() => base64ToBytes('ab$d')).toThrow();
  });
});
