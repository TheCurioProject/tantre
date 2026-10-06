import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "El catálogo",
  robots: { index: false, follow: true },
  alternates: { canonical: "/catalogo/" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
