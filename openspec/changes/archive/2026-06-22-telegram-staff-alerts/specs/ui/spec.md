# UI — Delta telegram-staff-alerts

## ADDED Requirements

### REQ-UI-016: Vinculación Telegram en dashboard

The dashboard MUST expose Telegram notification settings for authenticated staff.

#### Scenario: No vinculado
- **GIVEN** user without `telegramChatId`
- **WHEN** viewing dashboard (or settings section)
- **THEN** UI SHALL show instructions and button **Conectar Telegram** that requests link and opens `t.me` URL

#### Scenario: Vinculado
- **GIVEN** linked user
- **WHEN** viewing settings
- **THEN** UI SHALL show connected state and option to **Desvincular**

#### Scenario: Mobile-friendly
- Link open MUST work on phone (primary use case for Telegram)
