"use client";
import { useEffect } from "react";
import { apiBase } from "@/lib/api";
import { usePublicData } from "./Providers";
export function ErrorMonitor() {
  const { data } = usePublicData();
  useEffect(() => {
    if (!data.settings.monitoring_enabled) return;
    let count = 0;
    const send = (kind: "runtime" | "promise") => {
      if (count++ >= 3) return;
      fetch(`${apiBase}/api/errors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, path: location.pathname }),
        keepalive: true,
      }).catch(() => {});
    };
    const error = () => send("runtime"),
      rejection = () => send("promise");
    window.addEventListener("error", error);
    window.addEventListener("unhandledrejection", rejection);
    return () => {
      window.removeEventListener("error", error);
      window.removeEventListener("unhandledrejection", rejection);
    };
  }, [data.settings.monitoring_enabled]);
  return null;
}
