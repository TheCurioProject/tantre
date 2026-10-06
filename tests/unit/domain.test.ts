import { describe, it, expect } from "vitest";
import {
  dateSchema,
  reservationSchema,
  bookingRulesSchema,
  contentSchemas,
} from "../../src/lib/validation";
import {
  catalogAllowed,
  availabilityLabel,
  money,
  itemLink,
} from "../../src/lib/utils";
describe("Reservas y contenido", () => {
  it("rechaza fechas imposibles y permite años bisiestos", () => {
    expect(dateSchema.safeParse("2027-02-29").success).toBe(false);
    expect(dateSchema.safeParse("2028-02-29").success).toBe(true);
  });
  const form = {
    name: "  Ana Prueba ",
    email: "ANA@example.test",
    phone: "+52 (33) 0000 0000",
    date: "2028-02-29",
    slot_id: crypto.randomUUID(),
    party_size: 2,
    terms: true,
    token: "",
    website: "",
    idempotency_key: crypto.randomUUID(),
  };
  it("normaliza contacto y exige consentimiento, grupo y honeypot", () => {
    const parsed = reservationSchema.parse(form);
    expect(parsed.name).toBe("Ana Prueba");
    expect(parsed.email).toBe("ana@example.test");
    expect(parsed.phone).toBe("+523300000000");
    for (const patch of [
      { terms: false },
      { party_size: 0 },
      { party_size: 31 },
      { website: "spam" },
      { slot_id: "no" },
      { notes: "a".repeat(601) },
    ])
      expect(reservationSchema.safeParse({ ...form, ...patch }).success).toBe(
        false,
      );
  });
  it("no habilita reservas con cupo insuficiente", () => {
    expect(
      bookingRulesSchema.safeParse({
        enabled: true,
        capacity: 0,
        max_party_size: 6,
        session_minutes: 120,
        advance_minutes: 120,
        cancellation_hours: 24,
        horizon_days: 60,
        terms_version: "v1",
      }).success,
    ).toBe(false);
  });
  it("no publica reseñas sin consentimiento", () => {
    expect(
      contentSchemas.testimonials.safeParse({
        name: "Ana",
        handle: "",
        quote: "Me encantó pintar",
        consent_confirmed: false,
        published: true,
      }).success,
    ).toBe(false);
  });
  it("rechaza horarios imposibles", () => {
    expect(
      contentSchemas.business_hours.safeParse({
        weekday: 2,
        active: true,
        open_time: "25:00",
        close_time: "26:00",
        pickup_close_time: "18:00",
      }).success,
    ).toBe(false);
  });
});
describe("Política del catálogo", () => {
  it("se adapta a tablets en horizontal y excluye escritorio", () => {
    expect(catalogAllowed(390, true)).toBe(true);
    expect(catalogAllowed(1024, false)).toBe(true);
    expect(catalogAllowed(1180, true)).toBe(true);
    expect(catalogAllowed(1180, false)).toBe(false);
    expect(catalogAllowed(1366, true)).toBe(true);
    expect(catalogAllowed(1920, true)).toBe(false);
  });
  it("no promete inventario con información vieja", () => {
    expect(
      availabilityLabel(
        "available",
        new Date(Date.now() - 86400000).toISOString(),
      ),
    ).toContain("Consulta");
    expect(
      availabilityLabel("unavailable", new Date().toISOString()),
    ).toContain("no disponible");
  });
  it("conserva centavos y enlaces profundos", () => {
    expect(money(2550)).toContain("25.50");
    expect(itemLink("cafe", "café")).toBe("/catalogo/cafe/?item=caf%C3%A9");
  });
});
