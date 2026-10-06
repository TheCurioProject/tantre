import type { Metadata } from "next";
import { CancelReservation } from "@/components/reservations/CancelReservation";
export const metadata: Metadata = {
  title: "Tu reserva",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
  alternates: { canonical: "/reservar/cancelar/" },
};
export default function Page() {
  return <CancelReservation />;
}
