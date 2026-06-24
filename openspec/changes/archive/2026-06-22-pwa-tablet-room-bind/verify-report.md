# Verify Report — pwa-tablet-room-bind

**Change:** pwa-tablet-room-bind  
**Fecha:** 2026-06-22  
**Entorno:** prod (`habitacion.lionapp.cloud`) + tablet Chrome Android

## Instalación PWA

| # | Caso | Resultado |
|---|------|-----------|
| 1 | Abrir `?key=room-101-key` en Chrome | ✅ |
| 2 | Banner “Instalar en esta tablet” visible (o instrucciones menú ⋮) | ✅ |
| 3 | Instalar → ícono nombre habitación (label / número) | ✅ (usuario confirmó) |
| 4 | Abrir ícono → carga habitación sin pedir key | ✅ |
| 5 | Cerrar y reabrir ícono → sigue misma habitación | ✅ (persistencia localStorage) |
| 6 | Abre fullscreen sin barra del navegador | ✅ (usuario confirmó) |

## Persistencia y conflictos

| # | Caso | Resultado |
|---|------|-----------|
| 1 | Abrir PWA sin storage ni URL → pantalla soporte | ✅ (implementado; no re-probado manual en sesión) |
| 2 | Pantalla soporte sin ejemplo URL / sin input | ✅ |
| 3 | Abrir `?key=room-102-key` tras tener 101 → cambia a 102 | ✅ (lógica + unit tests; no re-probado manual) |

## Standalone

| # | Caso | Resultado |
|---|------|-----------|
| 1 | PWA standalone en `/` → redirect habitación | ✅ (StandaloneRoomGuard; no re-probado manual) |
| 2 | PWA standalone en `/dashboard` → redirect habitación | ✅ (implementado) |
| 3 | Banner no visible en standalone | ✅ (fix `388b000` tras reporte usuario) |

## Técnico

| # | Check | Resultado |
|---|-------|-----------|
| 1 | `GET /api/manifest?key=valid` JSON correcto | ✅ |
| 2 | `npm run test:unit` | ✅ 33 tests |
| 3 | `npm run build` | ✅ |
| 4 | Service worker `/sw.js` en prod | ✅ |
| 5 | Manifest dinámico en HTML inicial (`generateMetadata`) | ✅ |
| 6 | GHCR + `VPS_updateProject` | ✅ commits `e5dadf6`–`d6eeaaa` |

## Sign-off

- [x] Criterios proposal cumplidos
- [x] Listo para archivar

## Notas

- Instalación inicial: usuario usó menú Chrome → agregar a pantalla principal antes del fix de manifest/SW; tras reinstalar desde URL con key, comportamiento correcto.
- Branding institucional (logo Clínica MG) añadido en habitación, login y pantalla no configurada (`d6eeaaa`).
- **Fuera de scope v1:** modo kiosko / PIN para salir de la app → backlog `kiosk-exit-pin`.
- Commits principales: `e5dadf6` (bind), `0f1497b` (install fix), `388b000` (banner), `d6eeaaa` (logo).
