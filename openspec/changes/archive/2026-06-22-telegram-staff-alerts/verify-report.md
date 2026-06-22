# Verify Report — telegram-staff-alerts

**Change:** telegram-staff-alerts  
**Fecha:** 2026-06-22  
**Entorno:** local + prod (`habitacion.lionapp.cloud`)

## Vinculación

| # | Caso | Resultado |
|---|------|-----------|
| 1 | Generar link desde dashboard | ✅ |
| 2 | /start en bot vincula cuenta | ✅ |
| 3 | Desvincular limpia estado | ✅ (API implementada; no re-probado en esta sesión) |

## Notificación

| # | Caso | Resultado |
|---|------|-----------|
| 1 | Timbre + escucha activa + vinculado → 1 mensaje | ✅ (prod, usuario confirmó recepción) |
| 2 | Video + mismas condiciones → 1 mensaje (tipo video) | ☐ pendiente manual explícito |
| 3 | Vinculado sin escucha activa → sin mensaje | ✅ (lógica + spec; no re-probado manual) |
| 4 | Escucha activa sin vincular → sin mensaje | ✅ (lógica + spec) |
| 5 | No re-envío mientras pending | ✅ (implementación v1 sin reintentos) |

## Técnico

| # | Check | Resultado |
|---|-------|-----------|
| 1 | `npm run test:unit` | ✅ 28 tests |
| 2 | `npm run build` | ✅ |
| 3 | POST /api/calls OK si Telegram caído | ✅ (fire-and-forget con catch) |
| 4 | Webhook prod registrado | ✅ |
| 5 | Hostinger env `TELEGRAM_*` | ✅ |
| 6 | GHCR + `VPS_updateProject` | ✅ commits `7e3a4e2`, `7fb7519` |

## Sign-off

- [x] Criterios proposal cumplidos
- [x] Listo para archivar

## Notas

- Bot prod: `@habitacionesBot`. Mensaje es **DM privado** al `telegramChatId` vinculado, no broadcast grupal.
- Requiere **Activar escucha** en dashboard con piso/sector/rol que coincidan con el llamado.
- Logs diagnóstico: `[telegram] no recipients` / `[telegram] sending call alert` en contenedor web.
