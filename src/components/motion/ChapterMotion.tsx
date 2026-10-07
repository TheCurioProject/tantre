"use client";
import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
gsap.registerPlugin(
  ScrollTrigger,
  CustomEase,
  DrawSVGPlugin,
  SplitText,
  useGSAP,
);
CustomEase.create("tantre", ".18,.7,.24,1");
type Scene =
  | "intro"
  | "paint"
  | "process"
  | "coffee"
  | "community"
  | "faq"
  | "booking"
  | "visit";
export function ChapterMotion({
  children,
  className = "",
  id,
  scene = "intro",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  scene?: Scene;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const root = ref.current!;
      const select = gsap.utils.selector(root);
      // Each headline rises through its own typographic mask as the chapter arrives.
      // autoSplit rebuilds line masks after fonts load or the device rotates.
      const splits = [...root.querySelectorAll("h1, h2")].map((title) =>
        SplitText.create(title, {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 105,
              opacity: 0,
              rotationZ: 3,
              duration: 0.85,
              stagger: 0.085,
              ease: "tantre",
              scrollTrigger: {
                trigger: title,
                start: "top 92%",
                toggleActions: "play none none reverse",
              },
            }),
        }),
      );
      // Draws use the original hand-made SVG strokes, never replacement outlines.
      root.querySelectorAll("[data-draw]").forEach((drawing) => {
        gsap.fromTo(
          drawing.querySelectorAll("path"),
          { drawSVG: "0%" },
          {
            drawSVG: "100%",
            duration: scene === "booking" ? 1.5 : 1.05,
            stagger: 0.035,
            ease: "power2.inOut",
            scrollTrigger: {
              trigger: drawing,
              start: "top 88%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });
      const place = (selector: string, from: gsap.TweenVars) => {
        select(selector).forEach((element: Element, i: number) => {
          gsap.from(element, {
            autoAlpha: 0, // handles both opacity and visibility for FOUC prevention
            ...from,
            duration: 0.95,
            ease: "tantre",
            delay: (i % 4) * 0.08,
            scrollTrigger: {
              trigger: element,
              start: "top 94%",
              toggleActions: "play none none reverse",
            },
          });
        });
      };
      if (scene === "paint") {
        // Keep the canvas stationary, even if a visitor starts drawing during entry.
        place(".piece-tabs button", { y: 18, rotation: -2 });
        place(".palette button", { y: 16, rotation: -18 });
      } else if (scene === "process") {
        place(".step-art", { y: 42, rotation: -7, scale: 0.9 });
      } else if (scene === "coffee") {
        place(".coffee-cup", {
          y: 55,
          rotation: -8,
          transformOrigin: "50% 90%",
        });
        place(".coffee-snack", { x: 32, y: 20, rotation: 14 });
        gsap.to(select(".coffee-steam"), {
          y: -28,
          x: 8,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.8,
          },
        });
      } else if (scene === "community") {
        place(".community-drawing", { xPercent: -2, y: 30, rotation: -3 });
        place(".community-copy", { xPercent: 3.5, y: 16 });
      } else if (scene === "faq") {
        place(".faqs details", { xPercent: 3.5, rotation: 0.5 });
      } else if (scene === "booking") {
        place(".button", { y: 30, rotation: -3, scale: 0.95 });
        place(".booking-star", { rotation: -75, scale: 0.4 });
      } else if (scene === "visit") {
        place(".visit-details > .brand", { y: -32, scale: 0.85 });
        place(".visit-details > p, .visit-details > a", { y: 20 });
      }
      if (scene === "intro")
        place("[data-place]:not(h2)", { y: 38, rotation: -2 });
      return () => splits.forEach((split) => split.revert());
    },
    { scope: ref },
  );
  return (
    <div ref={ref} id={id} className={className} data-scene={scene} style={style}>
      {children}
    </div>
  );
}
