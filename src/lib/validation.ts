import { z } from "zod";
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Elige una fecha válida.")
  .refine((v) => {
    const d = new Date(v + "T12:00:00Z");
    return !Number.isNaN(+d) && d.toISOString().slice(0, 10) === v;
  }, "La fecha no existe.");
export const reservationSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre.").max(100),
  email: z
    .email("Revisa tu correo.")
    .max(254)
    .transform((v) => v.trim().toLowerCase()),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{10,22}$/, "Escribe un teléfono válido con lada.")
    .transform((v) => v.replace(/[^\d+]/g, ""))
    .refine(
      (v) => v.replace(/\D/g, "").length >= 10,
      "Escribe al menos 10 dígitos.",
    ),
  date: dateSchema,
  slot_id: z.uuid("Elige un horario disponible."),
  party_size: z.coerce.number().int().min(1).max(30),
  celebration: z.string().trim().max(80).default(""),
  notes: z.string().trim().max(600).default(""),
  terms: z.literal(true, { error: "Acepta los términos para reservar." }),
  token: z.string().max(2048).default(""),
  website: z.string().max(0, "No se pudo enviar.").default(""),
  idempotency_key: z.uuid(),
});
export type ReservationInput = z.input<typeof reservationSchema>;
export const itemSchema = z.object({
  id: z.uuid().optional(),
  type: z.enum(["ceramic", "cafe"]),
  category_id: z.uuid(),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .min(2)
    .max(100),
  name: z.string().trim().min(2).max(120),
  short_desc: z.string().max(240),
  long_desc: z.string().max(2500),
  price_cents: z.coerce.number().int().min(0).max(10000000),
  status: z.enum(["available", "low_stock", "unavailable", "seasonal"]),
  published: z.boolean(),
  sort_order: z.coerce.number().int().min(0).max(10000),
  asset: z.string().regex(/^(ceramic|cafe)-[a-z-]+$/),
});
export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
});
const clockTime = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, "Indica una hora válida.");
export const contentSchemas = {
  catalog_categories: z.object({
    id: z.uuid().optional(),
    type: z.enum(["ceramic", "cafe"]),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(2).max(100),
    sort_order: z.coerce.number().int().min(0),
    published: z.boolean(),
  }),
  faqs: z.object({
    id: z.uuid().optional(),
    category: z.string().max(100),
    question: z.string().min(4).max(250),
    answer: z.string().min(4).max(2000),
    sort_order: z.coerce.number().int().min(0),
    published: z.boolean(),
  }),
  packages: z
    .object({
      id: z.uuid().optional(),
      slug: z.string().regex(/^[a-z0-9-]+$/),
      title: z.string().min(2).max(100),
      description: z.string().max(1500),
      min_people: z.coerce.number().int().min(1),
      max_people: z.coerce.number().int().min(1),
      price_cents: z.number().int().min(0).nullable(),
      published: z.boolean(),
    })
    .refine(
      (v) => v.max_people >= v.min_people,
      "El máximo debe ser mayor o igual al mínimo.",
    ),
  testimonials: z
    .object({
      id: z.uuid().optional(),
      name: z.string().min(2).max(100),
      handle: z.string().max(100),
      quote: z.string().min(5).max(1500),
      consent_confirmed: z.boolean(),
      published: z.boolean(),
    })
    .refine(
      (v) => !v.published || v.consent_confirmed,
      "Confirma el consentimiento para publicar.",
    ),
  business_hours: z
    .object({
      weekday: z.coerce.number().int().min(0).max(6),
      open_time: clockTime,
      close_time: clockTime,
      pickup_close_time: clockTime,
      active: z.boolean(),
    })
    .refine(
      (v) => v.close_time > v.open_time,
      "El cierre debe ser posterior a la apertura.",
    ),
  schedule_exceptions: z
    .object({
      date: dateSchema,
      closed: z.boolean(),
      open_time: clockTime.nullable(),
      close_time: clockTime.nullable(),
      reason: z.string().max(200),
    })
    .refine(
      (v) =>
        v.closed ||
        (!!v.open_time && !!v.close_time && v.close_time > v.open_time),
      "Indica apertura y cierre válidos.",
    ),
};
export const bookingRulesSchema = z
  .object({
    enabled: z.boolean(),
    capacity: z.coerce.number().int().min(0).max(300),
    max_party_size: z.coerce.number().int().min(1).max(30),
    session_minutes: z.coerce.number().int().min(30).max(480),
    advance_minutes: z.coerce.number().int().min(0).max(10080),
    cancellation_hours: z.coerce.number().int().min(0).max(720),
    horizon_days: z.coerce.number().int().min(1).max(180),
    terms_version: z.string().min(1).max(40),
  })
  .refine(
    (v) => !v.enabled || v.capacity >= v.max_party_size,
    "Configura un cupo suficiente antes de habilitar reservas.",
  );
