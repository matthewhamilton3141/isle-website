#!/usr/bin/env node
/**
 * sync-from-swift.mjs
 *
 * Reads the app's Swift source and rewrites the generated blocks in
 * assets/isle.js and assets/isle.css, so the island replica on the site can't
 * drift from the island in the app.
 *
 * What comes from Swift:
 *   MarkerDesign.swift  the 5x5 grids, the state palette, and every marker's
 *                       lit dots, colour mode, animation, speed and intensity
 *   MarkerKind.swift    each state's title and one-line detail
 *   NotchShape.swift    the default corner radii of the notch outline
 *   NotchMetrics.swift  the size of the expanded panel
 *
 * What stays the site's own: which states to show, the short word the
 * collapsed island uses, and the note under each card.
 *
 *   node scripts/sync-from-swift.mjs [path-to-isle-repo]
 *   node scripts/sync-from-swift.mjs --check     # verify, write nothing
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const check = args.includes("--check");
const repo = resolve(
  args.find((a) => !a.startsWith("--")) || process.env.ISLE_REPO || join(SITE, "..", "isle")
);

const BEGIN = "BEGIN GENERATED (scripts/sync-from-swift.mjs)";
const END = "END GENERATED";

function die(msg) {
  console.error("sync-from-swift: " + msg);
  process.exit(1);
}

function read(rel) {
  const p = join(repo, rel);
  if (!existsSync(p)) die(`can't find ${rel} under ${repo}\n  pass the Isle repo path, or set ISLE_REPO`);
  return readFileSync(p, "utf8");
}

/** The body of the first `{ … }` at or after `from`, braces balanced. */
function block(src, from) {
  const open = src.indexOf("{", from);
  if (open === -1) return "";
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}" && --depth === 0) return src.slice(open + 1, i);
  }
  return "";
}

/* ---------------------------------------------------------------- parsing */

const designSrc = read("Isle/Markers/MarkerDesign.swift");
const kindSrc = read("Isle/Markers/MarkerKind.swift");
const shapeSrc = read("Isle/Notch/NotchShape.swift");
const metricsSrc = read("Isle/Notch/NotchMetrics.swift");

const dimension = Number(/static let dimension = (\d+)/.exec(designSrc)?.[1]);
const dotCount = Number(/static let dotCount = (\d+)/.exec(designSrc)?.[1]);
if (!dimension || !dotCount) die("couldn't read the grid size out of MarkerDesign.swift");

// Named grids: `static let checkmark = grid([4, 8, 10, 12, 16])`
const shapes = new Map();
for (const m of designSrc.matchAll(/static let (\w+) = grid\(\[([^\]]*)\]\)/g)) {
  shapes.set(m[1], m[2].split(",").map((n) => Number(n.trim())).filter((n) => !Number.isNaN(n)));
}
// `static let full = Array(repeating: true, count: dotCount)`
for (const m of designSrc.matchAll(/static let (\w+) = Array\(repeating: true, count: dotCount\)/g)) {
  shapes.set(m[1], Array.from({ length: dotCount }, (_, i) => i));
}
if (!shapes.size) die("couldn't read any dot grids out of MarkerDesign.swift");

// `private enum Hex { static let red = "#FF3B30" … }`
const hex = new Map();
const hexAt = designSrc.indexOf("enum Hex");
for (const m of block(designSrc, hexAt).matchAll(/static let (\w+) = "(#[0-9A-Fa-f]{6})"/g)) {
  hex.set(m[1], m[2].toLowerCase());
}

// Titles and details, from their own switches in MarkerKind.
function switchStrings(src, decl) {
  const at = src.indexOf(decl);
  if (at === -1) die(`couldn't find \`${decl}\` in MarkerKind.swift`);
  const out = new Map();
  for (const m of block(src, at).matchAll(/case\s+\.(\w+)\s*:\s*return\s+"((?:[^"\\]|\\.)*)"/g)) {
    out.set(m[1], m[2]);
  }
  return out;
}
// Scoped to `enum MarkerKind` — MarkerCategory declares a `title` too.
const kindBody = block(kindSrc, kindSrc.indexOf("enum MarkerKind"));
const titles = switchStrings(kindBody, "var title: String {");
const details = switchStrings(kindBody, "var detail: String {");

// `static func \`default\`(for kind: MarkerKind) -> MarkerDesign`
const defaultsAt = designSrc.indexOf("func `default`(for kind: MarkerKind)");
if (defaultsAt === -1) die("couldn't find MarkerDesign.default(for:)");
const defaultsBody = block(designSrc, defaultsAt);

const markers = {};
for (const chunk of defaultsBody.split(/\n\s*case\s+/).slice(1)) {
  const kinds = /^([^:]+):/.exec(chunk)?.[1] ?? "";
  const call = /MarkerDesign\(([^)]*)\)/.exec(chunk);
  if (!call) continue;

  const arg = {};
  for (const part of call[1].split(",")) {
    const [k, ...rest] = part.split(":");
    if (rest.length) arg[k.trim()] = rest.join(":").trim();
  }

  const grid = shapes.get(arg.dots);
  if (!grid) die(`unknown dot grid \`${arg.dots}\` — teach the script about it`);

  const lit = new Set(grid);
  const bits = Array.from({ length: dotCount }, (_, i) => (lit.has(i) ? "1" : "0")).join("");
  const colorRef = (arg.fixedColorHex || "").replace("Hex.", "");
  const color = hex.get(colorRef) || (colorRef.startsWith('"') ? colorRef.slice(1, -1).toLowerCase() : null);
  if (!color) die(`unknown colour \`${arg.fixedColorHex}\``);

  for (const raw of kinds.split(",")) {
    const kind = raw.trim().replace(/^\./, "");
    if (!kind) continue;
    if (!titles.has(kind)) die(`\`${kind}\` has a design but no title in MarkerKind.swift`);
    markers[kind] = {
      title: titles.get(kind),
      detail: details.get(kind) || "",
      dots: bits,
      colorMode: (arg.colorMode || "").replace(".", ""),
      hex: color,
      anim: (arg.animation || "").replace(".", ""),
      speed: Number(arg.speed),
      intensity: Number(arg.intensity),
      ghost: arg.ghost === "true"
    };
  }
}
if (!Object.keys(markers).length) die("parsed no markers — has MarkerDesign.default(for:) changed shape?");

