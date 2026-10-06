"use client";
import { useEffect, useState } from "react";
import { apiBase } from "@/lib/api";
import { usePublicData } from "./Providers";
const allowed = new Set([
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
]);
export function track(
  event: string,
  properties: Record<string, string | number | boolean> = {},
) {
  if (!allowed.has(event)) return;
  try {
    if (localStorage.getItem("tantre:analytics") !== "yes") return;
  } catch {
    return;
  }
  const keys = [
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
  const clean = Object.fromEntries(
    Object.entries(properties).filter(([k]) => keys.includes(k)),
  );
  let distinct_id: string;
  try {
    distinct_id =
      sessionStorage.getItem("tantre:session") || crypto.randomUUID();
    sessionStorage.setItem("tantre:session", distinct_id);
  } catch {
    return;
  }
  fetch(`${apiBase}/api/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ distinct_id, event, properties: clean }),
    keepalive: true,
  }).catch(() => {});
}
export function Analytics() {
  const [choice, setChoice] = useState<string | null>("pending");
  const { data } = usePublicData();
  useEffect(() => {
    try {
      setChoice(localStorage.getItem("tantre:analytics"));
    } catch {
      setChoice("no");
    }
  }, []);
  useEffect(() => {
    if (choice !== "yes" || !data.settings.analytics_enabled) return;
    let active = true;
    import("web-vitals").then(({ onCLS, onINP, onLCP }) => {
      const report = ({
        name,
        value,
        rating,
      }: {
        name: string;
        value: number;
        rating: string;
      }) => {
        if (active) track("web_vital", { name, value, rating });
      };
      onCLS(report);
      onINP(report);
      onLCP(report);
    });
    return () => {
      active = false;
    };
  }, [choice, data.settings.analytics_enabled]);
  if (choice !== null || !data.settings.analytics_enabled) return null;
  const choose = (value: string) => {
    try {
      localStorage.setItem("tantre:analytics", value);
    } catch {}
    setChoice(value);
  };
  return (
    <aside className="consent" aria-label="Preferencia de medición">
      <p>
        ¿Nos ayudas a mejorar este espacio? Podemos medir interacciones sin
        incluir tus datos de reserva.
      </p>
      <div>
        <button onClick={() => choose("no")}>Solo lo necesario</button>
        <button onClick={() => choose("yes")}>Aceptar medición</button>
        <a href="/privacidad/">Ver privacidad</a>
      </div>
    </aside>
  );
}
