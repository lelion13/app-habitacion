# Verify Report — telegram-staff-alerts

**Change:** telegram-staff-alerts  
**Fecha:** _pendiente_  
**Entorno:** _local / prod_

## Vinculación

| # | Caso | Resultado |
|---|------|-----------|
| 1 | Generar link desde dashboard | ☐ |
| 2 | /start en bot vincula cuenta | ☐ |
| 3 | Desvincular limpia estado | ☐ |

## Notificación

| # | Caso | Resultado |
|---|------|-----------|
| 1 | Timbre + escucha activa + vinculado → 1 mensaje | ☐ |
| 2 | Video + mismas condiciones → 1 mensaje (tipo video) | ☐ |
| 3 | Vinculado sin escucha activa → sin mensaje | ☐ |
| 4 | Escucha activa sin vincular → sin mensaje | ☐ |
| 5 | No re-envío mientras pending | ☐ |

## Técnico

| # | Check | Resultado |
|---|-------|-----------|
| 1 | `npm run test:unit` | ☐ |
| 2 | `npm run build` | ☐ |
| 3 | POST /api/calls OK si Telegram caído | ☐ |

## Sign-off

- [ ] Criterios proposal cumplidos
- [ ] Listo para archivar
