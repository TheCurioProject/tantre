import type { Metadata } from "next";
import { Legal } from "@/components/Legal";
export const metadata: Metadata = {
  title: "Términos",
  alternates: { canonical: "/terminos/" },
};
export default function Page() {
  return <Legal kind="terms" />;
}
