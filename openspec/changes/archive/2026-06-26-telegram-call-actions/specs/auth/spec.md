# Auth — Delta telegram-call-actions

## ADDED Requirements

### REQ-AUTH-008: Autorización acciones Telegram

Telegram `callback_query` actions MUST map `chat.id` to exactly one `users` document with `telegramChatId`.

Authorization MUST re-check at action time:
1. `staff_sessions` with `active: true` matching call `floor`, `sector`, `targetRole`
2. `telegramNotifyEnabled !== false`

Failures MUST return generic callback text (no user enumeration).

#### Scenario: Chat no vinculado
- **GIVEN** callback from unknown `chatId`
- **WHEN** any call action is attempted
- **THEN** action MUST be rejected

### REQ-AUTH-009: Token join videollamada

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
- **THEN** response SHALL include JWT usable for `PATCH` accept (if pending), signaling, and complete for that call

#### Scenario: Token de otro usuario
- **GIVEN** token issued for user A
- **WHEN** exchange attempted after chatId mismatch
- **THEN** MUST return 401

## MODIFIED Requirements

### REQ-AUTH-007: Seguridad Telegram (MODIFIED)

- `callback_query` data MUST be validated (known prefix, valid ObjectId)
- Magic link tokens MUST NOT be logged
- JWT from video-join MUST NOT grant admin or unrelated call access
