# Calls — Delta telegram-staff-alerts

## MODIFIED Requirements

### REQ-CALL-001: Crear llamado (MODIFIED)

#### Scenario: Llamado timbre exitoso
- **GIVEN** no active call for the room
- **WHEN** POST `/api/calls` with valid `{ type: "bell", targetRole }` and roomKey
- **THEN** a call with status `pending` SHALL be created and staff SHALL be notified via SSE
- **AND** staff with active listen session (matching floor/sector/targetRole) AND linked Telegram SHALL receive exactly one Telegram message (async)

#### Scenario: Videollamada creada
- **GIVEN** no active call for the room
- **WHEN** POST with `{ type: "video", targetRole }`
- **THEN** same notification rules apply; message MUST indicate videollamada

## ADDED Requirements

### REQ-CALL-014: Destinatarios Telegram

Telegram notification MUST be sent only when ALL are true:
1. Call just created (`status: pending`)
2. `staff_sessions` row with `active: true` matching `call.floor`, `call.sector`, `call.targetRole`
3. Corresponding `users` row with `telegramChatId` set and `telegramNotifyEnabled !== false`

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

### REQ-CALL-015: Contenido mensaje

Telegram message MUST include: room label/number, floor, sector, call type, target role, timestamp, link to `https://habitacion.lionapp.cloud/dashboard`.
Message MUST NOT include `roomKey` or secrets.
