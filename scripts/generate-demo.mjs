import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const WIDTH = 720;
const HEIGHT = 405;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "docs", "demo.gif");

const C = { paper: 0, ink: 1, lime: 2, white: 3, line: 4, orange: 5, blue: 6, muted: 7, pale: 8, green: 9 };
const palette = [
  [247,245,239], [17,24,39], [201,255,79], [255,253,248], [217,213,202],
  [255,107,53], [93,124,255], [99,108,121], [238,241,230], [142,197,31],
];

const glyphs = {
  " ":[0,0,0,0,0,0,0], A:[14,17,17,31,17,17,17], B:[30,17,17,30,17,17,30], C:[14,17,16,16,16,17,14],
  D:[30,17,17,17,17,17,30], E:[31,16,16,30,16,16,31], F:[31,16,16,30,16,16,16], G:[14,17,16,23,17,17,15],
  H:[17,17,17,31,17,17,17], I:[14,4,4,4,4,4,14], J:[7,2,2,2,18,18,12], K:[17,18,20,24,20,18,17],
  L:[16,16,16,16,16,16,31], M:[17,27,21,21,17,17,17], N:[17,25,21,19,17,17,17], O:[14,17,17,17,17,17,14],
  P:[30,17,17,30,16,16,16], Q:[14,17,17,17,21,18,13], R:[30,17,17,30,20,18,17], S:[15,16,16,14,1,1,30],
  T:[31,4,4,4,4,4,4], U:[17,17,17,17,17,17,14], V:[17,17,17,17,17,10,4], W:[17,17,17,21,21,21,10],
  X:[17,17,10,4,10,17,17], Y:[17,17,10,4,4,4,4], Z:[31,1,2,4,8,16,31],
  "0":[14,17,19,21,25,17,14], "1":[4,12,4,4,4,4,14], "2":[14,17,1,2,4,8,31], "3":[30,1,1,14,1,1,30],
  "4":[2,6,10,18,31,2,2], "5":[31,16,16,30,1,1,30], "6":[14,16,16,30,17,17,14], "7":[31,1,2,4,8,8,8],
  "8":[14,17,17,14,17,17,14], "9":[14,17,17,15,1,1,14], ".":[0,0,0,0,0,12,12], ":":[0,12,12,0,12,12,0],
  "/":[1,2,2,4,8,8,16], "%":[17,2,4,8,16,0,17], "-":[0,0,0,31,0,0,0], "+":[0,4,4,31,4,4,0],
};

