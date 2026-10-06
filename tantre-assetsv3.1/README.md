# TANTRE · Assets Personalizados v3.1 — "Bold & Flat" (versión definitiva)

Paquete completo de assets propios para la experiencia digital TANTRE (café de
pintura de cerámica, Guadalajara). **Versión 3.1**: ronda final de pulido
visual centrada en **jerarquía visual y posición de cada elemento según su
contexto**. 174 SVG programáticos + PNGs de soporte, moodboard, manifiesto
técnico y hojas de QA.

**Regla no negociable cumplida:** ningún asset proviene de Lucide, Heroicons,
Font Awesome, Material Symbols, Phosphor, Noun Project, Freepik, Canva ni packs
de doodles. Cada path fue construido específicamente para el universo Tantre.

---

## 0.1. Qué cambió en v3.1 (versión definitiva — feedback del cliente)

1. **Jerarquía de capas (z-order) revisada en TODO el sistema**: rellenos y
   líneas de color quedan DEBAJO de los contornos; los objetos que pasan por
   delante de un contenedor usan arcos frontales redibujados (popote, crema
   batida, bola de affogato, taza sumergida en esmalte).
2. **Asas de taza/jarra re-posicionadas**: el anillo del asa ahora vive FUERA
   del cuerpo (solo las puntas quedan enterradas en la pared) y se dibuja
   DETRÁS del cuerpo — ya no parece una "C" pegada encima de la taza.
3. **Vapor anclado**: todas las hebras de vapor arrancan a ~9px del aro
   (favicon/PWA incluidos, antes flotaban una altura de taza por encima).
4. **Canela re-colocada**: los palitos están ACOSTADOS sobre la superficie de
   la bebida, completamente dentro de la boca del recipiente (antes cruzaban
   el aro y el asa).
5. **Etiqueta de té tendida sobre el frente de la taza** (antes caía encima
   del asa).
6. **Pincel rediseñado**: mango largo, virola metálica con crimpes y cerdas
   con punta (más pintura del color de la escena) — en PROC-02, ILL-01 y
   LL-06.
7. **Hielo legible**: trazo del cubito reducido (el grosor anterior se comía
   el relleno) y cubitos repartidos en el líquido.
8. **Affogato re-encuadrado**: vaso postre alto, espresso casi al borde y
   bola de nieve asomando 49px por encima del aro, semihundida.
9. **Cerámicas SIN FONDO**: se elimina el blob de color detrás de las 10
   piezas (catálogo sobre transparente); viewBox recortado a la pieza
   (ilustración y máscara por igual).

---
---

## 0. Qué cambió en v2.0 → v3.0 (dirección de arte)

La v1 usaba monolinea fina "temblorosa" (2.5% ±8%). La v2 adopta el lenguaje de
**tantre.mx** (verificado contra las capturas del sitio):

| Aspecto | v1 | v2 (Bold & Flat) |
|---|---|---|
| Trazo | 2.5%, variación ±8% | **3.8% uniforme**, round cap/join |
| Rellenos | solo líneas (hueco) | **rellenos planos** (crema + colores de marca) |
| Fondo | transparente puro | blobs orgánicos suaves como escena |
| Geometría | wobble pesado | **limpia y segura**, toque humano mínimo |
| Detalle | muchas líneas | detalle mínimo, siluetas legibles |

Paleta implementada: ink `#1A1817` · fucsia `#E0519E` · esmeralda `#3EB878` ·
periwingo `#5B7BD8` · lavanda `#8E7BD8` · crema `#FDF6EC` · durazno `#F9E7D2` ·
más líquidos por sabor (espresso, matcha, taro, frutos rojos…). Tabla completa
en `specs.json → adn_grafico.tokens`.

---

## 1. Estructura

