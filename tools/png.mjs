/** Writes a PNG file from raw pixels. Only Node's built-in zlib is needed. */
import { deflateSync } from 'node:zlib';

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// PNG chunks end with a CRC check; this is the standard table for it.
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

/**
 * Encode pixels as a PNG.
 * @param {number} width
 * @param {number} height
 * @param {Uint8Array} rgba  width*height*4 bytes: red, green, blue, alpha per pixel.
 * @returns {Buffer} The PNG file content.
 */
export function encodePng(width, height, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // 8 bits per channel
  header[9] = 6; // RGBA
  const stride = width * 4;
  // Every row starts with a filter byte; 0 = "no filter" (already zero in a new buffer).
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const data = chunk('IDAT', deflateSync(raw));
  return Buffer.concat([SIGNATURE, chunk('IHDR', header), data, chunk('IEND', Buffer.alloc(0))]);
}
