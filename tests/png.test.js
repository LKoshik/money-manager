import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import { encodePng } from '../tools/png.mjs';

test('encodePng writes a valid PNG that decodes back to the same pixels', () => {
  const pixels = Uint8Array.from([255, 0, 0, 255, 0, 255, 0, 128, 0, 0, 255, 0, 9, 9, 9, 255]);
  const png = encodePng(2, 2, pixels);
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(png.readUInt32BE(16), 2); // width
  assert.equal(png.readUInt32BE(20), 2); // height
  const idatAt = png.indexOf('IDAT');
  const raw = inflateSync(png.subarray(idatAt + 4, png.indexOf('IEND') - 8));
  assert.equal(raw.length, 2 * (1 + 8));
  assert.deepEqual([...raw.subarray(1, 9)], [...pixels.subarray(0, 8)]);
  assert.deepEqual([...raw.subarray(10, 18)], [...pixels.subarray(8, 16)]);
});
