"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, AnimatePresence } from "framer-motion";
import { Brand } from "./brand/Brand";
import { CatalogModal } from "./catalog/CatalogModal";

gsap.registerPlugin(ScrollTrigger);
const MotionLink = motion.create(Link);

export function Nav() {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!headerRef.current) return;
    
    // Performance improvement: Avoid React state updates on scroll.
    // Use GSAP ScrollTrigger to toggle classes directly on the DOM node.
    const heroHeight = window.innerHeight * 0.85;
    
    if (open) {
      headerRef.current.classList.remove("hidden");
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        start: "top top",
        end: "max",
        onUpdate: (self) => {
          const currentScrollY = self.scroll();
          
          if (currentScrollY >= 50) {
            headerRef.current?.classList.add("scrolled");
          } else {
            headerRef.current?.classList.remove("scrolled");
          }

          if (currentScrollY > heroHeight && self.direction === 1 && !open) {
            headerRef.current?.classList.add("hidden");
          } else {
            headerRef.current?.classList.remove("hidden");
          }
        }
      });
    });

    return () => ctx.revert();
  }, [open]);
  const close = () => {
    setOpen(false);
  };
  if (pathname?.startsWith("/admin")) return null;
  return (
    <>
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>
      <header ref={headerRef} className="site-nav">
        <Link className="wordmark" href="/" aria-label="TANTRE, inicio">
          <Brand name="brand-logo-lineal" className="brand-logo" />
        </Link>
        <span className="nav-location">
          ARTE, CAFÉ Y UN POCO DE TI.
          <br />
          GUADALAJARA, MÉXICO
        </span>
        <div className="nav-actions">
          <Link href="/reservar/" className="nav-reserve">
            Reserva tu lugar
          </Link>
          <button
            ref={trigger}
            className="menu-trigger"
            aria-label="Abrir menú"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <span>Menú</span>
            <Brand name="state-menu-dot-idle" />
          </button>
        </div>
      </header>
      <CatalogModal isOpen={open} onClose={close} />
      <AnimatePresence>
        {!open && (
          <MotionLink 
            href="/reservar/" 
            className="mobile-sticky-reserve"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <span className="sticky-copy">Haz espacio para ti.</span>
            <span>
              Reservar
              <Brand name="ui-forward" />
            </span>
          </MotionLink>
        )}
      </AnimatePresence>
    </>
  );
}
