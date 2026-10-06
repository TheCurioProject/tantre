"use client";
import { useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useGSAP } from "@gsap/react";
import { Brand } from "../brand/Brand";
import { LivingLine } from "../motion/LivingLine";
import { ChapterMotion } from "../motion/ChapterMotion";
import { FreehandCanvas } from "./FreehandCanvas";
import { usePublicData } from "../Providers";
import { track } from "../Analytics";
gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, useGSAP);
const pieces = [
  {
    name: "Una taza",
    asset: "ceramic-taza-clasica",
    caption: "Para tus mañanas lentas.",
    color: "pink",
  },
  {
    name: "Un plato",
    asset: "ceramic-plato-llano",
    caption: "Para servir algo muy tuyo.",
    color: "lavender",
  },
  {
    name: "Un bowl",
    asset: "ceramic-bowl",
    caption: "Para guardar pequeños rituales.",
    color: "mint",
  },
  {
    name: "Una maceta",
    asset: "ceramic-maceta",
    caption: "Para ver crecer nuevas ideas.",
    color: "yellow",
  },
];
const colors = [
  { name: "Rosa", token: "pink", hex: "#D95198" },
  { name: "Lavanda", token: "lavender", hex: "#8472CF" },
  { name: "Azul", token: "periwinkle", hex: "#687FD0" },
  { name: "Menta", token: "mint", hex: "#80B993" },
  { name: "Amarillo", token: "yellow", hex: "#E6B95D" },
];
export function PaintInteraction() {
  const [selected, setSelected] = useState(0);
  const [color, setColor] = useState(colors[0]);
  const [size, setSize] = useState(16);
  const [painted, setPainted] = useState([false, false, false, false]);
  const [clears, setClears] = useState([0, 0, 0, 0]);
  const table = useRef<HTMLDivElement>(null);
  const { data } = usePublicData();
  const enabled = data.settings.paint_enabled !== false;
  useGSAP(
    () => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: table.current,
          start: "top 88%",
          toggleActions: "play none none reverse",
        },
      });
      timeline
        .fromTo(
          ".piece-surface:not([hidden]) .piece-outline path",
          { drawSVG: "0%" },
          {
            drawSVG: "100%",
            duration: 0.72,
            stagger: 0.025,
            ease: "power2.inOut",
          },
        )
        .fromTo(
          ".piece-caption > *",
          { y: 18, rotation: -1.2, opacity: 0 },
          {
            y: 0,
            rotation: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.06,
            ease: "power3.out",
          },
          0.12,
        );
      return () => timeline.kill();
    },
    { scope: table, dependencies: [selected] },
  );
  return (
    <ChapterMotion id="piezas" className="chapter choose-chapter" scene="paint">
      <div className="chapter-heading">
        <p className="eyebrow">02 / TODO EMPIEZA EN BLANCO</p>
        <h2>
          Tu próxima
          <br />
          <em>pieza favorita.</em>
        </h2>
        <p>
          Elige una forma.
          <br />
          Imagina todo lo que puede ser.
        </p>
      </div>
      <div className="paint-studio">
        <div className="piece-tabs" role="group" aria-label="Elige una pieza">
          {pieces.map((piece, i) => (
            <button
              key={piece.asset}
              aria-pressed={selected === i}
              className={selected === i ? "active" : ""}
              onClick={() => setSelected(i)}
            >
              <span>0{i + 1}</span>
              {piece.name}
            </button>
          ))}
        </div>
        <div className="painting-table" ref={table}>
          {enabled &&
            pieces.map((piece, i) => (
              <FreehandCanvas
                key={`canvas-${piece.asset}`}
                color={color.hex}
                size={size}
                clear={clears[i]}
                active={selected === i}
                onPaint={() => {
                  setPainted((previous) =>
                    previous[i]
                      ? previous
                      : previous.map((value, index) => index === i || value),
                  );
                  track("piece_color_try", {
                    item_id: piece.asset,
                    color_token: color.token,
                  });
                }}
              />
            ))}
          <div className="paint-piece">
            {pieces.map((piece, i) => (
              <div
                className="piece-surface"
                key={piece.asset}
                hidden={selected !== i}
              >
                <Brand name={piece.asset} className="piece-outline" />
              </div>
            ))}
            <span className="piece-number">
              {String(selected + 1).padStart(2, "0")} / 04
            </span>
          </div>
          <div className="piece-caption">
            <h3>
              {pieces[selected].name},<br />
              <em>pero como ninguna.</em>
            </h3>
            <p>{pieces[selected].caption}</p>
          </div>
          <LivingLine
            state={painted[selected] ? 6 : 5}
            className="paint-line"
          />
        </div>
        {enabled && (
          <div className="paint-controls">
            <div>
              <p className="eyebrow">DALE TU PRIMERA PINCELADA</p>
              <div
                className="palette"
                role="group"
                aria-label="Color de pintura"
              >
                {colors.map((c) => (
                  <button
                    key={c.token}
                    aria-label={c.name}
                    aria-pressed={color.token === c.token}
                    onClick={() => setColor(c)}
                    className={c.token === color.token ? "selected" : ""}
                    style={{ "--paint": c.hex } as React.CSSProperties}
                  >
                    <Brand name="mask-paint-03" />
                  </button>
                ))}
              </div>
            </div>
            <div className="brush-settings">
              <Brand name="line-06-pincel" />
              <label htmlFor="brush-size">
                Grosor del pincel
                <input
                  id="brush-size"
                  type="range"
                  min="4"
                  max="40"
                  value={size}
                  onChange={(event) => setSize(Number(event.target.value))}
                />
              </label>
            </div>
            <button
              className="reset-paint"
              disabled={!painted[selected]}
              onClick={() => {
                setClears((previous) =>
                  previous.map((value, i) =>
                    i === selected ? value + 1 : value,
                  ),
                );
                setPainted((previous) =>
                  previous.map((value, i) => (i === selected ? false : value)),
                );
              }}
            >
              Volver al blanco
            </button>
          </div>
        )}
        {enabled && (
          <p id="paint-instructions" className="paint-instructions">
            Dibuja libremente sobre todo el cuadro hueso. Cambia de color y
            pinta encima, sin límites.
            <span id="paint-keyboard">
              {" "}
              Con teclado: mueve el pincel con las flechas y mantén Espacio para
              pintar.
            </span>
          </p>
        )}
        <p className="paint-disclaimer">
          Una pequeña prueba de color. La pieza de verdad te espera en el
          estudio.
        </p>
      </div>
      <div className="chapter-tail">
        <p>Las posibilidades no caben en una pantalla.</p>
        <a className="text-link" href="/catalogo/piezas/">
          Explora el catálogo
          <Brand name="ui-forward" />
        </a>
      </div>
    </ChapterMotion>
  );
}
