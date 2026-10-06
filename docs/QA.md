# Verificación de entrega

Fecha: 5 de octubre de 2026. Entorno local: macOS 12.6, Node 22.23.2, Chrome instalado. Se revisaron capturas reales del build, además de las pruebas automáticas.

## Ejecutado

- `npm run check`: TypeScript sin errores, ESLint sin errores y 15 pruebas unitarias aprobadas.
- `npm run db:verify`: las cinco migraciones aplicadas en PGlite con schemas de Auth/Storage de prueba. Cupo, idempotencia, cancelación, outbox, rate limit, cambios de duración sin solapamientos, agenda, ocupación, roles, aislamiento de editores, publicación por categoría y políticas del bucket verificadas.
- `npm run build`: exportación de todas las rutas completada.
- `npm run deploy:check`: bundle del Worker y 304 archivos estáticos aceptados por el dry-run de Wrangler. Worker: 145,04 KiB gzip.
- `npm audit --omit=dev --audit-level=high`: cero vulnerabilidades conocidas en dependencias de producción.
- `node scripts/report-build.mjs`: HTML inicial 26,5 KiB gzip; JavaScript inicial del home 311,1 KiB gzip. Todas las líneas de `_headers` cumplen el límite de Cloudflare. Detalles en `BUILD-METRICS.json`.
- Consola del build revisada en home móvil/desktop, gate y reservas: sin errores de JavaScript ni de consola en esos recorridos.

## Navegador

Los 13 escenarios de `tests/e2e/product.spec.ts` cubren:

1. Home a 360, 390, 768, 1024 y 1440 px, sin overflow horizontal; selector y lienzo coincidente con el cuadro hueso.
2. Entrada, llegada y salida progresivas de la reserva fija móvil.
3. Gate de escritorio, QR real y ausencia de cuadrícula táctil.
4. Ficha por enlace profundo, color, favoritos y cierre con transición espacial.
5. Tableta táctil al rotar de 820 a 1366 px.
6. Catálogo vacío y fallo de conexión recuperable.
7. Formulario de reserva y confirmación.
8. Conflicto de cupo: conservación de datos y regreso a horarios.
9. Administración sin sesión.
10. Editor con contenido y sin agenda/equipo.
11. Cancelación: consultar no cancela; confirmar sí; token retirado de la URL.
12. Menú progresivo por teclado, Escape, permanencia durante el cierre y restauración de foco.
13. Filtros de agenda y ocupación independiente de la página de reservas.

Se corrigieron dos selectores de pruebas que confundían el anunciador de rutas y el texto de opciones de un select; se volvieron a ejecutar los escenarios afectados. Las comprobaciones axe WCAG A/AA de home, gate, ficha, formulario y login no detectaron infracciones. Esto no equivale a una certificación de accesibilidad ni reemplaza pruebas con lectores de pantalla reales.

Los datos de catálogo y respuestas de reserva de E2E son fixtures de prueba. **No** representan inventario ni reservas reales. La lógica de SQL se prueba separadamente; no se afirma una reserva extremo a extremo contra una cuenta Supabase/Resend real sin credenciales.

## Pintura libre y narrativa: revisión del 5 de octubre de 2026

Los 17 escenarios de navegador (13 de producto y 4 de pintura) pasan en el build actualizado. TypeScript, lint, 15 pruebas unitarias, build estático y dry-run de Cloudflare también pasan.

- Trazos de ratón visibles antes de soltar el puntero; continuidad comprobada por lectura de píxeles.
- Un trazo azul cubre un trazo rosa sin cambiar el resto del dibujo.
- Cada pieza conserva su bitmap al cambiar de forma y al redimensionar; borrar afecta solo a la pieza seleccionada.
- Touch no desplaza la página dentro del lienzo; deslizar fuera de él mantiene el scroll normal.
- Teclado con flechas y Espacio, grosor ajustable, foco visible e instrucciones.
- El canvas coincide con todo el cuadro hueso y no existe fuera de la sección de piezas. Los contornos SVG originales permanecen por encima de la pintura.
- Eliminados el botón de pinceladas prediseñadas y las condiciones de preferencia de movimiento del frontend, CSS y analytics, según el cambio solicitado.
- Corregido el desbordamiento de las entradas laterales a 360 px usando desplazamientos proporcionales.
- Motor de pintura sin bucle en reposo ni renders de React por punto. Sus buffers se adaptan al cuadro, conservan la pintura durante resize y limitan el borde mayor a 1024 píxeles con DPR máximo de 2.
- Menú hamburguesa verificado en un fotograma intermedio, estado abierto y cierre antes de retirar el diálogo; la barra inferior también se comprueba durante su recorrido.
- Cabecera móvil de 430 px sin intersección entre wordmark y acciones, hero sin intersección entre copy y composición y sin overflow horizontal.
- Arco del hero sustituido por el campo de pintura personalizado `mask-paint-06.svg`.

Muestra local durante dibujo continuo: 119 intervalos RAF, mediana **16,7 ms**, p95 **16,7 ms**, ninguno superior a 34 ms. Chrome en macOS con viewport 390 × 844 emulado. Esta muestra equivale aproximadamente a 60 fps en ese entorno; no acredita 60 fps en todos los dispositivos ni sustituye mediciones en iPhone/Android físicos. Datos reproducibles en `tmp/qa/paint-performance.json`, generados por `tests/e2e/paint.spec.ts`.

## Límites y comprobación de producción

- Este macOS es anterior al mínimo soportado por el runtime local de Workers. El dry-run sí compila; la app se prueba ejecutando el mismo handler en Node. El workflow de Ubuntu incluye arranque de Wrangler y prueba PostgreSQL con 20 reservas simultáneas y 10 reintentos simultáneos. Ese workflow está preparado, pero no se ha ejecutado en una cuenta GitHub en esta entrega.
- PGlite tiene una sola conexión: verifica transacciones y resultados, pero no acredita concurrencia multiconexión. Ejecuta `npm run db:concurrency` sobre PostgreSQL de pruebas o ejecuta CI antes de abrir reservas reales.
- Faltan las credenciales reales para comprobar login Supabase remoto, Turnstile con el dominio definitivo, entrega Resend, Storage remoto y recepción PostHog/Sentry. Los handlers y configuraciones están implementados; la activación está descrita en `DEPLOY.md`.
- No se han medido Core Web Vitals de usuarios reales ni CPU en Workers Free. Las cifras de bundle no equivalen a métricas LCP/INP/CLS. `web-vitals` está conectado a medición opcional con consentimiento.
- Se probaron viewports y touch emulados en Chrome. Queda la comprobación en iPhone/Safari y Android físicos durante la activación.
- El audit completo detecta cinco avisos de desarrollo que derivan de `braces` en la cadena de ESLint/Next, advisory `GHSA-vfj7-8cjw-p6xm`. No aparecen en el audit de producción. El registro no ofrece un parche compatible directo; no se degradó Next para ocultarlos. Los patrones del lint provienen del repositorio, no de solicitudes públicas.

Las reservas permanecen apagadas en el seed hasta configurar cupo, textos legales y proveedores. La falta de fotografías, precios/alérgenos y logo oficial está identificada; no se sustituyó por contenido inventado.
