import type { Metadata, Viewport } from "next";
import "@fontsource/instrument-serif/latin-400.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "@/styles/fonts.css";
import "@/styles/globals.css";
import "@/styles/brand-motion.css";
import "@/styles/catalog.css";
import "@/styles/booking.css";
import "@/styles/admin.css";
import { Providers } from "@/components/Providers";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { TantreLoaderFramer } from "@/components/TantreLoaderFramer";
import { ErrorMonitor } from "@/components/ErrorMonitor";
import { Analytics } from "@/components/Analytics";
const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://tantre.mx";
export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title: {
    default: "TANTRE — Un café. Mil formas de crear.",
    template: "%s · TANTRE",
  },
  description:
    "Un espacio para bajar el ritmo, pintar cerámica y compartir un café en Guadalajara. Elige tu pieza, hazla tuya y reserva tu mesa en TANTRE.",
  alternates: { canonical: "/" },
  openGraph: {
    images: [
      {
        url: "/og-tantre.png",
        width: 1200,
        height: 630,
        alt: "TANTRE: cerámica, café y un poco de ti",
      },
    ],
    type: "website",
    locale: "es_MX",
    siteName: "TANTRE",
    title: "TANTRE — Un café. Mil formas de crear.",
    description: "Cerámica, café y un poco de ti. Guadalajara, México.",
  },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [
      { url: "/brand/logo/brand-favicon.svg", type: "image/svg+xml" },
      { url: "/brand/logo/brand-favicon-32.png", sizes: "32x32" },
    ],
    apple: "/brand/logo/brand-favicon-180.png",
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F5F0E8",
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX">
      <body>
        <Providers>
          <TantreLoaderFramer />
          <Nav />
          {children}
          <Footer />
          <Analytics />
          <ErrorMonitor />
        </Providers>
      </body>
    </html>
  );
}
