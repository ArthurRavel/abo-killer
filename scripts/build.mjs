import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const assets = path.join(dist, "assets");

const hash = (content) => createHash("sha256").update(content).digest("hex").slice(0, 10);

await rm(dist, { recursive: true, force: true });
await mkdir(assets, { recursive: true });

const [htmlSource, css, main] = await Promise.all([
  readFile(path.join(root, "index.html"), "utf8"),
  readFile(path.join(root, "src/styles.css"), "utf8"),
  readFile(path.join(root, "src/main.js"), "utf8"),
]);

const cssName = `styles-${hash(css)}.css`;
const mainName = `main-${hash(main)}.js`;
const html = htmlSource
  .replace("./src/styles.css", `./assets/${cssName}`)
  .replace("./src/main.js", `./assets/${mainName}`);

await Promise.all([
  writeFile(path.join(dist, "index.html"), html),
  writeFile(path.join(assets, cssName), css),
  writeFile(path.join(assets, mainName), main),
  cp(path.join(root, "src/lib"), path.join(assets, "lib"), { recursive: true }),
  cp(path.join(root, "src/sample-data.js"), path.join(assets, "sample-data.js")),
]);

const manifest = {
  generatedBy: "scripts/build.mjs",
  entrypoints: { html: "index.html", css: `assets/${cssName}`, javascript: `assets/${mainName}` },
};
await writeFile(path.join(dist, "build-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Built ${path.relative(root, dist)} with ${cssName} and ${mainName}`);
