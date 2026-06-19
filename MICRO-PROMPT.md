# App Habitación

## Objetivo
Microaplicación hospitalaria para que pacientes o personal en una habitación soliciten atención (timbre o videollamada) hacia enfermería, asistente de calidad o médico. Incluye una PWA instalable en Android para la habitación (sin login, identificada por clave de configuración) y un dashboard web con autenticación donde el personal elige piso, sector y rol de escucha.

## Funcionalidades
- [x] PWA instalable en Android para la habitación (`/habitacion`)
- [x] Configuración de habitación por variable de entorno (`NEXT_PUBLIC_ROOM_KEY`) sin usuario/clave
- [x] Habitaciones organizadas por piso y sector
- [x] Llamado con timbre o videollamada hacia enfermero, asistente de calidad o médico
- [x] Dashboard con login: selección de piso, sector y rol de escucha
- [x] Notificaciones en tiempo real de llamados entrantes (SSE)
- [x] Cancelar llamado desde habitación y sincronizar con dashboard
- [x] Timbre dashboard con unlock de audio del navegador

## Documentación SDD

Ver [openspec/specs/](./openspec/specs/) y [docs/quick-map.md](./docs/quick-map.md).

## Servicios
- [x] MongoDB (siempre)
- [ ] RustFS / S3 (no requerido)
- [ ] Mailhog (no requerido)

## Modelo de datos

### `rooms`
- `_id`, `number`, `floor`, `sector`, `roomKey` (clave de configuración única), `label`

### `users`
- `_id`, `email`, `passwordHash`, `name`, `createdAt`

### `staff_sessions`
- `_id`, `userId`, `floor`, `sector`, `role` (`nurse` | `quality` | `doctor`), `active`, `updatedAt`

### `calls`
- `_id`, `roomId`, `roomNumber`, `floor`, `sector`, `type` (`bell` | `video`), `targetRole`, `status` (`pending` | `accepted` | `completed` | `cancelled`), `createdAt`, `acceptedBy`, `acceptedAt`, `completedAt`

## Pantallas / flujos
1. `/` — Landing con acceso a habitación y dashboard
2. `/habitacion` — PWA habitación: muestra piso/sector/número, botones timbre/videollamada por rol destino
3. `/dashboard/login` — Login del personal
4. `/dashboard` — Configurar escucha (piso, sector, rol) y recibir/responder llamados
5. `/dashboard/video/[callId]` — Videollamada WebRTC (cuando aplica)

## Auth y roles
- **Habitación**: sin login; `NEXT_PUBLIC_ROOM_KEY` validada contra `rooms.roomKey`
- **Dashboard**: JWT (bcrypt en registro inicial vía seed); roles de escucha: `nurse`, `quality`, `doctor`
- **GlobalContext**: `user`, `token`, `listenConfig` (floor, sector, role)

## Pagos / dinero
No aplica.

## Diseño
- Accent color: `#0d9488` (teal clínico)
- Iconos CSS por categoría (enfermería, calidad, médico) — sin imágenes
- UI mobile-first, botones grandes en PWA habitación

## Pruebas obligatorias
- E2E (Playwright): login dashboard, crear llamado desde habitación, recibir en dashboard
- Unit (Jest): `lib/auth`, `lib/validation`, `lib/calls`

## Variables de entorno
```
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=app_habitacion
JWT_SECRET=
NEXT_PUBLIC_ROOM_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
