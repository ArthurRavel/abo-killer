import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  }));
  return nested.flat();
}

const forbiddenRuntimeApis = [
  ["fetch", /\bfetch\s*\(/],
  ["XMLHttpRequest", /\bXMLHttpRequest\b/],
  ["WebSocket", /\bWebSocket\b/],
  ["sendBeacon", /\bsendBeacon\b/],
  ["EventSource", /\bEventSource\b/],
];

const failures = [];
const files = (await walk(dist)).filter((file) => /\.(?:html|css|js|json)$/.test(file));
let combinedOutput = "";
for (const file of files) {
  const content = await readFile(file, "utf8");
  combinedOutput += `\n${content}`;
  for (const [name, pattern] of forbiddenRuntimeApis) {
    if (pattern.test(content)) failures.push(`${path.relative(root, file)} contains ${name}`);
  }
  if (/\b(?:src|srcset)\s*=\s*["']https?:\/\//i.test(content)) {
    failures.push(`${path.relative(root, file)} loads an external resource`);
  }
  if (/<link\b[^>]*\bhref\s*=\s*["']https?:\/\//i.test(content)) {
    failures.push(`${path.relative(root, file)} loads an external stylesheet or linked resource`);
  }
  if (/[@\s]import\s*(?:\(|["'])\s*https?:\/\//i.test(content)) {
    failures.push(`${path.relative(root, file)} imports a remote module or stylesheet`);
  }
}

const index = await readFile(path.join(dist, "index.html"), "utf8");
if (!/connect-src 'none'/.test(index)) failures.push("index.html CSP does not disable connections");
if (/\b(?:localStorage|sessionStorage|indexedDB)\b/.test(combinedOutput)) {
  failures.push("production output references persistent browser storage");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Network-silence check passed across ${files.length} production files (user-clicked external links are allowed).`);
}
