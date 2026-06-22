# Calls — Llamados

## Requirements

### REQ-CALL-001: Crear llamado
A room MUST be able to create a call to a target role with type `bell` or `video`.

#### Scenario: Llamado timbre exitoso
- **GIVEN** no active call for the room
- **WHEN** POST `/api/calls` with valid `{ type: "bell", targetRole }` and roomKey
- **THEN** a call with status `pending` SHALL be created and staff SHALL be notified via SSE
- **AND** staff with active listen session (matching floor/sector/targetRole) AND linked Telegram SHALL receive exactly one Telegram message (async)

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

#### Scenario: Aceptar video habilita signaling
- **GIVEN** a pending call with `type: "video"`
- **WHEN** PATCH `/api/calls/{id}` with `{ action: "accept" }`
- **THEN** status SHALL become `accepted`
- **AND** POST `/api/calls/{id}/signal` SHALL be permitted for room and staff until terminal status

#### Scenario: Signaling rechazado si no es video
- **GIVEN** an accepted call with `type: "bell"`
- **WHEN** POST `/api/calls/{id}/signal`
- **THEN** the response MUST be 400

#### Scenario: Signaling rechazado si no accepted
- **GIVEN** a call in status `pending`
- **WHEN** POST `/api/calls/{id}/signal`
- **THEN** the response MUST be 409

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

### REQ-CALL-009: Señalización WebRTC
The system MUST relay WebRTC signaling messages between room and staff for an accepted video call.

#### Scenario: Room envía offer
- **GIVEN** accepted video call for room R
- **WHEN** POST `/api/calls/{id}/signal` with `{ from: "room", type: "offer", payload }` and valid roomKey
- **THEN** staff subscribed to the call's floor/sector/targetRole SHALL receive SSE `webrtc:signal`

#### Scenario: Staff envía answer
- **GIVEN** accepted video call
- **WHEN** POST with JWT and `{ from: "staff", type: "answer", payload }`
- **THEN** room subscribed to `room:{roomId}` SHALL receive SSE `webrtc:signal`

#### Scenario: ICE candidate
- **WHEN** either party POST `{ type: "ice", payload }`
- **THEN** the opposite party SHALL receive the event via SSE or buffered GET

### REQ-CALL-010: Autorización signaling

| `from` | Auth required |
|--------|---------------|
| `room` | Valid `roomKey` matching the call's room |
| `staff` | Valid JWT |

Unauthorized attempts MUST return 401.

### REQ-CALL-014: Destinatarios Telegram

Telegram notification MUST be sent only when ALL are true:
1. Call just created (`status: pending`)
2. `staff_sessions` row with `active: true` matching `call.floor`, `call.sector`, `call.targetRole`
3. Corresponding `users` row with `telegramChatId` set and `telegramNotifyEnabled !== false`

#### Scenario: Videollamada creada
- **GIVEN** no active call for the room
- **WHEN** POST with `{ type: "video", targetRole }`
- **THEN** same notification rules apply; message MUST indicate videollamada

#### Scenario: Sin escucha activa
- **GIVEN** user has Telegram linked but no active `staff_sessions` for that zone/role
- **WHEN** call is created
- **THEN** user MUST NOT receive Telegram message

#### Scenario: Múltiples staff en escucha
- **GIVEN** two users with active matching sessions and Telegram linked
- **WHEN** one call is created
- **THEN** both MUST receive one message each

#### Scenario: Sin re-envío
- **GIVEN** call remains `pending`
- **WHEN** time passes without status change
- **THEN** system MUST NOT send additional Telegram messages for that call (v1)

### REQ-CALL-015: Contenido mensaje Telegram

Telegram message MUST include: room label/number, floor, sector, call type, target role, timestamp, link to dashboard (`NEXT_PUBLIC_APP_URL/dashboard`).
Message MUST NOT include `roomKey` or secrets.
Delivery is **private DM** to each linked staff member (`sendMessage` to `telegramChatId`), not a group broadcast.

## Target roles

Same as auth listen roles: `nurse`, `quality`, `doctor`.

## Out of scope

- Cola de prioridad entre habitaciones
- Reasignación de llamado a otro rol
- Historial / auditoría prolongada
- TURN server (NAT estricto — ver backlog)
