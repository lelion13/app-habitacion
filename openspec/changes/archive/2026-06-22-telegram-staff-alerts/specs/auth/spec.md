# Auth — Delta telegram-staff-alerts

## ADDED Requirements

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
