import type { Metadata } from "next";
import { AdminApp } from "@/components/admin/AdminApp";
export const metadata: Metadata = {
  title: "El estudio",
  robots: { index: false, follow: false },
  alternates: { canonical: "/admin/" },
};
export default function Page() {
  return <AdminApp />;
}
