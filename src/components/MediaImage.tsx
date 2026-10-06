import { mediaUrl } from "@/lib/api";
export function MediaImage({
  path,
  alt,
  width = 1600,
  height = 1200,
  sizes = "(max-width: 600px) 45vw, (max-width: 1180px) 44vw, 30vw",
  className,
}: {
  path: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
}) {
  const small = Math.min(width, 640);
  return (
    <img
      className={className}
      src={mediaUrl(path, small)}
      srcSet={`${mediaUrl(path, small)} ${small}w${width > small ? `, ${mediaUrl(path, width)} ${width}w` : ""}`}
      sizes={sizes}
      width={width}
      height={height}
      alt={alt}
      loading="lazy"
      decoding="async"
    />
  );
}
