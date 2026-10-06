import { describe, it, expect, vi, afterEach } from "vitest";
import worker from "../../worker/index";
type Env = Parameters<typeof worker.fetch>[1];
const env = {
  APP_ENV: "production",
  ASSETS: { fetch: async () => new Response("static") },
} as unknown as Env;
const ctx = {
  waitUntil: vi.fn(),
  passThroughOnException: vi.fn(),
} as unknown as Parameters<typeof worker.fetch>[2];
const configured = {
  ...env,
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_ANON_KEY: "anon-test",
  SUPABASE_SERVICE_ROLE_KEY: "private-test",
  IP_HASH_SECRET: "local-test",
};
const call = (path: string, init: RequestInit = {}, settings = env) =>
  worker.fetch(new Request(`https://tantre.test${path}`, init), settings, ctx);
afterEach(() => vi.unstubAllGlobals());
describe("Worker: límites de confianza", () => {
  it("sirve el sitio estático y declara servicios sin configurar", async () => {
    expect(await (await call("/")).text()).toBe("static");
    expect(await (await call("/api/health")).json()).toEqual({
      ok: true,
      configured: false,
    });
    expect((await (await call("/api/public")).json()).catalog).toEqual([]);
  });
  it("nunca confirma reservas sin backend", async () => {
    const r = await call("/api/reservations", {
      method: "POST",
      headers: {
        Origin: "https://tantre.test",
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    expect(r.status).toBe(503);
    expect(await r.text()).not.toContain("private-test");
  });
  it("rechaza escrituras de otro origen antes de contactar Supabase", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const r = await call(
      "/api/admin/items",
      {
        method: "POST",
        headers: { Origin: "https://hostil.test" },
        body: "{}",
      },
      configured,
    );
    expect(r.status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("protege administración sin sesión", async () => {
    expect((await call("/api/admin/items", {}, configured)).status).toBe(401);
  });
  it("rechaza cuerpos excesivos en eventos", async () => {
    const r = await call("/api/events", {
      method: "POST",
      headers: {
        Origin: "https://tantre.test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ event: "a".repeat(40000) }),
    });
    expect(r.status).toBe(413);
  });
  it("genera QR sin aceptar destinos externos ni inyección", async () => {
    const r = await call(
      "/api/qr?type=cafe&item=%3Cscript%3E&url=https://hostil.test",
    );
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toBe("image/svg+xml");
    expect(await r.text()).toMatch(/^<svg/);
  });
  it("no expone errores internos", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("private-secret")),
    );
    const r = await call("/api/public", {}, configured);
    expect(r.status).toBe(500);
    expect(await r.text()).not.toContain("private-secret");
  });
});
