import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function buildChunk(type: string, data: Buffer): Buffer {
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const typeAndData = Buffer.concat([typeBuf, data]);
  const crcVal = zlib.crc32(typeAndData);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal >>> 0, 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

export function getTranslucentWatermarkPath(isGtMode: boolean, opacity: number = 0.14): string {
  const baseDir = path.join(process.cwd(), 'public');
  const inputFileName = isGtMode ? 'Logo_Genetrust.png' : 'logo.png';
  const outputFileName = isGtMode ? 'watermark_gt.png' : 'watermark_hk.png';

  const inputPath = path.join(baseDir, inputFileName);
  const outputPath = path.join(baseDir, outputFileName);

  if (!fs.existsSync(inputPath)) {
    return inputPath;
  }

  try {
    if (fs.existsSync(outputPath)) {
      const inputStat = fs.statSync(inputPath);
      const outputStat = fs.statSync(outputPath);
      if (outputStat.mtime >= inputStat.mtime) {
        return outputPath;
      }
    }

    const buf = fs.readFileSync(inputPath);
    let pos = 8;
    const chunks: Buffer[] = [buf.slice(0, 8)];
    let width = 0, height = 0;
    let idatBuffers: Buffer[] = [];

    while (pos < buf.length) {
      const len = buf.readUInt32BE(pos);
      const type = buf.toString('ascii', pos + 4, pos + 8);
      const chunkData = buf.slice(pos + 8, pos + 8 + len);
      pos += 12 + len;

      if (type === 'IHDR') {
        width = chunkData.readUInt32BE(0);
        height = chunkData.readUInt32BE(4);
        chunks.push(buildChunk('IHDR', chunkData));
      } else if (type === 'IDAT') {
        idatBuffers.push(chunkData);
      } else if (type === 'IEND') {
        const compressedData = Buffer.concat(idatBuffers);
        const decompressed = zlib.inflateSync(compressedData);

        const bpp = 4;
        const lineSize = width * 4;
        const rawData = Buffer.alloc(height * lineSize);

        for (let y = 0; y < height; y++) {
          const lineStart = y * (1 + lineSize);
          const filterType = decompressed[lineStart];
          const scanline = decompressed.slice(lineStart + 1, lineStart + 1 + lineSize);
          const rawLine = rawData.slice(y * lineSize, (y + 1) * lineSize);
          const prevRawLine = y > 0 ? rawData.slice((y - 1) * lineSize, y * lineSize) : null;

          for (let i = 0; i < lineSize; i++) {
            const sub = i >= bpp ? rawLine[i - bpp] : 0;
            const up = prevRawLine ? prevRawLine[i] : 0;
            const corner = (i >= bpp && prevRawLine) ? prevRawLine[i - bpp] : 0;

            let val = scanline[i];
            if (filterType === 1) val = (val + sub) & 0xff;
            else if (filterType === 2) val = (val + up) & 0xff;
            else if (filterType === 3) val = (val + Math.floor((sub + up) / 2)) & 0xff;
            else if (filterType === 4) val = (val + paethPredictor(sub, up, corner)) & 0xff;
            rawLine[i] = val;
          }
        }

        for (let i = 3; i < rawData.length; i += 4) {
          rawData[i] = Math.round(rawData[i] * opacity);
        }

        const outBuf = Buffer.alloc(height * (1 + lineSize));
        for (let y = 0; y < height; y++) {
          const outLineStart = y * (1 + lineSize);
          outBuf[outLineStart] = 0;
          rawData.copy(outBuf, outLineStart + 1, y * lineSize, (y + 1) * lineSize);
        }

        const newIdat = zlib.deflateSync(outBuf);
        chunks.push(buildChunk('IDAT', newIdat));
        chunks.push(buildChunk('IEND', chunkData));
      } else {
        chunks.push(buildChunk(type, chunkData));
      }
    }

    const finalPng = Buffer.concat(chunks);
    fs.writeFileSync(outputPath, finalPng);
    return outputPath;
  } catch (err) {
    console.error('getTranslucentWatermarkPath error:', err);
    return inputPath;
  }
}
