# Auth — Staff dashboard

## Requirements

### REQ-AUTH-001: Login staff
The system MUST authenticate dashboard users with email and password.

#### Scenario: Login exitoso
- **GIVEN** a user exists with a bcrypt password hash
- **WHEN** valid credentials are POSTed to `/api/auth/login`
- **THEN** the response SHALL include a JWT and user profile `{ id, email, name }`

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

### REQ-AUTH-005: Estado cliente
The dashboard client MUST persist JWT in `localStorage` and expose `user`, `token`, and `listenConfig` via `AppContext`.

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
- RBAC beyond listen role selection
- OAuth / SSO
