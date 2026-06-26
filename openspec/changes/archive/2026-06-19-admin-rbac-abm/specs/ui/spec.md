# UI — Delta: admin-rbac-abm

## ADDED Requirements

### REQ-UI-021: Shell dashboard staff

Authenticated staff routes (`/dashboard`, `/dashboard/admin`, `/estadisticas`) MUST use a shared dark shell (`#0d1b2a`) with:

1. Header: institution logo, listen status, user menu
2. Tab navigation: **Llamador**, **Administración** (admin only), **Estadísticas** (supervisor+)

Telegram link/unlink MUST live in the user menu dropdown, not as a standalone card on the Llamador page.

#### Scenario: admin ve pestaña ABM
- **GIVEN** `systemRole: admin`
- **WHEN** viewing any staff shell page
- **THEN** Administración tab MUST be visible

### REQ-UI-025: Llamador — catálogo y escucha

On `/dashboard` (Llamador):

- Floor and sector MUST be `<select>` options loaded from `GET /api/staff/catalog` (active floors/sectors)
- Two full-width stacked action buttons: **Probar sonido** and a toggle **Activar escucha** / **Desactivar escucha** based on live listen connection
- `DELETE /api/staff/session` MUST deactivate server listen session

#### Scenario: escucha persiste entre pestañas
- **GIVEN** user activated listen on Llamador
- **WHEN** navigating to Administración or Estadísticas without deactivating
- **THEN** header MUST still show **En línea** (SSE remains connected via global provider)

### REQ-UI-021 (legacy): Entrada administración desde dashboard home

Superseded by REQ-UI-021 shell tabs. ABM MUST NOT be linked from habitación routes.

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