```
tantre-assets/
├── README.md                  ← este archivo
├── specs.json                 ← manifiesto: 174 assets (función, sección,
│                                 viewBox, stroke, prioridad, tokens)
├── public/brand/              ← capa pública (bundle listo para el sitio)
│   ├── logo/                  ← favicon (svg + 16/32/180/512 png), PWA icon
│   ├── living-line/           ← line-01…line-14 (morph targets, 1 path c/u)
│   ├── ui/                    ← 20 iconos 48×48 currentColor (incluye variantes)
│   ├── ceramics/              ← 10 piezas 512×512 + 10 siluetas -mask
│   ├── cafe/                  ← 10 ilustraciones de café/snack 512×512
│   ├── process/               ← 6 pasos del flujo (elegir→recoger)
│   ├── doodles/               ← 8 acentos 120×120
│   ├── masks/                 ← 6 máscaras + preview/ (PNG)
│   ├── states/                ← 12 estados del sistema
│   ├── qr/                    ← 4 escenas de escaneo QR
│   ├── illus/                 ← 6 ilustraciones editoriales 800×600
│   ├── lettering/             ← 5 frases manuscritas (single-stroke)
│   ├── menu/                  ← ★ 42 ilustraciones por ítem del menú
│   │     menu-hot-*           (12 calientes)
│   │     menu-cold-*          (12 frías)
│   │     menu-snack-*         (5 snacks)
│   │     menu-esp-*           (6 especiales)
│   │     menu-drink-*         (3 drinks)
│   │     menu-extra-*         (4 extras)
│   └── menu-deco/             ← ★ 17 decoraciones del menú
│         deco-blob-*          (4 blobs de sección por color)
│         deco-vapor / granos / sparkles / flecha / corazon-mini
│         deco-divisor-onda / divisor-puntos
│         deco-rincon-flores
│         deco-tag-alcohol / vegano / cafe / sin-gluten / sin-azucar
├── design-source/svg-masters/ ← másteres de origen + photo-selects
├── references/                ← 59 fotos de referencia + NOTAS-REFERENCIAS.md
└── preview/                   ← hojas de contacto QA por categoría
```

---

## 2. Uso rápido

### Recolor de iconos (living-line, ui, doodles de trazo, estados compactos)
Los iconos usan `currentColor`:

```css
.icon { color: #1A1817; }          /* tinta por defecto */
.icon--on-pink { color: #FDF6EC; } /* crema sobre fucsia */
```

### Ilustraciones de menú
Cada ítem trae su blob de fondo incluido (es parte del dibujo, como en
tantre.mx). Si prefieres versión "limpia" para tarjetas pequeñas, el blob es el
primer `<path>` del SVG — puede ocultarse por CSS/JS o eliminarse del archivo.

```html
<img src="/brand/menu/menu-cold-taro.svg" alt="Taro frío">
```

### Animaciones
- **Living Line**: 1 solo `<path>` por archivo (DrawSVG de GSAP listo).
  Para MorphSVG, los 14 comparten viewBox 120×120 y trazo 7px.
- **Estados**: `state-loading-loop` es un arco 270°+dot — animar `rotate`.
  `state-loading-static` es el fallback para `prefers-reduced-motion`.

### Tags dietéticos
Los 5 tags (`deco-tag-*`) funcionan como leyenda del menú: alcohol, vegano,
café, sin gluten, sin azúcar. Trazo ink + relleno blanco/crema; legibles sobre
paneles de color.

---

## 3. QA incluido (`preview/`)
- Hojas de contacto por categoría (render cairosvg tal cual se sirve el SVG).
- `sheet-00-calibradores.png`: 6 activos que fijan la mano gráfica común.
- `sheet-contraste-pink.png`: prueba de recolor a crema sobre fucsia.
- 174/174 SVG validados (parse XML + viewBox).

## 4. Cobertura del menú (fuente: menús del cliente)
- **Caliente**: espresso, cappuccino, latte, americano, de olla, moka,
  chocolate, matcha, taro, chai vainilla, tisana, té.
- **Frío**: soda italiana, moka, latte, americano, taro, matcha ceremonia,
  chai vainilla, tisana, té, frappé, cold brew, agua mineral.
- **Snacks**: panini salado, pan dulce relleno, pan dulce sencillo,
  crepa dulce, crepa salada.
- **Especiales**: tantre ta'fresado, Denis Red Fruit, Caramel "Manchado",
  affogato vainilla, tisana "Strudel", bebida de temporada.
- **Drinks**: espresso martini, copa de vino tinto, margarita Nº20.
- **Extras**: shot de sabor, shot de café, leche de avena, cold foam.

## 5. Pendientes del cliente (documentados, no bloqueantes)
1. Fotos reales por familia cerámica para la galería (las ilustraciones
   conviven con foto como en el sitio actual).
2. `illus-visitamos.svg` es placeholder de fachada — sustituir por arte final
   o foto tratada.
3. `illus-qr-share-card.svg` trae área QR placeholder — pegar QR real.
4. Si existe un brand guide formal con colores exactos, ajustar
   `adn_grafico.tokens` y regenerar (todo el paquete es reproducible).
