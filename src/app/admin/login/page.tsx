import type { Metadata } from "next";
import { AdminApp } from "@/components/admin/AdminApp";
export const metadata: Metadata = {
  title: "Acceso al estudio",
  robots: { index: false, follow: false },
  alternates: { canonical: "/admin/login/" },
};
export default function Page() {
  return <AdminApp />;
}
