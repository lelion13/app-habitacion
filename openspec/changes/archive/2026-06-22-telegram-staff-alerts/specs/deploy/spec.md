# Deploy — Delta telegram-staff-alerts

## ADDED Requirements

### REQ-DEPLOY-006: Secrets Telegram

Production stack MUST provide:
- `TELEGRAM_BOT_TOKEN` — BotFather token (required for notify + webhook)
- `TELEGRAM_BOT_USERNAME` — bot username without `@` (for deep links)
- `TELEGRAM_WEBHOOK_SECRET` — optional header validation

Values MUST NOT be committed to git; set via Hostinger project environment.

#### Scenario: Token ausente
- **GIVEN** `TELEGRAM_BOT_TOKEN` unset
- **WHEN** call is created
- **THEN** call creation MUST succeed; Telegram send MAY be skipped with server log (no user-facing error)

### REQ-DEPLOY-007: Webhook Telegram

After deploy, webhook MUST point to:
`https://habitacion.lionapp.cloud/api/telegram/webhook`

Document setup steps in `docs/deploy-hostinger.md`.
