# Calls — Delta telegram-call-actions

## MODIFIED Requirements

### REQ-CALL-015: Contenido mensaje Telegram (MODIFIED)

Telegram alert MUST include room, floor, sector, type, target role, timestamp.

**Bell** (`type: bell`): message MUST include inline button **Atender** while `pending`; after accept by the clicker, same message MUST be edited to show **Finalizar** for the accepting user only.

**Video** (`type: video`): message MUST include URL button **Unirse a video** pointing to a one-time magic link (`/join/video?token=…`) valid for that staff user and call.

Message MUST NOT include `roomKey`. Dashboard link MAY remain as secondary text link.

#### Scenario: Alerta timbre con botón Atender
- **GIVEN** call `pending`, staff with active listen + Telegram linked
- **WHEN** alert is sent
- **THEN** message SHALL include inline **Atender** and stored `messageId` per recipient

#### Scenario: Alerta video con link mágico
- **GIVEN** call `pending` type `video`
- **WHEN** alert is sent to staff user U
- **THEN** URL button SHALL contain token bound to `callId` + `userId` U

## ADDED Requirements

### REQ-CALL-016: Aceptar llamado desde Telegram

Staff MUST accept a `pending` call via Telegram `callback_query` when authorized (active listen session matching call + linked `telegramChatId` equals sender chat).

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
- **WHEN** GET `/join/video?token=…`
- **THEN** page SHALL establish staff WebRTC session for that call

#### Scenario: Token expirado o usado
- **WHEN** token invalid, expired, or already consumed
- **THEN** page MUST show error without exposing internals

#### Scenario: Accept implícito al unirse video
- **GIVEN** video call still `pending`
- **WHEN** authorized staff opens magic link
- **THEN** system MAY auto-accept on first join (same race rules as **Atender**)
