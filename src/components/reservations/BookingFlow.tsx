"use client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { reservationSchema } from "@/lib/validation";
import { api, ApiError } from "@/lib/api";
import { fullDate, localDate, time } from "@/lib/utils";
import type { Slot, ReservationSummary } from "@/lib/types";
import { usePublicData } from "../Providers";
import { Brand } from "../brand/Brand";
import { LivingLine } from "../motion/LivingLine";
import { State } from "../brand/State";
import { Turnstile } from "./Turnstile";
import { track } from "../Analytics";
export function BookingFlow() {
  const { data, loading: configLoading } = usePublicData();
  const [step, setStep] = useState(1),
    [slots, setSlots] = useState<Slot[]>([]),
    [slotsLoading, setSlotsLoading] = useState(false),
    [slotsError, setSlotsError] = useState(""),
    [error, setError] = useState(""),
    [success, setSuccess] = useState<ReservationSummary | null>(null),
    [retry, setRetry] = useState(0),
    [turnstileKey, setTurnstileKey] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null),
    errorRef = useRef<HTMLDivElement>(null),
    started = useRef(false),
    key = useRef("");
  const rules = data.settings.booking_rules as
    | {
        enabled?: boolean;
        max_party_size?: number;
        session_minutes?: number;
        advance_minutes?: number;
        cancellation_hours?: number;
      }
    | undefined;
  const contact = data.settings.contact as
    { phone?: string; email?: string } | undefined;
  const enabled = !!(data.configured && rules?.enabled);
  const form = useForm<
    z.input<typeof reservationSchema>,
    unknown,
    z.output<typeof reservationSchema>
  >({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      date: "",
      slot_id: "",
      party_size: 2,
      celebration: "",
      notes: "",
      terms: undefined,
      token: "",
      website: "",
      idempotency_key: "",
    },
    mode: "onBlur",
  });
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = form;
  const date = watch("date"),
    party = Number(watch("party_size")),
    slotId = watch("slot_id");
  useEffect(() => {
    key.current = crypto.randomUUID();
    setValue("idempotency_key", key.current);
    setValue("date", localDate());
    const people = Number(new URLSearchParams(location.search).get("personas"));
    if (people > 0 && people <= 6) setValue("party_size", people);
  }, [setValue]);
  useEffect(() => {
    if (!enabled || !date || !party) return;
    let alive = true;
    setSlotsLoading(true);
    setSlotsError("");
    setValue("slot_id", "");
    api<{ slots: Slot[] }>(`/availability?date=${date}&party_size=${party}`)
      .then((result) => {
        if (alive) setSlots(result.slots);
      })
      .catch((e) => {
        if (alive) {
          setSlotsError(e.message);
          setSlots([]);
        }
      })
      .finally(() => {
        if (alive) setSlotsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [date, party, enabled, retry, setValue]);
  const selected = slots.find((s) => s.id === slotId);
  async function next() {
    if (await trigger(["date", "party_size", "slot_id"])) {
      setStep(2);
      setTimeout(() => heading.current?.focus(), 0);
    }
  }
  async function submit(input: z.output<typeof reservationSchema>) {
    setError("");
    try {
      const result = await api<ReservationSummary>("/reservations", {
        method: "POST",
        body: JSON.stringify(input),
      });
      setSuccess(result);
      track("reservation_success", {
        party_size: result.party_size,
        source: "booking",
      });
      setTimeout(() => heading.current?.focus(), 0);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No pudimos confirmar. Inténtalo de nuevo.",
      );
      setTurnstileKey((v) => v + 1);
      setValue("token", "");
      if (e instanceof ApiError && e.status === 409) {
        setStep(1);
        setRetry((v) => v + 1);
      }
      setTimeout(() => errorRef.current?.focus(), 0);
    }
  }
  function start() {
    if (!started.current) {
      started.current = true;
      track("reserve_start", { source: "booking" });
    }
  }
  if (success)
    return (
      <main id="main" className="reservation-success">
        <LivingLine state={13} />
        <p className="eyebrow">YA TENEMOS UN PLAN</p>
        <h1 tabIndex={-1} ref={heading}>
          Tu mesa te espera,
          <br />
          <em>{success.name.split(" ")[0]}.</em>
        </h1>
        <p>Nos vemos para crear algo tuyo.</p>
        <dl>
          <div>
            <dt>Tu día</dt>
            <dd>{fullDate(success.starts_at)}</dd>
          </div>
          <div>
            <dt>Horario</dt>
            <dd>
              {time(success.starts_at)}–{time(success.ends_at)}
            </dd>
          </div>
          <div>
            <dt>Personas</dt>
            <dd>{success.party_size}</dd>
          </div>
          <div>
            <dt>Tu código</dt>
            <dd>{success.public_code}</dd>
          </div>
        </dl>
        <p className="confirmation-email">
          Recibirás el resumen y el enlace para cancelar por correo. Guarda
          también tu código.
        </p>
        <a href="/catalogo/" className="button">
          Empieza a inspirarte
          <Brand name="ui-forward" />
        </a>
        <a href="/" className="text-link">
          Volver al inicio
        </a>
      </main>
    );
  return (
    <main id="main" className="booking-page">
      <aside className="booking-intro">
        <p className="eyebrow">HAZLE UN HUECO A LO QUE TE HACE BIEN</p>
        <h1>
          Un lugar
          <br />
          para <em>ti.</em>
        </h1>
        <p>
          Elige cuándo venir.
          <br />
          Nosotros vamos poniendo la mesa.
        </p>
        <Brand name="illus-mesa-creacion" />
        <div className="booking-facts">
          <span>
            <Brand name="ui-clock" />
            {rules?.session_minutes
              ? `${rules.session_minutes / 60} horas para crear`
              : "Un rato para crear"}
          </span>
          <span>
            <Brand name="line-06-pincel" />
            Materiales incluidos con tu pieza
          </span>
          <span>
            <Brand name="ui-people" />
            Ven como eres. Pinta como quieras.
          </span>
        </div>
      </aside>
      <div className="booking-form-wrap">
        <div className="booking-progress" aria-label={`Paso ${step} de 2`}>
          <span className={step === 1 ? "active" : ""}>01 · Tu momento</span>
          <span className={step === 2 ? "active" : ""}>02 · Tus datos</span>
        </div>
        <h2 ref={heading} tabIndex={-1}>
          {step === 1 ? "Empecemos por el cuándo." : "¿A nombre de quién?"}
        </h2>
        {!configLoading && !enabled && (
          <div className="booking-unavailable" role="status">
            <Brand name="state-loading-static" />
            <p>
              Estamos preparando las reservas en línea. Por ahora, escríbenos y
              organizamos tu visita.
            </p>
            <a
              href={`tel:${contact?.phone || "+523321583412"}`}
              className="text-link"
            >
              Llámanos
              <Brand name="ui-phone" />
            </a>
            <a href={`mailto:${contact?.email || "hola@tantre.mx"}`}>
              Enviar un correo
            </a>
          </div>
        )}
        <form
          onSubmit={handleSubmit(submit, () => {
            setError("Revisa los campos indicados para confirmar tu mesa.");
            setTimeout(() => errorRef.current?.focus(), 0);
          })}
          onFocus={start}
          noValidate
        >
          {error && (
            <div
              className="form-error-summary"
              role="alert"
              tabIndex={-1}
              ref={errorRef}
            >
              {error}
            </div>
          )}
          {step === 1 ? (
            <>
              <div className="field-row">
                <label className="field">
                  ¿Qué día?
                  <input
                    type="date"
                    min={localDate()}
                    {...register("date")}
                    aria-invalid={!!errors.date}
                    aria-describedby="date-error"
                    disabled={!enabled}
                  />
                  {errors.date && (
                    <span id="date-error" className="field-error">
                      {errors.date.message}
                    </span>
                  )}
                </label>
                <label className="field">
                  ¿Cuántas personas?
                  <select
                    {...register("party_size")}
                    aria-invalid={!!errors.party_size}
                    disabled={!enabled}
                  >
                    {Array.from(
                      { length: rules?.max_party_size || 6 },
                      (_, i) => (
                        <option key={i} value={i + 1}>
                          {i + 1} {i === 0 ? "persona" : "personas"}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </div>
              <fieldset className="slot-field">
                <legend>Elige tu horario</legend>
                {slotsLoading ? (
                  <div className="slot-loading" role="status">
                    <Brand name="state-loading-static" />
                    Buscando un espacio para ti…
                  </div>
                ) : slotsError ? (
                  <State
                    kind="offline"
                    title="No pudimos consultar horarios."
                    onRetry={() => setRetry((v) => v + 1)}
                  >
                    {slotsError}
                  </State>
                ) : enabled && slots.length === 0 ? (
                  <p className="slot-empty">
                    No hay horarios disponibles para esta fecha y grupo. Prueba
                    otro día.
                  </p>
                ) : (
                  <div className="slot-grid">
                    {slots.map((s) => (
                      <label
                        key={s.id}
                        className={slotId === s.id ? "selected" : ""}
                      >
                        <input
                          type="radio"
                          value={s.id}
                          {...register("slot_id")}
                          onChange={(e) => {
                            setValue("slot_id", e.target.value, {
                              shouldValidate: true,
                            });
                            track("slot_selected", {
                              date_bucket:
                                date === localDate() ? "today" : "future",
                              time: time(s.starts_at),
                            });
                          }}
                        />
                        {time(s.starts_at)}
                        <small>hasta {time(s.ends_at)}</small>
                      </label>
                    ))}
                  </div>
                )}
                {errors.slot_id && (
                  <p className="field-error" role="alert">
                    {errors.slot_id.message}
                  </p>
                )}
              </fieldset>
              <button
                type="button"
                className="button"
                disabled={!enabled || slotsLoading}
                onClick={next}
              >
                Siguiente: tus datos
                <Brand name="ui-forward" />
              </button>
              <p className="booking-help">
                ¿Son más de {rules?.max_party_size || 6}?{" "}
                <a href={`mailto:${contact?.email || "hola@tantre.mx"}`}>
                  Organicemos algo juntos.
                </a>
              </p>
            </>
          ) : (
            <>
              <div className="selected-slot">
                <span>
                  {selected
                    ? `${fullDate(selected.starts_at)} · ${time(selected.starts_at)}`
                    : date}
                  <br />
                  {party} personas
                </span>
                <button type="button" onClick={() => setStep(1)}>
                  Cambiar
                </button>
              </div>
              <label className="field">
                Tu nombre
                <input
                  autoComplete="name"
                  {...register("name")}
                  aria-invalid={!!errors.name}
                  aria-describedby="name-error"
                />
                {errors.name && (
                  <span id="name-error" className="field-error">
                    {errors.name.message}
                  </span>
                )}
              </label>
              <div className="field-row">
                <label className="field">
                  Correo electrónico
                  <input
                    type="email"
                    autoComplete="email"
                    {...register("email")}
                    aria-invalid={!!errors.email}
                    aria-describedby="email-error"
                  />
                  {errors.email && (
                    <span id="email-error" className="field-error">
                      {errors.email.message}
                    </span>
                  )}
                </label>
                <label className="field">
                  Teléfono con lada
                  <input
                    type="tel"
                    autoComplete="tel"
                    {...register("phone")}
                    aria-invalid={!!errors.phone}
                    aria-describedby="phone-error"
                  />
                  {errors.phone && (
                    <span id="phone-error" className="field-error">
                      {errors.phone.message}
                    </span>
                  )}
                </label>
              </div>
              <label className="field">
                ¿Celebran algo? <span className="optional">Opcional</span>
                <select {...register("celebration")}>
                  <option value="">Una tarde para crear</option>
                  <option>Cumpleaños</option>
                  <option>Una cita</option>
                  <option>Una reunión entre amigos</option>
                  <option>Una celebración especial</option>
                </select>
              </label>
              <label className="field">
                Algo que quieras contarnos{" "}
                <span className="optional">Opcional</span>
                <textarea
                  rows={3}
                  maxLength={600}
                  {...register("notes")}
                  placeholder="Peticiones especiales para tu visita"
                />
              </label>
              <label className="honeypot" aria-hidden="true">
                Sitio web
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  {...register("website")}
                />
              </label>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  {...register("terms")}
                  aria-invalid={!!errors.terms}
                  aria-describedby="terms-error"
                />
                <span>
                  Acepto los{" "}
                  <a href="/terminos/" target="_blank">
                    términos de reservación
                  </a>{" "}
                  y he leído el{" "}
                  <a href="/privacidad/" target="_blank">
                    aviso de privacidad
                  </a>
                  .
                </span>
              </label>
              {errors.terms && (
                <p id="terms-error" className="field-error">
                  {errors.terms.message}
                </p>
              )}
              <Turnstile
                siteKey={String(data.settings.turnstile_site_key || "")}
                resetKey={turnstileKey}
                onToken={(token) => setValue("token", token)}
              />
              <button className="button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Brand name="state-loading-static" />
                    Confirmando tu mesa…
                  </>
                ) : (
                  <>
                    Confirmar mi reserva
                    <Brand name="ui-forward" />
                  </>
                )}
              </button>
              <p className="booking-help">
                Tu horario se confirma al terminar este paso.
              </p>
            </>
          )}
        </form>
        <noscript>
          <p>
            Para reservar sin JavaScript, llama al{" "}
            <a href="tel:+523321583412">33 2158 3412</a>.
          </p>
        </noscript>
      </div>
    </main>
  );
}
