"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { Brand } from "./brand/Brand";
gsap.registerPlugin(DrawSVGPlugin);
// Nonblocking: the first chapter remains readable while its type finishes loading.
export function TantreLoader() {
  const [ready, setReady] = useState(false),
    ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let alive = true;
    const timer = setTimeout(() => {
      if (alive) setReady(true);
    }, 1800);
    document.fonts.ready.then(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);
  useEffect(() => {
    if (!ref.current || ready) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "path",
        { drawSVG: "0% 5%" },
        {
          drawSVG: "95% 100%",
          duration: 1.1,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut",
        },
      );
    }, ref);
    return () => ctx.revert();
  }, [ready]);
  if (ready) return null;
  return (
    <div ref={ref} className="tantre-loader" role="status">
      <Brand name="line-01-garabato" />
      <span className="sr-only">Preparando el lienzo…</span>
    </div>
  );
}
