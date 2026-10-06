# Arquitectura, assets y fases

## Fuentes y alcance

Se leyeron ambos documentos DOCX completos y se inspeccionó `tantre-assets/`, incluido `README.md`, `specs.json`, previews, originales y referencias. El proyecto implementa el concepto The Living Canvas como capítulos de cerámica, pintura, café y comunidad. No usa Lucide, Heroicons, Font Awesome, stock fotográfico ni packs de ilustraciones.

**Requisito:** Next App Router, TypeScript, GSAP, PostgreSQL/Supabase, reservas, administración, validación, estados y catálogo exclusivo de móvil/tablet. **Decisión técnica:** exportación estática de Next + Worker independiente para respetar Cloudflare Free; Zod compartido, API HTTP, SQL transaccional, Auth con cookies HttpOnly. **Dependencias externas pendientes:** cuentas/secretos, contenido comercial verificado y fotografías. No son datos que se puedan inferir del diseño.

## Inventario

`docs/ASSETS.csv` y `docs/ASSETS.json` enumeran 322 archivos, formatos, bytes, dimensiones/viewBox y correspondencia con la especificación original. Incluyen 117 SVG de distribución, 116 masters, 11 PNG de distribución, 14 hojas de preview y 59 referencias fotográficas. `photo-selects` no contiene las fotografías finales. Falta el master del favicon, aunque su distribución existe.

| Familia original         | Componente / interacción                                                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `living-line/line-01…14` | Loader, HeroCanvas, LivingLine, PaintInteraction, escenas y confirmación; MORPH del path principal y DRAW de auxiliares                |
| `ceramics/*`             | Hero, selector, miniaturas de catálogo y editor; contornos SVG conservados                                                             |
| `ceramics/*-mask`        | Recorte de pintura y prueba de color; superficies planas corregidas en `brand/derived`                                                 |
| `cafe/*`                 | Capítulo café, menú táctil e ilustraciones de familia                                                                                  |
| `masks/*`                | PAINT: pinceladas, skeletons y PhotoReveal; no se rasterizan                                                                           |
| `illustrations/*`        | Pasos del proceso, mesa creativa, comunidad y gate QR                                                                                  |
| `doodles/*`              | Flechas, subrayados, estrellas y anotaciones en lugares concretos                                                                      |
| `ui/*`                   | Navegación, búsqueda, favoritos, compartir, horarios y formularios                                                                     |
| `states/*`               | Carga, vacío, error, confirmación y control de menú                                                                                    |
| `logo/*`                 | Favicon y app icon; el wordmark tipográfico no se presenta como un archivo de logo oficial                                             |
| Letterings               | Reservados: algunos glifos tienen orientación inconsistente; no se publicaron deformados ni se reemplazaron con una fuente handwriting |
| `references/*`           | Moodboard únicamente; no se publica como fotografía de TANTRE                                                                          |

Las tres máscaras planas de plato, corazón y charola tenían huecos que impedían pintar el centro. El build deriva una superficie del contorno exterior sin alterar los originales. PAPER usa `#FFFDF8` del documento; se documenta la discrepancia con `#FBF8F1` del README de assets. No se añadió audio artificial porque faltan las grabaciones originales; la experiencia funciona en silencio.

## Rutas

| Ruta                                 | Función                                                                                         |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `/`                                  | Narrativa editorial completa, selector, pintura, proceso, café, comunidad, preguntas y contacto |
| `/catalogo/`                         | Universo táctil recordado en sesión o gate de escritorio                                        |
| `/catalogo/piezas/?item=slug`        | Cerámica y ficha enlazable                                                                      |
| `/catalogo/cafe/?item=slug`          | Bebidas/snacks y ficha enlazable                                                                |
| `/catalogo/favoritos/`               | Favoritos locales; no apartan inventario                                                        |
| `/reservar/`                         | Disponibilidad, datos, validación y confirmación                                                |
| `/reservar/cancelar/#code=…&token=…` | Consulta y cancelación explícita mediante token                                                 |
| `/admin/`, `/admin/login/`           | Acceso y administración por rol                                                                 |
| `/terminos/`, `/privacidad/`         | Textos administrables aprobados por el negocio                                                  |
| `/api/*`                             | Worker: datos públicos, medios, QR, disponibilidad, reservas, auth, administración y telemetría |

Las rutas de items usan query params para permitir altas desde administración sin reconstruir todas las páginas del catálogo estático. Catálogo, administración y cancelación son noindex.

## Frontend y motion

`src/components/chapters` separa HeroCanvas, PaintInteraction y narrativa editorial. `motion` contiene LivingLine, ChapterMotion y PhotoReveal. Catálogo, reservas y administración tienen módulos y estilos propios. `Providers` comparte contenido y mensajes de estado; no se usa un store global de reservas. Las rutas se dividen en chunks.

