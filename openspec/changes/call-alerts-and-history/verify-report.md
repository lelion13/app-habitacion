# Verify Report — call-alerts-and-history

**Change:** call-alerts-and-history  
**Fecha:** _pendiente_  
**Entorno:** _local / prod_

## Alerta persistente

| # | Caso | Resultado |
|---|------|-----------|
| 1 | Bell pending repite cada ~6s | ☐ |
| 2 | Video pending tono distinto | ☐ |
| 3 | Para al cancelar habitación | ☐ |
| 4 | Para al completar/cancel staff | ☐ |
| 5 | No suena sin unlock audio | ☐ |

## Historial y métricas

| # | Caso | Resultado |
|---|------|-----------|
| 1 | Métricas correctas bell atendido+completado | ☐ |
| 2 | Cancel pending: totalDuration, response null | ☐ |
| 3 | Video: sessionDuration refleja sesión | ☐ |
| 4 | GET /api/calls/history 401 sin JWT | ☐ |
| 5 | Filtros floor/fechas funcionan | ☐ |

## /estadisticas

| # | Caso | Resultado |
|---|------|-----------|
| 1 | KPIs cambian con filtros | ☐ |
| 2 | Tabla paginada mobile | ☐ |
| 3 | Redirect sin login | ☐ |

## Técnico

| # | Check | Resultado |
|---|-------|-----------|
| 1 | `npm run test:unit` | ✅ 25/25 |
| 2 | `npm run build` | ✅ OK |

## Sign-off

- [ ] Criterios proposal cumplidos
- [ ] Listo para archivar
