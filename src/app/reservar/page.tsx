import type { Metadata } from "next";
import { BookingFlow } from "@/components/reservations/BookingFlow";
export const metadata: Metadata = {
  title: "Reserva tu mesa",
  alternates: { canonical: "/reservar/" },
};
export default function Page() {
  return <BookingFlow />;
}
