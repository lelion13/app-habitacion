# Realtime — Delta telegram-call-actions

## ADDED Requirements

### REQ-RT-006: Consistencia SSE tras acción Telegram

Accept or complete performed via Telegram MUST publish the same SSE events as dashboard `PATCH /api/calls/{id}`.

#### Scenario: Atender desde Telegram actualiza dashboard
- **GIVEN** dashboard open with active SSE listen
- **WHEN** another client accepts via Telegram
- **THEN** dashboard SHALL receive `call:updated` with `accepted` status

#### Scenario: Finalizar desde Telegram
- **WHEN** complete via Telegram
- **THEN** `call:updated` terminal event SHALL reach room and staff subscribers

### REQ-RT-007: Edición mensajes Telegram

On call state transition triggered by Telegram or dashboard, system SHOULD attempt to edit all stored Telegram alert messages for that call.

#### Scenario: Aceptado desde dashboard
- **GIVEN** Telegram alerts sent with **Atender** buttons
- **WHEN** staff accepts from dashboard
- **THEN** Telegram messages SHOULD be edited to reflect accepted state (buttons removed or **Finalizar** for accepter only)
