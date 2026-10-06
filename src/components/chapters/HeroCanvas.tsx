"use client";
import { useRef, useState } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";
import { Brand } from "../brand/Brand";
import { LivingLine } from "../motion/LivingLine";
import { track } from "../Analytics";
gsap.registerPlugin(SplitText, DrawSVGPlugin, CustomEase, useGSAP);
CustomEase.create("tantreHero", ".2,.8,.25,1");
export function HeroCanvas() {
  const ref = useRef<HTMLElement>(null);
  const [line, setLine] = useState(0);
  useGSAP(
    () => {
      const title = SplitText.create(".hero-title", {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 105,
            duration: 1,
            stagger: 0.1,
            ease: "tantreHero",
          }),
      });
      const tl = gsap.timeline();
      tl.from(
        ".hero-color-field",
        {
          rotation: 18,
          scale: 0.68,
          opacity: 0,
          duration: 1.05,
          ease: "tantreHero",
        },
        0.15,
      )
        .from(
          ".hero-art",
          {
            rotation: -5,
            y: 45,
            scale: 0.96,
            duration: 0.9,
            ease: "tantreHero",
          },
          0.24,
        )
        .fromTo(
          ".hero-art .ceramic-drawing path",
          { drawSVG: "0%" },
          { drawSVG: "100%", duration: 1.1, stagger: 0.02 },
          0.35,
        );

      const timer = setTimeout(() => setLine(3), 1100);
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.intersectionRatio >= 0.4) {
            track("hero_engaged", {
              device_class: matchMedia("(pointer: coarse)").matches
                ? "touch"
                : "desktop",
            });
            observer.disconnect();
          }
        },
        { threshold: 0.4 },
      );
      observer.observe(ref.current!);
      return () => {
        title.revert();
        tl.kill();
        clearTimeout(timer);
        observer.disconnect();
      };
    },
    { scope: ref },
  );
  return (
    <section ref={ref} className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow">
          <span className="tiny-line" /> UN ESPACIO PARA HACERLO TUYO
        </p>
        <h1 id="hero-title" className="hero-title">
          Un café.
          <br />
          Mil formas
          <br />
          de <em>crear.</em>
        </h1>
        <div className="hero-description">
          <p>
            Manos que pintan. Conversaciones que fluyen.
            <br className="desktop-only" /> Un ratito para estar aquí, de
            verdad.
          </p>
          <a className="button" href="/reservar/">
            Reserva tu mesa <Brand name="ui-forward" />
          </a>
        </div>
      </div>
      <div className="hero-visual">
        <div className="hero-note">
          <span>
            NO TIENES QUE SABER.
            <br />
            SOLO TENER GANAS.
          </span>
          <Brand name="doodle-flecha-larga" />
        </div>
        <div className="hero-art">
          <div className="hero-color-field" aria-hidden="true" />
          <span className="art-index">ESTUDIO DE UNA POSIBILIDAD — 001</span>
          <Brand name="mask-paint-03" className="hero-swatch" />
          <Brand name="ceramic-taza-clasica" className="ceramic-drawing" />
          <Brand name="doodle-mini-flor" className="hero-flower" />
          <span className="art-caption">Aquí empieza algo tuyo.</span>
        </div>
        <LivingLine state={line} className="hero-living" />
        <div className="hero-footnote">
          <span>CERÁMICA + CAFÉ + TÚ</span>
          <span>GDL · MX</span>
        </div>
      </div>
      <a href="#experiencia" className="scroll-note">
        <span>
          El lienzo está en blanco.
          <br />
          Lo que sigue, lo pones tú.
        </span>
        <Brand name="line-03-flecha-curva" />
      </a>
    </section>
  );
}
