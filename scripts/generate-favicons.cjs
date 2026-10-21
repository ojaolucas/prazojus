const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[n] = c;
}
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBuf.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 8 + data.length);
  return chunk;
}
function encodePNG(width, height, rgbaBuffer) {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    scanlines[rowOffset] = 0;
    rgbaBuffer.copy(scanlines, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(scanlines, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

const logoPath = path.resolve(__dirname, '../public/policia-cientifica-logo.png');
const srcBuf = fs.readFileSync(logoPath);
let offset = 8, srcW, srcH, idatChunks = [];
while (offset < srcBuf.length) {
  const len = srcBuf.readUInt32BE(offset);
  const type = srcBuf.toString('ascii', offset + 4, offset + 8);
  if (type === 'IHDR') {
    srcW = srcBuf.readUInt32BE(offset + 8);
    srcH = srcBuf.readUInt32BE(offset + 12);
  } else if (type === 'IDAT') {
    idatChunks.push(srcBuf.slice(offset + 8, offset + 8 + len));
  }
  offset += 12 + len;
}
const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
const rowStride = 1 + srcW * 4;
const srcRGBA = Buffer.alloc(srcW * srcH * 4);
for (let y = 0; y < srcH; y++) {
  decompressed.copy(srcRGBA, y * srcW * 4, y * rowStride + 1, (y + 1) * rowStride);
}

function resample(targetW, targetH) {
  const dest = Buffer.alloc(targetW * targetH * 4);
  const xRatio = srcW / targetW;
  const yRatio = srcH / targetH;

  for (let dy = 0; dy < targetH; dy++) {
    const syStart = dy * yRatio;
    const syEnd = (dy + 1) * yRatio;
    const syMin = Math.floor(syStart);
    const syMax = Math.min(srcH - 1, Math.floor(syEnd));

    for (let dx = 0; dx < targetW; dx++) {
      const sxStart = dx * xRatio;
      const sxEnd = (dx + 1) * xRatio;
      const sxMin = Math.floor(sxStart);
      const sxMax = Math.min(srcW - 1, Math.floor(sxEnd));

      let totalWeight = 0;
      let rAcc = 0, gAcc = 0, bAcc = 0, aAcc = 0;

      for (let sy = syMin; sy <= syMax; sy++) {
        const yWeight = Math.min(sy + 1, syEnd) - Math.max(sy, syStart);
        if (yWeight <= 0) continue;

        for (let sx = sxMin; sx <= sxMax; sx++) {
          const xWeight = Math.min(sx + 1, sxEnd) - Math.max(sx, sxStart);
          if (xWeight <= 0) continue;

          const weight = xWeight * yWeight;
          const sIdx = (sy * srcW + sx) * 4;
          const a = srcRGBA[sIdx + 3] / 255;

          rAcc += srcRGBA[sIdx] * a * weight;
          gAcc += srcRGBA[sIdx + 1] * a * weight;
          bAcc += srcRGBA[sIdx + 2] * a * weight;
          aAcc += a * weight;
          totalWeight += weight;
        }
      }

      const dIdx = (dy * targetW + dx) * 4;
      if (totalWeight > 0 && aAcc > 0.001) {
        const finalAlpha = aAcc / totalWeight;
        dest[dIdx] = Math.min(255, Math.max(0, Math.round(rAcc / aAcc)));
        dest[dIdx + 1] = Math.min(255, Math.max(0, Math.round(gAcc / aAcc)));
        dest[dIdx + 2] = Math.min(255, Math.max(0, Math.round(bAcc / aAcc)));
        dest[dIdx + 3] = Math.min(255, Math.max(0, Math.round(finalAlpha * 255)));
      }
    }
  }
  return dest;
}

function makeSquareFavicon(size) {
  const square = Buffer.alloc(size * size * 4);
  const availH = Math.round(size * 0.94);
  const targetH = availH;
  const targetW = Math.round(targetH * (srcW / srcH));
  const resampledShield = resample(targetW, targetH);

  const offsetX = Math.floor((size - targetW) / 2);
  const offsetY = Math.floor((size - targetH) / 2);

  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const sIdx = (y * targetW + x) * 4;
      const dIdx = ((offsetY + y) * size + (offsetX + x)) * 4;
      resampledShield.copy(square, dIdx, sIdx, sIdx + 4);
    }
  }
  return square;
}

const pubDir = path.resolve(__dirname, '../public');
const sq256 = makeSquareFavicon(256);
fs.writeFileSync(path.join(pubDir, 'favicon.png'), encodePNG(256, 256, sq256));

const sq32 = makeSquareFavicon(32);
fs.writeFileSync(path.join(pubDir, 'favicon-32x32.png'), encodePNG(32, 32, sq32));

const sq192 = makeSquareFavicon(192);
fs.writeFileSync(path.join(pubDir, 'favicon-192x192.png'), encodePNG(192, 192, sq192));

const base64Png = fs.readFileSync(path.join(pubDir, 'favicon.png')).toString('base64');
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <image href="data:image/png;base64,${base64Png}" width="256" height="256"/>
</svg>
`;
fs.writeFileSync(path.join(pubDir, 'favicon.svg'), svgContent);

console.log('Favicons generated successfully in', pubDir);
