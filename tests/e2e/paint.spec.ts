import { test, expect, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

async function studio(page: Page) {
  await page.goto("/");
  await page.locator(".painting-table").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200); // Let the workbench settle before caching pointer coordinates.
  return page.locator(".paint-canvas:visible");
}
async function pixel(page: Page, x: number, y: number) {
  return page
    .locator(".paint-canvas:visible")
    .evaluate(
      (canvas: HTMLCanvasElement, p) => [
        ...canvas
          .getContext("2d")!
          .getImageData(
            Math.round(p.x * canvas.width),
            Math.round(p.y * canvas.height),
            1,
            1,
          ).data,
      ],
      { x, y },
    );
}
async function stroke(
  page: Page,
  from: [number, number],
  to: [number, number],
) {
  const box = (await page.locator(".paint-canvas:visible").boundingBox())!;
  await page.mouse.move(
    box.x + box.width * from[0],
    box.y + box.height * from[1],
  );
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * to[0], box.y + box.height * to[1], {
    steps: 24,
  });
  // Paint must be visible before lifting the pointer, not just on pointerup.
  await expect
    .poll(() =>
      pixel(page, (from[0] + to[0]) / 2, (from[1] + to[1]) / 2).then(
        (p) => p[3],
      ),
    )
    .toBe(255);
  await page.mouse.up();
}
test("pincel libre: trazo continuo en vivo, superposición, memoria por pieza y borrar", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await studio(page);
  const tableBox = await page.locator(".painting-table").boundingBox();
  const canvasBox = await page.locator(".paint-canvas:visible").boundingBox();
  expect(canvasBox).toEqual(tableBox);
  await stroke(page, [0.3, 0.55], [0.65, 0.55]);
  for (const x of [0.31, 0.38, 0.45, 0.52, 0.59, 0.64])
    expect(await pixel(page, x, 0.55)).toEqual([217, 81, 152, 255]);
  await page.getByRole("button", { name: "Azul", exact: true }).click();
  await stroke(page, [0.48, 0.38], [0.48, 0.75]);
  expect(await pixel(page, 0.48, 0.55)).toEqual([104, 127, 208, 255]);
  expect(await pixel(page, 0.34, 0.55)).toEqual([217, 81, 152, 255]);
  // This corner is outside the ceramic silhouette but remains inside the bone panel.
  await stroke(page, [0.82, 0.18], [0.92, 0.18]);
  expect(await pixel(page, 0.87, 0.18)).toEqual([104, 127, 208, 255]);
  await page.getByRole("button", { name: "Un plato", exact: false }).click();
  expect(await pixel(page, 0.48, 0.55)).toEqual([0, 0, 0, 0]);
  await page.getByRole("button", { name: "Una taza", exact: false }).click();
  expect(await pixel(page, 0.48, 0.55)).toEqual([104, 127, 208, 255]);
  await page.setViewportSize({ width: 390, height: 844 });
  const resizedColor = await pixel(page, 0.48, 0.55);
  expect(Math.abs(resizedColor[0] - 104)).toBeLessThanOrEqual(1);
  expect(Math.abs(resizedColor[1] - 127)).toBeLessThanOrEqual(1);
  expect(Math.abs(resizedColor[2] - 208)).toBeLessThanOrEqual(1);
  expect(resizedColor[3]).toBe(255);
  await page.getByRole("button", { name: "Volver al blanco" }).click();
  expect(await pixel(page, 0.48, 0.55)).toEqual([0, 0, 0, 0]);
  await expect(
    page.getByRole("button", { name: "Volver al blanco" }),
  ).toBeDisabled();
  expect(await page.locator("canvas:not(#piezas canvas)").count()).toBe(0);
  expect(errors).toEqual([]);
});

test("teclado: flechas, Espacio y grosor accesible", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const canvas = await studio(page);
  await canvas.focus();
  await page.keyboard.down("Space");
  for (let i = 0; i < 8; i++) await page.keyboard.press("ArrowRight");
  await page.keyboard.up("Space");
  expect(await pixel(page, 0.55, 0.5)).toEqual([217, 81, 152, 255]);
  await page.getByRole("slider", { name: "Grosor del pincel" }).focus();
  await page.keyboard.press("End");
  await expect(page.getByRole("slider")).toHaveValue("40");
});

test("touch: dibuja sin desplazar la página; fuera del lienzo conserva el scroll", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("http://localhost:8790/");
  await page.locator(".painting-table").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  const cdp = await context.newCDPSession(page);
  const box = (await page.locator(".paint-canvas:visible").boundingBox())!;
  const scroll = await page.evaluate(() => scrollY);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: box.x + box.width * 0.4, y: box.y + box.height * 0.45 }],
  });
  for (let i = 1; i <= 12; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: box.x + box.width * 0.4,
          y: box.y + box.height * (0.45 + i * 0.02),
        },
      ],
    });
  await expect.poll(() => pixel(page, 0.4, 0.55).then((p) => p[3])).toBe(255);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 8, y: 650 }],
  });
  for (let i = 1; i <= 8; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: 8, y: 650 - i * 25 }],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect
    .poll(() => page.evaluate(() => scrollY))
    .toBeGreaterThan(scroll + 50);
  await context.close();
});

test("pintura: muestra de tiempos de frame durante dibujo continuo", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const canvas = await studio(page);
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.32, box.y + box.height * 0.45);
  await page.mouse.down();
  const sampling = page.evaluate(
    () =>
      new Promise<number[]>((resolve) => {
        const frames: number[] = [];
        let last = performance.now();
        const tick = (now: number) => {
          frames.push(now - last);
          last = now;
          if (frames.length < 120) requestAnimationFrame(tick);
          else resolve(frames.slice(1));
        };
        requestAnimationFrame(tick);
      }),
  );
  for (let i = 0; i < 100; i++) {
    await page.mouse.move(
      box.x + box.width * (0.32 + (i % 30) / 100),
      box.y + box.height * (0.5 + Math.sin(i / 8) * 0.12),
    );
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  const frames = (await sampling).sort((a, b) => a - b);
  const bitmapMaxBytes = await page
    .locator(".paint-canvas")
    .evaluateAll((canvases: HTMLCanvasElement[]) =>
      canvases.reduce(
        (total, canvas) => total + canvas.width * canvas.height * 4,
        0,
      ),
    );
  const metrics = {
    environment:
      "Chrome local, viewport móvil emulado 390×844; no es una medición en hardware móvil",
    samples: frames.length,
    medianMs: Number(frames[Math.floor(frames.length / 2)].toFixed(2)),
    p95Ms: Number(frames[Math.floor(frames.length * 0.95)].toFixed(2)),
    over34ms: frames.filter((n) => n > 34).length,
    bitmapMaxBytes,
  };
  console.log("PAINT_FRAME_SAMPLE", JSON.stringify(metrics));
  await mkdir("tmp/qa", { recursive: true });
  await writeFile(
    "tmp/qa/paint-performance.json",
    JSON.stringify(metrics, null, 2),
  );
  await page
    .locator(".painting-table")
    .screenshot({ path: "tmp/qa/freehand-mobile.png" });
  expect(frames.every((n) => Number.isFinite(n))).toBe(true);
});
