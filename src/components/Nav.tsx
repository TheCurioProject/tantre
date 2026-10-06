"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Brand } from "./brand/Brand";

gsap.registerPlugin(ScrollTrigger);
const links = [
  ["La experiencia", "/#experiencia"],
  ["Las piezas", "/#piezas"],
  ["Café & compañía", "/#cafe"],
  ["El catálogo", "/catalogo/"],
  ["Encuéntranos", "/#visitanos"],
];
export function Nav() {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    returnFocus = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!headerRef.current) return;
    
    // Performance improvement: Avoid React state updates on scroll.
    // Use GSAP ScrollTrigger to toggle classes directly on the DOM node.
    const heroHeight = window.innerHeight * 0.85;
    
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
  useEffect(() => {
    const el = dialog.current!;
    const links = el.querySelectorAll(".nav-link");
    const book = el.querySelector(".nav-book");
    gsap.killTweensOf([el, links, book]);
    if (open) {
      if (!el.open) el.showModal();
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      const timeline = gsap.timeline();
      timeline
        .set(el, {
          clipPath: "inset(0% 0% 100% 0%)",
          opacity: 1,
        })
        .to(el, {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 0.72,
          ease: "power4.inOut",
        })
        .fromTo(
          links,
          { yPercent: 115, rotation: -3, opacity: 0 },
          {
            yPercent: 0,
            rotation: 0,
            opacity: 1,
            duration: 0.62,
            stagger: 0.065,
            ease: "power3.out",
          },
          0.22,
        )
        .fromTo(
          book,
          { x: -28, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.5, ease: "power3.out" },
          0.48,
        );
      return () => timeline.kill();
    }
    if (!el.open) return;
    const timeline = gsap.timeline({
      onComplete: () => {
        el.close();
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
        gsap.set(el, { clearProps: "clipPath,opacity" });
        if (returnFocus.current) trigger.current?.focus();
        returnFocus.current = false;
      },
    });
    timeline
      .to(links, {
        yPercent: -45,
        opacity: 0,
        duration: 0.24,
        stagger: { each: 0.035, from: "end" },
        ease: "power2.in",
      })
      .to(
        el,
        {
          clipPath: "inset(0% 0% 100% 0%)",
          duration: 0.56,
          ease: "power4.inOut",
        },
        0.08,
      );
    return () => {
      timeline.kill();
    };
  }, [open]);
  const close = () => {
    returnFocus.current = true;
    setOpen(false);
  };
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
            aria-controls="site-menu"
            onClick={() => setOpen(true)}
          >
            <span>Menú</span>
            <Brand name="state-menu-dot-idle" />
          </button>
        </div>
      </header>
      <dialog
        ref={dialog}
        id="site-menu"
        className="nav-dialog"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        aria-label="Navegación principal"
      >
        <div className="nav-dialog-top">
          <Link className="wordmark" href="/" onClick={close} aria-label="TANTRE, inicio">
            <Brand name="brand-logo-lineal" className="brand-logo" />
          </Link>
          <button
            className="icon-button"
            onClick={close}
            aria-label="Cerrar menú"
          >
            <Brand name="ui-close" />
          </button>
        </div>
        <nav>
          {links.map(([title, href], i) => (
            <a key={href} className="nav-link" href={href} onClick={close}>
              <small>0{i + 1}</small>
              {title}
            </a>
          ))}
        </nav>
        <a href="/reservar/" className="nav-book" onClick={close}>
          Hagamos espacio para crear.
          <Brand name="doodle-flecha-larga" />
        </a>
        <p className="eyebrow">Una mesa, un café, infinitas posibilidades.</p>
      </dialog>
    </>
  );
}
