"use client";
import { useEffect, useRef } from "react";

type Point = { x: number; y: number; pressure: number };
const MAX_EDGE = 1024;

export function FreehandCanvas({
  color,
  size,
  clear,
  active,
  onPaint,
}: {
  color: string;
  size: number;
  clear: number;
  active: boolean;
  onPaint: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const notify = useRef(onPaint);
  const keyboardPosition = useRef({ x: 0.5, y: 0.5, pressure: 1 });

  useEffect(() => {
    notify.current = onPaint;
  }, [onPaint]);

  useEffect(() => {
    const canvas = ref.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  }, [clear]);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let pointer: number | null = null;
    let bounds = canvas.getBoundingClientRect();
    let frame = 0;
    let queue: Point[] = [];
    let last: Point | null = null;
    let keyboardDown = false;
    const keyboard = keyboardPosition.current;
    const cursor = canvas.nextElementSibling as HTMLElement;

    const resize = () => {
      const nextBounds = canvas.getBoundingClientRect();
      if (!nextBounds.width || !nextBounds.height) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const scale = Math.min(
        ratio,
        MAX_EDGE / Math.max(nextBounds.width, nextBounds.height),
      );
      const width = Math.max(1, Math.round(nextBounds.width * scale));
      const height = Math.max(1, Math.round(nextBounds.height * scale));
      bounds = nextBounds;
      if (canvas.width === width && canvas.height === height) return;
      const copy = document.createElement("canvas");
      copy.width = canvas.width;
      copy.height = canvas.height;
      copy.getContext("2d")?.drawImage(canvas, 0, 0);
      canvas.width = width;
      canvas.height = height;
      if (copy.width && copy.height)
        ctx.drawImage(copy, 0, 0, copy.width, copy.height, 0, 0, width, height);
    };

    const point = (event: PointerEvent): Point => ({
      x: ((event.clientX - bounds.left) * canvas.width) / bounds.width,
      y: ((event.clientY - bounds.top) * canvas.height) / bounds.height,
      pressure: event.pointerType === "pen" ? Math.max(0.3, event.pressure) : 1,
    });

    const flush = () => {
      frame = 0;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalCompositeOperation = "source-over";
      const pixelScale = canvas.width / Math.max(bounds.width, 1);
      for (const p of queue) {
        ctx.lineWidth = size * pixelScale * p.pressure;
        ctx.beginPath();
        if (last) {
          ctx.moveTo(last.x, last.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        } else {
          ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        last = p;
      }
      queue = [];
    };

    const enqueue = (p: Point) => {
      queue.push(p);
      if (!frame) frame = requestAnimationFrame(flush);
    };

    const finish = () => {
      if (frame) cancelAnimationFrame(frame);
      if (queue.length) flush();
      last = null;
      keyboardDown = false;
      const captured = pointer;
      pointer = null;
      if (captured !== null && canvas.hasPointerCapture(captured))
        canvas.releasePointerCapture(captured);
    };

    const down = (event: PointerEvent) => {
      if (!active || !event.isPrimary || event.button !== 0 || pointer !== null)
        return;
      event.preventDefault();
      finish();
      resize();
      bounds = canvas.getBoundingClientRect();
      pointer = event.pointerId;
      canvas.setPointerCapture(pointer);
      canvas.dataset.input = "pointer";
      canvas.focus({ preventScroll: true });
      enqueue(point(event));
      notify.current();
    };

    const move = (event: PointerEvent) => {
      if (event.pointerId !== pointer) return;
      const samples = event.getCoalescedEvents?.() || [];
      for (const sample of samples.length ? samples : [event])
        enqueue(point(sample));
    };

    const up = (event: PointerEvent) => {
      if (event.pointerId !== pointer) return;
      if (event.type === "pointerup") enqueue(point(event));
      finish();
    };

    const keydown = (event: KeyboardEvent) => {
      if (!active) return;
      canvas.dataset.input = "keyboard";
      const directions: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      const direction = directions[event.key];
      if (direction) {
        event.preventDefault();
        keyboard.x = Math.max(
          0,
          Math.min(1, keyboard.x + direction[0] * 0.025),
        );
        keyboard.y = Math.max(
          0,
          Math.min(1, keyboard.y + direction[1] * 0.025),
        );
        cursor.style.left = `${keyboard.x * 100}%`;
        cursor.style.top = `${keyboard.y * 100}%`;
        if (keyboardDown)
          enqueue({
            x: keyboard.x * canvas.width,
            y: keyboard.y * canvas.height,
            pressure: 1,
          });
      } else if (event.code === "Space" || event.key === "Enter") {
        event.preventDefault();
        if (event.repeat) return;
        finish();
        resize();
        keyboardDown = true;
        enqueue({
          x: keyboard.x * canvas.width,
          y: keyboard.y * canvas.height,
          pressure: 1,
        });
        notify.current();
      }
    };

    const keyup = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.key === "Enter") finish();
    };
    const visibility = () => {
      if (document.hidden) finish();
    };
    const observer = new ResizeObserver(() => {
      finish();
      resize();
    });

    resize();
    observer.observe(canvas);
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("lostpointercapture", up);
    canvas.addEventListener("keydown", keydown);
    canvas.addEventListener("keyup", keyup);
    canvas.addEventListener("blur", finish);
    document.addEventListener("visibilitychange", visibility);

    return () => {
      finish();
      observer.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("lostpointercapture", up);
      canvas.removeEventListener("keydown", keydown);
      canvas.removeEventListener("keyup", keyup);
      canvas.removeEventListener("blur", finish);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [active, color, size]);

  return (
    <>
      <canvas
        ref={ref}
        className="paint-canvas"
        tabIndex={active ? 0 : -1}
        role="img"
        aria-label="Lienzo para pintar todo el cuadro hueso"
        aria-describedby="paint-instructions paint-keyboard"
        aria-hidden={!active}
        hidden={!active}
      >
        Dibuja sobre todo el cuadro con el dedo, ratón o lápiz.
      </canvas>
      <span
        className="paint-keyboard-cursor"
        aria-hidden="true"
        hidden={!active}
      />
    </>
  );
}
