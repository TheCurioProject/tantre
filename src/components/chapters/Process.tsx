"use client";
import { Brand } from "../brand/Brand";
import { ChapterMotion } from "../motion/ChapterMotion";

const steps = [
  [
    "proc-01-elegir",
    "Encuentra tu pieza.",
    "Una forma en blanco, muchas posibilidades.",
  ],
  [
    "proc-02-pintar",
    "Hazla tuya.",
    "Pinceles, colores y tiempo para experimentar.",
  ],
  [
    "proc-03-horno",
    "La transformamos.",
    "Nos encargamos del acabado y del horneado.",
  ],
  [
    "proc-06-recoger",
    "Llévate un recuerdo.",
    "Te contamos cuándo volver por tu pieza terminada.",
  ],
];

export function Process() {
  return (
    <ChapterMotion className="chapter process-chapter" scene="process">
      <div className="process-title">
        <p className="eyebrow">03 / DEL PRIMER TRAZO AL ÚLTIMO RECUERDO</p>
        <h2>
          Lo bonito está
          <br />
          <em>en el proceso.</em>
        </h2>
        <Brand name="line-13-camino" className="process-path" data-draw />
      </div>
      <div className="process-grid">
        {steps.map(([asset, title, copy], i) => (
          <article key={asset} data-place>
            <div className="step-art">
              <Brand name={asset} />
              <span>0{i + 1}</span>
            </div>
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </div>
    </ChapterMotion>
  );
}
