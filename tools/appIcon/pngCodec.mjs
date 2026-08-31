/**
 * A PNG encoder, and just enough of a decoder to check our own output.
 *
 * Written out rather than pulled in, for the same reason the rest-timer chime is
 * synthesised rather than shipped as an audio file: the alternative is a native
 * image dependency (`sharp` and friends carry platform binaries and a 30 MB
 * install) to produce six small squares that never change.
 *
 * The scope is deliberately tiny. Everything here is 8-bit RGBA, non-interlaced,
 * filter type 0 — which is all `generateAppIcons.mjs` emits. The decoder asserts
 * that rather than handling the rest of the format, so a file this project did
 * not write fails loudly instead of being half-read.
 */

import { deflateSync, inflateSync } from 'node:zlib';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const BIT_DEPTH_EIGHT = 8;
const COLOR_TYPE_RGBA = 6;
const BYTES_PER_PIXEL = 4;

/** The one filter type we emit: none. Keeps the encoder honest and the decoder short. */
const FILTER_TYPE_NONE = 0;

const CYCLIC_REDUNDANCY_CHECK_TABLE = (() => {
  const table = new Uint32Array(256);

  for (let byteValue = 0; byteValue < 256; byteValue += 1) {
    let remainder = byteValue;

    for (let bit = 0; bit < 8; bit += 1) {
      remainder = remainder & 1 ? 0xedb88320 ^ (remainder >>> 1) : remainder >>> 1;
    }

    table[byteValue] = remainder >>> 0;
  }

  return table;
})();

function calculateCyclicRedundancyCheck(bytes) {
  let remainder = 0xffffffff;

  for (const byte of bytes) {
    remainder = CYCLIC_REDUNDANCY_CHECK_TABLE[(remainder ^ byte) & 0xff] ^ (remainder >>> 8);
  }

  return (remainder ^ 0xffffffff) >>> 0;
}

function buildChunk(chunkType, chunkData) {
  const lengthBytes = Buffer.alloc(4);
  lengthBytes.writeUInt32BE(chunkData.length, 0);

  const typeAndData = Buffer.concat([Buffer.from(chunkType, 'ascii'), chunkData]);

  const checkBytes = Buffer.alloc(4);
  checkBytes.writeUInt32BE(calculateCyclicRedundancyCheck(typeAndData), 0);

  return Buffer.concat([lengthBytes, typeAndData, checkBytes]);
}

/**
 * Encodes a tightly packed RGBA buffer as a PNG.
 *
 * `rgbaPixels` is `widthInPixels * heightInPixels * 4` bytes, row-major, no padding.
 */
export function encodeRgbaAsPng(rgbaPixels, widthInPixels, heightInPixels) {
  const expectedLength = widthInPixels * heightInPixels * BYTES_PER_PIXEL;

  if (rgbaPixels.length !== expectedLength) {
    throw new Error(
      `Expected ${String(expectedLength)} bytes of RGBA for a ${String(widthInPixels)}x${String(heightInPixels)} image, got ${String(rgbaPixels.length)}.`,
    );
  }

  const headerData = Buffer.alloc(13);
  headerData.writeUInt32BE(widthInPixels, 0);
  headerData.writeUInt32BE(heightInPixels, 4);
  headerData.writeUInt8(BIT_DEPTH_EIGHT, 8);
  headerData.writeUInt8(COLOR_TYPE_RGBA, 9);
  headerData.writeUInt8(0, 10); // Compression: deflate, the only defined value.
  headerData.writeUInt8(0, 11); // Filtering: adaptive, the only defined value.
  headerData.writeUInt8(0, 12); // Interlacing: none.

  // Each scanline is prefixed with its filter byte. Filtering exists to help the
  // compressor find patterns; on flat gradients at these sizes it buys single-digit
  // percentages, and it would double the length of the decoder below.
  const bytesPerRow = widthInPixels * BYTES_PER_PIXEL;
  const filteredRows = Buffer.alloc(heightInPixels * (bytesPerRow + 1));

  for (let rowIndex = 0; rowIndex < heightInPixels; rowIndex += 1) {
    const destinationOffset = rowIndex * (bytesPerRow + 1);

    filteredRows[destinationOffset] = FILTER_TYPE_NONE;
    Buffer.from(
      rgbaPixels.buffer,
      rgbaPixels.byteOffset + rowIndex * bytesPerRow,
      bytesPerRow,
    ).copy(filteredRows, destinationOffset + 1);
  }

  return Buffer.concat([
    PNG_SIGNATURE,
    buildChunk('IHDR', headerData),
    buildChunk('IDAT', deflateSync(filteredRows, { level: 9 })),
    buildChunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Reads back a PNG this module wrote.
 *
 * `verifyAppIcons.mjs` compares **pixels**, not file bytes, and this is why it
 * can. Byte comparison would have been shorter, but zlib's exact output is not
 * guaranteed stable across Node versions — so a byte check would fail the build
 * on a Node upgrade while the icons were in fact identical.
 */
export function decodePngToRgba(pngBytes) {
  if (!pngBytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('Not a PNG: the file signature does not match.');
  }

  let widthInPixels = 0;
  let heightInPixels = 0;
  const compressedChunks = [];
  let readOffset = 8;

  while (readOffset < pngBytes.length) {
    const chunkLength = pngBytes.readUInt32BE(readOffset);
    const chunkType = pngBytes.toString('ascii', readOffset + 4, readOffset + 8);
    const chunkData = pngBytes.subarray(readOffset + 8, readOffset + 8 + chunkLength);

    if (chunkType === 'IHDR') {
      widthInPixels = chunkData.readUInt32BE(0);
      heightInPixels = chunkData.readUInt32BE(4);

      const bitDepth = chunkData.readUInt8(8);
      const colorType = chunkData.readUInt8(9);
      const interlaceMethod = chunkData.readUInt8(12);

      if (bitDepth !== BIT_DEPTH_EIGHT || colorType !== COLOR_TYPE_RGBA || interlaceMethod !== 0) {
        throw new Error(
          'Unsupported PNG. This decoder only reads the 8-bit RGBA, non-interlaced files this project generates.',
        );
      }
    } else if (chunkType === 'IDAT') {
      compressedChunks.push(chunkData);
    } else if (chunkType === 'IEND') {
      break;
    }

    readOffset += 12 + chunkLength;
  }

  const filteredRows = inflateSync(Buffer.concat(compressedChunks));
  const bytesPerRow = widthInPixels * BYTES_PER_PIXEL;
  const rgbaPixels = Buffer.alloc(heightInPixels * bytesPerRow);

  for (let rowIndex = 0; rowIndex < heightInPixels; rowIndex += 1) {
    const sourceOffset = rowIndex * (bytesPerRow + 1);
    const filterType = filteredRows[sourceOffset];

    if (filterType !== FILTER_TYPE_NONE) {
      throw new Error(
        `Unsupported PNG row filter ${String(filterType)}. This decoder only reads files this project generates.`,
      );
    }

    filteredRows.copy(
      rgbaPixels,
      rowIndex * bytesPerRow,
      sourceOffset + 1,
      sourceOffset + 1 + bytesPerRow,
    );
  }

  return { rgbaPixels, widthInPixels, heightInPixels };
}
