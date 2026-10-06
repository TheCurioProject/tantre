import assets from "@/lib/generated/brand.json";
export type BrandName = keyof typeof assets;
export function Brand({
  name,
  className = "",
  label,
  ...props
}: {
  name: string;
  className?: string;
  label?: string;
} & React.SVGProps<SVGSVGElement>) {
  const asset = assets[name as BrandName];
  if (!asset) return null;
  let html = asset.content;
  // Prefix common Illustrator class names (e.g. cls-1, st0) in both class="" and <style>
  html = html.replace(/\b(cls-\d+|st\d+)\b/g, `${name}-$1`);
  // Prefix clip/mask IDs to prevent global namespace collisions
  html = html.replace(/\bid="(clip[^"]+|mask[^"]+)"/g, `id="${name}-$1"`);
  html = html.replace(/\burl\((['"]?)#(clip[^'"\)]+|mask[^'"\)]+)\1\)/g, `url($1#${name}-$2$1)`);
  html = html.replace(/\bhref="([^"]*?)#(clip[^"]+|mask[^"]+)"/g, `href="$1#${name}-$2"`);

  return (
    <svg
      viewBox={asset.viewBox}
      className={`brand ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...props}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
