import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
// Synthetic records exist only in browser tests, never in the database seed.
const cat = "10000000-0000-4000-8000-000000000001",
  item = "10000000-0000-4000-8000-000000000002",
  slot = "10000000-0000-4000-8000-000000000003";
const fixture = {
  configured: true,
  catalog: [
    {
      id: item,
      type: "ceramic",
      category_id: cat,
      slug: "taza-prueba",
      name: "Taza de prueba",
      short_desc: "Dato sintético para QA",
      long_desc: "Esta pieza solo existe en las pruebas.",
      price_cents: 28000,
      status: "available",
      published: true,
      sort_order: 0,
      asset: "ceramic-taza-clasica",
      ceramic_meta: {
        dimensions: "10 × 8 cm",
        difficulty: "Libre",
        estimated_minutes: 90,
        shape_family: "taza",
      },
      catalog_media: [],
    },
  ],
  categories: [
    {
      id: cat,
      type: "ceramic",
      slug: "tazas",
      title: "Tazas",
      published: true,
      sort_order: 0,
    },
  ],
  faqs: [],
  packages: [],
  gallery: [],
  testimonials: [],
  settings: {
    paint_enabled: true,
    booking_rules: { enabled: true, max_party_size: 6, session_minutes: 120 },
    contact: { phone: "+523300000000", email: "test@example.test" },
  },
};
async function seed(page: Page) {
  await page.route("**/api/public", (r) => r.fulfill({ json: fixture }));
}
async function accessible(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
}
test("home: responsive, pintura, navegación y consola limpia", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await seed(page);
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Un café.",
    );
    await page.waitForTimeout(1200);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Un plato" }).click();
  const paintArea = await page.locator(".painting-table").boundingBox();
  const canvasArea = await page.locator(".paint-canvas:visible").boundingBox();
  expect(canvasArea).toEqual(paintArea);
  await expect(
    page.getByRole("button", { name: "Otra pincelada" }),
  ).toHaveCount(0);
  await accessible(page);
  expect(errors).toEqual([]);
});
test("móvil: la reserva fija entra y sale progresivamente", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.goto("/");
  const sticky = page.locator(".home-sticky");
  await expect(sticky).toHaveAttribute("aria-hidden", "true");
  await page.evaluate(() => {
    const hero = document.querySelector(".hero")!;
    scrollTo({ top: hero.getBoundingClientRect().bottom + scrollY + 80 });
  });
  await expect(sticky).toHaveAttribute("aria-hidden", "false");
  await page.waitForTimeout(100);
  const midpoint = await sticky.evaluate(
    (element) => new DOMMatrix(getComputedStyle(element).transform).m42,
  );
  expect(midpoint).toBeGreaterThan(0);
  await expect
    .poll(() =>
      sticky.evaluate(
        (element) => new DOMMatrix(getComputedStyle(element).transform).m42,
      ),
    )
    .toBeCloseTo(0, 1);
  await page.evaluate(() => scrollTo({ top: 0 }));
  await expect(sticky).toHaveAttribute("aria-hidden", "true");
  await page.waitForTimeout(100);
  expect(
    await sticky.evaluate(
      (element) => new DOMMatrix(getComputedStyle(element).transform).m42,
    ),
  ).toBeGreaterThan(0);
});
test("desktop: escena QR real y ninguna cuadrícula táctil", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await seed(page);
  await page.goto("/catalogo/piezas/?item=taza-prueba");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "con las manos",
  );
  await expect(page.locator(".catalog-grid")).toHaveCount(0);
  await expect(page.locator(".qr-frame img")).toBeVisible();
  expect(
    await page
      .locator(".qr-frame img")
      .evaluate((e: HTMLImageElement) => e.naturalWidth),
  ).toBeGreaterThan(0);
  await accessible(page);
});
test("móvil: deep link, color, favoritos y regreso espacial", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.goto("/catalogo/piezas/?item=taza-prueba");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Lavanda", exact: true }).click();
  await expect(page.locator(".piece-color-surface")).toBeVisible();
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Guardado", exact: true }),
  ).toBeVisible();
  await accessible(page);
  await page.getByRole("button", { name: "Cerrar ficha" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.goto("/catalogo/favoritos/");
  await expect(
    page.getByRole("button", { name: "Ver Taza de prueba" }),
  ).toBeVisible();
});
test("tablet al rotar conserva catálogo táctil", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 820, height: 1180 },
    hasTouch: true,
  });
  const page = await context.newPage();
  await seed(page);
  await page.goto("http://localhost:8790/catalogo/");
  await expect(page.locator(".catalog-grid")).toBeVisible();
  await page.setViewportSize({ width: 1366, height: 1024 });
  await expect(page.locator(".catalog-grid")).toBeVisible();
  await context.close();
});
test("catálogo: vacío, error de red y recuperación", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/public", (r) => r.abort());
  await page.goto("/catalogo/");
  await expect(
    page.getByRole("heading", { name: "Hagamos una pequeña pausa." }),
  ).toBeVisible();
  await page.unroute("**/api/public");
  await page.route("**/api/public", (r) =>
    r.fulfill({ json: { ...fixture, catalog: [] } }),
  );
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Estamos preparando nuevas posibilidades.",
    }),
  ).toBeVisible();
});
async function booking(page: Page) {
  await seed(page);
  await page.route("**/api/availability?*", (r) =>
    r.fulfill({
      json: {
        slots: [
          {
            id: slot,
            starts_at: "2026-12-20T17:00:00Z",
            ends_at: "2026-12-20T19:00:00Z",
            remaining: 6,
          },
        ],
      },
    }),
  );
  await page.goto("/reservar/");
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Siguiente: tus datos" }).click();
  await page.getByRole("textbox", { name: "Tu nombre" }).fill("Ana Prueba");
  await page
    .getByRole("textbox", { name: "Correo electrónico" })
    .fill("qa@example.test");
  await page
    .getByRole("textbox", { name: "Teléfono con lada" })
    .fill("+523300000000");
  await page.getByRole("checkbox").check();
}
test("reservar: validación, confirmación y accesibilidad", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/reservations", (r) =>
    r.fulfill({
      status: 201,
      json: {
        public_code: "ABCD1234EF56",
        name: "Ana Prueba",
        party_size: 2,
        starts_at: "2026-12-20T17:00:00Z",
        ends_at: "2026-12-20T19:00:00Z",
        status: "confirmed",
      },
    }),
  );
  await booking(page);
  await accessible(page);
  await page.getByRole("button", { name: "Confirmar mi reserva" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Tu mesa te espera",
  );
  await expect(page.getByText("ABCD1234EF56")).toBeVisible();
});
test("reservar: un conflicto conserva los datos y vuelve a horarios", async ({
  page,
}) => {
  await page.route("**/api/reservations", (r) =>
    r.fulfill({
      status: 409,
      json: { error: "Ese horario acaba de llenarse." },
    }),
  );
  await booking(page);
  await page.getByRole("button", { name: "Confirmar mi reserva" }).click();
  await expect(page.locator(".form-error-summary")).toContainText(
    "acaba de llenarse",
  );
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Siguiente: tus datos" }).click();
  await expect(page.getByRole("textbox", { name: "Tu nombre" })).toHaveValue(
    "Ana Prueba",
  );
});
test("administración: sin sesión no muestra datos y formulario accesible", async ({
  page,
}) => {
  await page.route("**/api/admin/me", (r) =>
    r.fulfill({ status: 401, json: { error: "Inicia sesión" } }),
  );
  await page.goto("/admin/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "por dentro",
  );
  await expect(page.locator(".admin-bookings")).toHaveCount(0);
  await accessible(page);
});
test("admin editor: contenido sin agenda ni permisos", async ({ page }) => {
  await page.route("**/api/admin/me", (r) =>
    r.fulfill({
      json: { id: item, display_name: "Equipo QA", role: "editor" },
    }),
  );
  await page.route("**/api/admin/items", (r) =>
    r.fulfill({ json: fixture.catalog }),
  );
  await page.route("**/api/admin/catalog_categories", (r) =>
    r.fulfill({ json: fixture.categories }),
  );
  await page.goto("/admin/");
  await expect(
    page.getByRole("heading", { name: "Piezas & menú" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Agenda", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Equipo", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Editar", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Nombre", exact: true }),
  ).toHaveValue("Taza de prueba");
});

