/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-location-assign-relative-destination */
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { api, ApiError, mediaUrl } from "@/lib/api";
import type { Staff, CatalogItem, Category } from "@/lib/types";
import { money, fullDate, time, localDate } from "@/lib/utils";
import { ZodError } from "zod";
import {
  itemSchema,
  contentSchemas,
  bookingRulesSchema,
} from "@/lib/validation";
import { Brand } from "../brand/Brand";
import { State } from "../brand/State";
import { useToast } from "../Providers";
import { AdminShell } from "./AdminShell";
import { PageHeading, Empty } from "./ui";
const message = (error: unknown) =>
  error instanceof ZodError
    ? error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" · ")
    : error instanceof Error
      ? error.message
      : "No se pudo guardar.";
type Row = Record<string, unknown>;
type Field = {
  key: string;
  label: string;
  kind?:
    "text" | "textarea" | "number" | "checkbox" | "date" | "time" | "select";
  options?: [string, string][];
  required?: boolean;
};
const resources: Record<
  string,
  { title: string; fields: Field[]; defaults: Row }
> = {
  catalog_categories: {
    title: "Categorías",
    fields: [
      { key: "title", label: "Nombre", required: true },
      { key: "slug", label: "Identificador URL", required: true },
      {
        key: "type",
        label: "Universo",
        kind: "select",
        options: [
          ["ceramic", "Cerámica"],
          ["cafe", "Café"],
        ],
      },
      { key: "sort_order", label: "Orden", kind: "number" },
      { key: "published", label: "Publicar", kind: "checkbox" },
    ],
    defaults: {
      title: "",
      slug: "",
      type: "ceramic",
      sort_order: 0,
      published: false,
    },
  },
  faqs: {
    title: "Preguntas frecuentes",
    fields: [
      { key: "question", label: "Pregunta", required: true },
      { key: "answer", label: "Respuesta", kind: "textarea", required: true },
      { key: "category", label: "Tema" },
      { key: "sort_order", label: "Orden", kind: "number" },
      { key: "published", label: "Publicar", kind: "checkbox" },
    ],
    defaults: {
      question: "",
      answer: "",
      category: "",
      sort_order: 0,
      published: false,
    },
  },
  packages: {
    title: "Paquetes",
    fields: [
      { key: "title", label: "Nombre", required: true },
      { key: "slug", label: "Identificador URL", required: true },
      {
        key: "description",
        label: "Descripción e incluidos",
        kind: "textarea",
      },
      { key: "min_people", label: "Mínimo de personas", kind: "number" },
      { key: "max_people", label: "Máximo de personas", kind: "number" },
      {
        key: "price_cents",
        label: "Precio en centavos MXN (vacío: consultar)",
        kind: "number",
      },
      { key: "published", label: "Publicar", kind: "checkbox" },
    ],
    defaults: {
      title: "",
      slug: "",
      description: "",
      min_people: 2,
      max_people: 6,
      price_cents: null,
      published: false,
    },
  },
  testimonials: {
    title: "Testimonios",
    fields: [
      { key: "name", label: "Nombre", required: true },
      { key: "handle", label: "Usuario/red social" },
      { key: "quote", label: "Testimonio", kind: "textarea", required: true },
      {
        key: "consent_confirmed",
        label: "Tenemos permiso para publicarlo",
        kind: "checkbox",
      },
      { key: "published", label: "Publicar", kind: "checkbox" },
    ],
    defaults: {
      name: "",
      handle: "",
      quote: "",
      consent_confirmed: false,
      published: false,
    },
  },
  business_hours: {
    title: "Horarios",
    fields: [
      {
        key: "weekday",
        label: "Día",
        kind: "select",
        options: [
          ["0", "Domingo"],
          ["1", "Lunes"],
          ["2", "Martes"],
          ["3", "Miércoles"],
          ["4", "Jueves"],
          ["5", "Viernes"],
          ["6", "Sábado"],
        ],
      },
      { key: "open_time", label: "Apertura", kind: "time" },
      { key: "close_time", label: "Cierre", kind: "time" },
      { key: "pickup_close_time", label: "Cierre de recogida", kind: "time" },
      { key: "active", label: "Abierto", kind: "checkbox" },
    ],
    defaults: {
      weekday: 1,
      open_time: "11:00",
      close_time: "19:00",
      pickup_close_time: "18:00",
      active: false,
    },
  },
  schedule_exceptions: {
    title: "Fechas especiales",
    fields: [
      { key: "date", label: "Fecha", kind: "date", required: true },
      { key: "closed", label: "Cerrado todo el día", kind: "checkbox" },
      { key: "open_time", label: "Apertura especial", kind: "time" },
      { key: "close_time", label: "Cierre especial", kind: "time" },
      { key: "reason", label: "Motivo" },
    ],
    defaults: {
      date: "",
      closed: true,
      open_time: null,
      close_time: null,
      reason: "",
    },
  },
};
function ErrorText({ error }: { error: string }) {
  return error ? (
    <p role="alert" className="admin-error">
      {error}
    </p>
  ) : null;
}
function Fields({
  fields,
  value,
  onChange,
}: {
  fields: Field[];
  value: Row;
  onChange: (v: Row) => void;
}) {
  return (
    <>
      {fields.map((f) =>
        f.kind === "checkbox" ? (
          <label className="checkbox-field" key={f.key}>
            <input
              type="checkbox"
              checked={!!value[f.key]}
              onChange={(e) =>
                onChange({ ...value, [f.key]: e.target.checked })
              }
            />
            {f.label}
          </label>
        ) : (
          <label className="field" key={f.key}>
            {f.label}
            {f.kind === "textarea" ? (
              <textarea
                rows={4}
                value={String(value[f.key] ?? "")}
                onChange={(e) =>
                  onChange({ ...value, [f.key]: e.target.value })
                }
                required={f.required}
              />
            ) : f.kind === "select" ? (
              <select
                value={String(value[f.key] ?? "")}
                onChange={(e) =>
                  onChange({ ...value, [f.key]: e.target.value })
                }
              >
                {f.options?.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={f.kind || "text"}
                value={String(value[f.key] ?? "")}
                onChange={(e) =>
                  onChange({
                    ...value,
                    [f.key]:
                      f.kind === "number"
                        ? e.target.value === ""
                          ? null
                          : Number(e.target.value)
                        : e.target.value,
                  })
                }
                required={f.required}
                min={f.kind === "number" ? 0 : undefined}
              />
            )}
          </label>
        ),
      )}
    </>
  );
}
function ContentEditor({
  resource,
  canWrite,
}: {
  resource: string;
  canWrite: boolean;
}) {
  const config = resources[resource],
    toast = useToast();
  const [rows, setRows] = useState<Row[]>([]),
    [value, setValue] = useState<Row | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(
    () =>
      api<Row[]>(`/admin/${resource}`)
        .then(setRows)
        .catch((e) => setError(e.message)),
    [resource],
  );
  useEffect(() => {
    setValue(null);
    setError("");
    load();
  }, [load]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!value) return;
    setBusy(true);
    setError("");
    try {
      const parsed = contentSchemas[
        resource as keyof typeof contentSchemas
      ].parse(
        resource === "schedule_exceptions"
          ? {
              ...value,
              open_time: value.open_time || null,
              close_time: value.close_time || null,
            }
          : value,
      );
      await api(`/admin/${resource}`, {
        method: "POST",
        body: JSON.stringify(parsed),
      });
      toast("Cambios guardados");
      setValue(null);
      await load();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="admin-title">
        <h2>{config.title}</h2>
        {canWrite && (
          <button
            className="button"
            onClick={() => setValue({ ...config.defaults })}
          >
            Añadir
          </button>
        )}
      </div>
      <ErrorText error={error} />
      {value ? (
        <form className="admin-editor" onSubmit={save}>
          <Fields fields={config.fields} value={value} onChange={setValue} />
          <div className="admin-form-actions">
            <button className="button" disabled={busy}>
              {busy ? "Guardando…" : "Guardar cambios"}
            </button>
            <button
              className="text-link"
              type="button"
              onClick={() => setValue(null)}
            >
              Cerrar
            </button>
          </div>
        </form>
      ) : rows.length ? (
        <div className="admin-records">
          {rows.map((r, i) => (
            <div key={String(r.id || r.date || r.weekday || i)}>
              <div>
                <strong>
                  {String(
                    r.title ||
                      r.question ||
                      r.name ||
                      r.date ||
                      (resource === "business_hours"
                        ? [
                            "Domingo",
                            "Lunes",
                            "Martes",
                            "Miércoles",
                            "Jueves",
                            "Viernes",
                            "Sábado",
                          ][Number(r.weekday)]
                        : "Registro"),
                  )}
                </strong>
                <p>
                  {typeof r.published === "boolean"
                    ? r.published
                      ? "Publicado"
                      : "Borrador"
                    : resource === "business_hours"
                      ? `${r.active ? "Abierto" : "Cerrado"} · ${r.open_time}–${r.close_time}`
                      : r.closed
                        ? "Cerrado"
                        : "Horario especial"}
                </p>
              </div>
              {canWrite && (
                <button className="text-link" onClick={() => setValue(r)}>
                  Editar
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <State kind="sin-resultados" title="Todavía no hay contenido aquí.">
          Añade el primer registro cuando tengas la información confirmada.
        </State>
      )}
    </>
  );
}
function CatalogEditor({ canWrite }: { canWrite: boolean }) {
  const [items, setItems] = useState<CatalogItem[]>([]),
    [categories, setCategories] = useState<Category[]>([]),
    [value, setValue] = useState<Row | null>(null),
    [meta, setMeta] = useState<Row>({}),
    [query, setQuery] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [preview, setPreview] = useState(false);
  const toast = useToast();
  const load = useCallback(
    () =>
      Promise.all([
        api<CatalogItem[]>("/admin/items"),
        api<Category[]>("/admin/catalog_categories"),
      ])
        .then(([i, c]) => {
          setItems(i);
          setCategories(c);
        })
        .catch((e) => setError(e.message)),
    [],
  );
  useEffect(() => {
    load();
  }, [load]);
  function edit(item?: CatalogItem) {
    setValue(
      item
        ? { ...item }
        : {
            type: "ceramic",
            category_id: categories.find((c) => c.type === "ceramic")?.id || "",
            slug: "",
            name: "",
            short_desc: "",
            long_desc: "",
            price_cents: 0,
            status: "available",
            published: false,
            sort_order: items.length,
            asset: "ceramic-taza-clasica",
          },
    );
    setMeta(
      item
        ? item.ceramic_meta || item.cafe_meta || {}
        : {
            dimensions: "",
            difficulty: "",
            estimated_minutes: null,
            shape_family: "",
          },
    );
    setError("");
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const item = itemSchema.parse(value);
      await api("/admin/items", {
        method: "POST",
        body: JSON.stringify({
          item,
          meta:
            item.type === "ceramic"
              ? {
                  dimensions: "",
                  difficulty: "",
                  estimated_minutes: null,
                  shape_family: "",
                  ...meta,
                }
              : {
                  temperature: "",
                  caffeine: false,
                  dietary_tags: [],
                  allergens: [],
                  alcohol_note: "",
                  ...meta,
                },
        }),
      });
      toast("Pieza guardada");
      setValue(null);
      await load();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function togglePublish(i: CatalogItem) {
    try {
      await api("/admin/items", {
        method: "POST",
        body: JSON.stringify({
          item: { ...i, published: !i.published },
          meta: i.type === "ceramic" ? i.ceramic_meta || {} : i.cafe_meta || {},
        }),
      });
      await load();
      toast(i.published ? "Ocultado del catálogo" : "Publicado en el catálogo");
    } catch (e) {
      toast("Error al actualizar estado");
    }
  }
  const assets =
    value?.type === "cafe"
      ? [
          "menu-hot-espresso",
          "menu-hot-cappuccino",
          "menu-hot-latte",
          "menu-hot-americano",
          "menu-hot-de-olla",
          "menu-hot-moka",
          "menu-hot-chocolate",
          "menu-hot-matcha",
          "menu-hot-taro",
          "menu-hot-chai-vainilla",
          "menu-hot-tisana",
          "menu-hot-te",
          "menu-cold-soda-italiana",
          "menu-cold-moka",
          "menu-cold-latte",
          "menu-cold-americano",
          "menu-cold-taro",
          "menu-cold-matcha-cerem",
          "menu-cold-chai-vainilla",
          "menu-cold-tisana",
          "menu-cold-te",
          "menu-cold-frappe",
          "menu-cold-cold-brew",
          "menu-cold-agua-mineral",
          "menu-extra-shot",
          "menu-extra-shot-cafe",
          "menu-extra-leche-avena",
          "menu-extra-cold-foam",
          "menu-snack-panini-salado",
          "menu-snack-pan-dulce-relleno",
          "menu-snack-pan-dulce-sencillo",
          "menu-snack-crepa-dulce",
          "menu-snack-crepa-salada",
          "menu-esp-tantresado",
          "menu-esp-denis-red-fruit",
          "menu-esp-caramel-manchado",
          "menu-esp-affogato",
          "menu-esp-tisana-strudel",
          "menu-esp-temporada",
          "menu-drink-espresso-martini",
          "menu-drink-vino-tinto",
          "menu-drink-margarita"
        ]
      : [
          "taza-clasica",
          "taza-cappuccino",
          "plato-llano",
          "bowl",
          "florero",
          "maceta",
          "platito-corazon",
          "figura",
          "candelero",
          "charola-oval",
        ].map((v) => "ceramic-" + v);
  return (
    <>
      <div className="admin-title">
        <h2>Piezas & menú</h2>
        {canWrite && (
          <button className="button" onClick={() => edit()}>
            Añadir item
          </button>
        )}
      </div>
      <ErrorText error={error} />
      {value ? (
        <form onSubmit={save} className="admin-editor">
          <div className="field-row">
            <label className="field">
              Universo
              <select
                value={String(value.type)}
                onChange={(e) => {
                  setValue({
                    ...value,
                    type: e.target.value,
                    category_id:
                      categories.find((c) => c.type === e.target.value)?.id ||
                      "",
                    asset:
                      e.target.value === "cafe"
                        ? "cafe-latte"
                        : "ceramic-taza-clasica",
                  });
                  setMeta({});
                }}
              >
                <option value="ceramic">Cerámica</option>
                <option value="cafe">Café & snacks</option>
              </select>
            </label>
            <label className="field">
              Categoría
              <select
                value={String(value.category_id)}
                onChange={(e) =>
                  setValue({ ...value, category_id: e.target.value })
                }
                required
              >
                <option value="">Elige categoría</option>
                {categories
                  .filter((c) => c.type === value.type)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <Fields
            fields={[
              { key: "name", label: "Nombre", required: true },
              { key: "slug", label: "Identificador URL", required: true },
              { key: "short_desc", label: "Descripción corta" },
              {
                key: "long_desc",
                label: "Descripción y recomendaciones",
                kind: "textarea",
              },
              {
                key: "price_cents",
                label: "Precio en centavos MXN (28000 = $280)",
                kind: "number",
              },
              {
                key: "status",
                label: "Disponibilidad",
                kind: "select",
                options: [
                  ["available", "Disponible"],
                  ["low_stock", "Pocas piezas"],
                  ["unavailable", "No disponible"],
                  ["seasonal", "Temporada"],
                ],
              },
              { key: "sort_order", label: "Orden", kind: "number" },
              {
                key: "asset",
                label: "Ilustración de familia",
                kind: "select",
                options: assets.map((a) => [
                  a,
                  a.replace(/^(ceramic|cafe)-/, "").replaceAll("-", " "),
                ]),
              },
            ]}
            value={value}
            onChange={setValue}
          />
          {value.type === "ceramic" ? (
            <Fields
              fields={[
                { key: "dimensions", label: "Dimensiones reales" },
                { key: "difficulty", label: "Dificultad (opcional)" },
                {
                  key: "estimated_minutes",
                  label: "Tiempo de pintura estimado en minutos",
                  kind: "number",
                },
                { key: "shape_family", label: "Familia" },
              ]}
              value={meta}
              onChange={setMeta}
            />
          ) : (
            <>
              <Fields
                fields={[
                  { key: "temperature", label: "Temperatura" },
                  {
                    key: "caffeine",
                    label: "Contiene cafeína",
                    kind: "checkbox",
                  },
                  {
                    key: "alcohol_note",
                    label: "Información de alcohol, si aplica",
                  },
                ]}
                value={meta}
                onChange={setMeta}
              />
              {["allergens", "dietary_tags"].map((k) => (
                <label key={k} className="field">
                  {k === "allergens"
                    ? "Alérgenos confirmados, separados por coma"
                    : "Etiquetas dietarias, separadas por coma"}
                  <input
                    value={
                      Array.isArray(meta[k])
                        ? (meta[k] as string[]).join(", ")
                        : ""
                    }
                    onChange={(e) =>
                      setMeta({
                        ...meta,
                        [k]: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </label>
              ))}
            </>
          )}
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={!!value.published}
              onChange={(e) =>
                setValue({ ...value, published: e.target.checked })
              }
            />
            Publicar en el catálogo
          </label>
          <p className="admin-hint">
            Desmarca Publicar para archivar sin perder el registro. Solo
            confirma disponibilidad con información actual del estudio.
          </p>
          <div className="admin-form-actions">
            <button className="button" disabled={busy}>
              {busy ? "Guardando…" : "Guardar"}
            </button>
            <button
              className="text-link"
              type="button"
              onClick={() => setPreview((v) => !v)}
            >
              Vista móvil
            </button>
            <button
              className="text-link"
              type="button"
              onClick={() => setValue(null)}
            >
              Cerrar
            </button>
          </div>
          {preview && (
            <div className="admin-mobile-preview">
              <Brand name={String(value.asset)} />
              <h3>{String(value.name || "Nombre de la pieza")}</h3>
              <p>{money(Number(value.price_cents) || 0)}</p>
              <p>{String(value.short_desc || "")}</p>
            </div>
          )}
        </form>
      ) : (
        <>
          <label className="field">
            Buscar piezas o bebidas
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="admin-records">
            {(() => {
              const filtered = items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()));
              if (filtered.length === 0) {
                return items.length === 0 ? (
                  <State kind="sin-resultados" title="Tu catálogo empieza aquí.">
                    Publica únicamente piezas, precios y bebidas reales.
                  </State>
                ) : (
                  <State kind="sin-resultados" title="No hay resultados.">
                    No encontramos piezas o bebidas con ese nombre.
                  </State>
                );
              }
              return filtered.map((i) => (
                <div key={i.id}>
                  <Brand name={i.asset} />
                  <div>
                    <strong>{i.name}</strong>
                    <p>
                      {money(i.price_cents)} ·{" "}
                      {i.published ? "Publicado" : "Borrador"} · {i.status}
                    </p>
                  </div>
                  {canWrite && (
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <button 
                        onClick={() => togglePublish(i)} 
                        aria-label={i.published ? "Ocultar" : "Mostrar"}
                        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <motion.svg
                          width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          animate={i.published ? "visible" : "hidden"}
                          variants={{
                            visible: { color: "var(--ink)" },
                            hidden: { color: "#a09c96" }
                          }}
                        >
                          {/* Eye outline */}
                          <motion.path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          {/* Eye pupil */}
                          <motion.circle cx="12" cy="12" r="3" 
                            variants={{
                              visible: { scale: 1, opacity: 1 },
                              hidden: { scale: 0.5, opacity: 0 }
                            }}
                          />
                          {/* Slash line for hidden state */}
                          <motion.line x1="4" y1="4" x2="20" y2="20"
                            initial={{ pathLength: 0, opacity: 0 }}
                            variants={{
                              visible: { pathLength: 0, opacity: 0 },
                              hidden: { pathLength: 1, opacity: 1 }
                            }}
                            transition={{ duration: 0.3 }}
                          />
                        </motion.svg>
                      </button>
                      <button className="text-link" onClick={() => edit(i)}>
                        Editar
                      </button>
                    </div>
                  )}
                </div>
              ));
            })()}
          </div>
        </>
      )}
    </>
  );
}
type Reservation = {
  id: string;
  public_code: string;
  name: string;
  email: string;
  phone: string;
  party_size: number;
  celebration: string;
  notes: string;
  status: string;
  slot_id: string;
  reservation_slots: { starts_at: string; ends_at: string };
};
function Dashboard({ canWrite }: { canWrite: boolean }) {
  const [data, setData] = useState<{
      reservations: Reservation[];
      total?: number;
      metrics?: { confirmed: number; people: number; cancelled: number };
      notifications?: {
        id: string;
        attempts: number;
        last_error: string | null;
      }[];
      slots: {
        id: string;
        starts_at: string;
        capacity: number;
        blocked: boolean;
        booked: number;
      }[];
    }>({ reservations: [], slots: [] }),
    [error, setError] = useState(""),
    [day, setDay] = useState(localDate()),
    [status, setStatus] = useState("all"),
    [busy, setBusy] = useState(false),
    [days, setDays] = useState(1),
    [minParty, setMinParty] = useState(1),
    [celebration, setCelebration] = useState(false),
    [offset, setOffset] = useState(0);
  const toast = useToast(),
    request = useRef(0);
  const load = useCallback(async () => {
    const sequence = ++request.current;
    setError("");
    try {
      const result = await api<typeof data>(
        `/admin/dashboard?date=${day}&days=${days}&status=${status}&min=${minParty}&celebration=${celebration}&offset=${offset}`,
      );
      if (sequence === request.current) setData(result);
    } catch (e) {
      if (sequence === request.current) setError(message(e));
    }
  }, [day, days, status, minParty, celebration, offset]);
  useEffect(() => setOffset(0), [day, days, status, minParty, celebration]);
  useEffect(() => {
    load();
  }, [load]);
  async function update(id: string, status: string) {
    if (
      status === "cancelled" &&
      !confirm("¿Cancelar esta reserva y liberar su cupo?")
    )
      return;
    setBusy(true);
    try {
      await api("/admin/reservation", {
        method: "PATCH",
        body: JSON.stringify({ id, status }),
      });
      toast("Reserva actualizada");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const filtered = data.reservations;
  return (
    <>
      <div className="admin-title">
        <h2>La agenda del estudio</h2>
        <button className="text-link" onClick={load}>
          Actualizar
        </button>
      </div>
      <ErrorText error={error} />
      <>
        {!!data.notifications?.length && (
          <p className="admin-hint" role="status">
            {data.notifications.length} correos pendientes de entrega.{" "}
            {data.notifications.some((n) => n.attempts >= 12)
              ? "Hay envíos agotados: revisa Resend y contacta a las personas desde la agenda."
              : "El sistema reintentará los envíos automáticamente."}
          </p>
        )}
      </>
      <div className="admin-metrics">
        <div>
          <strong>{data.metrics?.confirmed || 0}</strong>
          <span>Confirmadas</span>
        </div>
        <div>
          <strong>{data.metrics?.people || 0}</strong>
          <span>Lugares reservados</span>
        </div>
        <div>
          <strong>{data.metrics?.cancelled || 0}</strong>
          <span>Canceladas</span>
        </div>
      </div>
      <div className="field-row">
        <label className="field">
          Fecha
          <input
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
        </label>
        <label className="field">
          Estado
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Todos</option>
            {["pending", "confirmed", "cancelled", "completed", "no_show"].map(
              (s) => (
                <option key={s}>{s}</option>
              ),
            )}
          </select>
        </label>
      </div>
      <div className="field-row">
        <label className="field">
          Vista
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={1}>Día</option>
            <option value={7}>Semana desde la fecha elegida</option>
          </select>
        </label>
        <label className="field">
          Grupo de al menos
          <input
            type="number"
            min={1}
            max={30}
            value={minParty}
            onChange={(e) =>
              setMinParty(Math.max(1, Math.min(30, Number(e.target.value))))
            }
          />
        </label>
      </div>
      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={celebration}
          onChange={(e) => setCelebration(e.target.checked)}
        />
        Solo celebraciones
      </label>
      <p className="admin-hint">
        Métricas de esta selección · {data.total || 0} reservas en la selección.
      </p>
      <div className="admin-bookings">
        {filtered.map((r) => (
          <details key={r.id}>
            <summary>
              <span>
                {r.name}
                <small>
                  {fullDate(r.reservation_slots.starts_at)} ·{" "}
                  {time(r.reservation_slots.starts_at)}
                </small>
              </span>
              <span>
                {r.party_size} personas<small>{r.status}</small>
              </span>
            </summary>
            <div>
              <p>
                {r.public_code} · <a href={`mailto:${r.email}`}>{r.email}</a> ·{" "}
                <a href={`tel:${r.phone}`}>{r.phone}</a>
              </p>
              {r.celebration && <p>{r.celebration}</p>}
              {r.notes && <p>{r.notes}</p>}
              {canWrite && ["pending", "confirmed"].includes(r.status) && (
                <div className="admin-form-actions">
                  {r.status === "pending" && (
                    <button
                      disabled={busy}
                      onClick={() => update(r.id, "confirmed")}
                    >
                      Confirmar
                    </button>
                  )}
                  <button
                    disabled={busy}
                    onClick={() => update(r.id, "completed")}
                  >
                    Completada
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => update(r.id, "no_show")}
                  >
                    No asistió
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => update(r.id, "cancelled")}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </details>
        ))}
      </div>
      {!filtered.length && (
        <State
          kind="sin-resultados"
          title="No hay reservas en esta selección."
        />
      )}
      <div className="admin-form-actions">
        <button
          className="text-link"
          disabled={offset === 0}
          onClick={() => setOffset((v) => Math.max(0, v - 100))}
        >
          Página anterior
        </button>
        <span>Página {offset / 100 + 1}</span>
        <button
          className="text-link"
          disabled={offset + 100 >= (data.total || 0)}
          onClick={() => setOffset((v) => v + 100)}
        >
          Siguiente página
        </button>
      </div>
      <h3 className="admin-section-title">Próximos horarios</h3>
      <div className="admin-records">
        {data.slots.slice(0, 30).map((s) => (
          <div key={s.id}>
            <div>
              <strong>
                {fullDate(s.starts_at)} · {time(s.starts_at)}
              </strong>
              <p>
                {s.booked} / {s.capacity} lugares ·{" "}
                {s.blocked ? "Bloqueado" : "Abierto"}
              </p>
            </div>
            {canWrite && (
              <button
                className="text-link"
                onClick={async () => {
                  try {
                    await api("/admin/slot", {
                      method: "PATCH",
                      body: JSON.stringify({ id: s.id, blocked: !s.blocked }),
                    });
                    load();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                {s.blocked ? "Abrir" : "Bloquear"}
              </button>
            )}
          </div>
        ))}
      </div>
      <p className="admin-hint">
        Los horarios existentes conservan su cupo original. La agenda muestra
        100 reservas por página.
      </p>
    </>
  );
}
async function optimize(file: File, maxWidth = 1600) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width, 2400 / bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) =>
        b ? resolve(b) : reject(new Error("No pudimos preparar la imagen.")),
      "image/webp",
      0.83,
    ),
  );
  return { blob, width: canvas.width, height: canvas.height };
}
function MediaLibrary() {
  const [media, setMedia] = useState<Row[]>([]),
    [items, setItems] = useState<CatalogItem[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [alt, setAlt] = useState(""),
    [destination, setDestination] = useState("library");
  const toast = useToast();
  const load = useCallback(
    () =>
      Promise.all([
        api<Row[]>("/admin/media_assets"),
        api<CatalogItem[]>("/admin/items"),
      ])
        .then(([m, i]) => {
          setMedia(m);
          setItems(i);
        })
        .catch((e) => setError(e.message)),
    [],
  );
  useEffect(() => {
    load();
  }, [load]);
  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem(
      "image",
    ) as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const optimized = await optimize(file);
      const form = new FormData();
      form.set("file", optimized.blob, "photo.webp");
      form.set("alt", alt);
      form.set("width", String(optimized.width));
      form.set("height", String(optimized.height));
      const saved = await api<{
        storage_path: string;
        alt: string;
        width: number;
        height: number;
      }>("/admin/media", { method: "POST", body: form });
      if (saved.width > 640) {
        const small = await optimize(file, 640);
        const variantForm = new FormData();
        variantForm.set("file", small.blob, "photo-small.webp");
        variantForm.set("alt", alt);
        variantForm.set("width", String(small.width));
        variantForm.set("height", String(small.height));
        const variant = await api<typeof saved>("/admin/media", {
          method: "POST",
          body: variantForm,
        });
        await api("/admin/image-variant", {
          method: "POST",
          body: JSON.stringify({
            base_path: saved.storage_path,
            variant_path: variant.storage_path,
            width: variant.width,
            height: variant.height,
          }),
        });
      }
      if (destination === "gallery")
        await api("/admin/gallery_entries", {
          method: "POST",
          body: JSON.stringify({
            storage_path: saved.storage_path,
            alt,
            caption: "",
            sort_order: media.length,
            published: false,
          }),
        });
      else if (destination !== "library")
        await api("/admin/item-media", {
          method: "POST",
          body: JSON.stringify({
            ...saved,
            item_id: destination,
            sort_order: 0,
          }),
        });
      toast("Imagen subida y optimizada");
      setAlt("");
      input.value = "";
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="admin-title">
        <h2>Biblioteca de medios</h2>
      </div>
      <ErrorText error={error} />
      <form onSubmit={upload} className="admin-editor">
        <label className="field">
          Fotografía real
          <input
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
          />
        </label>
        <label className="field">
          Descripción accesible
          <input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            required
            minLength={2}
            maxLength={250}
          />
        </label>
        <label className="field">
          Usar en
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          >
            <option value="library">Solo biblioteca</option>
            <option value="gallery">Galería editorial (borrador)</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </label>
        <button className="button" disabled={busy}>
          {busy ? "Optimizando y subiendo…" : "Subir imagen"}
        </button>
        <p className="admin-hint">
          Se exportan versiones WebP de 640 y hasta 1600 px de ancho. Alt
          obligatorio. Almacenamiento privado; solo se sirven medios asociados a
          contenido publicado.
        </p>
      </form>
      <div className="admin-media-grid">
        {media.map((m) => (
          <figure key={String(m.id)}>
            <img
              src={mediaUrl(String(m.storage_path))}
              alt={String(m.alt)}
              loading="lazy"
            />
            <figcaption>
              {String(m.alt)}
              <small>
                {String(m.width)} × {String(m.height)} ·{" "}
                {Math.round(Number(m.bytes) / 1024)} KB
              </small>
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
function Settings() {
  const [settings, setSettings] = useState<Record<string, unknown>>({}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [section, setSection] = useState("booking_rules");
  const toast = useToast();
  useEffect(() => {
    api<{ key: string; value_json: unknown }[]>("/admin/settings")
      .then((rows) =>
        setSettings(Object.fromEntries(rows.map((r) => [r.key, r.value_json]))),
      )
      .catch((e) => setError(e.message));
  }, []);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const value =
        section === "booking_rules"
          ? bookingRulesSchema.parse(settings[section])
          : settings[section];
      await api("/admin/settings", {
        method: "POST",
        body: JSON.stringify({ key: section, value_json: value }),
      });
      toast("Configuración guardada");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const fields: Field[] =
    section === "booking_rules"
      ? [
          {
            key: "enabled",
            label: "Habilitar reservas en línea",
            kind: "checkbox",
          },
          {
            key: "capacity",
            label: "Cupo de personas por sesión",
            kind: "number",
          },
          {
            key: "max_party_size",
            label: "Máximo de personas por reserva",
            kind: "number",
          },
          {
            key: "session_minutes",
            label: "Duración de la sesión, minutos",
            kind: "number",
          },
          {
            key: "advance_minutes",
            label: "Anticipación mínima, minutos",
            kind: "number",
          },
          {
            key: "cancellation_hours",
            label: "Anticipación para cancelar, horas",
            kind: "number",
          },
          {
            key: "horizon_days",
            label: "Días disponibles hacia adelante",
            kind: "number",
          },
          { key: "terms_version", label: "Versión de términos" },
        ]
      : [
          { key: "address", label: "Dirección" },
          { key: "phone", label: "Teléfono con código de país" },
          { key: "email", label: "Correo" },
          { key: "instagram", label: "Usuario de Instagram" },
          {
            key: "verified",
            label: "Datos verificados con TANTRE",
            kind: "checkbox",
          },
        ];
  return (
    <>
      <div className="admin-title">
        <h2>Ajustes del estudio</h2>
      </div>
      <label className="field">
        Sección
        <select value={section} onChange={(e) => setSection(e.target.value)}>
          {[
            ["booking_rules", "Reservas"],
            ["contact", "Contacto"],
            ["terms", "Términos"],
            ["privacy", "Privacidad"],
            ["legal_published", "Publicar información legal"],
            ["paint_enabled", "Interacción de pintura"],
            ["analytics_enabled", "Medición opcional"],
            ["availability_freshness_hours", "Vigencia de disponibilidad"],
          ].map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <ErrorText error={error} />
      <form className="admin-editor" onSubmit={save}>
        {["booking_rules", "contact"].includes(section) ? (
          <Fields
            fields={fields}
            value={(settings[section] as Row) || {}}
            onChange={(v) => setSettings({ ...settings, [section]: v })}
          />
        ) : ["terms", "privacy"].includes(section) ? (
          <label className="field">
            Texto aprobado · separar párrafos con una línea vacía
            <textarea
              rows={18}
              value={String(settings[section] || "")}
              onChange={(e) =>
                setSettings({ ...settings, [section]: e.target.value })
              }
              required
              minLength={100}
            />
          </label>
        ) : section === "availability_freshness_hours" ? (
          <label className="field">
            Horas
            <input
              type="number"
              min={1}
              max={168}
              value={Number(settings[section]) || 6}
              onChange={(e) =>
                setSettings({ ...settings, [section]: Number(e.target.value) })
              }
            />
          </label>
        ) : (
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={!!settings[section]}
              onChange={(e) =>
                setSettings({ ...settings, [section]: e.target.checked })
              }
            />
            Activado
          </label>
        )}
        <button className="button" disabled={busy}>
          {busy ? "Guardando…" : "Guardar configuración"}
        </button>
      </form>
    </>
  );
}
function Audit() {
  const [rows, setRows] = useState<Row[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    api<Row[]>("/admin/audit_log")
      .then(setRows)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <>
      <h2>Historial de cambios</h2>
      <ErrorText error={error} />
      <div className="admin-records">
        {rows.map((r) => (
          <details key={String(r.id)}>
            <summary>
              {String(r.entity)} · {String(r.action)} ·{" "}
              {new Date(String(r.created_at)).toLocaleString("es-MX")}
            </summary>
            <pre>
              {JSON.stringify(
                { antes: r.before_json, despues: r.after_json },
                null,
                2,
              )}
            </pre>
          </details>
        ))}
      </div>
    </>
  );
}
function GalleryEditor() {
  const [rows, setRows] = useState<Row[]>([]),
    [error, setError] = useState("");
  const toast = useToast();
  useEffect(() => {
    api<Row[]>("/admin/gallery_entries")
      .then(setRows)
      .catch((e) => setError(e.message));
  }, []);
  async function save(row: Row) {
    try {
      await api("/admin/gallery_entries", {
        method: "POST",
        body: JSON.stringify(row),
      });
      toast("Galería actualizada");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <h2>Galería editorial</h2>
      <ErrorText error={error} />
      <p className="admin-hint">
        Añade fotos desde Medios eligiendo Galería editorial.
      </p>
      <div className="admin-media-grid">
        {rows.map((r, i) => (
          <div key={String(r.id)}>
            <img src={mediaUrl(String(r.storage_path))} alt={String(r.alt)} />
            <Fields
              fields={[
                { key: "caption", label: "Pie de foto" },
                { key: "alt", label: "Descripción accesible" },
                { key: "sort_order", label: "Orden", kind: "number" },
                { key: "published", label: "Publicar", kind: "checkbox" },
              ]}
              value={r}
              onChange={(v) => setRows(rows.map((x, n) => (n === i ? v : x)))}
            />
            <button className="text-link" onClick={() => save(r)}>
              Guardar
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
function Team() {
  const [rows, setRows] = useState<Row[]>([]),
    [value, setValue] = useState<Row | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const toast = useToast();
  const load = useCallback(
    () =>
      api<Row[]>("/admin/profiles")
        .then(setRows)
        .catch((e) => setError(e.message)),
    [],
  );
  useEffect(() => {
    load();
  }, [load]);
  return (
    <>
      <div className="admin-title">
        <h2>Equipo del estudio</h2>
        <button
          className="button"
          onClick={() =>
            setValue({ id: "", display_name: "", role: "editor", active: true })
          }
        >
          Dar acceso
        </button>
      </div>
      <p className="admin-hint">
        Crea primero la cuenta en Supabase Authentication, con registro público
        desactivado. Copia su User UID aquí. Nunca compartas contraseñas entre
        miembros.
      </p>
      <ErrorText error={error} />
      {value ? (
        <form
          className="admin-editor"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              await api("/admin/team", {
                method: "POST",
                body: JSON.stringify(value),
              });
              setValue(null);
              toast("Acceso actualizado");
              await load();
            } catch (e) {
              setError(message(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          <Fields
            fields={[
              { key: "id", label: "User UID de Supabase", required: true },
              { key: "display_name", label: "Nombre", required: true },
              {
                key: "role",
                label: "Permisos",
                kind: "select",
                options: [
                  ["owner", "Propietario: todo y equipo"],
                  ["manager", "Responsable: operación y contenido"],
                  ["editor", "Editor: contenido sin reservas"],
                  ["viewer", "Consulta: sin cambios"],
                ],
              },
              { key: "active", label: "Acceso activo", kind: "checkbox" },
            ]}
            value={value}
            onChange={setValue}
          />
          <button className="button" disabled={busy}>
            Guardar acceso
          </button>
          <button
            type="button"
            className="text-link"
            onClick={() => setValue(null)}
          >
            Cerrar
          </button>
        </form>
      ) : (
        <div className="admin-records">
          {rows.map((r) => (
            <div key={String(r.id)}>
              <div>
                <strong>{String(r.display_name)}</strong>
                <p>
                  {String(r.role)} · {r.active ? "Activo" : "Desactivado"}
                </p>
              </div>
              <button className="text-link" onClick={() => setValue(r)}>
                Editar
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
export function AdminApp({ path }: { path?: string[] }) {
  const [user, setUser] = useState<Staff | null>(null),
    [checking, setChecking] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [showPassword, setShowPassword] = useState(false);
    
  let tab = path?.[0] || 'dashboard';
  if (user?.role === "editor" && !path?.[0]) tab = "catalog";

  useEffect(() => {
    api<Staff>("/admin/me")
      .then((p) => {
        setUser(p);
      })
      .catch((e) => {
        if (!(e instanceof ApiError && e.status === 401)) setError(e.message);
      })
      .finally(() => setChecking(false));
  }, []);
  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const staff = await api<Staff>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      setUser(staff);
      window.location.href = "/admin";
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (checking)
    return (
      <main id="main" className="simple-page">
        <State kind="loading-static" title="Abriendo el estudio…" />
      </main>
    );
  if (!user)
    return (
      <main id="main" className="admin-login">
        <p className="eyebrow">DETRÁS DEL LIENZO</p>
        <h1>
          El estudio,
          <br />
          <em>por dentro.</em>
        </h1>
        <p>Acceso para el equipo de TANTRE.</p>
        <form onSubmit={login}>
          <ErrorText error={error} />
          <label className="field">
            Correo de trabajo
            <input name="email" type="email" autoComplete="username" required />
          </label>
          <label className="field">
            Contraseña
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                minLength={8}
                style={{ width: "100%", paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar" : "Mostrar"}
                title={showPassword ? "Ocultar" : "Mostrar"}
                style={{
                  position: "absolute",
                  right: "10px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  color: "var(--ink, #252422)",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showPassword ? (
                    <>
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </>
                  ) : (
                    <>
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </label>
          <button className="button" disabled={busy}>
            {busy ? "Entrando…" : "Entrar al estudio"}
            <Brand name="ui-forward" />
          </button>
        </form>
      </main>
    );
  const canWrite = user.role !== "viewer",
    ops = ["owner", "manager"].includes(user.role);

  return (
    <AdminShell>
      <div className="admin-layout" style={{ display: 'block', paddingTop: 0 }}>
        <section className="admin-content">
          {tab === "dashboard" ? (
            <>
              <PageHeading eyebrow={`EL ESTUDIO · ${user.role}`} title={`Hola, ${user.display_name || "equipo"}.`} />
              <Dashboard canWrite={ops} />
            </>
          ) : tab === "catalog" || tab === "items" ? (
            <>
              <PageHeading title="Catálogo y Productos" />
              <CatalogEditor canWrite={canWrite} />
              <div style={{ marginTop: 40 }} />
              <PageHeading title="Categorías de Catálogo" />
              <ContentEditor resource={"catalog_categories"} canWrite={canWrite} />
            </>
          ) : tab === "faqs" ? (
            <>
              <PageHeading title="Preguntas Frecuentes" />
              <ContentEditor resource={"faqs"} canWrite={canWrite} />
            </>
          ) : tab === "packages" ? (
            <>
              <PageHeading title="Paquetes y Eventos" />
              <ContentEditor resource={"packages"} canWrite={canWrite} />
            </>
          ) : tab === "settings" ? (
            <>
              <PageHeading title="Ajustes" />
              <Settings />
            </>
          ) : (
            <Empty title="Sección en construcción" description="Esta sección estará disponible pronto." />
          )}
        </section>
      </div>
    </AdminShell>
  );
}
