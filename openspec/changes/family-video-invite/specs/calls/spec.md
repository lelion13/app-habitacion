# Calls — Delta family-video-invite

## ADDED Requirements

### REQ-CALL-021: Llamado Familiar (modelo)

The system MUST support video calls with `targetRole: "family"`.

`family` MUST NOT be a staff listen role (`StaffRole`). Dashboard listen catalog and Telegram staff alerts MUST ignore `family` calls.

A family call MUST store at minimum:

| Field | Purpose |
|-------|---------|
| `type` | Always `video` |
| `targetRole` | `family` |
| `inviteEmail` | Destination email (full value in DB) |
| `inviteMessage` | Optional message from room |
| `familyInviteSentAt` | When SMTP send succeeded (or attempted timestamp documented) |

Application logs MUST NOT print the full invite email in clear text.

#### Scenario: Crear invite Familiar
- **GIVEN** room has no active call (`pending` / `accepted`)
- **WHEN** authorized room requests family invite with valid email
- **THEN** a call SHALL be created with `type: video`, `targetRole: family`, `status: pending`
- **AND** a one-time join token SHALL be created (TTL 3 hours)
- **AND** an email with magic link SHALL be sent via SMTP

#### Scenario: Bloqueo si hay llamado activo
- **GIVEN** room already has an active staff or family call
- **WHEN** family invite is requested
- **THEN** the response MUST be 409
- **AND** no email MUST be sent

#### Scenario: Rate limit
- **GIVEN** room successfully created a family invite within the last hour
- **WHEN** another invite is requested
- **THEN** the response MUST be 429 with Spanish error
- **AND** no new call MUST be created

### REQ-CALL-022: Token join Familiar

Magic link tokens for family joins MUST be:

- Cryptographically random
- Bound to `callId` and `roomId`
- TTL **3 hours** from creation
- **One-time** (atomic consume)

Exchange endpoint MUST return a short-lived JWT scoped to that family call (`scope: "family-join"`, `callId`).

#### Scenario: Token válido
- **GIVEN** unused non-expired family token for pending/accepted family call
- **WHEN** token is exchanged
- **THEN** token SHALL be marked used
- **AND** if call is still `pending`, it SHALL become `accepted` (atomic)
- **AND** JWT scoped to that call SHALL be returned

#### Scenario: Token inválido / usado / expirado
- **WHEN** token is invalid, used, or expired
- **THEN** exchange MUST fail with generic Spanish error
- **AND** call state MUST NOT change due to the failed exchange

### REQ-CALL-023: Exclusión mutua habitación

While a family call is `pending` or `accepted`, the room MUST NOT create staff calls (`nurse` / `quality` / `doctor`, bell or video).

While any staff call is active, the room MUST NOT create a family invite.

#### Scenario: Staff bloqueado durante Familiar
- **GIVEN** family call `pending` or `accepted` for the room
- **WHEN** room attempts POST staff call
- **THEN** response MUST be 409

### REQ-CALL-024: Finalización Familiar

Either room or family guest MUST be able to end an active family video call.

- Room: existing room cancel/complete path appropriate to status
- Family guest: complete via scoped JWT on the call (no cancel of unrelated calls)

Terminal transition MUST persist metrics per REQ-CALL-011.

#### Scenario: Familiar finaliza
- **GIVEN** family call `accepted`
- **WHEN** guest completes with valid family-join JWT for that callId
- **THEN** status SHALL become `completed`
- **AND** room SSE SHALL receive `call:updated`

#### Scenario: Habitación finaliza
- **GIVEN** family call `pending` or `accepted`
- **WHEN** room cancels/ends via room API with valid roomKey
- **THEN** call SHALL become terminal
- **AND** guest client SHALL tear down WebRTC when it observes terminal status

### REQ-CALL-025: Historial y analytics Familiar

`GET /api/calls/history` and chart aggregations MUST treat `targetRole: family` as a first-class role labeled «Familiar» in UI.

Family calls MUST appear in supervisor statistics when filters match.

#### Scenario: Filtro por rol Familiar
- **GIVEN** completed family calls in range
- **WHEN** history requested with `targetRole=family`
- **THEN** only family calls SHALL be returned

## MODIFIED Requirements

### REQ-CALL-001: Crear llamado (MODIFIED)

Creating a staff call MUST also fail with 409 when the room has an active **family** call.

Staff call creation MUST continue to require `targetRole` in `{ nurse, quality, doctor }` (not `family`).

Family invites MUST use a dedicated invite API (not `POST /api/calls` with `targetRole: family` from arbitrary clients without roomKey rules documented in design).

#### Scenario: Llamado staff bloqueado por Familiar activo
- **GIVEN** active family call for the room
- **WHEN** POST `/api/calls` with staff targetRole
- **THEN** 409

### REQ-CALL-014: Destinatarios Telegram (MODIFIED)

Telegram notification MUST NOT be sent for calls with `targetRole: family`.

#### Scenario: Invite Familiar sin Telegram
- **GIVEN** staff with active listen in same floor/sector
- **WHEN** family invite is created
- **THEN** no Telegram alert MUST be sent
