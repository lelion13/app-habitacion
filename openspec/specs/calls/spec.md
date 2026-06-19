# Calls — Llamados

## Requirements

### REQ-CALL-001: Crear llamado
A room MUST be able to create a call to a target role with type `bell` or `video`.

#### Scenario: Llamado timbre exitoso
- **GIVEN** no active call for the room
- **WHEN** POST `/api/calls` with valid `{ type: "bell", targetRole }` and roomKey
- **THEN** a call with status `pending` SHALL be created and staff SHALL be notified

#### Scenario: Llamado bloqueado por activo
- **GIVEN** the room has a call in status `pending` or `accepted`
- **WHEN** a new call is attempted
- **THEN** the response MUST be 409 with message indicating active call

### REQ-CALL-002: Estados del llamado
Call status MUST be one of: `pending`, `accepted`, `completed`, `cancelled`.

Active statuses (block new calls): `pending`, `accepted`.

Terminal statuses: `completed`, `cancelled`.

### REQ-CALL-003: Atender desde dashboard
Staff with valid JWT MUST be able to accept pending calls.

#### Scenario: Aceptar
- **GIVEN** call status is `pending`
- **WHEN** PATCH `/api/calls/{id}` with `{ action: "accept" }`
- **THEN** status SHALL become `accepted` with `acceptedBy` and `acceptedAt`

### REQ-CALL-004: Finalizar o cancelar (staff)
Staff MUST be able to complete or cancel calls in `pending` or `accepted`.

| action | Result status |
|--------|---------------|
| `complete` | `completed` |
| `cancel` | `cancelled` |

### REQ-CALL-005: Cancelar desde habitación
The room MUST cancel its active call without staff JWT.

#### Scenario: Cancel room
- **GIVEN** the room has an active call
- **WHEN** PATCH `/api/calls/room` with `{ action: "cancel" }`
- **THEN** the call SHALL become `cancelled` and staff SHALL be notified

### REQ-CALL-006: Consultar llamado activo (habitación)
GET `/api/calls/room` MUST return `{ call: SerializedCall | null }` for the configured roomKey.

### REQ-CALL-007: Listar llamados (staff)
GET `/api/calls?floor&sector&role` with JWT MUST return active calls (`pending`, `accepted`) matching the listen target.

### REQ-CALL-008: Modelo de datos
Each call MUST store denormalized `roomNumber`, `floor`, `sector` for query performance and display.

## Target roles

Same as auth listen roles: `nurse`, `quality`, `doctor`.

## Out of scope (MVP)

- Cola de prioridad entre habitaciones
- Reasignación de llamado a otro rol
- Historial / auditoría prolongada
- WebRTC signaling completo (see UI spec)
