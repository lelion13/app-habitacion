# Tasks — Alertas persistentes + historial

## Fase 1 — Specs

- [x] 1.1 Delta `specs/calls/spec.md`
- [x] 1.2 Delta `specs/ui/spec.md`
- [x] 1.3 Delta `specs/realtime/spec.md`
- [x] 1.4 Design.md

## Fase 2 — Backend métricas

- [x] 2.1 Ampliar `Call` en `lib/types.ts` + `serializeCall`
- [x] 2.2 Crear `lib/call-metrics.ts` + tests unitarios
- [x] 2.3 PATCH `[id]/route.ts` — persistir métricas en accept/complete/cancel
- [x] 2.4 PATCH `room/route.ts` — métricas en cancel
- [x] 2.5 Índices Mongo (documentados en `docs/runbook.md`)

## Fase 3 — API historial

- [x] 3.1 `GET /api/calls/history` con filtros + paginación
- [x] 3.2 Agregados `summary` (`includeSummary=true`)
- [x] 3.3 Tests unitarios query builder / métricas agregadas

## Fase 4 — Alerta persistente (frontend)

- [x] 4.1 `playVideoAlert` + `startAlertLoop` / `stopAlertLoop` en `lib/bell.ts`
- [x] 4.2 Refactor `dashboard/page.tsx` — loop según pending, bell+video
- [x] 4.3 Indicador alerta bloqueada / activa
- [x] 4.4 Tests `bell.ts` (loop start/stop)

## Fase 5 — UI estadísticas

- [x] 5.1 `app/estadisticas/layout.tsx` — guard JWT
- [x] 5.2 `app/estadisticas/page.tsx` — filtros, KPIs, tabla
- [x] 5.3 Enlace desde dashboard nav → `/estadisticas`
- [x] 5.4 Formato duraciones legible (ms → texto)

## Fase 6 — Verificación

- [x] 6.1 Manual: timbre pending repite hasta atender o cancel
- [x] 6.2 Manual: video pending repite con tono distinto
- [x] 6.3 Manual: `/estadisticas` KPIs + filtros
- [x] 6.4 `npm run test:unit` + `npm run build`
- [x] 6.5 Completar `verify-report.md`

## Fase 7 — Cierre SDD

- [x] 7.1 Fusionar deltas → `openspec/specs/`
- [x] 7.2 Archivar change

## Dependencias

```
1 → 2 → 3 → 4 → 5 → 6 → 7
```

Completado: **2026-06-22**.