GSAP se registra donde se usa y se limpia mediante contextos, `useGSAP` y cleanup de listeners. DRAW utiliza DrawSVG, PAINT máscaras originales, PLACE masa/rotación con CustomEase y Flip, MORPH MorphSVG entre paths originales. SplitText conserva semántica accesible. La pintura libre utiliza Pointer Events (ratón, touch y lápiz con presión), muestras coalescidas y Canvas 2D sobre todo el rectángulo hueso del estudio. Mantiene un bitmap independiente por pieza, conserva el contenido al redimensionar y limita cada borde a 1024 píxeles con DPR máximo de 2. La composición es opaca y solo solicita `requestAnimationFrame` mientras hay muestras pendientes. No se mantiene un historial creciente ni se actualiza React por punto. Tiene grosor ajustable, borrado por pieza y alternativa de teclado.

El menú conserva el diálogo nativo, pero `showModal()` y `close()` delimitan una secuencia visual GSAP: el plano se revela, los enlaces entran escalonados y el cierre termina antes de retirar el diálogo y devolver el foco. La reserva fija permanece montada para interpolar entrada y salida. Los hovers de la cabecera responden con subrayado pintado, desplazamiento editorial y giro del punto de menú. La ficha del catálogo conserva relación espacial con su tarjeta. MotionPath no se añade sin una trayectoria que lo requiera.

Por cambio explícito del usuario, las animaciones se mantienen siempre: se han eliminado las condiciones que consultaban las preferencias de movimiento del sistema. ChapterMotion tiene escenas distintas para introducción, pintura, proceso, café, comunidad, preguntas, reserva y visita. Los títulos se revelan por líneas; las piezas se colocan con masa; el vapor responde al scroll y los recorridos se dibujan. Los cambios de estado se interpolan mediante fotogramas de GSAP o transiciones CSS. Los efectos de entrada se ejecutan una vez y el canvas permanece inmóvil al pintar. El hero sustituye el arco geométrico por un campo lavanda irregular construido con `mask-paint-06.svg`. No hay scroll hijacking ni WebGL. El loader es no bloqueante: no retrasa artificialmente el acceso al hero.

## Dispositivos

Hasta 1024 px se ofrece catálogo táctil; hasta 1440 px también si el puntero principal es coarse, para tablets en horizontal. Por encima se muestra la escena desktop. La política responde a resize/orientación y no confía en user-agent. Un navegador de escritorio estrecho recibe el diseño compacto, decisión deliberada de viewport. No hay botón para forzar un catálogo desktop.

El gate tiene QR SVG dinámico del mismo universo/item, composición original, microanimaciones, enlace copiable y regreso al sitio principal. El resto del sitio funciona plenamente en escritorio. Dialogs usan `100dvh`, controles táctiles, safe areas, foco, Escape y alternativas accesibles a drag/swipe.

## Backend y datos

| Grupo     | Tablas                                                                        |
| --------- | ----------------------------------------------------------------------------- |
| Equipo    | profiles ↔ auth.users                                                         |
| Catálogo  | catalog_categories → catalog_items → ceramic_meta / cafe_meta / catalog_media |
| Medios    | media_assets → image_variants; gallery_entries                                |
| Editorial | packages, faqs, testimonials, site_settings                                   |
| Agenda    | business_hours, schedule_exceptions, reservation_slots → reservations         |
| Operación | notification_outbox, audit_log, rate_limits                                   |

RPC de reserva: valida reglas, serializa idempotencia, materializa slots sin solapamientos, bloquea cupo, confirma y crea outbox en la misma transacción. No hay reservas ficticias ni un pago simulado. Cancelar libera cupo y crea una única notificación. Auth valida usuario y perfil activo en cada operación. La administración usa el JWT del usuario para mantener RLS; únicamente operaciones privadas justificadas usan service role.

Las fotografías se optimizan en el navegador antes de subirlas. Variantes WebP alimentan `srcset`; el Worker entrega archivos ya optimizados sin pagar transformaciones. Los SVG conservan paths para draw/morph/recolor. Fuentes WOFF2 locales, HTML prerenderizado, metadata, OpenGraph, sitemap, robots y CSP generada por página.

## Fases y criterios

| Fase | Implementación                                      | Criterio verificable                                                            |
| ---- | --------------------------------------------------- | ------------------------------------------------------------------------------- |
| 0    | Auditoría y correspondencia de assets               | Inventario, inconsistencias y decisiones documentadas                           |
| 1    | Stack, rutas, tokens, tipografía, API y SQL         | TypeScript, lint, build y migraciones verificables                              |
| 2    | Loader, navegación, hero y Living Line              | Responsive, teclado, consola y continuidad de movimiento                        |
| 3    | Selector y pintura                                  | Dibujo continuo, superposición, memoria por pieza, reset y teclado              |
| 4    | Proceso, café, comunidad, galería, FAQs y ubicación | Composición responsive; contenido real administrable y estados vacíos           |
| 5    | Catálogo y gate QR                                  | Deep links, favoritos, búsqueda, filtros, ficha, compartir y rotación de tablet |
| 6    | Reservas y administración                           | Validación, cupo, idempotencia, cancelación, permisos y outbox                  |
| 7    | SEO, medición y performance                         | Metadata, CSP, consentimiento, imágenes/fuentes y no PII en telemetría          |
| 8    | QA y documentación                                  | Pruebas de navegador/SQL/unitarias, dry-run y guía operativa                    |

Los checks automáticos no equivalen a una validación en un iPhone físico ni a probar servicios externos sin credenciales. El informe QA distingue lo ejecutado localmente de lo que se debe comprobar al conectar la cuenta real.
