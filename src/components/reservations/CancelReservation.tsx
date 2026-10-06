"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { ReservationSummary } from "@/lib/types";
import { fullDate, time } from "@/lib/utils";
import { State } from "../brand/State";
import { Brand } from "../brand/Brand";
export function CancelReservation() {
  const credentialsRef = useRef<{ code: string; token: string } | null>(null);
  const [summary, setSummary] = useState<
      (ReservationSummary & { can_cancel: boolean }) | null
    >(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(true),
    [link, setLink] = useState({ code: "", token: "" });
  useEffect(() => {
    const params = new URLSearchParams(location.hash.slice(1));
    const credentials = credentialsRef.current || {
      code: params.get("code") || "",
      token: params.get("token") || "",
    };
    credentialsRef.current = credentials;
    let alive = true;
    setLink(credentials);
    history.replaceState({}, "", location.pathname);
    api<ReservationSummary & { can_cancel: boolean }>("/reservations/cancel", {
      method: "POST",
      body: JSON.stringify({ ...credentials, confirm: false }),
    })
      .then((value) => {
        if (alive) setSummary(value);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setBusy(false);
      });
    return () => {
      alive = false;
    };
  }, []);
  async function cancel() {
    setBusy(true);
    setError("");
    try {
      setSummary(
        await api("/reservations/cancel", {
          method: "POST",
          body: JSON.stringify({ ...link, confirm: true }),
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cancelar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="main" className="simple-page">
      <p className="eyebrow">TU RESERVA TANTRE</p>
      <h1>
        {summary?.status === "cancelled"
          ? "Nos vemos en otra ocasión."
          : "A veces cambian los planes."}
      </h1>
      {busy && !summary ? (
        <State kind="loading-static" title="Consultando tu reserva…" />
      ) : error && !summary ? (
        <State title="No pudimos abrir la reserva.">{error}</State>
      ) : (
        summary && (
          <>
            <p>
              {fullDate(summary.starts_at)} · {time(summary.starts_at)} ·{" "}
              {summary.party_size} personas
            </p>
            <p>Código {summary.public_code}</p>
            {summary.status === "cancelled" ? (
              <State kind="success" title="Reserva cancelada.">
                Tu espacio ya quedó disponible. Gracias por avisarnos.
              </State>
            ) : summary.can_cancel ? (
              <>
                <p>
                  Al confirmar, liberaremos tu mesa. Esta acción no se puede
                  deshacer.
                </p>
                <button className="button" onClick={cancel} disabled={busy}>
                  Confirmar cancelación
                  <Brand name="ui-forward" />
                </button>
              </>
            ) : (
              <p>Para cambiar esta reserva, contáctanos directamente.</p>
            )}
            {error && <p role="alert">{error}</p>}
          </>
        )
      )}
      <p>
        <a className="text-link" href="tel:+523321583412">
          Hablar con TANTRE
          <Brand name="ui-phone" />
        </a>
      </p>
    </main>
  );
}
