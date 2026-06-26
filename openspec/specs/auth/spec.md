# Auth — Staff dashboard

## Requirements

### REQ-AUTH-001: Login staff
The system MUST authenticate dashboard users with email and password.

#### Scenario: Login exitoso
- **GIVEN** a user exists with a bcrypt password hash
- **WHEN** valid credentials are POSTed to `/api/auth/login`
- **THEN** the response SHALL include a JWT and user profile `{ id, email, name, systemRole }`

#### Scenario: Login fallido
- **GIVEN** invalid email or password
- **WHEN** login is attempted
- **THEN** the response MUST be 401 with `{ error: string }` and a generic message

### REQ-AUTH-002: Validación de token
The system MUST validate JWT on protected API routes.

#### Scenario: Token válido
- **GIVEN** a valid Bearer token
- **WHEN** GET `/api/auth/login` is called with Authorization header
- **THEN** the user profile SHALL be returned

#### Scenario: Token inválido
- **GIVEN** missing or expired token
- **WHEN** a protected route is called
- **THEN** the response MUST be 401

### REQ-AUTH-003: Hash de contraseñas
The system MUST store passwords only as bcrypt hashes. Plain text passwords MUST NOT be persisted or logged.

### REQ-AUTH-004: Sesión de escucha
The system SHALL allow staff to register which floor, sector, and role they listen to.

#### Scenario: Guardar escucha
- **GIVEN** an authenticated user
- **WHEN** PUT `/api/staff/session` with valid `{ floor, sector, role }`
- **THEN** previous sessions for that user MUST be deactivated and a new active session SHALL be created

#### Scenario: Desactivar escucha
- **GIVEN** an authenticated user with active listen session
- **WHEN** DELETE `/api/staff/session`
- **THEN** all active `staff_sessions` for that user MUST be deactivated
- **AND** response SHALL include `{ listenConfig: null }`

### REQ-AUTH-005: Estado cliente
The dashboard client MUST persist JWT in `localStorage` and expose `user`, `token`, `listenConfig`, `listening`, and `user.systemRole` via `AppContext`.

On login or token restore, the client SHOULD sync `listenConfig` from GET `/api/staff/session` (server is source of truth for Telegram recipient matching).

### REQ-AUTH-006: Vinculación Telegram

Authenticated staff MUST link a Telegram account to receive call notifications.

#### Scenario: Generar link de vinculación
- **GIVEN** valid JWT
- **WHEN** POST `/api/staff/telegram/link`
- **THEN** response SHALL include a one-time deep link (`t.me/{bot}?start=link_{token}`) with TTL ≤ 15 minutes

#### Scenario: Completar vinculación
- **GIVEN** user opens bot with valid `link_{token}`
- **WHEN** Telegram webhook receives `/start link_{token}`
- **THEN** `users.telegramChatId` SHALL be set, `telegramNotifyEnabled` true, `telegramLinkedAt` recorded
- **AND** token MUST be invalidated (one-time)

#### Scenario: Desvincular
- **GIVEN** linked user
- **WHEN** DELETE `/api/staff/telegram` with JWT
- **THEN** telegram fields SHALL be cleared or `telegramNotifyEnabled` false

#### Scenario: Estado vinculación
- **GIVEN** valid JWT
- **WHEN** GET `/api/staff/telegram`
- **THEN** response SHALL indicate linked state (without exposing full chat id in logs)

### REQ-AUTH-007: Seguridad Telegram

- Link tokens MUST NOT be guessable; single use; short TTL
- Webhook MUST validate Telegram update structure; SHOULD use `TELEGRAM_WEBHOOK_SECRET` if configured
- `telegramChatId` MUST NOT appear in client error messages or public API responses to other users
- `callback_query` data MUST be validated (known prefix, valid ObjectId)
- Magic link tokens for video join MUST NOT be logged
- JWT from video-join MUST NOT grant admin or unrelated call access
- Webhook registration MUST include `allowed_updates: ["message", "callback_query"]`

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

### REQ-AUTH-011: Escucha staff — sesión servidor vs browser

`staff_sessions` with `active: true` represents an activated listen zone on the server.

- `PUT /api/staff/session` activates listen
- `DELETE /api/staff/session` deactivates listen
- Client `logout` clears local token only; it MUST NOT implicitly deactivate `staff_sessions` (documented behavior)

Telegram notifications for calls MUST use active `staff_sessions` matching call floor/sector/role, not browser SSE state.

#### Scenario: logout sin desactivar
- **GIVEN** user activated listen and linked Telegram
- **WHEN** user logs out without pressing Desactivar escucha
- **THEN** `staff_sessions` MAY remain active
- **AND** Telegram notifications MAY still be sent for matching calls

### REQ-AUTH-012: Autorización acciones Telegram

Telegram `callback_query` actions MUST map `chat.id` to exactly one `users` document with `telegramChatId`.

Authorization MUST re-check at action time:
1. `staff_sessions` with `active: true` matching call `floor`, `sector`, `targetRole`
2. `telegramNotifyEnabled !== false`

Failures MUST return generic callback text (no user enumeration).

#### Scenario: Chat no vinculado
- **GIVEN** callback from unknown `chatId`
- **WHEN** any call action is attempted
- **THEN** action MUST be rejected

### REQ-AUTH-013: Token join videollamada

`POST /api/staff/telegram/video-join` MUST accept `{ token }` and return short-lived JWT scoped to staff video actions for one `callId`.

| Property | Rule |
|----------|------|
| TTL token | 30 minutes from creation |
| One-time | Token MUST be invalidated after successful exchange |
| Binding | Token MUST bind `userId` + `callId` |
| JWT TTL | ≤ 2 hours or until call terminal |

#### Scenario: Canje exitoso
- **GIVEN** valid unused token
- **WHEN** POST video-join
- **THEN** response SHALL include JWT usable for signaling and complete for that call

#### Scenario: Token de otro usuario
- **GIVEN** token issued for user A
- **WHEN** exchange attempted after chatId mismatch
- **THEN** MUST return 401

## Roles de escucha

| Valor | Etiqueta UI |
|-------|-------------|
| `nurse` | Enfermería |
| `quality` | Asistente de calidad |
| `doctor` | Médico |

## Seguridad

- JWT expiration: 12 hours (current implementation)
- Auth failures MUST NOT reveal whether email exists
- `/api/seed` MUST be disabled in production (403)

## Out of scope (MVP)

- Refresh tokens
- OAuth / SSO
