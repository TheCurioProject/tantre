"use client";
import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { usePathname } from "next/navigation";
import { usePublicData } from "./Providers";
import { Brand } from "./brand/Brand";
gsap.registerPlugin(ScrollTrigger, useGSAP);
export function Footer() {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      gsap.from(".footer-word", {
        yPercent: 28,
        rotation: -2,
        transformOrigin: "0% 100%",
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: { trigger: ref.current, start: "top 90%", once: true },
      });
    },
    { scope: ref },
  );
  const { data } = usePublicData();
  const contact = data.settings.contact as { instagram?: string } | undefined;
  if (pathname?.startsWith("/admin")) return null;
  return (
    <footer ref={ref} className="site-footer" style={{ 
      position: "relative",
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      padding: "6rem var(--gutter) 4rem",
      backgroundColor: "var(--beige)",
      borderTopLeftRadius: "50% 10%",
      borderTopRightRadius: "50% 10%",
      marginTop: "4rem"
    }}>
      <div className="footer-word" style={{ width: "100%", maxWidth: "150px", margin: "0 auto 3rem", display: "flex", justifyContent: "center" }}>
        <Brand name="brand-logo-cuadrado" className="brand-logo-footer" style={{ width: "100%", height: "auto" }} />
      </div>
      
      <div style={{ 
        display: "flex", 
        flexWrap: "wrap", 
        justifyContent: "center", 
        gap: "2rem", 
        fontSize: "1rem", 
        textTransform: "uppercase", 
        letterSpacing: "0.1em",
        fontFamily: "var(--font-inter)",
        fontWeight: 500,
        marginBottom: "2rem"
      }}>
        <a href="/privacidad/">Privacidad</a>
        <a href="/terminos/">Términos</a>
        <a
          href={`https://www.instagram.com/${contact?.instagram || "tantre_mx"}/`}
          target="_blank"
          rel="noreferrer"
        >
          Instagram
        </a>
      </div>
      
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", opacity: 0.5 }}>
        <span>© {new Date().getFullYear()} TANTRE · Guadalajara</span>
        <span>Hecho con las manos. Y con un poquito de caos.</span>
      </div>
    </footer>
  );
}
