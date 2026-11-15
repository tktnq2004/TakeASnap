import { hexToHsv, hsvToHex, normalizeHex, rgbToHex } from '../colorMath';

describe('Bảng màu: đổi HEX ↔ HSV', () => {
  it('chuẩn hóa mã HEX người dùng gõ', () => {
    expect(normalizeHex('#abc')).toBe('#AABBCC');
    expect(normalizeHex('2563eb')).toBe('#2563EB');
    expect(normalizeHex(' #FF8A3D ')).toBe('#FF8A3D');
    expect(normalizeHex('#12345')).toBeNull();
    expect(normalizeHex('xyz')).toBeNull();
  });

  it('màu cơ bản', () => {
    expect(hsvToHex(0, 1, 1)).toBe('#FF0000');
    expect(hsvToHex(120, 1, 1)).toBe('#00FF00');
    expect(hsvToHex(240, 1, 1)).toBe('#0000FF');
    expect(hsvToHex(0, 0, 1)).toBe('#FFFFFF');
    expect(hsvToHex(200, 0.5, 0)).toBe('#000000');
    expect(rgbToHex(37, 99, 235)).toBe('#2563EB');
  });

  it.each(['#2563EB', '#FF8A3D', '#22C55E', '#10213F', '#FFFFFF', '#000000', '#FACC15'])(
    '%s đổi sang HSV rồi về lại vẫn đúng',
    (hex) => {
      const { h, s, v } = hexToHsv(hex);
      expect(hsvToHex(h, s, v)).toBe(hex);
    },
  );
});
