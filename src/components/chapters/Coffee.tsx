"use client";
import { Brand } from "../brand/Brand";
import { ChapterMotion } from "../motion/ChapterMotion";

export function Coffee() {
  return (
    <ChapterMotion id="cafe" className="coffee-chapter" scene="coffee">
      <div className="coffee-art" data-place>
        <Brand name="cafe-latte" className="coffee-cup" />
        <Brand name="line-05-vapor" className="coffee-steam" data-draw />
        <Brand name="cafe-croissant" className="coffee-snack" />
        <span>UNA PAUSA BIEN HECHA.</span>
      </div>
      <div className="coffee-copy">
        <p className="eyebrow">04 / ENTRE UNA PINCELADA Y OTRA</p>
        <h2>
          El complemento
          <br />
          <em>perfecto.</em>
        </h2>
        <p>
          Sabemos que la inspiración fluye mejor con una buena taza. Nuestra barra de especialidad y selección de repostería artesanal están pensadas para acompañar cada una de tus pinceladas y hacer que no quieras irte.
        </p>
        <a href="/reservar/" className="text-link">
          Ven a vivir la experiencia
          <Brand name="ui-forward" />
        </a>
        <Brand name="illus-cafe-pausa" className="coffee-mini" />
      </div>
    </ChapterMotion>
  );
}
