# Verify report — telegram-call-actions

**Date:** 2026-06-19  
**Change:** `telegram-call-actions`

## Automated

| Check | Result |
|-------|--------|
| `npm run test:unit` | ✅ 43/43 |
| `npm run build` | ✅ OK |

## Implemented

- Inline keyboards: timbre **Atender** / **Finalizar** vía `callback_query`
- Video: botón URL → `/join/video?token=…` → JWT scoped + `VideoCallSession`
- `telegramAlerts` en call para editar mensajes
- `calls-service.ts` compartido (PATCH + Telegram + video-join)
- Sync Telegram al cambiar estado (PATCH, room cancel, Telegram actions)

## Manual (pendiente prod)

- [ ] Timbre Atender → Finalizar desde Telegram
- [ ] Dos staff: segundo ve “ya atendido”
- [ ] Video en móvil vía link Telegram
- [ ] Accept desde dashboard actualiza mensajes Telegram

## Rollback

Set `TELEGRAM_CALL_ACTIONS=false` o revertir deploy; v1 informativo sigue funcionando sin botones.
