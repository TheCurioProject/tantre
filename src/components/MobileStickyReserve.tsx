"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { Brand } from "./brand/Brand";
import { track } from "./Analytics";
gsap.registerPlugin(useGSAP);
export function MobileStickyReserve() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const hero = document.querySelector(".hero");
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);
  useGSAP(
    () => {
      const bar = ref.current!;
      const copy = bar.querySelectorAll(".sticky-copy, .sticky-action");
      gsap.killTweensOf([bar, copy]);
      const timeline = gsap.timeline();
      if (visible) {
        timeline
          .set(bar, { visibility: "visible", pointerEvents: "auto" })
          .fromTo(
            bar,
            { yPercent: 115, opacity: 0 },
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.62,
              ease: "power4.out",
            },
          )
          .fromTo(
            copy,
            { y: 15, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.38,
              stagger: 0.07,
              ease: "power3.out",
            },
            0.18,
          );
      } else {
        timeline
          .to(copy, {
            y: 10,
            opacity: 0,
            duration: 0.2,
            stagger: { each: 0.035, from: "end" },
            ease: "power2.in",
          })
          .to(
            bar,
            {
              yPercent: 115,
              opacity: 0,
              duration: 0.42,
              ease: "power3.in",
              onComplete: () =>
                gsap.set(bar, {
                  visibility: "hidden",
                  pointerEvents: "none",
                }),
            },
            0.05,
          );
      }
      return () => timeline.kill();
    },
    { dependencies: [visible] },
  );
  return (
    <a
      ref={ref}
      className="mobile-sticky-reserve home-sticky"
      href="/reservar/"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      onClick={() => track("reserve_start", { source: "sticky" })}
    >
      <span className="sticky-copy">Haz espacio para ti.</span>
      <span className="sticky-action">
        Reservar
        <Brand name="ui-forward" />
      </span>
    </a>
  );
}
