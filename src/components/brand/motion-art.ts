// Path ranges refer to the original artwork in public/brand (zero based).
// Group only related, adjacent strokes so their geometry stays intact.
const details: Record<
  string,
  { first: number; last: number; gesture: string }
> = {
  "illus-cafe-pausa": { first: 6, last: 8, gesture: "steam" },
  "illus-mejor-juntos": { first: 11, last: 11, gesture: "heart" },
  "proc-01-elegir": { first: 9, last: 10, gesture: "glimmer" },
  "proc-02-pintar": { first: 4, last: 14, gesture: "brush" },
  "proc-03-horno": { first: 28, last: 30, gesture: "heat" },
  "proc-06-recoger": { first: 15, last: 15, gesture: "heart" },
  "line-05-vapor": { first: 0, last: 2, gesture: "steam" },
  "doodle-mini-flor": { first: 0, last: 5, gesture: "flower" },
  "doodle-corazon": { first: 0, last: 0, gesture: "heart" },
  "doodle-mini-estrella": { first: 0, last: 0, gesture: "star" },
  "doodle-spark-3-lineas": { first: 0, last: 2, gesture: "glimmer" },
};

export function prepareMotionArt(name: string, content: string) {
  // Inline SVG styles are document-global. These legacy rules target ALL svg/path
  // elements, overriding other drawings and GSAP. Keep Illustrator paint styles.
  let html = content
    .replace(/<style\s+id="tantre-anim">[\s\S]*?<\/style>/g, "")
    .replace(/\s+id="tantre-anim-group"/g, "");
  const detail = details[name];
  if (!detail) return { html, animated: false };

  const paths = [...html.matchAll(/<path\b[^>]*\/>/g)];
  const first = paths[detail.first];
  const last = paths[detail.last];
  if (!first || !last) return { html, animated: false };
  const start = first.index;
  const end = last.index + last[0].length;
  // Fail static if an asset revision changes its grouping.
  if (/<\/?g\b/.test(html.slice(start, end))) return { html, animated: false };
  html = `${html.slice(0, start)}<g class="brand-detail brand-detail--${detail.gesture}">${html.slice(start, end)}</g>${html.slice(end)}`;
  return { html, animated: true };
}
