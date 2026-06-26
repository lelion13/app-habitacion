# Tasks — Acciones Telegram en llamados

## Fase 1 — Specs

- [x] 1.1 `proposal.md` + decisiones producto
- [x] 1.2 Deltas `auth`, `calls`, `realtime`, `ui`
- [x] 1.3 `design.md`

## Fase 2 — Backend core

- [x] 2.1 Tipos: `telegramAlerts` en `Call`, `TelegramVideoJoinToken`
- [x] 2.2 `lib/telegram-video-join.ts` (create/consume, TTL 30m)
- [x] 2.3 Extraer `acceptCall` / `completeCall` compartido (`lib/calls-service.ts`)
- [x] 2.4 `lib/telegram-call-actions.ts` (auth chatId + session, race-safe accept)
- [x] 2.5 Ampliar `lib/telegram.ts` (inline keyboard, editMessage, answerCallback)
- [x] 2.6 Actualizar `notifyTelegramStaffForCall` — guardar messageId + tokens video
- [x] 2.7 Webhook: handler `callback_query`
- [x] 2.8 `POST /api/staff/telegram/video-join`
- [x] 2.9 PATCH route: disparar `syncTelegramMessagesForCall` al cambiar estado
- [x] 2.10 Tests unitarios (tokens, accept race, callback auth, message format)

## Fase 3 — Frontend

- [x] 3.1 Página `/join/video` mobile + canje token client-side
- [x] 3.2 Reutilizar `VideoCallSession` con JWT de video-join
- [x] 3.3 Estados error/expirado en español

## Fase 4 — Verificación

- [ ] 4.1 Manual: timbre Atender → Finalizar desde Telegram
- [ ] 4.2 Manual: dos staff — segundo ve “ya atendido”
- [ ] 4.3 Manual: video link en móvil → WebRTC
- [ ] 4.4 Manual: accept dashboard sincroniza mensajes Telegram
- [x] 4.5 `npm run test:unit` + `npm run build`
- [x] 4.6 `verify-report.md`

## Fase 5 — Cierre SDD

- [ ] 5.1 Fusionar deltas → `openspec/specs/`
- [ ] 5.2 Actualizar `docs/runbook.md` (botones, tokens video)
- [ ] 5.3 Archivar change

## Dependencias

```
1 → 2 → 3 → 4 → 5
```