test("cancelación: consultar no cancela; confirmar sí y retira el token de la URL", async ({
  page,
}) => {
  const requests: boolean[] = [];
  await page.route("**/api/reservations/cancel", (r) => {
    const confirm = r.request().postDataJSON().confirm;
    requests.push(confirm);
    return r.fulfill({
      json: {
        public_code: "ABCD1234EF56",
        name: "QA",
        party_size: 2,
        starts_at: "2026-12-20T17:00:00Z",
        ends_at: "2026-12-20T19:00:00Z",
        status: confirm ? "cancelled" : "confirmed",
        can_cancel: !confirm,
      },
    });
  });
  await page.goto(
    "/reservar/cancelar/#code=ABCD1234EF56&token=" + "a".repeat(64),
  );
  await expect(
    page.getByRole("button", { name: "Confirmar cancelación" }),
  ).toBeVisible();
  expect(new URL(page.url()).hash).toBe("");
  expect(requests).toEqual([false]);
  await page.getByRole("button", { name: "Confirmar cancelación" }).click();
  await expect(
    page.getByRole("heading", { name: "Reserva cancelada." }),
  ).toBeVisible();
  expect(requests).toEqual([false, true]);
});
test("navegación: transición progresiva, teclado, foco y Escape", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menú" }).focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Navegación principal" });
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(90);
  expect(
    await dialog.evaluate((element) => getComputedStyle(element).clipPath),
  ).not.toBe("inset(0px)");
  await expect
    .poll(() =>
      dialog.evaluate((element) => getComputedStyle(element).clipPath),
    )
    .toBe("inset(0%)");
  await page.keyboard.press("Escape");
  // The dialog remains mounted while its closing frames are painted.
  expect(
    await dialog.evaluate((element: HTMLDialogElement) => element.open),
  ).toBe(true);
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Abrir menú" })).toBeFocused();
});
test("agenda: filtros del servidor y ocupación independiente de la página", async ({
  page,
}) => {
  await page.route("**/api/admin/me", (r) =>
    r.fulfill({
      json: { id: item, display_name: "Responsable QA", role: "manager" },
    }),
  );
  const queries: string[] = [];
  await page.route("**/api/admin/dashboard?*", (r) => {
    queries.push(r.request().url());
    return r.fulfill({
      json: {
        reservations: [],
        total: 0,
        metrics: { confirmed: 0, people: 0, cancelled: 0 },
        notifications: [],
        slots: [
          {
            id: slot,
            starts_at: "2026-12-20T17:00:00Z",
            capacity: 10,
            booked: 6,
            blocked: false,
          },
        ],
      },
    });
  });
  await page.goto("/admin/");
  await expect(
    page.getByRole("heading", { name: "La agenda del estudio" }),
  ).toBeVisible();
  await expect(
    page.getByText("6 / 10 lugares", { exact: false }),
  ).toBeVisible();
  await page.getByLabel(/Vista/).selectOption("7");
  await page.getByLabel("Solo celebraciones").check();
  await expect.poll(() => queries.at(-1)).toContain("days=7");
  await expect.poll(() => queries.at(-1)).toContain("celebration=true");
});
