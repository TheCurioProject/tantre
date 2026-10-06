# TANTRE · The Living Canvas

Sitio editorial, catálogo táctil, reservas transaccionales y administración. Next.js App Router + TypeScript, DOM/SVG/GSAP, Supabase PostgreSQL/Auth/Storage y API en Cloudflare Workers Static Assets. Preparado para Cloudflare Free sin ejecutar SSR de Next en cada visita.

## Abrir el proyecto

```sh
nvm use
npm ci
npm run build
npm run preview:portable
```

Abre `http://localhost:8787`. El sitio se puede revisar sin credenciales: muestra los estados vacíos reales y no simula reservas ni inventario. `/admin/` contiene el acceso del equipo. `/catalogo/` muestra el catálogo en móvil/tablet y la escena QR en escritorio.

Para desarrollo: `npm run dev` abre Next en `http://localhost:3000` y la API en `http://localhost:8787`. En macOS anterior a 13.5 utiliza automáticamente el servidor portátil. En Linux/macOS compatibles utiliza Wrangler. El servidor portátil ejecuta el mismo handler de la API, pero no emula límites de CPU, caché, cron ni todos los comportamientos de Cloudflare.

## Documentación

- [Desplegar en Cloudflare Free](docs/DEPLOY.md): servicios, SQL, secretos, primer propietario y activación.
- [Arquitectura y decisiones](docs/DECISIONES.md).
- [Mapa de assets y alcance](docs/ARQUITECTURA.md).
- [Inventario completo de archivos](docs/ASSETS.csv): formatos, dimensiones y correspondencia original.
- [Operación del estudio](docs/OPERACION.md): publicaciones, agenda, permisos y recuperación.
- [Pruebas y límites de verificación](docs/QA.md).

## Verificación

```sh
npm run check
npm run db:verify
npm run build
npm run deploy:check
npm run test:e2e
```

En Linux, instala Chromium para Playwright con `npx playwright install --with-deps chromium`. En este Mac usa Chrome instalado. La prueba adicional `npm run db:concurrency` necesita `TEST_DATABASE_URL` de una base PostgreSQL vacía cuyo nombre termine en `_test` o `_ci`. Nunca la dirijas a producción. El workflow de GitHub ejecuta esa prueba con PostgreSQL y comprueba Wrangler en Ubuntu.

## Contenido necesario para abrir reservas

El código está preparado; los servicios externos necesitan las cuentas del negocio. Faltan fotografías reales, inventario/precios/alérgenos confirmados, cupo operativo, textos legales aprobados y credenciales de Supabase, Turnstile y Resend. Se cargan mediante configuración y administración. Las imágenes de `tantre-assets/references` son referencias, no fotografías del negocio. No se publicaron productos, reseñas o precios inventados.

Los originales `tantre-assets/` se conservan. No se usan packs de iconos. Las superficies de pintura corregidas están en `public/brand/derived/` y se regeneran desde los SVG originales.
