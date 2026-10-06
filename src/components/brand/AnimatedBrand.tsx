"use client";

import { useEffect, useImperativeHandle, useRef, type SVGProps } from "react";

// One observer and one visibility listener for all decorative SVGs, with no
// animation ticker, React updates per frame, or observers on static UI icons.
const drawings = new Map<SVGSVGElement, boolean>();
let observer: IntersectionObserver | undefined;
let preference: MediaQueryList | undefined;

function updatePlayback() {
  drawings.forEach((visible, drawing) => {
    drawing.dataset.motionPlaying = String(
      visible && !document.hidden && !preference?.matches,
    );
  });
}

function updatePreference() {
  observer?.disconnect();
  drawings.forEach((_, drawing) => {
    drawings.set(drawing, false);
    if (!preference?.matches) observer?.observe(drawing);
  });
  updatePlayback();
}

function observe(drawing: SVGSVGElement) {
  if (!drawings.size) {
    preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const target = entry.target as SVGSVGElement;
            if (drawings.has(target)) {
              drawings.set(
                target,
                entry.isIntersecting && entry.intersectionRatio >= 0.15,
              );
            }
          });
          updatePlayback();
        },
        { threshold: [0, 0.15] },
      );
    }
    preference.addEventListener("change", updatePreference);
    document.addEventListener("visibilitychange", updatePlayback);
  }
  drawings.set(drawing, false);
  if (!preference?.matches) observer?.observe(drawing);
  return () => {
    observer?.unobserve(drawing);
    drawings.delete(drawing);
    if (!drawings.size) {
      observer?.disconnect();
      observer = undefined;
      preference?.removeEventListener("change", updatePreference);
      document.removeEventListener("visibilitychange", updatePlayback);
      preference = undefined;
    }
  };
}

export function AnimatedBrand({
  ref: forwardedRef,
  ...props
}: SVGProps<SVGSVGElement>) {
  const ref = useRef<SVGSVGElement>(null);
  useImperativeHandle(forwardedRef, () => ref.current!);
  useEffect(() => observe(ref.current!), []);
  return <svg {...props} ref={ref} data-motion-playing="false" />;
}
