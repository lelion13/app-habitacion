# Implementation — telegram-call-actions

## Entregado

### Backend
- `lib/calls-service.ts` — `acceptCall`, `completeCall`, `cancelCall` compartidos (PATCH + Telegram)
- `lib/telegram-call-actions.ts` — handlers `callback_query`, sync mensajes
- `lib/telegram-video-join.ts` — tokens join video (TTL 30 min, one-time)
- `lib/telegram.ts` — inline keyboards, `editMessageText`, `answerCallbackQuery`, `allowed_updates`
- `app/api/telegram/webhook/route.ts` — `callback_query` + logging + try/catch
- `app/api/staff/telegram/video-join/route.ts` — canje token → JWT scoped
- `app/api/calls/[id]/route.ts` — usa `calls-service` + sync Telegram
- `app/api/calls/room/route.ts` — sync Telegram al cancelar

### Frontend
- `app/join/video/` — página mobile fullscreen (`JoinVideoClient` + `VideoCallSession`)

### Tipos
- `Call.telegramAlerts[]`, `TelegramVideoJoinToken`
- JWT `scope: video-join` + `callId` en `auth.ts`

### Tests
- 43 unit tests (`telegram.test.ts`, `telegram-video-join-auth.test.ts`)

## Prod — lecciones

1. Webhook debe incluir `allowed_updates: ["message", "callback_query"]`
2. Imagen GHCR `latest` debe estar actualizada antes del redeploy
3. Logs `[telegram] callback_query received` confirman que el botón llegó al servidor

## Rollback

`TELEGRAM_CALL_ACTIONS=false` o revertir deploy; mensajes informativos sin botones siguen funcionando.
