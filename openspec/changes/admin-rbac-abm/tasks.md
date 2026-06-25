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

## 3. Integración llamados / habitación

- [x] 3.1 `GET /api/room` — indicar inactiva
- [x] 3.2 `POST /api/calls` — 403 habitación inactiva
- [x] 3.3 UI habitación — mensaje inactiva + botones disabled
- [x] 3.4 Migración automática en login/seed (`runAdminMigrations`)

## 4. Frontend dashboard

- [x] 4.1 `AppContext` — `systemRole` en sesión (vía login GET)
- [x] 4.2 Dashboard home: card Administración (admin); Estadísticas por rol
- [x] 4.3 `/dashboard/admin` — tabs ABM (4 entidades)
- [x] 4.4 Guard `/estadisticas` — supervisor+
- [x] 4.5 Guard `/dashboard/admin` — admin only

## 5. Tests y docs

- [x] 5.1 Unit: roles + roomKey generation
- [ ] 5.2 Unit/e2e: guards por rol (mínimo)
- [x] 5.3 `npm run build` + `npm run test:unit`
- [x] 5.4 Actualizar runbook (primer admin, migración prod)
- [ ] 5.5 verify-report + archivar change
