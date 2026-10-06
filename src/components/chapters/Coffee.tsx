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
          También venimos
          <br />
          por <em>el café.</em>
        </h2>
        <p>
          Una taza caliente. Algo rico para compartir. Y esa conversación que
          no quieres que se acabe.
        </p>
        <a href="/catalogo/cafe/" className="text-link">
          Descubre café & snacks
          <Brand name="ui-forward" />
        </a>
        <Brand name="illus-cafe-pausa" className="coffee-mini" />
      </div>
    </ChapterMotion>
  );
}
