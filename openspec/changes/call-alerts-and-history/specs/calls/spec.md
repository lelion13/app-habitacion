# Calls — Delta call-alerts-and-history

## ADDED Requirements

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

## MODIFIED Requirements

### REQ-CALL-008: Modelo de datos (MODIFIED)

Each call MUST store denormalized `roomNumber`, `floor`, `sector` for query performance and display.

Each call MAY store computed metrics: `responseTimeMs`, `totalDurationMs`, `sessionDurationMs` (numbers, milliseconds).

MongoDB indexes SHOULD exist on `{ createdAt: -1 }`, `{ floor: 1, sector: 1, targetRole: 1 }`, `{ status: 1 }` for history queries.

## REMOVED Requirements

### Out of scope item: Historial / auditoría prolongada

(Reason: now in scope via REQ-CALL-012 and REQ-CALL-013)
