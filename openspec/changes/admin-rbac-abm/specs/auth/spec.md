# Auth — Delta: admin-rbac-abm

## ADDED Requirements

### REQ-AUTH-008: Roles de sistema

The system MUST assign each dashboard user a `systemRole`: `user`, `supervisor`, or `admin`.

Permissions MUST be cumulative:

| Role | Capabilities |
|------|--------------|
| `user` | Dashboard escucha/llamados, Telegram |
| `supervisor` | `user` + `/estadisticas` |
| `admin` | `supervisor` + ABM administración |

#### Scenario: user sin estadísticas
- **GIVEN** authenticated user with `systemRole: user`
- **WHEN** opening `/estadisticas`
- **THEN** client MUST redirect to `/dashboard` or show 403

#### Scenario: supervisor con estadísticas
- **GIVEN** `systemRole: supervisor`
- **WHEN** opening `/estadisticas`
- **THEN** page SHALL load normally

#### Scenario: admin ABM
- **GIVEN** `systemRole: admin`
- **WHEN** opening `/dashboard/admin`
- **THEN** ABM UI SHALL be available

### REQ-AUTH-009: JWT con systemRole

Login and token validation MUST include `systemRole` in the user profile returned to the client and SHOULD embed it in the JWT payload.

Protected admin APIs MUST reject tokens from users without `systemRole: admin` with 403.

#### Scenario: API admin sin permiso
- **GIVEN** JWT for `user`
- **WHEN** POST `/api/admin/users`
- **THEN** response MUST be 403

### REQ-AUTH-010: ABM usuarios (admin)

Admin MUST manage users via authenticated admin APIs:

- Create with email, name, `systemRole`, password (bcrypt server-side)
- Update name, `systemRole`, active flag
- Reset password on edit
- Soft-delete via `active: false`

#### Scenario: Último admin
- **GIVEN** only one active admin remains
- **WHEN** admin attempts to deactivate that user
- **THEN** API MUST return 409

#### Scenario: Password nunca expuesta
- **WHEN** any user API responds
- **THEN** `passwordHash` MUST NOT be included

## MODIFIED Requirements

### REQ-AUTH-005: Estado cliente

`AppContext` MUST expose `user.systemRole` for UI guards (estadísticas, admin card).

### REQ-AUTH-001: Login staff

Successful login response MUST include `systemRole` in the user object.

## REMOVED Requirements

_None._
