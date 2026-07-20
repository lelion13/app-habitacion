# Calls — Delta call-analytics-enrichment

## ADDED Requirements

### REQ-CALL-019: Canal de atención y cierre

Each call MAY store:

| Field | Values | Set when |
|-------|--------|----------|
| `acceptedChannel` | `web` \| `telegram` | `accept` transition |
| `completedChannel` | `web` \| `telegram` | `complete` transition |

Channel MUST reflect the client surface that performed the action (not inferred later).

#### Scenario: Atender desde dashboard
- **WHEN** staff accepts via PATCH `/api/calls/{id}`
- **THEN** `acceptedChannel` SHALL be `web`

#### Scenario: Atender desde Telegram
- **WHEN** staff accepts via Telegram callback
- **THEN** `acceptedChannel` SHALL be `telegram`

#### Scenario: Video join Telegram
- **WHEN** staff auto-accepts via `/join/video` magic link
- **THEN** `acceptedChannel` SHALL be `telegram`

#### Scenario: Finalizar desde Telegram
- **WHEN** staff completes bell via Telegram **Finalizar**
- **THEN** `completedChannel` SHALL be `telegram`

#### Scenario: Finalizar desde web
- **WHEN** staff completes via dashboard or video page PATCH
- **THEN** `completedChannel` SHALL be `web`

#### Scenario: Cancel habitación
- **WHEN** room cancels without staff accept
- **THEN** `acceptedChannel` and `completedChannel` MUST remain unset

#### Scenario: Llamado histórico pre-change
- **GIVEN** call created before channel tracking deploy
- **WHEN** listed in history
- **THEN** channel fields MAY be null

### REQ-CALL-020: Historial enriquecido

`GET /api/calls/history` serialized calls SHOULD include `acceptedByName` when `acceptedBy` is set.

When `includeCharts=true`, response MUST include chart series for the active filter window:

- Calls per day (total, bell, video)
- Average response time per day
- Channel split (accepted / completed: web, telegram, unknown)
- Breakdown by floor, sector, targetRole

Chart aggregation MUST use the same filter `match` as the paginated list.

#### Scenario: Filtro piso aplicado
- **WHEN** history requested with `floor=1` and `includeCharts=true`
- **THEN** all chart series MUST reflect only floor 1

#### Scenario: Ventana máxima
- **WHEN** date range exceeds 90 days
- **THEN** API MUST return 400 or clamp range (documented in runbook)
