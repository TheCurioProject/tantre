import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
const spec = JSON.parse(await fs.readFile("tantre-assets/specs.json", "utf8"));
async function walk(dir) {
  const rows = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) rows.push(...(await walk(file)));
    else rows.push(file);
  }
  return rows;
}
const rows = [];
for (const file of await walk("tantre-assets")) {
  if (file.endsWith(".DS_Store")) continue;
  const extension = path.extname(file).slice(1).toLowerCase();
  const data = spec.assets.find((a) => file.endsWith(a.archivo));
  let width = "",
    height = "",
    viewBox = "";
  if (extension === "svg") {
    const text = await fs.readFile(file, "utf8");
    viewBox = text.match(/viewBox="([^"]+)"/)?.[1] || "";
    [, , width, height] = viewBox.split(" ");
  } else if (["png", "jpg", "jpeg", "webp", "avif"].includes(extension)) {
    const m = await sharp(file).metadata();
    width = m.width;
    height = m.height;
  }
  const family = file.includes("living-line")
    ? "Living Line"
    : file.includes("ceramics")
      ? "Cerámica"
      : file.includes("/cafe/")
        ? "Café"
        : file.includes("/ui/")
          ? "UI"
          : file.includes("mask")
            ? "PAINT / máscara"
            : file.includes("reference")
              ? "Referencia, no publicar como TANTRE"
              : file.includes("preview")
                ? "Hoja de revisión"
                : data?.contexto || "Recurso de proyecto";
  rows.push({
    file,
    format: extension,
    bytes: (await fs.stat(file)).size,
    width,
    height,
    viewBox,
    id: data?.id || "",
    name: data?.nombre || "",
    family,
    use: data?.funcion || "",
    context: data?.contexto || "",
    states: data?.variantes || "",
  });
}
await fs.mkdir("docs", { recursive: true });
await fs.writeFile("docs/ASSETS.json", JSON.stringify(rows, null, 2));
const fields = Object.keys(rows[0]);
await fs.writeFile(
  "docs/ASSETS.csv",
  [fields, ...rows.map((r) => fields.map((f) => r[f]))]
    .map((row) =>
      row.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","),
    )
    .join("\n"),
);
console.log(
  `${rows.length} files inventoried with dimensions and original specification mapping.`,
);
