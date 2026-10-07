import type { Metadata } from "next";
import { AdminApp } from "@/components/admin/AdminApp";

export const metadata: Metadata = {
  title: "El estudio",
  robots: { index: false, follow: false },
  alternates: { canonical: "/admin/" },
};

export function generateStaticParams() {
  return [
    { path: [] },
    { path: ["catalog"] },
    { path: ["faqs"] },
    { path: ["packages"] },
    { path: ["settings"] },
  ];
}

export default async function Page({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const resolvedParams = await params;
  return <AdminApp path={resolvedParams.path || []} />;
}
