# Operación del estudio

## Roles

| Rol     | Acceso                                                                                      |
| ------- | ------------------------------------------------------------------------------------------- |
| owner   | Contenido, agenda, ajustes, historial y equipo                                              |
| manager | Contenido, agenda, horarios y ajustes; sin equipo                                           |
| editor  | Catálogo, categorías, medios, galería, paquetes, preguntas y reseñas; sin datos de reservas |
| viewer  | Consulta de catálogo y agenda; sin escrituras                                               |

El backend y RLS verifican permisos. Ocultar botones no es el control de seguridad. Desactivar un perfil corta el acceso en la siguiente petición. Un propietario no puede desactivar o degradar su propio acceso desde la aplicación.

## Publicación

Los items deben tener una categoría del mismo universo. Una categoría no publicada oculta sus items. La disponibilidad es informativa: favoritos no reservan ni descuentan inventario. «Disponible hoy» deja de mostrarse cuando la actualización supera la vigencia configurada. Revisar existencias y guardar el item renueva esa marca.

El orden se gestiona por el campo Orden. Desmarcar Publicar archiva sin borrar. El precio se introduce en centavos: `28000` equivale a `$280 MXN`. No se calculan cobros en línea. Las reseñas exigen confirmar permiso de publicación.

Medios acepta fotografías reales y las exporta a WebP en variantes de 640 y hasta 1600 px de ancho antes de subirlas. Tamaño máximo 2 MB; el backend valida tipo y límites. Elige destino al subir: biblioteca, item o galería. Los elementos de galería se crean como borrador y se publican en Galería. Los SVG de marca permanecen en el repositorio y no se admiten SVG arbitrarios desde el panel.

## Reservas

La agenda permite filtrar fecha y estado, ver contacto, celebración y notas, bloquear horarios y marcar confirmada, cancelada, completada o no asistió. Un estado final no se reactiva. Para cambiar grupo u horario, cancela y crea una reserva nueva para que el cupo vuelva a validarse.

La agenda ofrece vistas de día y semana, filtros por estado, tamaño de grupo y celebración, y paginación de 100 reservas. Para exportaciones completas utiliza Supabase con una cuenta autorizada. El horario es `America/Mexico_City`. La cancelación pública respeta el plazo configurado; el personal puede cancelar desde el panel. Los cierres bloquean nuevas reservas, pero no cancelan automáticamente reservas existentes: revisa la agenda y contacta a las personas afectadas.

## Fallos

- Sin Supabase: reservas y administración no confirman operaciones. El sitio ofrece contacto y estados recuperables.
- Horario agotado al confirmar: el formulario conserva los datos y vuelve a la selección de hora.
- Doble clic o reintento por conexión: la misma clave devuelve la misma reserva.
- Correo pendiente: la reserva sigue siendo válida y el código se muestra en pantalla. Revisa outbox/Resend y la alerta de la agenda.
- Turnstile expirado: se renueva la verificación antes del siguiente envío.
- Foto no publicada: su URL devuelve denegación sin sesión; no debe hacerse público el bucket para corregirla.

La política de retención de datos de clientes debe definirse en el aviso de privacidad del negocio. No se impone un borrado automático arbitrario de reservas. Los logs de aplicación excluyen formularios y tokens; el historial audita cambios sin duplicar PII de reservas.
