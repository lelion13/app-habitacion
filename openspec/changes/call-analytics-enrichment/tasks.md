# Tasks — Enriquecimiento estadísticas

## Fase 1 — Specs

- [x] 1.1 `proposal.md` + decisiones producto
- [x] 1.2 Deltas `calls`, `ui`
- [x] 1.3 `design.md`

## Fase 2 — Backend

- [x] 2.1 `CallChannel` + campos en `types.ts`
- [x] 2.2 `acceptCall` / `completeCall` aceptan `{ channel }`
- [x] 2.3 Instrumentar: PATCH calls, Telegram actions, video-join, VideoCallSession complete
- [x] 2.4 `serializeCall` + `acceptedByName` (lookup o aggregate)
- [x] 2.5 `lib/call-analytics.ts` — agregaciones chart series
- [x] 2.6 Extender `GET /api/calls/history` (`includeCharts`, límite 90 días)
- [x] 2.7 Tests unitarios channel + analytics shapes

## Fase 3 — Frontend

- [x] 3.1 Agregar `recharts` (o equivalente SVG)
- [x] 3.2 `EstadisticasCharts.tsx` — 5 visualizaciones
- [x] 3.3 Actualizar `estadisticas/page.tsx` — columnas + fetch charts
- [x] 3.4 Empty states y tema oscuro

## Fase 4 — Verificación

- [ ] 4.1 Manual: atender web → canal web en tabla/gráfico
- [ ] 4.2 Manual: atender Telegram → canal telegram
- [ ] 4.3 Manual: filtros piso/sector reflejados en gráficos
- [x] 4.4 `npm run test:unit` + `npm run build`
- [x] 4.5 `verify-report.md`

## Fase 5 — Cierre SDD

- [ ] 5.1 Fusionar deltas → `openspec/specs/`
- [ ] 5.2 Actualizar `docs/runbook.md` y `quick-map.md`
- [ ] 5.3 Archivar change

## Dependencias

```
1 → 2 → 3 → 4 → 5
```

Estimación: **2 sesiones** (backend channel + API charts + UI Recharts).
