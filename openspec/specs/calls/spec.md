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

Each call MAY store computed metrics: `responseTimeMs`, `totalDurationMs`, `sessionDurationMs` (numbers, milliseconds).

MongoDB indexes SHOULD exist on `{ createdAt: -1 }`, `{ floor: 1, sector: 1, targetRole: 1 }`, `{ status: 1 }` for history queries (see runbook).

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

### REQ-CALL-011: Métricas de llamada

The system MUST compute and persist call metrics on the backend when status transitions occur.

| Field | When set | Formula |
|-------|----------|---------|
| `responseTimeMs` | `accept` | `acceptedAt − createdAt` |
| `totalDurationMs` | terminal (`completed` / `cancelled`) | `completedAt − createdAt` |
| `sessionDurationMs` | terminal **and** `acceptedAt` present | `completedAt − acceptedAt` |

Terminal transitions MUST set `completedAt` (existing behavior). If call never accepted, `responseTimeMs` and `sessionDurationMs` MUST remain unset/null.

#### Scenario: Timbre atendido y completado
- **GIVEN** call `type: "bell"`, `pending` at T0
- **WHEN** staff accepts at T1 and completes at T2
- **THEN** `responseTimeMs = T1−T0`, `totalDurationMs = T2−T0`, `sessionDurationMs = T2−T1`

#### Scenario: Cancel desde habitación sin atender
- **GIVEN** call `pending` at T0
- **WHEN** room cancels at T1
- **THEN** status `cancelled`, `totalDurationMs = T1−T0`, `responseTimeMs` null

#### Scenario: Videollamada completa
- **GIVEN** video call accepted at T1, completed at T2
- **THEN** all three metrics MUST be persisted; `sessionDurationMs` reflects video session length

### REQ-CALL-012: Historial staff

Authenticated staff MUST query call history via `GET /api/calls/history`.

Query params (all optional except auth): `from`, `to`, `floor`, `sector`, `targetRole`, `roomNumber`, `type`, `status`, `page`, `limit`, `includeSummary`.

Response MUST include:
- `calls`: paginated list with metrics and timestamps
- `summary` (when `includeSummary=true`): aggregates for current filter — at minimum `totalCalls`, `avgResponseTimeMs`, `avgSessionDurationMs`, `bellCount`, `videoCount`

Scope MUST NOT be limited to staff listen config (hospital-wide with filters).

#### Scenario: Listado filtrado
- **GIVEN** valid JWT
- **WHEN** GET with `floor=1&status=completed&from=2026-06-01`
- **THEN** response SHALL contain only matching terminal/active records per filters

#### Scenario: Sin JWT
- **WHEN** GET without valid token
- **THEN** 401

### REQ-CALL-013: Retención historial

Call documents MUST NOT be deleted on terminal status. No TTL purge in v1.

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

Telegram alert MUST include: room label/number, floor, sector, call type, target role, timestamp, link to dashboard (`NEXT_PUBLIC_APP_URL/dashboard`).

**Bell** (`type: bell`): message MUST include inline button **Atender** while `pending`; after accept by the clicker, same message MUST be edited to show **Finalizar** for the accepting user only.

**Video** (`type: video`): message MUST include URL button **Unirse a video** pointing to a one-time magic link (`/join/video?token=…`) valid for that staff user and call.

Message MUST NOT include `roomKey` or secrets.
Delivery is **private DM** to each linked staff member (`sendMessage` to `telegramChatId`), not a group broadcast.
Each sent alert MUST store `telegramAlerts[]` on the call document (`userId`, `chatId`, `messageId`) for later `editMessageText`.

#### Scenario: Alerta timbre con botón Atender
- **GIVEN** call `pending`, staff with active listen + Telegram linked
- **WHEN** alert is sent
- **THEN** message SHALL include inline **Atender** and stored `messageId` per recipient

#### Scenario: Alerta video con link mágico
- **GIVEN** call `pending` type `video`
- **WHEN** alert is sent to staff user U
- **THEN** URL button SHALL contain token bound to `callId` + `userId` U

### REQ-CALL-016: Aceptar llamado desde Telegram

Staff MUST accept a `pending` call via Telegram `callback_query` when authorized (active listen session matching call + linked `telegramChatId` equals sender chat).

Accept MUST be race-safe (`findOneAndUpdate` with `status: pending`).

#### Scenario: Atender timbre exitoso
- **GIVEN** call `pending` type `bell`
- **WHEN** authorized staff taps **Atender**
- **THEN** call status SHALL become `accepted` with `acceptedBy` / `acceptedAt`
- **AND** SSE `call:updated` SHALL fire
- **AND** Telegram message SHALL be edited (status + **Finalizar** for accepter)

#### Scenario: Primer click gana
- **GIVEN** two staff received the same alert
- **WHEN** staff A accepts first
- **THEN** staff B tapping **Atender** MUST NOT change call state
- **AND** B's message SHALL be edited to indicate already handled (no action buttons)

#### Scenario: Sin escucha activa al tocar botón
- **GIVEN** staff had listen active at alert time but deactivated before tap
- **WHEN** **Atender** is pressed
- **THEN** action MUST be rejected with generic callback answer
- **AND** call state MUST remain unchanged

#### Scenario: Llamado ya terminal
- **GIVEN** call `completed` or `cancelled`
- **WHEN** stale **Atender** is pressed
- **THEN** action MUST be rejected; message SHOULD be edited to reflect terminal state

### REQ-CALL-017: Finalizar timbre desde Telegram

Only the staff who accepted (`acceptedBy`) MAY complete a `bell` call via Telegram **Finalizar** while status is `accepted`.

#### Scenario: Finalizar timbre
- **GIVEN** call `accepted` type `bell` by user U
- **WHEN** U taps **Finalizar**
- **THEN** status SHALL become `completed` with metrics persisted
- **AND** message SHALL be edited to completed state without action buttons

#### Scenario: Otro staff no puede finalizar
- **GIVEN** call accepted by user A
- **WHEN** user B taps **Finalizar** on their copy
- **THEN** action MUST be rejected

### REQ-CALL-018: Join video vía token

Magic link MUST allow staff to join an accepted or concurrently-accepting video call without dashboard JWT.

#### Scenario: Abrir link válido
- **GIVEN** unused token for pending/accepted video call and matching user
- **WHEN** user opens `/join/video?token=…`
- **THEN** page SHALL establish staff WebRTC session for that call

#### Scenario: Token expirado o usado
- **WHEN** token invalid, expired, or already consumed
- **THEN** page MUST show error without exposing internals

#### Scenario: Accept implícito al unirse video
- **GIVEN** video call still `pending`
- **WHEN** authorized staff opens magic link
- **THEN** system MAY auto-accept on first join (same race rules as **Atender**)

## Target roles

Same as auth listen roles: `nurse`, `quality`, `doctor`.

## Out of scope

- Cola de prioridad entre habitaciones
- Reasignación de llamado a otro rol
- TTL purge / archivo frío de historial (v1 retiene todo)
- TURN server (NAT estricto — ver backlog)
