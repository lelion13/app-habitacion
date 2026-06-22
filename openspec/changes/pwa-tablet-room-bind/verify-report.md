# Verify Report — pwa-tablet-room-bind

**Change:** pwa-tablet-room-bind  
**Fecha:** _pendiente_  
**Entorno:** _local / prod / tablet Chrome Android_

## Instalación PWA

| # | Caso | Resultado |
|---|------|-----------|
| 1 | Abrir `?key=room-101-key` en Chrome | ☐ |
| 2 | Banner “Instalar en esta tablet” visible | ☐ |
| 3 | Instalar → ícono nombre “Habitación 101” (o label) | ☐ |
| 4 | Abrir ícono → carga habitación sin pedir key | ☐ |
| 5 | Cerrar y reabrir ícono → sigue habitación 101 | ☐ |

## Persistencia y conflictos

| # | Caso | Resultado |
|---|------|-----------|
| 1 | Abrir PWA sin storage ni URL → pantalla soporte | ☐ |
| 2 | Pantalla soporte sin ejemplo URL / sin input | ☐ |
| 3 | Abrir `?key=room-102-key` tras tener 101 → cambia a 102 | ☐ |

## Standalone

| # | Caso | Resultado |
|---|------|-----------|
| 1 | PWA standalone en `/` → redirect habitación | ☐ |
| 2 | PWA standalone en `/dashboard` → redirect habitación | ☐ |
| 3 | Banner no visible en standalone | ☐ |

## Técnico

| # | Check | Resultado |
|---|-------|-----------|
| 1 | `GET /api/manifest?key=valid` JSON correcto | ☐ |
| 2 | `npm run test:unit` | ☐ |
| 3 | `npm run build` | ☐ |

## Sign-off

- [ ] Criterios proposal cumplidos
- [ ] Listo para archivar

## Notas

_Dispositivo, versión Chrome, roomKey usada:_
