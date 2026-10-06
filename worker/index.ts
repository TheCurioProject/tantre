import type {
  ExecutionContext,
  Fetcher,
  ScheduledController,
} from "@cloudflare/workers-types";
import { z } from "zod";
import { reportFailure } from "./monitoring";
import QRCode from "qrcode";
import {
  reservationSchema,
  dateSchema,
  loginSchema,
  itemSchema,
  contentSchemas,
  bookingRulesSchema,
} from "../src/lib/validation";
type Env = {
  ASSETS: Fetcher;
  APP_ENV: string;
  SITE_URL?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_SITE_KEY?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  IP_HASH_SECRET?: string;
  POSTHOG_KEY?: string;
  POSTHOG_HOST?: string;
  SENTRY_DSN?: string;
};
type Staff = {
  id: string;
  role: "owner" | "manager" | "editor" | "viewer";
  display_name: string;
  active: boolean;
};
type Context = {
  req: Request;
  env: Env;
  ctx: ExecutionContext;
  cookies: string[];
  access?: string;
  staff?: Staff;
};
class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: unknown,
  ) {
    super(message);
  }
}
const configured = (env: Env) =>
  !!(
    env.SUPABASE_URL &&
    env.SUPABASE_ANON_KEY &&
    env.SUPABASE_SERVICE_ROLE_KEY
  );
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const safe = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
function requireConfig(env: Env) {
  if (!configured(env))
    throw new HttpError(
      503,
      "Estamos preparando las reservas en línea. Por ahora, escríbenos para organizar tu visita.",
    );
}
async function body(req: Request) {
  if (!req.headers.get("content-type")?.includes("application/json"))
    throw new HttpError(415, "Envía un formulario válido.");
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, "Falta el formulario.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 32768) {
      await reader.cancel();
      throw new HttpError(413, "El formulario es demasiado grande.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new HttpError(400, "El formulario no es válido.");
  }
}
async function sb<T>(
  env: Env,
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  requireConfig(env);
  const key = env.SUPABASE_ANON_KEY!;
  const res = await fetch(`${env.SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${token || env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
    signal: AbortSignal.timeout(12000),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.message || data?.msg || data?.error_description || "";
    if (/CAPACITY_CHANGED/.test(message))
      throw new HttpError(
        409,
        "Ese horario acaba de llenarse. Elige otra hora; conservamos tus datos.",
      );
    if (/IDEMPOTENCY_CONFLICT/.test(message))
      throw new HttpError(
        409,
        "Esta solicitud ya fue procesada con otra selección. Recarga antes de crear otra reserva.",
      );
    if (/BOOKING_DISABLED/.test(message))
      throw new HttpError(
        503,
        "Las reservas en línea están en pausa. Escríbenos para ayudarte.",
      );
    if (/INVALID_LINK/.test(message))
      throw new HttpError(
        404,
        "Este enlace no es válido. Revisa el correo de confirmación.",
      );
    if (/CANCELLATION_CLOSED/.test(message))
      throw new HttpError(
        410,
        "Ya pasó el plazo de cancelación en línea. Contáctanos para ayudarte.",
      );
    if (res.status === 401 || res.status === 403)
      throw new HttpError(
        res.status,
        "Tu sesión terminó o no tienes permiso para esta acción.",
      );
    if (/KEEP_OWN_ACCESS/.test(message))
      throw new HttpError(422, "Conserva tu propio acceso de propietario.");
    if (/FINAL_STATUS/.test(message))
      throw new HttpError(
        409,
        "La reserva ya tiene un estado final. Actualiza la agenda.",
      );
    if (data?.code === "23505")
      throw new HttpError(409, "Ya existe un registro con ese identificador.");
    throw new HttpError(
      502,
      "No pudimos guardar o consultar la información. Inténtalo de nuevo.",
    );
  }
  return data as T;
}
const rpc = <T>(env: Env, name: string, params: unknown, token?: string) =>
  sb<T>(
    env,
    `/rest/v1/rpc/${name}`,
    { method: "POST", body: JSON.stringify(params) },
    token,
  );
async function hash(text: string) {
  return [
    ...new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
    ),
  ]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
async function rate(c: Context, action: string, limit = 10, seconds = 600) {
  const ip =
    c.req.headers.get("CF-Connecting-IP") ||
    (c.env.APP_ENV === "development" ? "127.0.0.1" : "unknown");
  if (c.env.APP_ENV !== "development" && !c.env.IP_HASH_SECRET)
    throw new HttpError(
      503,
      "El servicio de reservas está temporalmente en mantenimiento.",
    );
  const key = await hash(
    `${c.env.IP_HASH_SECRET || "local-development"}:${ip}:${action}`,
  );
  if (
    !(await rpc<boolean>(c.env, "take_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_seconds: seconds,
    }))
  )
    throw new HttpError(
      429,
      "Hiciste varios intentos seguidos. Espera unos minutos y vuelve a intentar.",
    );
}
function cookie(c: Context, name: string, value: string, maxAge: number) {
  c.cookies.push(
    `${name}=${encodeURIComponent(value)}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${c.env.APP_ENV === "development" ? "" : "; Secure"}`,
  );
}
function setSession(
  c: Context,
  data: { access_token: string; refresh_token: string; expires_in: number },
) {
  cookie(c, "tantre_access", data.access_token, data.expires_in);
  cookie(c, "tantre_refresh", data.refresh_token, 60 * 60 * 24 * 7);
  c.access = data.access_token;
}
async function staff(c: Context, roles?: string[]): Promise<Staff> {
  if (c.staff) {
    if (roles && !roles.includes(c.staff.role))
      throw new HttpError(403, "No tienes permiso para esta acción.");
    return c.staff;
  }
  const cookies = Object.fromEntries(
    (c.req.headers.get("Cookie") || "")
      .split(";")
      .filter((x) => x.includes("="))
      .map((x) => {
        const i = x.indexOf("=");
        return [x.slice(0, i).trim(), decodeURIComponent(x.slice(i + 1))];
      }),
  );
  let access = cookies.tantre_access;
  let user: { id: string } | null = null;
  if (access) {
    try {
      user = await sb(c.env, "/auth/v1/user", {}, access);
    } catch {
      access = "";
    }
  }
  if (!user && cookies.tantre_refresh) {
    try {
      const session = await sb<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
      }>(
        c.env,
        "/auth/v1/token?grant_type=refresh_token",
        {
          method: "POST",
          body: JSON.stringify({ refresh_token: cookies.tantre_refresh }),
        },
        c.env.SUPABASE_ANON_KEY,
      );
      setSession(c, session);
      access = session.access_token;
      user = await sb(c.env, "/auth/v1/user", {}, access);
    } catch {
      throw new HttpError(401, "Tu sesión terminó. Vuelve a entrar.");
    }
  }
  if (!user || !access)
    throw new HttpError(401, "Inicia sesión para continuar.");
  const profiles = await sb<Staff[]>(
    c.env,
    `/rest/v1/profiles?id=eq.${user.id}&select=id,role,display_name,active`,
    {},
    access,
  );
  const profile = profiles[0];
  if (!profile?.active)
    throw new HttpError(403, "Esta cuenta no tiene acceso al estudio.");
  c.access = access;
  c.staff = profile;
  if (roles && !roles.includes(profile.role))
    throw new HttpError(403, "No tienes permiso para esta acción.");
  return profile;
}
async function publicData(env: Env) {
  if (!configured(env))
    return {
      configured: false,
      catalog: [],
      categories: [],
      packages: [],
      faqs: [],
      testimonials: [],
      gallery: [],
      settings: {},
    };
  const [
    catalog,
    categories,
    packages,
    faqs,
    testimonials,
    gallery,
    settings,
    hours,
  ] = await Promise.all([
    sb<Record<string, unknown>[]>(
      env,
      "/rest/v1/catalog_items?published=eq.true&select=*,ceramic_meta(*),cafe_meta(*),catalog_media(*)&order=sort_order.asc",
      {},
      env.SUPABASE_ANON_KEY,
    ),
    sb<{ id: string }[]>(
      env,
      "/rest/v1/catalog_categories?published=eq.true&order=sort_order.asc",
      {},
      env.SUPABASE_ANON_KEY,
    ),
    sb(env, "/rest/v1/packages?published=eq.true", {}, env.SUPABASE_ANON_KEY),
    sb(
      env,
      "/rest/v1/faqs?published=eq.true&order=sort_order.asc",
      {},
      env.SUPABASE_ANON_KEY,
    ),
    sb(
      env,
      "/rest/v1/testimonials?published=eq.true&select=id,name,handle,quote,published",
      {},
      env.SUPABASE_ANON_KEY,
    ),
    sb(
      env,
      "/rest/v1/gallery_entries?published=eq.true&select=*,media_assets(width,height)&order=sort_order.asc",
    ),
    sb<{ key: string; value_json: unknown }[]>(
      env,
      "/rest/v1/site_settings?public=eq.true",
      {},
      env.SUPABASE_ANON_KEY,
    ),
    sb(env, "/rest/v1/business_hours?order=weekday.asc"),
  ]);
  const categoryIds = new Set(categories.map((c) => c.id));
  return {
    configured: true,
    catalog: catalog.filter((i) => categoryIds.has(String(i.category_id))),
    categories,
    packages,
    faqs,
    testimonials,
    gallery,
    settings: {
      ...Object.fromEntries(settings.map((s) => [s.key, s.value_json])),
      business_hours: hours,
      site_url: env.SITE_URL || "",
      monitoring_enabled: !!env.SENTRY_DSN,
      turnstile_site_key: env.TURNSTILE_SITE_KEY || "",
    },
  };
}
async function verifyTurnstile(c: Context, token: string) {
  if (c.env.APP_ENV === "development" && !c.env.TURNSTILE_SECRET_KEY) return;
  if (!c.env.TURNSTILE_SECRET_KEY || !token)
    throw new HttpError(422, "Completa la verificación para continuar.");
  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: new URLSearchParams({
        secret: c.env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: c.req.headers.get("CF-Connecting-IP") || "",
      }),
      signal: AbortSignal.timeout(8000),
    },
  );
  const data = (await response.json()) as {
    success: boolean;
    hostname?: string;
    action?: string;
  };
  if (
    !data.success ||
    data.action !== "reservation" ||
    (c.env.SITE_URL && data.hostname !== new URL(c.env.SITE_URL).hostname)
  )
    throw new HttpError(422, "La verificación expiró. Vuelve a intentarlo.");
}
async function notifications(env: Env) {
  if (
    !configured(env) ||
    !env.RESEND_API_KEY ||
    !env.EMAIL_FROM ||
    !env.SITE_URL
  )
    return;
  const jobs = await rpc<
    {
      id: string;
      kind: string;
      attempts: number;
      payload: Record<string, string | number>;
    }[]
  >(env, "claim_notifications", {});
  for (const job of jobs) {
    try {
      const p = job.payload;
      const cancel = `${env.SITE_URL}/reservar/cancelar/#code=${encodeURIComponent(p.public_code)}&token=${encodeURIComponent(p.cancellation_token || "")}`;
      const when = new Intl.DateTimeFormat("es-MX", {
        timeZone: "America/Mexico_City",
        dateStyle: "full",
        timeStyle: "short",
      }).format(new Date(String(p.starts_at)));
      const html = `<!doctype html><html lang="es"><body style="background:#F5F0E8;color:#181716;font-family:Arial,sans-serif;padding:32px"><h1 style="font-family:Georgia,serif;font-size:42px">tantre</h1><h2>${job.kind === "confirmation" ? "Tu mesa te espera." : "Tu reserva fue cancelada."}</h2><p>Hola ${safe(String(p.name))},</p><p>${safe(when)} · ${Number(p.party_size)} personas</p><p>Tu código: <strong>${safe(String(p.public_code))}</strong></p>${job.kind === "confirmation" ? `<p>Ven con ganas de crear. Los materiales te esperan aquí.</p><p><a href="${safe(cancel)}">Consultar o cancelar mi reserva</a></p>` : ""}<p>¿Necesitas ayuda? Responde a este correo.</p><p>TANTRE · Guadalajara</p></body></html>`;
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `tantre-${job.id}`,
        },
        body: JSON.stringify({
          from: env.EMAIL_FROM,
          to: [String(p.email)],
          subject:
            job.kind === "confirmation"
              ? `Tu reserva TANTRE · ${p.public_code}`
              : `Reserva cancelada · ${p.public_code}`,
          html,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`email_provider_${res.status}`);
      await sb(env, `/rest/v1/notification_outbox?id=eq.${job.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          sent_at: new Date().toISOString(),
          payload: { public_code: p.public_code },
          last_error: null,
          locked_until: null,
        }),
      });
    } catch {
      await sb(env, `/rest/v1/notification_outbox?id=eq.${job.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          last_error: "delivery_failed",
          locked_until: null,
          available_at: new Date(
            Date.now() + Math.min(3600000, 60000 * 2 ** job.attempts),
          ).toISOString(),
        }),
      }).catch(() => {});
    }
  }
}
const writable = ["owner", "manager", "editor"];
const operations = ["owner", "manager"];
async function admin(c: Context, path: string): Promise<Response> {
  await staff(c);
  if (!["GET", "POST", "PATCH"].includes(c.req.method))
    throw new HttpError(405, "Método no permitido.");
  if (path === "/api/admin/me") return json(c.staff);
  if (path === "/api/admin/dashboard") {
    await staff(c, ["owner", "manager", "viewer"]);
    const query = new URL(c.req.url).searchParams;
    const filter = z
      .object({
        date: dateSchema.nullable(),
        days: z.coerce.number().refine((v) => v === 1 || v === 7),
        status: z.enum([
          "all",
          "pending",
          "confirmed",
          "cancelled",
          "completed",
          "no_show",
        ]),
        min: z.coerce.number().int().min(1).max(30),
        celebration: z.boolean(),
        offset: z.coerce.number().int().min(0).max(20000),
      })
      .parse({
        date: query.get("date") || null,
        days: query.get("days") || 1,
        status: query.get("status") || "all",
        min: query.get("min") || 1,
        celebration: query.get("celebration") === "true",
        offset: query.get("offset") || 0,
      });
    const [agenda, slots, notifications] = await Promise.all([
      rpc<{ reservations: unknown[]; total: number }>(
        c.env,
        "admin_agenda",
        {
          p_date: filter.date,
          p_days: filter.days,
          p_status: filter.status,
          p_min_party: filter.min,
          p_celebration: filter.celebration,
          p_offset: filter.offset,
        },
        c.access,
      ),
      rpc(c.env, "admin_slots", {}, c.access),
      sb(
        c.env,
        "/rest/v1/notification_outbox?sent_at=is.null&select=id,kind,attempts,last_error,created_at&order=created_at.desc&limit=50",
      ),
    ]);
    return json({ ...agenda, slots, notifications });
  }
  if (path === "/api/admin/reservation" && c.req.method === "PATCH") {
    await staff(c, operations);
    const input = z
      .object({
        id: z.uuid(),
        status: z.enum(["confirmed", "cancelled", "completed", "no_show"]),
      })
      .parse(await body(c.req));
    await sb(
      c.env,
      `/rest/v1/reservations?id=eq.${input.id}`,
      { method: "PATCH", body: JSON.stringify({ status: input.status }) },
      c.access,
    );
    c.ctx.waitUntil(notifications(c.env));
    return json({ ok: true });
  }
  if (path === "/api/admin/slot" && c.req.method === "PATCH") {
    await staff(c, operations);
    const input = z
      .object({ id: z.uuid(), blocked: z.boolean() })
      .parse(await body(c.req));
    await sb(
      c.env,
      `/rest/v1/reservation_slots?id=eq.${input.id}`,
      { method: "PATCH", body: JSON.stringify({ blocked: input.blocked }) },
      c.access,
    );
    return json({ ok: true });
  }
  if (path === "/api/admin/team" && c.req.method === "POST") {
    await staff(c, ["owner"]);
    const input = z
      .object({
        id: z.uuid(),
        display_name: z.string().trim().min(2).max(100),
        role: z.enum(["owner", "manager", "editor", "viewer"]),
        active: z.boolean(),
      })
      .parse(await body(c.req));
    await rpc(
      c.env,
      "update_staff",
      {
        p_id: input.id,
        p_name: input.display_name,
        p_role: input.role,
        p_active: input.active,
      },
      c.access,
    );
    return json({ ok: true });
  }
  if (path === "/api/admin/items") {
    if (c.req.method === "GET")
      return json(
        await sb(
          c.env,
          "/rest/v1/catalog_items?select=*,ceramic_meta(*),cafe_meta(*),catalog_media(*)&order=sort_order.asc",
          {},
          c.access,
        ),
      );
    await staff(c, writable);
    const raw = await body(c.req);
    const item = itemSchema.parse(raw.item);
    const meta =
      item.type === "ceramic"
        ? z
            .object({
              dimensions: z.string().max(150),
              difficulty: z.string().max(80),
              estimated_minutes: z.number().int().positive().nullable(),
              shape_family: z.string().max(100),
            })
            .parse(raw.meta)
        : z
            .object({
              temperature: z.string().max(80),
              caffeine: z.boolean(),
              dietary_tags: z.array(z.string().max(40)).max(12),
              allergens: z.array(z.string().max(60)).max(20),
              alcohol_note: z.string().max(250),
            })
            .parse(raw.meta);
    const id = await rpc(
      c.env,
      "save_catalog_item",
      { p_item: item, p_meta: meta },
      c.access,
    );
    return json({ id });
  }
  if (path === "/api/admin/settings") {
    await staff(c, operations);
    if (c.req.method === "GET")
      return json(await sb(c.env, "/rest/v1/site_settings", {}, c.access));
    const raw = z
      .object({
        key: z.enum([
          "booking_rules",
          "contact",
          "paint_enabled",
          "analytics_enabled",
          "availability_freshness_hours",
          "terms",
          "privacy",
          "legal_published",
        ]),
        value_json: z.unknown(),
      })
      .parse(await body(c.req));
    if (raw.key === "booking_rules") {
      raw.value_json = bookingRulesSchema.parse(raw.value_json);
      if ((raw.value_json as { enabled: boolean }).enabled) {
        const legal = await sb<{ value_json: boolean }[]>(
          c.env,
          "/rest/v1/site_settings?key=eq.legal_published",
          {},
          c.access,
        );
        if (!legal[0]?.value_json)
          throw new HttpError(
            422,
            "Publica los términos y privacidad antes de habilitar reservas.",
          );
        if (
          !c.env.RESEND_API_KEY ||
          !c.env.TURNSTILE_SECRET_KEY ||
          !c.env.TURNSTILE_SITE_KEY ||
          !c.env.EMAIL_FROM ||
          !c.env.SITE_URL ||
          !c.env.IP_HASH_SECRET
        )
          throw new HttpError(
            422,
            "Faltan servicios de email, dominio o protección. Consulta la guía de despliegue.",
          );
      }
    } else if (
      ["paint_enabled", "analytics_enabled", "legal_published"].includes(
        raw.key,
      )
    ) {
      raw.value_json = z.boolean().parse(raw.value_json);
      if (raw.key === "legal_published" && raw.value_json) {
        const docs = await sb<{ key: string; value_json: string }[]>(
          c.env,
          "/rest/v1/site_settings?key=in.(terms,privacy)",
          {},
          c.access,
        );
        if (docs.length !== 2 || docs.some((d) => d.value_json.length < 100))
          throw new HttpError(
            422,
            "Completa términos y privacidad antes de publicarlos.",
          );
      }
    } else if (raw.key === "contact")
      raw.value_json = z
        .object({
          address: z.string().min(5).max(300),
          phone: z.string().regex(/^\+?[\d ]{10,20}$/),
          email: z.email(),
          instagram: z.string().regex(/^[a-zA-Z0-9_.]{1,50}$/),
          verified: z.boolean(),
        })
        .parse(raw.value_json);
    else if (raw.key === "availability_freshness_hours")
      raw.value_json = z.number().min(1).max(168).parse(raw.value_json);
    else raw.value_json = z.string().min(100).max(16000).parse(raw.value_json);
    await sb(
      c.env,
      "/rest/v1/site_settings?on_conflict=key",
      {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({ ...raw, public: true }),
      },
      c.access,
    );
    return json({ ok: true });
  }
  if (path === "/api/admin/media" && c.req.method === "POST") {
    await staff(c, writable);
    await rate(c, "media", 30, 600);
    const reader = c.req.body?.getReader();
    if (!reader) throw new HttpError(400, "Falta la imagen.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2200000) {
        await reader.cancel();
        throw new HttpError(413, "La imagen supera 2 MB.");
      }
      chunks.push(value);
    }
    const upload = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      upload.set(chunk, offset);
      offset += chunk.length;
    }
    const form = await new Request(c.req.url, {
      method: "POST",
      headers: c.req.headers,
      body: upload,
    }).formData();
    const file = form.get("file");
    const alt = z.string().trim().min(2).max(250).parse(form.get("alt"));
    if (
      !(file instanceof File) ||
      file.size > 2097152 ||
      !["image/webp", "image/png", "image/jpeg"].includes(file.type)
    )
      throw new HttpError(
        422,
        "Sube una imagen WebP, PNG o JPEG de máximo 2 MB.",
      );
    const bytes = new Uint8Array(await file.arrayBuffer());
    const valid =
      (file.type === "image/webp" &&
        new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
        new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP") ||
      (file.type === "image/png" &&
        bytes[0] === 137 &&
        bytes[1] === 80 &&
        bytes[2] === 78 &&
        bytes[3] === 71) ||
      (file.type === "image/jpeg" &&
        bytes[0] === 255 &&
        bytes[1] === 216 &&
        bytes[2] === 255);
    if (!valid)
      throw new HttpError(
        422,
        "El contenido del archivo no corresponde a una imagen válida.",
      );
    const width = z.coerce
        .number()
        .int()
        .min(32)
        .max(4096)
        .parse(form.get("width")),
      height = z.coerce
        .number()
        .int()
        .min(32)
        .max(4096)
        .parse(form.get("height"));
    const storage_path = `media/${crypto.randomUUID()}.${file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1]}`;
    const response = await fetch(
      `${c.env.SUPABASE_URL}/storage/v1/object/tantre-media/${storage_path}`,
      {
        method: "POST",
        headers: {
          apikey: c.env.SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${c.access}`,
          "Content-Type": file.type,
        },
        body: bytes,
      },
    );
    if (!response.ok) throw new HttpError(502, "No pudimos subir la imagen.");
    try {
      await sb(
        c.env,
        "/rest/v1/media_assets",
        {
          method: "POST",
          body: JSON.stringify({
            storage_path,
            alt,
            width,
            height,
            mime: file.type,
            bytes: file.size,
          }),
        },
        c.access,
      );
    } catch (error) {
      await fetch(`${c.env.SUPABASE_URL}/storage/v1/object/tantre-media`, {
        method: "DELETE",
        headers: {
          apikey: c.env.SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${c.access}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prefixes: [storage_path] }),
      }).catch(() => {});
      throw error;
    }
    return json({ storage_path, alt, width, height });
  }
  if (path === "/api/admin/image-variant" && c.req.method === "POST") {
    await staff(c, writable);
    const input = z
      .object({
        base_path: z.string().regex(/^media\/[a-f0-9-]+\.(webp|png|jpg)$/),
        variant_path: z.string().regex(/^media\/[a-f0-9-]+\.(webp|png|jpg)$/),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
      })
      .parse(await body(c.req));
    const matches = await sb<{ width: number; height: number }[]>(
      c.env,
      `/rest/v1/media_assets?storage_path=eq.${input.variant_path}&select=width,height`,
      {},
      c.access,
    );
    if (
      matches[0]?.width !== input.width ||
      matches[0]?.height !== input.height
    )
      throw new HttpError(422, "Las dimensiones de la variante no coinciden.");
    await sb(
      c.env,
      "/rest/v1/image_variants?on_conflict=base_path,width",
      {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify(input),
      },
      c.access,
    );
    return json({ ok: true });
  }
  if (path === "/api/admin/item-media") {
    await staff(c, writable);
    const input = z
      .object({
        item_id: z.uuid(),
        storage_path: z.string().regex(/^media\/[a-f0-9-]+\.(webp|png|jpg)$/),
        alt: z.string().min(2).max(250),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        sort_order: z.number().int().min(0),
      })
      .parse(await body(c.req));
    await sb(
      c.env,
      "/rest/v1/catalog_media",
      { method: "POST", body: JSON.stringify(input) },
      c.access,
    );
    return json({ ok: true });
  }
  const resource = path.split("/")[3];
  const readOnly = ["audit_log", "media_assets", "profiles"];
  if (
    resource in contentSchemas ||
    readOnly.includes(resource) ||
    resource === "gallery_entries"
  ) {
    if (c.req.method === "GET") {
      if (resource === "audit_log") await staff(c, operations);
      if (resource === "profiles") await staff(c, ["owner"]);
      return json(
        await sb(
          c.env,
          `/rest/v1/${resource}?limit=500${resource === "audit_log" ? "&order=created_at.desc" : ""}`,
          {},
          c.access,
        ),
      );
    }
    if (readOnly.includes(resource))
      throw new HttpError(405, "Esta operación no está disponible.");
    await staff(
      c,
      ["business_hours", "schedule_exceptions"].includes(resource)
        ? operations
        : writable,
    );
    const raw = await body(c.req);
    const parsed =
      resource === "gallery_entries"
        ? z
            .object({
              id: z.uuid().optional(),
              storage_path: z
                .string()
                .regex(/^media\/[a-f0-9-]+\.(webp|png|jpg)$/),
              alt: z.string().min(2).max(250),
              caption: z.string().max(500),
              sort_order: z.number().int().min(0),
              published: z.boolean(),
            })
            .parse(raw)
        : contentSchemas[resource as keyof typeof contentSchemas].parse(raw);
    const primary =
      resource === "business_hours"
        ? "weekday"
        : resource === "schedule_exceptions"
          ? "date"
          : "id";
    await sb(
      c.env,
      `/rest/v1/${resource}?on_conflict=${primary}`,
      {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify(parsed),
      },
      c.access,
    );
    return json({ ok: true });
  }
  throw new HttpError(404, "No encontramos esta operación.");
}
async function cached(
  c: Context,
  key: string,
  produce: () => Promise<Response>,
) {
  const cache = (
    globalThis.caches as unknown as { default?: Cache } | undefined
  )?.default;
  const request = new Request(key);
  const hit = await cache?.match(request);
  if (hit) return hit;
  const response = await produce();
  if (cache && response.ok)
    c.ctx.waitUntil(cache.put(request, response.clone()).catch(() => {}));
  return response;
}
async function route(c: Context): Promise<Response> {
  const url = new URL(c.req.url),
    path = url.pathname.replace(/\/$/, "");
  if (path === "/api/health")
    return json({ ok: true, configured: configured(c.env) });
  if (path === "/api/public" && c.req.method === "GET")
    return cached(c, `${url.origin}/api/public`, async () => {
      const response = json(await publicData(c.env));
      response.headers.set("Cache-Control", "public,max-age=30");
      return response;
    });
  if (path === "/api/qr" && c.req.method === "GET") {
    const base = c.env.SITE_URL || url.origin;
    const target = new URL(base);
    const type = url.searchParams.get("type");
    target.pathname =
      type === "cafe"
        ? "/catalogo/cafe/"
        : type === "ceramic"
          ? "/catalogo/piezas/"
          : "/catalogo/";
    target.search = "";
    target.hash = "";
    target.searchParams.set("source", "desktop-qr");
    const item = url.searchParams.get("item");
    if (item && /^[a-z0-9-]{1,100}$/.test(item))
      target.searchParams.set("item", item);
    return cached(
      c,
      `${url.origin}/api/qr?target=${encodeURIComponent(target.href)}`,
      async () => {
        const svg = await QRCode.toString(target.href, {
          type: "svg",
          errorCorrectionLevel: "M",
          margin: 4,
          width: 512,
          color: { dark: "#181716", light: "#FFFDF8" },
        });
        return new Response(svg, {
          headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "public, max-age=3600",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    );
  }
  if (path === "/api/availability" && c.req.method === "GET") {
    requireConfig(c.env);
    const date = dateSchema.parse(url.searchParams.get("date"));
    const party = z.coerce
      .number()
      .int()
      .min(1)
      .max(30)
      .parse(url.searchParams.get("party_size"));
    await rate(c, "availability", 120, 600);
    return json({
      slots: await rpc(c.env, "get_availability", {
        p_date: date,
        p_party_size: party,
      }),
    });
  }
  if (path === "/api/reservations" && c.req.method === "POST") {
    requireConfig(c.env);
    await rate(c, "reservation", 6, 600);
    const input = reservationSchema.parse(await body(c.req));
    await verifyTurnstile(c, input.token);
    const result = await rpc(c.env, "create_reservation", { p_payload: input });
    c.ctx.waitUntil(notifications(c.env));
    return json(result, 201);
  }
  if (path === "/api/reservations/cancel" && c.req.method === "POST") {
    requireConfig(c.env);
    await rate(c, "cancel", 20, 600);
    const input = z
      .object({
        code: z.string().regex(/^[A-Z0-9]{12}$/),
        token: z.string().regex(/^[a-f0-9]{64}$/),
        confirm: z.boolean(),
      })
      .parse(await body(c.req));
    const result = await rpc(c.env, "reservation_by_token", {
      p_code: input.code,
      p_token: input.token,
      p_cancel: input.confirm,
    });
    if (input.confirm) c.ctx.waitUntil(notifications(c.env));
    return json(result);
  }
  if (path === "/api/auth/login" && c.req.method === "POST") {
    requireConfig(c.env);
    await rate(c, "login", 8, 900);
    const input = loginSchema.parse(await body(c.req));
    const session = await sb<{
      access_token: string;
      refresh_token: string;
      expires_in: number;
      user: { id: string };
    }>(
      c.env,
      "/auth/v1/token?grant_type=password",
      { method: "POST", body: JSON.stringify(input) },
      c.env.SUPABASE_ANON_KEY,
    ).catch(() => {
      throw new HttpError(401, "Revisa tu correo y contraseña.");
    });
    const profiles = await sb<Staff[]>(
      c.env,
      `/rest/v1/profiles?id=eq.${session.user.id}`,
      {},
      session.access_token,
    );
    if (!profiles[0]?.active)
      throw new HttpError(403, "Esta cuenta no tiene acceso al estudio.");
    setSession(c, session);
    return json(profiles[0]);
  }
  if (path === "/api/auth/logout" && c.req.method === "POST") {
    try {
      await staff(c);
      await sb(
        c.env,
        "/auth/v1/logout?scope=local",
        { method: "POST" },
        c.access,
      );
    } catch {}
    cookie(c, "tantre_access", "", 0);
    cookie(c, "tantre_refresh", "", 0);
    return json({ ok: true });
  }
  if (path.startsWith("/api/admin/")) {
    requireConfig(c.env);
    return admin(c, path);
  }
  if (path === "/api/media" && c.req.method === "GET") {
    requireConfig(c.env);
    const target = z
      .string()
      .regex(/^media\/[a-f0-9-]+\.(webp|png|jpg)$/)
      .parse(url.searchParams.get("path"));
    let allowed = false;
    const [items, gallery] = await Promise.all([
      sb<unknown[]>(
        c.env,
        `/rest/v1/catalog_media?storage_path=eq.${target}&catalog_items.published=eq.true&select=id,catalog_items!inner(published)`,
        {},
        c.env.SUPABASE_ANON_KEY,
      ),
      sb<unknown[]>(
        c.env,
        `/rest/v1/gallery_entries?storage_path=eq.${target}&published=eq.true&select=id`,
        {},
        c.env.SUPABASE_ANON_KEY,
      ),
    ]);
    allowed = !!(items.length || gallery.length);
    if (!allowed) {
      await staff(c, writable);
    }
    let imagePath = target;
    const requestedWidth = Number(url.searchParams.get("w"));
    if (requestedWidth > 0 && requestedWidth <= 640) {
      const variants = await sb<{ variant_path: string }[]>(
        c.env,
        `/rest/v1/image_variants?base_path=eq.${target}&width=gte.${Math.floor(requestedWidth)}&order=width.asc&limit=1`,
      );
      imagePath = variants[0]?.variant_path || target;
    }
    const image = await fetch(
      `${c.env.SUPABASE_URL}/storage/v1/object/authenticated/tantre-media/${imagePath}`,
      {
        headers: {
          apikey: c.env.SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      },
    );
    if (!image.ok) throw new HttpError(404, "Imagen no disponible.");
    return new Response(image.body, {
      headers: {
        "Content-Type": image.headers.get("Content-Type") || "image/webp",
        "Cache-Control": allowed ? "public,max-age=60" : "private,no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  if (path === "/api/errors" && c.req.method === "POST") {
    const input = z
      .object({
        kind: z.enum(["runtime", "promise"]),
        path: z.enum([
          "/",
          "/reservar/",
          "/reservar/cancelar/",
          "/catalogo/",
          "/catalogo/piezas/",
          "/catalogo/cafe/",
          "/catalogo/favoritos/",
          "/admin/",
          "/admin/login/",
          "/privacidad/",
          "/terminos/",
        ]),
      })
      .parse(await body(c.req));
    if (c.env.SENTRY_DSN && configured(c.env)) {
      await rate(c, "errors", 10, 600);
      c.ctx.waitUntil(reportFailure(c.env.SENTRY_DSN, input.kind, input.path));
    }
    return json({ ok: true });
  }
  if (path === "/api/events" && c.req.method === "POST") {
    const input = z
      .object({
        distinct_id: z.uuid(),
        event: z.enum([
          "hero_engaged",
          "piece_selector_view",
          "piece_color_try",
          "catalog_open",
          "catalog_item_view",
          "favorite_add",
          "share_item",
          "reserve_start",
          "slot_selected",
          "reservation_success",
          "qr_gate_view",
          "qr_link_copy",
          "web_vital",
        ]),
        properties: z.record(
          z.string(),
          z.union([z.string().max(100), z.number(), z.boolean()]),
        ),
      })
      .parse(await body(c.req));
    if (c.env.POSTHOG_KEY && configured(c.env)) {
      const enabled = await sb<{ value_json: boolean }[]>(
        c.env,
        "/rest/v1/site_settings?key=eq.analytics_enabled",
        {},
        c.env.SUPABASE_ANON_KEY,
      );
      if (!enabled[0]?.value_json) return json({ ok: true });
      await rate(c, "analytics", 180, 600);
      const allowed = [
        "device_class",
        "category",
        "item_id",
        "color_token",
        "type",
        "source",
        "method",
        "date_bucket",
        "time",
        "party_size",
        "name",
        "value",
        "rating",
      ];
      const properties = Object.fromEntries(
        Object.entries(input.properties).filter(([k]) => allowed.includes(k)),
      );
      c.ctx.waitUntil(
        fetch(`${c.env.POSTHOG_HOST || "https://us.i.posthog.com"}/capture/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: c.env.POSTHOG_KEY,
            event: input.event,
            properties: {
              ...properties,
              distinct_id: input.distinct_id,
              $process_person_profile: false,
            },
          }),
        })
          .then(() => {})
          .catch(() => {}),
      );
    }
    return json({ ok: true });
  }
  throw new HttpError(404, "No encontramos esta página.");
}
const worker = {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    if (!new URL(request.url).pathname.startsWith("/api/"))
      return env.ASSETS.fetch(request as never) as unknown as Promise<Response>;
    const c: Context = { req: request, env, ctx, cookies: [] };
    const origin = request.headers.get("Origin");
    const requestOrigin = new URL(request.url).origin;
    const permitted =
      origin === requestOrigin ||
      origin === env.SITE_URL ||
      (env.APP_ENV === "development" &&
        !!origin &&
        ["http://localhost:3000", "http://127.0.0.1:3000"].includes(origin));
    let response: Response;
    try {
      if (request.method === "OPTIONS") {
        if (!permitted) throw new HttpError(403, "Origen no permitido.");
        response = new Response(null, { status: 204 });
      } else {
        if (!["GET", "HEAD"].includes(request.method) && !permitted)
          throw new HttpError(
            403,
            "Abre el formulario desde el sitio de TANTRE.",
          );
        response = await route(c);
      }
    } catch (error) {
      if (error instanceof z.ZodError)
        response = json(
          {
            error: "Revisa los campos indicados.",
            fields: z.flattenError(error).fieldErrors,
          },
          422,
        );
      else if (error instanceof HttpError)
        response = json(
          { error: error.message, fields: error.fields },
          error.status,
        );
      else {
        console.error(
          JSON.stringify({
            event: "request_failed",
            path: new URL(request.url).pathname,
            type: error instanceof Error ? error.name : "unknown",
          }),
        );
        response = json(
          { error: "Tuvimos un problema al conectar. Inténtalo de nuevo." },
          500,
        );
      }
    }
    if (response.status >= 500 && response.status !== 503)
      ctx.waitUntil(
        reportFailure(
          env.SENTRY_DSN,
          `api_${response.status}`,
          new URL(request.url).pathname
            .replace(/[^a-zA-Z0-9/_-]/g, "")
            .slice(0, 80),
        ),
      );
    const headers = new Headers(response.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "no-referrer");
    for (const cookie of c.cookies) headers.append("Set-Cookie", cookie);
    if (env.APP_ENV === "development" && origin && permitted) {
      headers.set("Access-Control-Allow-Origin", origin);
      headers.set("Access-Control-Allow-Credentials", "true");
      headers.set("Access-Control-Allow-Headers", "Content-Type");
      headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
      headers.set("Vary", "Origin");
    }
    return new Response(response.body, { status: response.status, headers });
  },
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ) {
    ctx.waitUntil(
      Promise.all([
        notifications(env),
        configured(env) ? rpc(env, "maintenance", {}) : Promise.resolve(),
      ]),
    );
  },
};

export default worker;
