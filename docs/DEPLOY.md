# Despliegue en Cloudflare Free

## Qué se despliega

Un Worker llamado `tantre` sirve `/api/*`; Cloudflare entrega el resto desde `out/`. No se necesita Pages, Vercel, OpenNext ni un servidor Node en producción. Supabase conserva PostgreSQL, Auth y almacenamiento privado; Resend envía correo. Turnstile protege las reservas. PostHog y Sentry son opcionales.

Cloudflare Free tiene 100.000 solicitudes dinámicas diarias y 10 ms de CPU por invocación; el tiempo esperando red no es CPU. Los archivos estáticos se sirven por separado. Los límites y cuotas de Supabase/Resend también aplican y no están incluidos en Cloudflare. Antes de una campaña, mide CPU real y consumo de cada proveedor. No se ha ejecutado un benchmark en una cuenta Cloudflare en esta entrega.

Fuentes oficiales: [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [Static Assets](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/), [Supabase billing](https://supabase.com/docs/guides/platform/billing-on-supabase), [Resend](https://resend.com/docs/api-reference/emails/send-email).

## 1. Base de datos y propietario

1. Crea un proyecto Supabase. Guarda URL, clave `anon` y `service_role` en tu gestor de secretos. Esta implementación espera las claves JWT `anon` y `service_role` de la sección de claves legacy, no cadenas `sb_publishable_*` o `sb_secret_*`. La clave `service_role` nunca va al frontend ni a una variable `NEXT_PUBLIC_*`.
2. En SQL Editor, ejecuta **en orden, una sola vez**, los cinco archivos de `supabase/migrations/`. Usa un proyecto nuevo; los scripts no eliminan tablas existentes.
3. En Authentication desactiva el registro público. Crea el primer usuario del equipo con una contraseña fuerte. Copia su User UID.
4. Ejecuta esta inserción sustituyendo UID y nombre:

```sql
insert into public.profiles(id,display_name,role,active)
values('USER_UID_REAL','Nombre del propietario','owner',true);
```

El bucket `tantre-media` es privado. No cambies su visibilidad. La API entrega únicamente archivos asociados a contenido publicado o a personal autorizado. Supabase debe conservar activadas las políticas RLS.

## 2. Dominio y proveedores

Elige una URL HTTPS definitiva, por ejemplo `https://tantre.tu-subdominio.workers.dev` o tu dominio. La misma URL, sin barra final, debe usarse en `SITE_URL` y `NEXT_PUBLIC_SITE_URL`. El QR se genera en el navegador desde `SITE_URL` y conserva el item/universo, sin consumir CPU del Worker en cada visita. La API también ofrece una versión SVG cacheable.

- Turnstile: crea un widget para el hostname exacto y guarda site key/secret key. La acción verificada es `reservation`.
- Resend: verifica el dominio remitente y sus DNS. Crea API key de envío y usa `EMAIL_FROM` con ese dominio. Configura un buzón atendido para respuestas. No utilices el remitente de pruebas para reservas reales.
- Supabase Auth: configura URL del sitio y administra el alta de personal desde su dashboard. No existe registro público en la app.

## 3. Compilar y desplegar

```sh
nvm use
npm ci
npx wrangler login
NEXT_PUBLIC_SITE_URL=https://tu-dominio.example npm run build
npm run deploy:check
npx wrangler deploy
```

El primer deploy permite obtener el subdominio `workers.dev`; si esa será la URL final, vuelve a compilar con ella para que canonical y sitemap sean correctos. Para dominio propio, asígnalo al Worker desde Cloudflare y repite la compilación con la URL elegida.

Cloudflare Workers Builds también puede ejecutar `npm ci && npm run build` y después `npx wrangler deploy`. Usa Node 22.23.2 o una versión 22 posterior compatible. No subas únicamente `out/` a Pages: perderías la API y el cron.

## 4. Secretos del Worker

Ejecuta cada comando y pega el valor en el prompt. No escribas valores secretos dentro del repositorio ni del historial de comandos.

```sh
npx wrangler secret put SITE_URL
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put TURNSTILE_SITE_KEY
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put EMAIL_FROM
npx wrangler secret put IP_HASH_SECRET
```

Genera `IP_HASH_SECRET` como un valor aleatorio de al menos 32 bytes. Mantén `APP_ENV=production`, ya definido en Wrangler. Nunca pongas `development` en el Worker público: ese modo permite localhost y omitir Turnstile cuando no tiene claves.

Opcionales: `POSTHOG_KEY`, `POSTHOG_HOST`, `SENTRY_DSN`. Sin ellos no se envía telemetría externa. PostHog requiere además activar medición en Ajustes y consentimiento en el navegador. Sentry recibe únicamente eventos operativos sanitizados, sin mensajes de excepción, cookies, IP o datos del formulario; no implementa Session Replay.

Para pruebas locales copia `.env.example` a `.dev.vars`, completa valores de un proyecto de pruebas y conserva `APP_ENV=development`. No uses una base real de clientes para QA.

## 5. Activar el negocio

En `/admin/`, inicia sesión con el propietario y configura, en este orden:

1. Contacto verificado, horarios y fechas de cierre.
2. Categorías, items reales, precios en centavos MXN, alérgenos confirmados y medios con descripción accesible. Guarda borradores y publica cuando corresponda.
3. Textos completos de Términos y Privacidad; después activa «Publicar información legal».
4. Cupo por sesión, máximo de grupo, duración, anticipación y cancelación. Los slots ya creados conservan su cupo y duración: no se reescriben reservas existentes.
5. Habilita reservas. La API lo impide si faltan textos legales o secretos de correo/protección.

Haz una reserva controlada en producción, recibe el correo, consulta el enlace de cancelación y cancela explícitamente. Verifica el cupo liberado y el correo de cancelación. El enlace usa fragmento para que el token no aparezca en logs de URL ni se active por escáneres de correo.

## 6. Operación y recuperación

El cron de `wrangler.jsonc` se ejecuta cada diez minutos. Los envíos también se procesan inmediatamente después de reservar/cancelar. La outbox persiste aunque falle Resend; el panel muestra pendientes. Los reintentos usan la misma clave de idempotencia del proveedor. Se hacen hasta 12 intentos; payloads fallidos se purgan después de siete días. Un fallo prolongado necesita intervención desde la agenda; no se debe prometer entrega garantizada.

No se ejecutan migraciones automáticamente al desplegar frontend. Conserva copias de seguridad de Supabase antes de futuras migraciones. Un rollback de código se realiza con Cloudflare Versions; no revierte datos. Elimina acceso de personal desde Equipo y revoca sesiones desde Supabase cuando corresponda.

Los cambios de contenido publicados aparecen al cargar la API, con hasta 30 segundos de caché pública. Los medios publicados pueden permanecer en caché hasta 60 segundos. Los cambios de metadata SEO estática, tipografía o código requieren build y deploy. No existe caché offline de reservas ni inventario.
