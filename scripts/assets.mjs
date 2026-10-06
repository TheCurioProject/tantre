import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
async function walk(dir) {
  const rows = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) rows.push(...(await walk(file)));
    else if (file.endsWith('.svg')) rows.push(file);
  }
  return rows;
}
const svgFiles = await walk("public/brand");
const assets = {};
for (const file of svgFiles) {
  if (file.includes('derived')) continue; // Skip generated files if any
  const original = await fs.readFile(file, "utf8");
  if (/<script|<foreignObject|\son\w+=|<image/i.test(original))
    throw new Error(`Unsafe brand asset: ${file}`);
  const viewBoxMatch = original.match(/viewBox="([^"]+)"/);
  if (!viewBoxMatch) continue;
  const viewBox = viewBoxMatch[1];
  const content = original
    .replace(/^.*?<svg[^>]*>/s, "")
    .replace(/<\/svg>\s*$/, "")
    .replace(/<(title|desc)>.*?<\/\1>/gs, "");
  const base = path.basename(file, ".svg");
  assets[base] = {
    viewBox,
    content,
    file: `/${file}`,
  };
}
await fs.mkdir("src/lib/generated", { recursive: true });
await fs.writeFile("src/lib/generated/brand.json", JSON.stringify(assets));
console.log(
  `Validated ${Object.keys(assets).length} original SVGs. No source artwork changed.`,
);

// Planar objects have a decorative inner contour in the original even-odd mask.
// Preserve the original file and derive a filled surface from its outer subpath.
await fs.mkdir("public/brand/derived", { recursive: true });
for (const name of [
  "ceramic-plato-llano",
  "ceramic-platito-corazon",
  "ceramic-charola-oval",
]) {
  const original = await fs.readFile(
    `public/brand/ceramics/${name}-mask.svg`,
    "utf8",
  );
  const derived = original.replace(
    /d="([^"]+)"/,
    (_, d) => `d="${d.split(/(?<=Z)\s*(?=M)/)[0]}"`,
  );
  await fs.writeFile(`public/brand/derived/${name}-surface.svg`, derived);
}

const mug = await fs.readFile(
  "public/brand/ceramics/ceramic-taza-clasica.svg",
  "utf8",
);
const mugBody = mug.replace(/^.*?<svg[^>]*>/s, "").replace(/<\/svg>\s*$/, "");
const social = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#FFFDF8"/><path d="M755 595V285C755 30 1150 30 1150 285V595Z" fill="#B6A4D8"/><g transform="translate(760 190) scale(.75)" color="#181716">${mugBody}</g><g fill="#181716" font-family="Georgia,serif"><text x="65" y="112" font-size="62">tantre</text><text x="65" y="275" font-size="100">Un café.</text><text x="65" y="380" font-size="100">Mil formas</text><text x="65" y="485" font-size="100" font-style="italic">de crear.</text></g><text x="70" y="575" fill="#181716" font-family="Arial,sans-serif" font-size="17" letter-spacing="3">CERÁMICA + CAFÉ + TÚ · GUADALAJARA</text></svg>`;
await sharp(Buffer.from(social))
  .png({ compressionLevel: 9 })
  .toFile("public/og-tantre.png");
