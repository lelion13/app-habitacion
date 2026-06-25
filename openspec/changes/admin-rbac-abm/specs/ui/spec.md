# UI — Delta: admin-rbac-abm

## ADDED Requirements

### REQ-UI-021: Entrada administración desde dashboard home

Only users with `systemRole: admin` MUST see an **Administración** entry on `/dashboard` home linking to `/dashboard/admin`.

ABM MUST NOT be linked from global nav, estadísticas, or habitación routes.

#### Scenario: user no ve admin
- **GIVEN** `systemRole: user`
- **WHEN** viewing `/dashboard`
- **THEN** Administración link MUST NOT appear

### REQ-UI-022: Pantalla admin con pestañas

Route `/dashboard/admin` MUST present tabbed ABM:

1. Usuarios
2. Pisos
3. Sectores
4. Habitaciones

Mobile-first; forms for create/edit; confirm before deactivate.

Habitación form MUST show `roomKey` read-only after creation.

### REQ-UI-023: Estadísticas por rol

Link to `/estadisticas` on dashboard MUST be visible only for `supervisor` and `admin`.

`/estadisticas` layout MUST reject `user` role (redirect).

### REQ-UI-024: Habitación inactiva — mensaje UI

When room is inactive, `/habitacion` MUST display a prominent message that the room is inactive and calls are disabled; call buttons MUST be disabled.

## MODIFIED Requirements

### REQ-UI-004: Dashboard escucha

Unchanged for `user`+. Telegram and listen config remain available to all authenticated staff roles.

### REQ-UI-014: Pantalla estadísticas

Access MUST require `systemRole` of `supervisor` or `admin` (not merely JWT).

## REMOVED Requirements

_None._
