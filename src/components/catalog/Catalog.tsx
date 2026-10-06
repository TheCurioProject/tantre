"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { usePublicData, useToast } from "../Providers";
import { Brand } from "../brand/Brand";
import { State } from "../brand/State";
import { DesktopCatalogGate } from "./DesktopCatalogGate";
import type { CatalogItem, Universe } from "@/lib/types";
import {
  catalogAllowed,
  money,
  availabilityLabel,
  itemLink,
  paintMask,
} from "@/lib/utils";
import { MediaImage } from "../MediaImage";
import { track } from "../Analytics";
gsap.registerPlugin(Flip);
const favoriteKey = "tantre:favorites:v1";
function Art({ item }: { item: CatalogItem }) {
  const image = item.catalog_media
    ?.slice()
    .sort((a, b) => a.sort_order - b.sort_order)[0];
  return image ? (
    <MediaImage
      path={image.storage_path}
      alt={image.alt}
      width={image.width}
      height={image.height}
    />
  ) : (
    <Brand name={item.asset} />
  );
}
export function Catalog({
  initialType = "ceramic",
  favoritesOnly = false,
}: {
  initialType?: Universe;
  favoritesOnly?: boolean;
}) {
  const { data, loading, error, reload } = usePublicData(),
    toast = useToast();
  const [device, setDevice] = useState<"pending" | "touch" | "desktop">(
      "pending",
    ),
    [type, setType] = useState<Universe>(initialType),
    [category, setCategory] = useState("all"),
    [query, setQuery] = useState(""),
    [sort, setSort] = useState("curated");
  const [favorites, setFavorites] = useState<string[]>([]),
    [selected, setSelected] = useState<CatalogItem | null>(null),
    [deepItem, setDeepItem] = useState(""),
    [color, setColor] = useState(""),
    [flipped, setFlipped] = useState<string[]>([]);
  const sheet = useRef<HTMLDialogElement>(null),
    origin = useRef<HTMLElement | null>(null),
    touchStart = useRef(0);
  useEffect(() => {
    const media = matchMedia("(pointer: coarse)");
    const update = () =>
      setDevice(
        catalogAllowed(window.innerWidth, media.matches) ? "touch" : "desktop",
      );
    update();
    window.addEventListener("resize", update);
    media.addEventListener("change", update);
    return () => {
      window.removeEventListener("resize", update);
      media.removeEventListener("change", update);
    };
  }, []);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(favoriteKey) || "[]");
      if (Array.isArray(stored))
        setFavorites(stored.filter((x) => typeof x === "string").slice(0, 100));
      if (
        location.pathname === "/catalogo/" &&
        sessionStorage.getItem("tantre:universe") === "cafe"
      )
        setType("cafe");
    } catch {}
    const read = () =>
      setDeepItem(new URLSearchParams(location.search).get("item") || "");
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);
  useEffect(() => {
    if (device === "touch") {
      track("catalog_open", {
        type,
        source: new URLSearchParams(location.search).get("source") || "site",
      });
      try {
        sessionStorage.setItem("tantre:universe", type);
      } catch {}
    }
  }, [device, type]);
  useEffect(() => {
    setSelected(
      device === "touch" && deepItem
        ? data.catalog.find(
            (i) => i.slug === deepItem && (favoritesOnly || i.type === type),
          ) || null
        : null,
    );
  }, [deepItem, data.catalog, device, type, favoritesOnly]);
  useEffect(() => {
    if (!flipped.length) return;
    const cards = document.querySelectorAll(".catalog-card .card-story");
    const context = gsap.context(() => {
      gsap.fromTo(
        cards,
        { rotationY: -70 },
        { rotationY: 0, duration: 0.42, ease: "power2.out" },
      );
    });
    return () => context.revert();
  }, [flipped]);
  const close = useCallback(() => {
    const finish = () => {
      const u = new URL(location.href);
      u.searchParams.delete("item");
      history.replaceState({}, "", u);
      sheet.current?.close();
      setDeepItem("");
      setSelected(null);
      setColor("");
      origin.current?.focus();
    };
    const art = sheet.current?.querySelector(".detail-art");
    const target = origin.current?.querySelector(".catalog-art");
    if (art && target) {
      const fit = Flip.fit(art, target, { getVars: true });
      gsap.to(art, {
        ...fit,
        duration: 0.3,
        ease: "power2.inOut",
        onComplete: finish,
      });
    } else finish();
  }, []);
  useEffect(() => {
    const dialog = sheet.current;
    if (!dialog) return;
    if (!selected) {
      dialog.close();
      return;
    }
    dialog.showModal();
    document.body.style.overflow = "hidden";
    const image = dialog.querySelector(".detail-art");
    if (image) {
      const source = origin.current?.querySelector(".catalog-art");
      if (source) {
        const fit = Flip.fit(image, source, { getVars: true });
        gsap.from(image, { ...fit, duration: 0.6, ease: "power3.inOut" });
      } else gsap.from(image, { y: 35, rotation: -2, duration: 0.6 });
    }
    const timer = setTimeout(
      () =>
        track("catalog_item_view", {
          item_id: selected.id,
          category: selected.category_id,
        }),
      500,
    );
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "";
      if (image) gsap.killTweensOf(image);
    };
  }, [selected]);
  function open(item: CatalogItem, element: HTMLElement) {
    origin.current = element;
    const u = new URL(location.href);
    u.searchParams.set("item", item.slug);
    history.pushState({}, "", u);
    setDeepItem(item.slug);
    setSelected(item);
    setColor("");
  }
  function toggle(item: CatalogItem) {
    const exists = favorites.includes(item.id);
    if (
      !exists &&
      item.type === "cafe" &&
      data.catalog.filter((i) => i.type === "cafe" && favorites.includes(i.id))
        .length >= 8
    ) {
      toast("Puedes guardar hasta 8 opciones de café y snacks.", true);
      return;
    }
    const next = exists
      ? favorites.filter((id) => id !== item.id)
      : [...favorites, item.id];
    try {
      localStorage.setItem(favoriteKey, JSON.stringify(next));
      setFavorites(next);
      toast(exists ? "Retirado de tus favoritos" : "Guardado para inspirarte");
      if (!exists) track("favorite_add", { item_id: item.id });
    } catch {
      toast("Este navegador no pudo guardar tus favoritos.", true);
    }
  }
  async function share(item: CatalogItem) {
    const url = new URL(itemLink(item.type, item.slug), location.origin).href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${item.name} · TANTRE`, url });
        track("share_item", { item_id: item.id, method: "native" });
      } else {
        await navigator.clipboard.writeText(url);
        toast("Enlace copiado");
        track("share_item", { item_id: item.id, method: "copy" });
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError"))
        toast("No pudimos compartir. Copia el enlace del navegador.", true);
    }
  }
  const items = data.catalog
    .filter(
      (i) =>
        (favoritesOnly ? favorites.includes(i.id) : i.type === type) &&
        (category === "all" || i.category_id === category) &&
        `${i.name} ${i.short_desc}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "low"
        ? a.price_cents - b.price_cents
        : sort === "high"
          ? b.price_cents - a.price_cents
          : a.sort_order - b.sort_order,
    );
  if (device === "desktop")
    return (
      <main id="main">
        <DesktopCatalogGate type={type} item={deepItem} />
      </main>
    );
  if (device === "pending")
    return (
      <main id="main" className="catalog-pending">
        <Brand name="state-loading-static" />
        <h1>Abre un mundo de posibilidades.</h1>
        <p>Una experiencia para tu teléfono o tableta.</p>
        <noscript>
          <p>
            Activa JavaScript para explorar el catálogo táctil. También puedes{" "}
            <a href="/reservar/">reservar tu visita</a>.
          </p>
        </noscript>
      </main>
    );
  return (
    <main id="main" className="catalog-page">
      <header className="catalog-heading">
        <a href="/" className="catalog-back" aria-label="Volver al inicio">
          <Brand name="ui-back" />
        </a>
        <span className="eyebrow">ELIGE CON LAS MANOS.</span>
        <a
          className="catalog-favorite"
          href={favoritesOnly ? "/catalogo/" : "/catalogo/favoritos/"}
          aria-label={
            favoritesOnly
              ? "Volver al catálogo"
              : `Mis favoritos, ${favorites.length}`
          }
        >
          <Brand name={favoritesOnly ? "ui-back" : "ui-favorite-outline"} />
          <span>{favorites.length}</span>
        </a>
      </header>
      <div className="catalog-title">
        <p className="eyebrow">EL CATÁLOGO TANTRE</p>
        <h1>
          {favoritesOnly ? (
            <>
              Tus pequeñas
              <br />
              <em>posibilidades.</em>
            </>
          ) : type === "ceramic" ? (
            <>
              Una forma.
              <br />
              <em>Mil posibilidades.</em>
            </>
          ) : (
            <>
              Un sorbo.
              <br />
              <em>Una buena pausa.</em>
            </>
          )}
        </h1>
        <Brand
          name={
            favoritesOnly
              ? "line-11-corazon"
              : type === "ceramic"
                ? "line-08-plato"
                : "line-05-vapor"
          }
        />
      </div>
      {!favoritesOnly && (
        <div
          className="universe-switch"
          role="group"
          aria-label="Universo del catálogo"
        >
          <button
            aria-pressed={type === "ceramic"}
            onClick={() => {
              setType("ceramic");
              setCategory("all");
              close();
            }}
          >
            Piezas de cerámica
          </button>
          <button
            aria-pressed={type === "cafe"}
            onClick={() => {
              setType("cafe");
              setCategory("all");
              close();
            }}
          >
            Café & snacks
          </button>
        </div>
      )}
      <div className="catalog-tools">
        <label className="search-field">
          <Brand name="ui-search" />
          <span className="sr-only">Buscar en el catálogo</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Encuentra algo tuyo"
            type="search"
          />
        </label>
        <label className="sort-field">
          <span className="sr-only">Orden del catálogo</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="curated">Selección TANTRE</option>
            <option value="low">Menor precio</option>
            <option value="high">Mayor precio</option>
          </select>
        </label>
      </div>
      <div className="category-chips" role="group" aria-label="Categorías">
        <button
          aria-pressed={category === "all"}
          onClick={() => setCategory("all")}
        >
          Todo
        </button>
        {data.categories
          .filter((c) => favoritesOnly || c.type === type)
          .map((c) => (
            <button
              key={c.id}
              aria-pressed={category === c.id}
              onClick={() => setCategory(c.id)}
            >
              {c.title}
            </button>
          ))}
      </div>
      {loading ? (
        <div
          className="catalog-loading"
          role="status"
          aria-label="Cargando catálogo"
        >
          {[1, 2, 3, 4].map((n) => (
            <div key={n}>
              <Brand name="mask-paint-04" />
            </div>
          ))}
        </div>
      ) : error ? (
        <State
          kind="offline"
          title="Hagamos una pequeña pausa."
          onRetry={reload}
        >
          {error}
        </State>
      ) : items.length === 0 ? (
        <State
          kind={favoritesOnly ? "empty-favoritos" : "sin-resultados"}
          title={
            favoritesOnly
              ? "Tu siguiente favorito está por llegar."
              : query || category !== "all"
                ? "No encontramos esa combinación."
                : deepItem
                  ? "Esta pieza ya no está publicada."
                  : "Estamos preparando nuevas posibilidades."
          }
        >
          {favoritesOnly
            ? "Toca el corazón de una pieza o bebida para guardarla aquí."
            : query || category !== "all"
              ? "Prueba otra categoría o busca algo diferente."
              : "Descubre las piezas disponibles en tu visita. Escríbenos si buscas algo especial."}
        </State>
      ) : (
        <div className="catalog-grid">
          {items.map((item, i) => (
            <article
              key={item.id}
              className={`catalog-card tint-${i % 4}`}
              onTouchStart={(e) => {
                touchStart.current = e.touches[0].clientX;
              }}
              onTouchEnd={(e) => {
                if (
                  item.type === "cafe" &&
                  Math.abs(e.changedTouches[0].clientX - touchStart.current) >
                    55
                )
                  setFlipped((v) =>
                    v.includes(item.id)
                      ? v.filter((id) => id !== item.id)
                      : [...v, item.id],
                  );
              }}
            >
              <button
                className="card-open"
                onClick={(e) => open(item, e.currentTarget)}
                aria-label={`Ver ${item.name}`}
              >
                <div className="catalog-art">
                  {flipped.includes(item.id) ? (
                    <p className="card-story">{item.short_desc}</p>
                  ) : (
                    <Art item={item} />
                  )}
                </div>
                <div className="card-caption">
                  <h2>{item.name}</h2>
                  <span>{money(item.price_cents)}</span>
                </div>
              </button>
              <p className="card-status">
                {availabilityLabel(
                  item.status,
                  item.availability_updated_at,
                  Number(data.settings.availability_freshness_hours) || 6,
                )}
              </p>
              {item.cafe_meta?.allergens?.length ? (
                <p className="card-allergens">
                  Contiene: {item.cafe_meta.allergens.join(", ")}
                </p>
              ) : null}
              <div className="card-bottom">
                <button
                  className="favorite-button"
                  aria-pressed={favorites.includes(item.id)}
                  aria-label={`${favorites.includes(item.id) ? "Quitar" : "Guardar"} ${item.name}`}
                  onClick={() => toggle(item)}
                >
                  <Brand
                    name={
                      favorites.includes(item.id)
                        ? "ui-favorite-filled"
                        : "ui-favorite-outline"
                    }
                  />
                </button>
                {item.type === "cafe" && (
                  <button
                    className="card-turn"
                    onClick={() =>
                      setFlipped((v) =>
                        v.includes(item.id)
                          ? v.filter((id) => id !== item.id)
                          : [...v, item.id],
                      )
                    }
                  >
                    Dale la vuelta
                  </button>
                )}
                <span>{String(i + 1).padStart(2, "0")}</span>
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="catalog-bottom-note">
        <Brand name="line-06-pincel" />
        <p>
          {type === "cafe"
            ? "Guarda lo que se te antoje. Pídelo cuando llegues."
            : "Guardar una pieza es una forma de inspirarte. No aparta inventario."}
        </p>
      </div>
      <a href="/reservar/" className="mobile-sticky-reserve">
        Una mesa para crear
        <span>
          Reservar
          <Brand name="ui-forward" />
        </span>
      </a>
      <dialog
        ref={sheet}
        className="catalog-sheet"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        aria-labelledby="detail-title"
      >
        {selected && (
          <>
            <div className="sheet-top">
              <span className="eyebrow">UN POQUITO MÁS CERCA</span>
              <button
                className="icon-button"
                aria-label="Cerrar ficha"
                onClick={close}
              >
                <Brand name="ui-close" />
              </button>
            </div>
            <div className="detail-art">
              {color && selected.type === "ceramic" ? (
                <div className="colored-piece">
                  <div
                    className="piece-color-surface"
                    style={{
                      background: color,
                      maskImage: `url(${paintMask(selected.asset)})`,
                    }}
                  />
                  <Brand name={selected.asset} />
                </div>
              ) : (
                <Art item={selected} />
              )}
            </div>
            <div className="detail-content">
              <div className="detail-name">
                <h2 id="detail-title">{selected.name}</h2>
                <span>{money(selected.price_cents)}</span>
              </div>
              <p className="detail-status">
                {availabilityLabel(
                  selected.status,
                  selected.availability_updated_at,
                )}
              </p>
              <p>{selected.long_desc || selected.short_desc}</p>
              {selected.ceramic_meta && (
                <dl>
                  <div>
                    <dt>Dimensiones</dt>
                    <dd>
                      {selected.ceramic_meta.dimensions ||
                        "Consúltalas en tu visita"}
                    </dd>
                  </div>
                  {selected.ceramic_meta.difficulty && (
                    <div>
                      <dt>Dificultad</dt>
                      <dd>{selected.ceramic_meta.difficulty}</dd>
                    </div>
                  )}
                  {selected.ceramic_meta.estimated_minutes && (
                    <div>
                      <dt>Tiempo estimado</dt>
                      <dd>{selected.ceramic_meta.estimated_minutes} min</dd>
                    </div>
                  )}
                </dl>
              )}
              {selected.cafe_meta && (
                <div className="dietary-info">
                  <p>
                    {selected.cafe_meta.temperature}
                    {selected.cafe_meta.caffeine ? " · Contiene cafeína" : ""}
                  </p>
                  <p>{selected.cafe_meta.dietary_tags.join(" · ")}</p>
                  <p>
                    <strong>Alérgenos:</strong>{" "}
                    {selected.cafe_meta.allergens.length
                      ? selected.cafe_meta.allergens.join(", ")
                      : "Consulta al equipo antes de pedir."}
                  </p>
                  {selected.cafe_meta.alcohol_note && (
                    <p>{selected.cafe_meta.alcohol_note}</p>
                  )}
                </div>
              )}
              {selected.type === "ceramic" && (
                <div className="detail-palette">
                  <span>Imagínala en otro color</span>
                  {[
                    { v: "#F5F0E8", n: "Cerámica" },
                    { v: "#ecc7da", n: "Rosa" },
                    { v: "#d5cbed", n: "Lavanda" },
                    { v: "#c4dbcb", n: "Menta" },
                  ].map((c) => (
                    <button
                      key={c.v}
                      style={{ backgroundColor: c.v }}
                      aria-label={c.n}
                      aria-pressed={color === c.v}
                      onClick={() => {
                        setColor(c.v);
                        track("piece_color_try", {
                          item_id: selected.id,
                          color_token: c.n,
                        });
                      }}
                    />
                  ))}
                </div>
              )}
              {selected.catalog_media && selected.catalog_media.length > 1 && (
                <div className="detail-gallery">
                  {selected.catalog_media.slice(1).map((m) => (
                    <MediaImage
                      key={m.id}
                      path={m.storage_path}
                      alt={m.alt}
                      width={m.width}
                      height={m.height}
                      sizes="(max-width: 650px) 80vw, 520px"
                    />
                  ))}
                </div>
              )}
              <div className="detail-actions">
                <button
                  className="button light"
                  onClick={() => toggle(selected)}
                >
                  <Brand
                    name={
                      favorites.includes(selected.id)
                        ? "ui-favorite-filled"
                        : "ui-favorite-outline"
                    }
                  />
                  {favorites.includes(selected.id) ? "Guardado" : "Guardar"}
                </button>
                <button
                  className="icon-button"
                  aria-label="Compartir pieza"
                  onClick={() => share(selected)}
                >
                  <Brand name="ui-share" />
                </button>
              </div>
              <a href="/reservar/" className="button">
                Reserva una mesa
                <Brand name="ui-forward" />
              </a>
              <p className="detail-note">
                Prueba de color ilustrativa. Tu selección no aparta piezas.
              </p>
            </div>
          </>
        )}
      </dialog>
    </main>
  );
}
