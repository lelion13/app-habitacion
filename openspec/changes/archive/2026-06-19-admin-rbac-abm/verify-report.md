# Verify Report — admin-rbac-abm

**Change:** admin-rbac-abm  
**Fecha:** 2026-06-19 (inicio) — verificación final 2026-06-19  
**Entorno:** local (`npm run test:unit`, `npm run build`)

## RBAC y guards

| # | Caso | Resultado |
|---|------|-----------|
| 1 | `user` no accede `/estadisticas` (redirect `/dashboard`) | ✅ |
| 2 | `user` no ve pestaña Administración | ✅ |
| 3 | `supervisor` accede Estadísticas, no ABM | ✅ |
| 4 | `admin` accede ABM + Estadísticas | ✅ |
| 5 | API `/api/admin/*` rechaza sin rol admin (403) | ✅ |
| 6 | JWT + login incluyen `systemRole` | ✅ |
| 7 | No desactivar último admin activo (409) | ✅ |

## ABM (admin)

| # | Caso | Resultado |
|---|------|-----------|
| 1 | CRUD lógico usuarios (create, edit, password, active) | ✅ |
| 2 | CRUD pisos y sectores | ✅ |
| 3 | CRUD habitaciones con selects piso/sector | ✅ |
| 4 | `roomKey` legible `room-{número}-key` al crear | ✅ |
| 5 | Colisión → sufijo `room-{número}-2-key` | ✅ |
| 6 | `roomKey` solo lectura en UI | ✅ |
| 7 | Form reset tras crear (fix `formEl` async) | ✅ |
| 8 | Denorm `floor` = `floor.name` (no “Piso Piso 1”) | ✅ |

## Habitación inactiva

| # | Caso | Resultado |
|---|------|-----------|
| 1 | `GET /api/room` expone `active` | ✅ |
| 2 | `POST /api/calls` → 403 si inactiva | ✅ |
| 3 | UI tablet: banner + botones disabled | ✅ |

## Dashboard staff UI (tema oscuro)

| # | Caso | Resultado |
|---|------|-----------|
| 1 | Shell compartido: logo, estado escucha, menú usuario | ✅ |
| 2 | Pestañas: Llamador / Administración / Estadísticas | ✅ |
| 3 | Tema `#0d1b2a` alineado con `/habitacion` | ✅ |
| 4 | Telegram en dropdown del usuario (no card en body) | ✅ |
| 5 | Login dashboard con mismo tema | ✅ |
| 6 | Admin + Estadísticas con `staff-theme` | ✅ |

## Llamador (escucha)

| # | Caso | Resultado |
|---|------|-----------|
| 1 | Piso/Sector desde `GET /api/staff/catalog` | ✅ |
| 2 | Dos botones apilados mismo tamaño: Probar sonido + Activar/Desactivar | ✅ |
| 3 | En línea → botón “Desactivar escucha” | ✅ |
| 4 | Fuera de línea → botón “Activar escucha” | ✅ |
| 5 | `DELETE /api/staff/session` desactiva escucha | ✅ |
| 6 | SSE global (`StaffListenProvider`) — en línea en Admin/Estadísticas | ✅ |
| 7 | Indicador header: punto junto a “En línea”, centrado sobre zona | ✅ |

## Telegram + escucha (comportamiento documentado)

| # | Caso | Resultado |
|---|------|-----------|
| 1 | Telegram notifica si `staff_sessions.active` + match zona/rol | ✅ (lógica existente) |
| 2 | Cerrar sesión **sin** desactivar escucha → sesión servidor sigue activa | ✅ (intencional) |
| 3 | Telegram puede seguir llegando tras logout sin desactivar | ✅ (documentado en runbook) |

## Migración

| # | Caso | Resultado |
|---|------|-----------|
| 1 | `runAdminMigrations` en login/seed | ✅ |
| 2 | Pisos/sectores desde rooms legacy | ✅ |
| 3 | Seed admin → `systemRole: admin` | ✅ |

## Técnico

| # | Check | Resultado |
|---|-------|-----------|
| 1 | `npm run test:unit` | ✅ 37 tests |
| 2 | `npm run build` | ✅ |
| 3 | `npm run lint` | ☐ no ejecutado en esta sesión |

## Archivos clave (implementación)

### Auth / RBAC
- `web/lib/types.ts`, `web/lib/auth.ts`, `web/lib/system-roles.ts`
- `web/lib/admin-auth.ts`, `web/lib/admin-migrate.ts`, `web/lib/admin-catalog.ts`
- `web/app/api/admin/{users,floors,sectors,rooms}/**`

### Rooms / roomKey
- `web/lib/room-key-gen.ts` — `buildRoomKeyFromNumber`, `allocateRoomKey`
- `web/app/api/admin/rooms/route.ts`

### Dashboard UI
- `web/lib/staff-theme.ts`
- `web/components/dashboard/DashboardShell.tsx`, `UserMenu.tsx`
- `web/hooks/useTelegramLink.ts`
- `web/components/admin/AdminPanel.tsx`
- `web/app/dashboard/layout.tsx`, `login/page.tsx`, `page.tsx`
- `web/app/estadisticas/layout.tsx`, `page.tsx`

### Escucha persistente
- `web/context/StaffListenContext.tsx`
- `web/components/StaffListenBridge.tsx` (en `app/layout.tsx`)
- `web/app/api/staff/catalog/route.ts`
- `web/app/api/staff/session/route.ts` — `PUT`, `GET`, `DELETE`

## Sign-off

- [x] Criterios proposal cumplidos (+ extensiones UI/escucha acordadas en sesión)
- [x] `tasks.md` actualizado
- [x] `docs/runbook.md` actualizado
- [x] Listo para archivar (`sdd-archive` / mover a `openspec/changes/archive/`)

## Notas post-archivo

- Habitaciones creadas antes del fix de `roomKey` conservan clave hex; recrear o editar manual en DB si hace falta.
- E2e guards por rol (task 5.2) quedó opcional; cobertura vía unit + verificación manual.
- Próximo change sugerido (fuera de scope): auto-desactivar escucha en `logout` si se desea alinear Telegram con sesión browser.
