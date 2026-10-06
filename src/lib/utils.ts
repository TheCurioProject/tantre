export const money = (cents: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: cents % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
export const time = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
export const fullDate = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
export function localDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function catalogAllowed(width: number, coarse: boolean) {
  return width <= 1024 || (width <= 1440 && coarse);
}
export function itemLink(type: string, slug: string) {
  return `/catalogo/${type === "ceramic" ? "piezas" : "cafe"}/?item=${encodeURIComponent(slug)}`;
}
export function availabilityLabel(
  status: string,
  updated: string | undefined,
  freshHours = 6,
) {
  if (status === "unavailable") return "Por ahora no disponible";
  if (status === "seasonal") return "De temporada";
  if (status === "low_stock") return "Pocas piezas · consulta en tu visita";
  if (
    updated &&
    Date.now() - new Date(updated).getTime() < freshHours * 3600000
  )
    return "Disponible hoy";
  return "Consulta disponibilidad al llegar";
}

export function paintMask(asset: string) {
  return [
    "ceramic-plato-llano",
    "ceramic-platito-corazon",
    "ceramic-charola-oval",
  ].includes(asset)
    ? `/brand/derived/${asset}-surface.svg`
    : `/brand/ceramics/${asset}-mask.svg`;
}
