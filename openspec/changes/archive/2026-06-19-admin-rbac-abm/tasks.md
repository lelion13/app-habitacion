# Tasks — admin-rbac-abm

## 1. Auth y modelo

- [x] 1.1 Agregar `SystemRole`, `systemRole`, `active` a `User` y `AuthUser`
- [x] 1.2 Extender JWT payload + login response con `systemRole`
- [x] 1.3 `lib/admin-auth.ts`: `requireAdmin`, `requireSupervisor`, `hasAtLeastRole`
- [x] 1.4 Migración/seed: admin demo → `admin`; default `user`; `active: true`

## 2. Catálogos y habitaciones (backend)

- [x] 2.1 Colecciones `floors`, `sectors` + tipos + validación
- [x] 2.2 Ampliar `Room` con refs, `active`, timestamps; denormalización
- [x] 2.3 APIs `/api/admin/floors`, `/api/admin/sectors`, `/api/admin/rooms`
- [x] 2.4 APIs `/api/admin/users` (create, patch, reset password, soft-delete)
- [x] 2.5 Reglas: último admin, piso/sector con habitaciones activas
- [x] 2.6 `roomKey` legible `room-{número}-key` + sufijo si colisión
- [x] 2.7 Denorm `room.floor` = `floor.name` (no label)

## 3. Integración llamados / habitación

- [x] 3.1 `GET /api/room` — indicar inactiva
- [x] 3.2 `POST /api/calls` — 403 habitación inactiva
- [x] 3.3 UI habitación — mensaje inactiva + botones disabled
- [x] 3.4 Migración automática en login/seed (`runAdminMigrations`)

## 4. Frontend dashboard (RBAC + ABM)

- [x] 4.1 `AppContext` — `systemRole` en sesión (vía login GET)
- [x] 4.2 Guard `/estadisticas` — supervisor+
- [x] 4.3 Guard `/dashboard/admin` — admin only
- [x] 4.4 `/dashboard/admin` — tabs ABM (4 entidades)

## 5. Dashboard staff UI (extensión)

- [x] 5.1 `DashboardShell`: logo, pestañas Llamador/Admin/Estadísticas, estado escucha
- [x] 5.2 `UserMenu`: dropdown usuario + Telegram + cerrar sesión
- [x] 5.3 Tema oscuro `staff-theme` (login, llamador, admin, estadísticas)
- [x] 5.4 `GET /api/staff/catalog` — pisos/sectores para Llamador
- [x] 5.5 Llamador: selects catálogo + botones apilados Activar/Desactivar toggle
- [x] 5.6 `DELETE /api/staff/session` + `clearListenConfig`
- [x] 5.7 `StaffListenProvider` — SSE y alertas persisten entre pestañas

## 6. Tests y docs

- [x] 6.1 Unit: roles + room-key-gen
- [x] 6.2 `npm run build` + `npm run test:unit` (37 tests)
- [x] 6.3 Actualizar `docs/runbook.md`
- [x] 6.4 verify-report + documentación para archivar
- [ ] 6.5 Unit/e2e guards por rol (opcional, no bloqueante)
