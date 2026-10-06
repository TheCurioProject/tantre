# Decisiones de implementación

Las fuentes son los documentos TANTRE 01/02 y el inventario original tantre-assets. Los originales se conservan. Fecha: 5 octubre 2026.

## Cloudflare Free

El usuario sustituye Vercel por Cloudflare Free. Workers Free tiene 10 ms de CPU por petición y 100.000 peticiones dinámicas/día. Adoptamos Next.js App Router con exportación estática, HTML semántico pre-renderizado y API TypeScript ligera en Workers Static Assets. No se ejecuta Next SSR ni Server Actions en el Worker. PostgreSQL ejecuta lógica transaccional; los cambios administrativos se leen mediante API sin deploy. El catálogo es noindex. El contenido editorial esencial permanece en el HTML exportado; el contenido administrable se actualiza al cargar. Los datos SEO operativos del build deben regenerarse tras cambios de dirección/horario. Imágenes optimizadas antes de subir; sin servicio de transformación de imágenes de pago.

Se sustituyen Vercel Analytics/Speed Insights por web-vitals + PostHog y métricas Workers. Sentry es opcional y no recibe PII. Rate limit persistente en PostgreSQL evita otra dependencia/plan; Turnstile verificado servidor. Resend conserva confirmaciones. El coste cero está sujeto a las cuotas independientes de cada proveedor.

## Seguridad y operación

Supabase Auth únicamente vía backend, cookies HttpOnly, refresh servidor, verificación activa del usuario. No registro público de staff. RLS y roles en DB. Secret service role únicamente Worker. Reservas mediante RPC con bloqueo de slot, idempotencia y outbox atómica. Sin holds. Slots no solapados. Zona America/Mexico_City. Cupo real debe configurarse antes de habilitar reservas. Sin claves: API devuelve estado de servicio sin configurar, nunca una confirmación ficticia.

## Visual

PAPER #FFFDF8 prevalece frente al supuesto del README. Living Line conserva todos los paths; portador MORPH + auxiliares DRAW. Letterings necesitan reparación de orientación por glifo; no sustituir por fuentes handwriting. Máscaras de superficies derivadas de originales. Fachada placeholder no se publica como real. Las 59 imágenes de references son moodboard, no fotografía del negocio. Fotografías PH01–16, precios/alérgenos y logo oficial quedan pendientes de contenido; no se inventan evidencias.

## Dispositivos

Catálogo hasta 1024 px por viewport; hasta 1440 px con pointer coarse. Desktop mouse >1024: gate. Se actualiza al rotar. No existe override de escritorio. Favoritos locales versionados; no inventario. Deep links de items usan /catalogo/piezas/?item=slug y /catalogo/cafe/?item=slug para permitir altas sin rebuild del export estático.
