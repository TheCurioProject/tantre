"use client";
import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import assets from "@/lib/generated/brand.json";
gsap.registerPlugin(useGSAP, MorphSVGPlugin, DrawSVGPlugin);
export const lineStates = [
  "garabato",
  "punto",
  "flecha-curva",
  "taza",
  "vapor",
  "pincel",
  "pincelada",
  "plato",
  "flor",
  "estrella",
  "corazon",
  "dos-manos",
  "camino",
  "check",
] as const;
export function LivingLine({
  state = 0,
  className = "",
}: {
  state?: number;
  className?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const previous = useRef(0);
  useGSAP(
    () => {
      const root = ref.current!;
      const index = Math.max(0, Math.min(13, state));
      const key =
        `line-${String(index + 1).padStart(2, "0")}-${lineStates[index]}` as keyof typeof assets;
      const doc = new DOMParser().parseFromString(
        `<svg xmlns="http://www.w3.org/2000/svg">${assets[key].content}</svg>`,
        "image/svg+xml",
      );
      const paths = [...doc.querySelectorAll("path")];
      const carrier = root.querySelector(".line-carrier")!;
      const details = root.querySelector(".line-details")!;
      gsap.killTweensOf(carrier);
      gsap.killTweensOf(details.children);
      details.replaceChildren(
        ...paths.slice(1).map((p) => document.importNode(p, true)),
      );
      const d = paths[0]?.getAttribute("d") || "";
      gsap.to(carrier, {
        morphSVG: { shape: d, map: "position" },
        duration: previous.current === index ? 0.3 : 0.8,
        ease: "power2.inOut",
        fill: index === 1 ? "currentColor" : "none",
      });
      gsap.fromTo(
        details.children,
        { drawSVG: "0%" },
        { drawSVG: "100%", duration: 0.5, stagger: 0.035, delay: 0.35 },
      );
      previous.current = index;
    },
    { scope: ref, dependencies: [state] },
  );
  return (
    <svg
      ref={ref}
      className={`living-line ${className}`}
      viewBox="0 0 320 320"
      aria-hidden="true"
    >
      <path
        className="line-carrier"
        d={assets["line-01-garabato"].content.match(/\bd="([^"]+)"/)?.[1] || ""}
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g className="line-details" />
    </svg>
  );
}
