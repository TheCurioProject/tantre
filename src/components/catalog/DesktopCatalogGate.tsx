"use client";
import { useEffect, useState } from "react";
import { Brand } from "../brand/Brand";
import { ChapterMotion } from "../motion/ChapterMotion";
import { useToast, usePublicData } from "../Providers";
import { track } from "../Analytics";
export function DesktopCatalogGate({
  type,
  item,
}: {
  type?: string;
  item?: string;
}) {
  const [url, setUrl] = useState(""),
    [qr, setQr] = useState(""),
    [failed, setFailed] = useState(false);
  const toast = useToast();
  const { data } = usePublicData();
  useEffect(() => {
    const u = new URL(String(data.settings.site_url || window.location.origin));
    u.pathname =
      type === "cafe"
        ? "/catalogo/cafe/"
        : type === "ceramic"
          ? "/catalogo/piezas/"
          : "/catalogo/";
    u.hash = "";
    u.search = "";
    u.searchParams.set("source", "desktop-qr");
    if (item) u.searchParams.set("item", item);
    setUrl(u.href);
    track("qr_gate_view", { source: "desktop" });
  }, [data.settings.site_url, type, item]);
  useEffect(() => {
    if (!url) return;
    let alive = true;
    setFailed(false);
    import("qrcode")
      .then((module) =>
        module.toString(url, {
          type: "svg",
          errorCorrectionLevel: "M",
          margin: 4,
          width: 512,
          color: { dark: "#181716", light: "#FFFDF8" },
        }),
      )
      .then((svg) => {
        if (alive)
          setQr(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [url]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast("Enlace copiado");
      track("qr_link_copy", { source: "desktop" });
    } catch {
      toast("Selecciona el enlace que aparece bajo el código.", true);
    }
  }
  return (
    <ChapterMotion className="catalog-gate">
      <div className="gate-copy">
        <p className="eyebrow">UN CATÁLOGO HECHO PARA TOCAR</p>
        <h1>
          Este catálogo
          <br />
          se disfruta
          <br />
          <em>con las manos.</em>
        </h1>
        <p>
          Desliza, descubre y encuentra tu próxima pieza.
          <br />
          Escanea el código con tu teléfono o tableta
          <br />y sigue creando desde ahí.
        </p>
        <a href="/" className="text-link">
          Volver al lienzo
          <Brand name="ui-back" />
        </a>
        <Brand name="line-03-flecha-curva" className="gate-arrow" data-draw />
      </div>
      <div className="gate-composition">
        <Brand name="illus-qr-devices" className="gate-devices" data-place />
        <div className="qr-paper" data-place>
          <span className="eyebrow">TU PRÓXIMA IDEA ESTÁ AQUÍ</span>
          <div className="qr-frame">
            <Brand name="illus-qr-frame-light" />
            {!failed && qr ? (
              <img
                src={qr}
                width="512"
                height="512"
                alt="Código QR para abrir el catálogo Tantre en móvil o tableta"
                onError={() => setFailed(true)}
              />
            ) : failed ? (
              <p>
                Abre el enlace de abajo
                <br />
                desde tu teléfono.
              </p>
            ) : (
              <p role="status">Preparando tu código…</p>
            )}
          </div>
          <button className="text-link" onClick={copy}>
            Copiar enlace
            <Brand name="ui-share" />
          </button>
          <a className="qr-url" href={url || "/catalogo/"}>
            {url ? url.replace(/^https?:\/\//, "") : "tantre.mx/catalogo"}
          </a>
        </div>
        <span className="gate-note">
          Hecho para explorar.
          <br />
          <em>Sin prisas.</em>
        </span>
      </div>
    </ChapterMotion>
  );
}
