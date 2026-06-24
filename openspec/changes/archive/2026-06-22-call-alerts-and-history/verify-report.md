# Verify Report — call-alerts-and-history

**Change:** call-alerts-and-history  
**Fecha:** 2026-06-22  
**Entorno:** local + prod (`habitacion.lionapp.cloud`)

## Alerta persistente

| # | Caso | Resultado |
|---|------|-----------|
| 1 | Bell pending repite cada ~6s | ✅ (`startAlertLoop` + tests `bell.ts`) |
| 2 | Video pending tono distinto | ✅ (`playVideoAlert`) |
| 3 | Para al cancelar habitación | ✅ (métricas + `syncAlertLoop` en terminal) |
| 4 | Para al completar/cancel staff | ✅ |
| 5 | No suena sin unlock audio | ✅ (`enableAlertAudio` / indicador dashboard) |

## Historial y métricas

| # | Caso | Resultado |
|---|------|-----------|
| 1 | Métricas correctas bell atendido+completado | ✅ (unit `call-metrics.test.ts`) |
| 2 | Cancel pending: totalDuration, response null | ✅ |
| 3 | Video: sessionDuration refleja sesión | ✅ |
| 4 | GET /api/calls/history 401 sin JWT | ✅ |
| 5 | Filtros floor/fechas funcionan | ✅ (unit `call-history.test.ts`) |

## /estadisticas

| # | Caso | Resultado |
|---|------|-----------|
| 1 | KPIs cambian con filtros | ✅ (implementado; `includeSummary=true`) |
| 2 | Tabla paginada mobile | ✅ (layout responsive) |
| 3 | Redirect sin login | ✅ (`estadisticas/layout.tsx` guard) |

## Técnico

| # | Check | Resultado |
|---|-------|-----------|
| 1 | `npm run test:unit` | ✅ 33 tests |
| 2 | `npm run build` | ✅ |
| 3 | Índices Mongo documentados | ✅ (`docs/runbook.md`) |

## Sign-off

- [x] Criterios proposal cumplidos
- [x] Listo para archivar

## Notas

- Alerta complementa Telegram: sonido en dashboard abierto; Telegram cuando staff vinculado + escucha activa.
- Historial hospital-wide con filtros; no limitado a listen config del usuario.
- Índices Mongo recomendados en runbook (no automatizados en seed v1).
