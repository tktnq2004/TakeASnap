/**
 * Giải mã base64 → bytes, TypeScript thuần (không phụ thuộc atob của engine JS). Dùng cho lưới
 * alpha WebView gửi về (vài trăm KB).
 */
const LOOKUP = (() => {
  const t = new Int16Array(256).fill(-1);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  for (let i = 0; i < chars.length; i++) t[chars.charCodeAt(i)] = i;
  return t;
})();

export function base64ToBytes(b64: string): Uint8Array {
  let len = b64.length;
  while (len > 0 && b64[len - 1] === '=') len--;
  const out = new Uint8Array(Math.floor((len * 3) / 4));
  let o = 0;
  let buf = 0;
  let bits = 0;
  for (let i = 0; i < len; i++) {
    const v = LOOKUP[b64.charCodeAt(i)]!;
    if (v < 0) throw new Error('Chuỗi base64 không hợp lệ');
    buf = (buf << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[o++] = (buf >> bits) & 0xff;
    }
  }
  return out.subarray(0, o);
}
