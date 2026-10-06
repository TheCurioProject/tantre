import type { Metadata } from "next";
import { Legal } from "@/components/Legal";
export const metadata: Metadata = {
  title: "Privacidad",
  alternates: { canonical: "/privacidad/" },
};
export default function Page() {
  return <Legal kind="privacy" />;
}
