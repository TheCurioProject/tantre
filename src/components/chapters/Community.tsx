"use client";
import { usePublicData } from "../Providers";
import { Brand } from "../brand/Brand";
import { ChapterMotion } from "../motion/ChapterMotion";
import { PhotoReveal } from "../motion/PhotoReveal";
import { MediaImage } from "../MediaImage";
import { money } from "@/lib/utils";

export function Community() {
  const { data } = usePublicData();

  return (
    <ChapterMotion id="juntos" className="chapter community" scene="community">
      <p className="eyebrow">05 / HAY COSAS QUE SALEN MEJOR JUNTOS</p>
      <h2>
        Haz espacio
        <br />
        para <em>compartir.</em>
      </h2>
      <div className="community-composition">
        <div className="community-drawing" data-place>
          <Brand name="illus-mejor-juntos" />
          <span>
            MANOS OCUPADAS.
            <br />
            BUENAS CONVERSACIONES.
          </span>
        </div>
        <div className="community-copy">
          <Brand name="line-12-dos-manos" data-draw />
          <p>
            Una cita diferente, una tarde entre amigos o una celebración sin
            prisas. Siempre hay una buena razón para sentarse a crear.
          </p>
          <a href="/reservar/" className="text-link">
            Encuentren su momento
            <Brand name="ui-forward" />
          </a>
        </div>
      </div>
      {data.packages && data.packages.length > 0 && (
        <div className="packages-list">
          {data.packages.map((p) => (
            <a key={p.id} href={`/reservar/?personas=${p.min_people}`}>
              <h3>{p.title}</h3>
              <p>{p.description}</p>
              <span>
                {p.min_people}–{p.max_people} personas
                {p.price_cents !== null ? ` · ${money(p.price_cents)}` : ""}
              </span>
              <Brand name="ui-forward" />
            </a>
          ))}
        </div>
      )}
      {data.gallery && data.gallery.length > 0 && (
        <div className="community-gallery">
          {data.gallery.map((p) => (
            <figure key={p.id}>
              <PhotoReveal>
                <MediaImage
                  path={p.storage_path}
                  alt={p.alt}
                  width={p.media_assets?.width}
                  height={p.media_assets?.height}
                />
              </PhotoReveal>
              <figcaption>{p.caption}</figcaption>
            </figure>
          ))}
        </div>
      )}
      {data.testimonials && data.testimonials.map((t) => (
        <blockquote key={t.id}>
          <p>“{t.quote}”</p>
          <cite>
            {t.name}
            {t.handle ? ` · ${t.handle}` : ""}
          </cite>
        </blockquote>
      ))}
    </ChapterMotion>
  );
}