const radii = /init\(topCornerRadius: CGFloat = ([\d.]+), bottomCornerRadius: CGFloat = ([\d.]+)\)/.exec(shapeSrc);
if (!radii) die("couldn't read the corner radii out of NotchShape.swift");

const panel = /static let expandedSize = CGSize\(width: ([\d.]+), height: ([\d.]+)\)/.exec(metricsSrc);
if (!panel) die("couldn't read expandedSize out of NotchMetrics.swift");

const version = (/MARKETING_VERSION = ([\d.]+)/.exec(
  existsSync(join(repo, "Isle.xcodeproj/project.pbxproj"))
    ? readFileSync(join(repo, "Isle.xcodeproj/project.pbxproj"), "utf8")
    : ""
) || [])[1];

/* ---------------------------------------------------------------- writing */

const stamp = "Isle" + (version ? " " + version : "") + " — MarkerDesign.swift, MarkerKind.swift, NotchShape.swift, NotchMetrics.swift";

const jsRows = Object.entries(markers).map(([kind, m]) =>
  `      ${kind}: { title: ${JSON.stringify(m.title)}, detail: ${JSON.stringify(m.detail)},` +
  ` dots: "${m.dots}", colorMode: "${m.colorMode}", hex: "${m.hex}",` +
  ` anim: "${m.anim}", speed: ${m.speed}, intensity: ${m.intensity}, ghost: ${m.ghost} }`
).join(",\n");

const jsBlock = `  var SWIFT = {
    /* ${stamp} */
    dimension: ${dimension},
    notch: { topCornerRadius: ${Number(radii[1])}, bottomCornerRadius: ${Number(radii[2])} },
    markers: {
${jsRows}
    }
  };`;

const cssBlock = `:root {
  /* ${stamp} */
  --expanded-w: ${Number(panel[1])}px;
  --expanded-h: ${Number(panel[2])}px;
}`;

function splice(file, body, comment) {
  const path = join(SITE, file);
  const src = readFileSync(path, "utf8");
  const open = src.indexOf(BEGIN);
  const close = src.indexOf(END, open);
  if (open === -1 || close === -1) die(`${file} has no generated block — expected a "${BEGIN}" comment`);

  const head = src.lastIndexOf("\n", open) + 1;
  const tail = src.indexOf("\n", close) + 1;
  const next = src.slice(0, head) + comment.begin + "\n" + body + "\n" + comment.end + "\n" + src.slice(tail);
  return { path, file, src, next };
}

const edits = [
  splice("assets/isle.js", jsBlock, {
    begin: `  /* --- ${BEGIN} --------- */`,
    end: `  /* --- ${END} ------------------------------------------------- */`
  }),
  splice("assets/isle.css", cssBlock, {
    begin: `/* --- ${BEGIN} ----------- */`,
    end: `/* --- ${END} --------------------------------------------------- */`
  })
];

const stale = edits.filter((e) => e.src !== e.next);

if (check) {
  if (stale.length) {
    console.error("sync-from-swift: out of date — " + stale.map((e) => e.file).join(", "));
    console.error("  run: node scripts/sync-from-swift.mjs");
    process.exit(1);
  }
  console.log("sync-from-swift: generated blocks match " + repo);
} else {
  stale.forEach((e) => writeFileSync(e.path, e.next));
  console.log(
    `sync-from-swift: ${Object.keys(markers).length} markers, ${dimension}x${dimension} grid, ` +
    `notch radii ${radii[1]}/${radii[2]}, panel ${panel[1]}x${panel[2]}\n` +
    (stale.length ? "  wrote " + stale.map((e) => e.file).join(", ") : "  already up to date")
  );
}

/* The site only draws the states listed in SHOWN, and the pages point at
   markers by key — so a key that no longer exists is a broken page. */
const isle = readFileSync(join(SITE, "assets/isle.js"), "utf8");
const shown = new Set(
  [...block(isle, isle.indexOf("var SHOWN = ")).matchAll(/^\s*(\w+)\s*:/gm)].map((m) => m[1])
);
const unknownState = [...shown].filter((k) => !markers[k]);
if (unknownState.length) die(`SHOWN lists ${unknownState.join(", ")}, which the app doesn't define`);

const bad = [];
for (const page of readdirSync(SITE).filter((f) => f.endsWith(".html"))) {
  const html = readFileSync(join(SITE, page), "utf8");
  for (const m of html.matchAll(/data-(?:marker|dots)="(\w+)"/g)) {
    if (!shown.has(m[1])) bad.push(`${page}: ${m[0]}`);
  }
}
if (bad.length) die("pages point at markers the site doesn't show:\n  " + bad.join("\n  "));
console.log(`  ${shown.size} shown, every data-marker / data-dots reference resolves`);
