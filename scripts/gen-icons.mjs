import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ACCENT = [109, 40, 217];
const WHITE = [255, 255, 255];
const SOFT = [233, 221, 248];

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0;
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const dst = y * (1 + width * 4) + 1 + x * 4;
      raw[dst] = rgba[src];
      raw[dst + 1] = rgba[src + 1];
      raw[dst + 2] = rgba[src + 2];
      raw[dst + 3] = rgba[src + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const idat = zlib.deflateSync(raw);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function roundRectSdf(x, y, cx, cy, halfW, halfH, r) {
  const dx = Math.max(Math.abs(x - cx) - halfW + r, 0);
  const dy = Math.max(Math.abs(y - cy) - halfH + r, 0);
  return Math.hypot(dx, dy) - r;
}

function makeIcon(size, { rounded = false } = {}) {
  const px = new Uint8Array(size * size * 4);
  const scale = size / 512;
  const inset = rounded ? 512 * 0.08 : 0;

  const cubes = [
    { w: 0.62, h: 0.15, y: 0.22, color: WHITE },
    { w: 0.62, h: 0.15, y: 0.42, color: SOFT },
    { w: 0.62, h: 0.15, y: 0.62, color: WHITE },
  ];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / scale;
      const v = y / scale;
      let color = ACCENT;

      if (rounded) {
        if (roundRectSdf(u, v, 256, 256, 220 - inset, 220 - inset, 90) > 0) {
          color = [0, 0, 0, 0];
        }
      }

      for (const cube of cubes) {
        const halfW = (cube.w * 512) / 2;
        const halfH = (cube.h * 512) / 2;
        const cy = cube.y * 512;
        const d = roundRectSdf(u, v, 256, cy, halfW, halfH, 26);
        if (d <= 0) {
          color = cube.color;
          break;
        }
      }

      const i = (y * size + x) * 4;
      px[i] = color[0] ?? 255;
      px[i + 1] = color[1] ?? 255;
      px[i + 2] = color[2] ?? 255;
      px[i + 3] = color.length === 4 ? color[3] : 255;
    }
  }
  return px;
}

const outDir = path.join(process.cwd(), "public");
fs.mkdirSync(outDir, { recursive: true });

const targets = [
  { name: "pwa-icon-512.png", size: 512 },
  { name: "pwa-icon-192.png", size: 192 },
  { name: "pwa-maskable-512.png", size: 512, rounded: false },
  { name: "pwa-maskable-192.png", size: 192, rounded: false },
  { name: "apple-touch-icon.png", size: 180, rounded: true },
  { name: "favicon-32.png", size: 32 },
];

for (const target of targets) {
  const px = makeIcon(target.size, { rounded: target.rounded });
  fs.writeFileSync(
    path.join(outDir, target.name),
    encodePng(target.size, target.size, px),
  );
  console.log("generated", target.name);
}
