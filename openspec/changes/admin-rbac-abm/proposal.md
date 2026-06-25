# Proposal — RBAC + ABM administración

**Change:** admin-rbac-abm  
**Status:** Propuesta cerrada — pendiente specs finales + implementación  
**Dominios:** `auth`, `rooms`, `ui`

## Intent

Hoy pisos, sectores y habitaciones se cargan por seed; no hay roles de sistema ni pantallas de administración. Se necesita operar el hospital sin tocar Mongo manualmente: ABM de usuarios, catálogos de pisos/sectores, habitaciones, y permisos por rol.

## Roles de sistema (jerarquía acumulativa)

| Rol | Permisos |
|-----|----------|
| `user` | Dashboard escucha/llamados + vincular Telegram |
| `supervisor` | `user` + `/estadisticas` |
| `admin` | `supervisor` + ABM (usuarios, pisos, sectores, habitaciones) |

> Distinto de `StaffRole` (`nurse` / `quality` / `doctor`) = rol de **escucha** en dashboard.

## Decisiones de producto (cerradas)

| Tema | Decisión |
|------|----------|
| Pisos / sectores | Colecciones `floors` y `sectors`; habitaciones referencian por `floorId` / `sectorId` |
| `roomKey` | Auto-generado al crear; solo lectura en UI |
| Bajas | Baja lógica (`active: false`) en todas las entidades ABM |
| Habitación inactiva | Tablet resuelve habitación; mensaje claro; **no** puede iniciar llamados |
| Contraseñas | Admin define al crear y puede resetear al editar |
| UI ABM | `/dashboard/admin` con **pestañas** (Usuarios, Pisos, Sectores, Habitaciones) |
| Acceso ABM | Solo enlace/tarjeta desde **home** del dashboard; solo rol `admin` |
| Estadísticas | Solo `supervisor` y `admin`; ocultar enlace para `user` |

## Scope

### In scope

- Campo `systemRole` en `users` + claim JWT + guards API/UI
- ABM API admin (CRUD lógico) para users, floors, sectors, rooms
- UI `/dashboard/admin` (tabs) + entrada en dashboard home
- Restringir `/estadisticas` a supervisor+
- Migración: usuario seed → `admin`; usuarios existentes sin rol → `user` (script o migración en deploy)
- Denormalizar `floor`/`sector` string en `rooms` y llamados al guardar habitación

### Out of scope

- Auto-servicio cambio de contraseña por el usuario
- Rotación manual de `roomKey` / rebind tablet
- ABM desde rutas fuera del dashboard home
- Roles extra (super-admin, auditor, etc.)
- Import/export CSV

## Approach

1. Extender `User`, JWT (`systemRole`), `AuthUser`, `AppContext`
2. `lib/admin-auth.ts` — `requireAdmin`, `requireSupervisor` para API routes
3. Colecciones `floors`, `sectors`; migrar `rooms` a refs + `active`
4. APIs bajo `/api/admin/*` (JWT + rol admin)
5. Página `/dashboard/admin` con tabs; tarjeta «Administración» solo en dashboard home
6. Ajustar `GET /api/room` y `POST /api/calls` para habitación inactiva
7. Tests unitarios validación + guards; e2e login por rol

## Affected areas

| Área | Impacto |
|------|---------|
| `web/lib/types.ts`, `web/lib/auth.ts` | `systemRole`, JWT |
| `web/lib/validation.ts` | Schemas ABM |
| `web/app/api/admin/**` | New |
| `web/app/api/auth/login`, `web/app/api/room`, `web/app/api/calls` | Modified |
| `web/app/dashboard/page.tsx` | Card admin + ocultar estadísticas por rol |
| `web/app/dashboard/admin/page.tsx` | New (tabs) |
| `web/app/estadisticas/layout.tsx` | Guard supervisor+ |
| `web/context/AppContext.tsx` | `systemRole` en sesión |
| `openspec/specs/auth`, `rooms`, `ui` | Delta |

## Risks

| Riesgo | Mitigación |
|--------|------------|
| Lockout sin admin | Seed/migración garantiza ≥1 admin; documentar runbook |
| JWT sin `systemRole` (tokens viejos) | Re-login; validar rol desde DB en rutas críticas si hace falta |
| Pisos/sectores inactivos con habitaciones activas | Validar en API; advertir en UI |
| Tablets con habitación desactivada | Mensaje explícito; no romper PWA |

## Rollback

- Revert deploy GHCR; APIs admin ignoradas
- Campos nuevos opcionales en Mongo; sin drop de colecciones
- Quitar guards UI → comportamiento anterior (todo staff ve estadísticas)

## Success criteria

- [ ] `user` no accede `/estadisticas` ni `/dashboard/admin`
- [ ] `supervisor` accede estadísticas, no ABM
- [ ] `admin` gestiona los 4 ABM desde tabs
- [ ] Habitación inactiva bloquea llamados con mensaje claro
- [ ] `roomKey` generado automáticamente
- [ ] `npm run test:unit` + `npm run build` OK
