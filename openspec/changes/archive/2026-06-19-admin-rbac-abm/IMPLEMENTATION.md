# Implementación — admin-rbac-abm

Resumen técnico para archivar el change. Detalle de verificación en [verify-report.md](./verify-report.md).

## Alcance entregado

### A. RBAC y ABM (propuesta original)

- Roles `user` | `supervisor` | `admin` en `users` + JWT
- APIs `/api/admin/{users,floors,sectors,rooms}`
- UI `/dashboard/admin` con 4 pestañas
- Guards en `/estadisticas` (supervisor+) y admin (admin)
- Habitación inactiva: 403 en llamados + UI tablet
- Migración idempotente `runAdminMigrations()` en login/seed

### B. roomKey legible

- `room-{número}-key` (ej. `room-101-key`)
- Colisión: `room-101-2-key`
- Denorm `room.floor` = `floor.name`

### C. Dashboard staff UI

- `DashboardShell`: logo, tabs, estado escucha, `UserMenu`
- Tema `staff-theme` (#0d1b2a) en login, llamador, admin, estadísticas
- Telegram en dropdown del usuario

### D. Llamador mejorado

- `GET /api/staff/catalog` para selects piso/sector
- Botones apilados: Probar sonido + toggle Activar/Desactivar
- `DELETE /api/staff/session`

### E. Escucha persistente

- `StaffListenProvider` en layout raíz
- SSE + alertas activas en Llamador, Admin y Estadísticas

### F. Comportamiento documentado (sin cambio de código)

- Logout no desactiva `staff_sessions`
- Telegram usa sesión servidor, no login browser

## Archivos nuevos principales

```
web/lib/staff-theme.ts
web/lib/room-key-gen.ts
web/lib/admin-auth.ts
web/lib/admin-migrate.ts
web/lib/admin-catalog.ts
web/lib/system-roles.ts
web/context/StaffListenContext.tsx
web/components/StaffListenBridge.tsx
web/components/dashboard/DashboardShell.tsx
web/components/dashboard/UserMenu.tsx
web/components/admin/AdminPanel.tsx
web/hooks/useTelegramLink.ts
web/app/api/admin/**
web/app/api/staff/catalog/route.ts
web/app/dashboard/admin/page.tsx
```

## Archivar (pasos SDD)

1. Revisar [verify-report.md](./verify-report.md) — sign-off ✅
2. Fusionar deltas `specs/{auth,rooms,ui}/spec.md` → `openspec/specs/`
3. Mover carpeta a `openspec/changes/archive/2026-06-19-admin-rbac-abm/` (o fecha de deploy)
4. Actualizar `state.yaml` del archivo con `status: archived`
5. Quitar entrada de “Changes activos” en `docs/quick-map.md`

## Tests

```bash
cd web && npm run test:unit   # 37 passed
cd web && npm run build       # OK
```
