# Verify report — telegram-call-actions

**Date:** 2026-06-26  
**Change:** `telegram-call-actions`  
**Status:** ✅ Verified (automated + manual prod)

## Automated

| Check | Result |
|-------|--------|
| `npm run test:unit` | ✅ 43/43 |
| `npm run build` | ✅ OK |

## Manual prod

- [x] Timbre: **Atender** → **Finalizar** desde Telegram (habitación 101)
- [x] Video: link **Unirse a video** en móvil → WebRTC
- [x] Webhook con `callback_query` tras re-registro
- [x] Sync dashboard/SSE al actuar desde Telegram

## Fix aplicado en prod

Webhook sin handler de `callback_query` / `allowed_updates` incompleto → botón sin respuesta. Corregido con redeploy + `setWebhook` actualizado.

## Rollback

`TELEGRAM_CALL_ACTIONS=false` o revertir imagen GHCR; v1 informativo sigue operativo.
