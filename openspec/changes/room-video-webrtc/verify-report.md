# Verify Report — room-video-webrtc

**Change:** room-video-webrtc  
**Fecha:** _pendiente_  
**Entorno:** _local / prod_

## Checklist funcional

| # | Caso | Resultado | Notas |
|---|------|-----------|-------|
| 1 | Habitación solicita video | ☐ | |
| 2 | Dashboard atiende llamado | ☐ | |
| 3 | Habitación muestra UI video (no solo banner) | ☐ | |
| 4 | Permisos cámara/mic solicitados en habitación | ☐ | |
| 5 | Staff abre `/dashboard/video/{id}` | ☐ | |
| 6 | Stream remoto visible en dashboard | ☐ | |
| 7 | Stream remoto visible en habitación | ☐ | |
| 8 | Audio bidireccional perceptible | ☐ | |
| 9 | Finalizar call → tracks detenidos | ☐ | |
| 10 | Cancelar desde habitación → cleanup | ☐ | |
| 11 | Timbre (bell) sin regresión | ☐ | |

## Checklist técnico

| # | Verificación | Resultado |
|---|--------------|-----------|
| 1 | `npm run test:unit` | ☐ |
| 2 | `npm run build` | ☐ |
| 3 | Signaling solo en calls accepted+video | ☐ |
| 4 | roomKey/JWT enforced en `/signal` | ☐ |

## Issues encontrados

_Documentar durante implementación._

## Sign-off

- [ ] Criterios de éxito de proposal.md cumplidos
- [ ] Listo para archivar change SDD