function canvas(color = C.paper) { return new Uint8Array(WIDTH * HEIGHT).fill(color); }
function rect(pixels, x, y, width, height, color) {
  const x0 = Math.max(0, x), y0 = Math.max(0, y), x1 = Math.min(WIDTH, x + width), y1 = Math.min(HEIGHT, y + height);
  for (let py = y0; py < y1; py += 1) pixels.fill(color, py * WIDTH + x0, py * WIDTH + x1);
}
function border(pixels, x, y, width, height, color, thickness = 1) {
  rect(pixels, x, y, width, thickness, color); rect(pixels, x, y + height - thickness, width, thickness, color);
  rect(pixels, x, y, thickness, height, color); rect(pixels, x + width - thickness, y, thickness, height, color);
}
function text(pixels, value, x, y, scale = 2, color = C.ink) {
  let cursor = x;
  for (const character of value.toUpperCase()) {
    const glyph = glyphs[character] ?? glyphs[" "];
    glyph.forEach((row, gy) => {
      for (let gx = 0; gx < 5; gx += 1) if (row & (1 << (4 - gx))) rect(pixels, cursor + gx * scale, y + gy * scale, scale, scale, color);
    });
    cursor += 6 * scale;
  }
}
function pill(pixels, value, x, y, width, background, foreground) {
  rect(pixels, x, y, width, 24, background); text(pixels, value, x + 9, y + 6, 1, foreground);
}
function chrome(pixels, step) {
  rect(pixels, 0, 0, WIDTH, 56, C.white);
  rect(pixels, 24, 16, 27, 27, C.ink); text(pixels, "AK", 30, 26, 1, C.lime); text(pixels, "ABO KILLER", 62, 23, 2, C.ink);
  pill(pixels, "OFFLINE BY DESIGN", 546, 17, 150, C.pale, C.ink);
  [1,2,3].forEach((number, index) => {
    const x = 190 + index * 116;
    rect(pixels, x, 70, 98, 4, number <= step ? C.ink : C.line);
    text(pixels, String(number), x, 82, 1, number === step ? C.orange : C.muted);
  });
}
function frameImport() {
  const p = canvas(); chrome(p, 1);
  text(p, "FIND THE", 34, 126, 5, C.ink); text(p, "QUIET DRAIN.", 34, 171, 5, C.ink); rect(p, 32, 212, 280, 7, C.orange);
  text(p, "ZERO UPLOADS. EXPLAINABLE MATCHES.", 38, 242, 1, C.muted);
  rect(p, 408, 112, 270, 230, C.ink); border(p, 422, 126, 242, 202, C.muted, 2);
  rect(p, 508, 151, 54, 54, C.lime); text(p, "CSV", 520, 173, 2, C.ink);
  text(p, "DROP YOUR CSV", 473, 229, 2, C.white); text(p, "OR TRY SYNTHETIC DEMO", 467, 258, 1, C.muted);
  rect(p, 476, 282, 174, 27, C.lime); text(p, "CHOOSE FILE", 517, 292, 1, C.ink);
  text(p, "YOUR FILE NEVER LEAVES THIS TAB", 236, 376, 1, C.muted);
  return p;
}
function frameReview() {
  const p = canvas(); chrome(p, 1);
  text(p, "CHECK THE IMPORT", 35, 111, 3, C.ink); text(p, "NOTHING IS COUNTED YET", 38, 145, 1, C.muted);
  rect(p, 34, 174, 652, 158, C.white); border(p, 34, 174, 652, 158, C.line);
  rect(p, 34, 174, 652, 30, C.pale); text(p, "DATE", 79, 185, 1, C.muted); text(p, "DESCRIPTION", 218, 185, 1, C.muted); text(p, "AMOUNT", 557, 185, 1, C.muted);
  const rows = [["03 JAN", "SPOTIFY AB", "-10.99 EUR"], ["12 JAN", "NETFLIX.COM", "-13.49 EUR"], ["18 JAN", "SEPA TRANSFER", "-250.00 EUR"], ["03 FEB", "SPOTIFY AB", "-10.99 EUR"]];
  rows.forEach((row, index) => {
    const y = 215 + index * 28; rect(p, 50, y, 12, 12, index === 2 ? C.white : C.ink); border(p, 50, y, 12, 12, C.ink);
    if (index !== 2) { rect(p, 53, y + 3, 6, 6, C.lime); }
    text(p, row[0], 79, y + 2, 1, C.ink); text(p, row[1], 218, y + 2, 1, C.ink); text(p, row[2], 557, y + 2, 1, C.ink);
  });
  rect(p, 487, 349, 199, 34, C.lime); text(p, "FIND RECURRING CHARGES", 507, 361, 1, C.ink);
  return p;
}
function frameMatches() {
  const p = canvas(); chrome(p, 2);
  text(p, "REVIEW 3 MATCHES", 35, 108, 3, C.ink); text(p, "THE DETECTOR PROPOSES. YOU DECIDE.", 38, 144, 1, C.muted);
  const matches = [["SPOTIFY", "MONTHLY  99%", "10.99 EUR"], ["NETFLIX", "MONTHLY  98%", "14.99 EUR"], ["CLOUD NINE", "UNKNOWN  92%", "24.00 EUR"]];
  matches.forEach((row, index) => {
    const y = 170 + index * 58; rect(p, 34, y, 652, 48, C.white); border(p, 34, y, 652, 48, C.line);
    rect(p, 50, y + 15, 14, 14, C.ink); rect(p, 54, y + 19, 6, 6, C.lime);
    text(p, row[0], 82, y + 12, 2, C.ink); pill(p, row[1], 280, y + 12, 140, index === 2 ? C.pale : C.lime, C.ink); text(p, row[2], 552, y + 17, 1, C.ink);
  });
  rect(p, 34, 356, 405, 28, C.ink); text(p, "TOTAL WITHHELD UNTIL YOU CONFIRM", 52, 366, 1, C.lime);
  rect(p, 475, 349, 211, 35, C.lime); text(p, "CONFIRM AND CALCULATE", 501, 362, 1, C.ink);
  return p;
}
function frameSummary() {
  const p = canvas(C.ink); chrome(p, 3);
  text(p, "3 QUIET DRAINS", 36, 116, 4, C.white); text(p, "MADE VISIBLE.", 36, 154, 4, C.white);
  text(p, "REVIEWED ESTIMATE. NO EXCHANGE RATE GUESSES.", 39, 204, 1, C.muted);
  rect(p, 36, 232, 306, 114, C.lime); text(p, "ESTIMATED MONTHLY", 55, 251, 1, C.ink); text(p, "49.98 EUR", 54, 278, 4, C.ink); text(p, "599.76 EUR / YEAR", 55, 326, 1, C.ink);
  rect(p, 370, 232, 316, 114, C.white); text(p, "SAFE SUMMARY", 390, 251, 2, C.ink); text(p, "NO RAW TRANSACTIONS", 390, 283, 1, C.muted); text(p, "NO ACCOUNT DETAILS", 390, 304, 1, C.muted); text(p, "EXPORT JSON", 390, 326, 1, C.blue);
  text(p, "NO UPLOADS. NO ACCOUNTS. NO TRACKERS.", 220, 378, 1, C.lime);
  return p;
}

function u16(value) { return [value & 255, (value >> 8) & 255]; }
function imageData(pixels) {
  const codes = [];
  for (let offset = 0; offset < pixels.length; offset += 200) {
    codes.push(256, ...pixels.slice(offset, offset + 200));
  }
  codes.push(257);
  const bytes = [];
  let buffer = 0, bitCount = 0;
  for (const code of codes) {
    buffer |= code << bitCount; bitCount += 9;
    while (bitCount >= 8) { bytes.push(buffer & 255); buffer >>>= 8; bitCount -= 8; }
  }
  if (bitCount) bytes.push(buffer & 255);
  const blocks = [];
  for (let index = 0; index < bytes.length; index += 255) blocks.push(Math.min(255, bytes.length - index), ...bytes.slice(index, index + 255));
  return [8, ...blocks, 0];
}
function encodeGif(frames) {
  const bytes = [...Buffer.from("GIF89a"), ...u16(WIDTH), ...u16(HEIGHT), 0xf7, C.paper, 0];
  for (let index = 0; index < 256; index += 1) bytes.push(...(palette[index] ?? [0,0,0]));
  bytes.push(0x21,0xff,0x0b,...Buffer.from("NETSCAPE2.0"),3,1,0,0,0);
  for (const frame of frames) {
    bytes.push(0x21,0xf9,4,0,...u16(155),0,0);
    bytes.push(0x2c,0,0,0,0,...u16(WIDTH),...u16(HEIGHT),0);
    for (const byte of imageData(frame)) bytes.push(byte);
  }
  bytes.push(0x3b);
  return Buffer.from(bytes);
}

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, encodeGif([frameImport(), frameReview(), frameMatches(), frameSummary()]));
console.log(`Generated ${path.relative(root, output)} using synthetic UI data only.`);
