# Tasks — Alertas Telegram staff

## Fase 1 — Specs

- [x] 1.1 Delta auth, calls, ui, deploy
- [x] 1.2 Design.md
- [x] 1.3 Decisiones producto cerradas

## Fase 2 — Bot y backend core

- [x] 2.1 `lib/telegram.ts` + `lib/telegram-recipients.ts`
- [x] 2.2 `lib/telegram-link.ts` (token one-time)
- [x] 2.3 Ampliar `User` en `types.ts`
- [x] 2.4 `POST /api/staff/telegram/link`, `GET/DELETE /api/staff/telegram`
- [x] 2.5 `POST /api/telegram/webhook`
- [x] 2.6 Hook en `POST /api/calls` (async notify)
- [x] 2.7 Tests unitarios (recipients, message format, token)

## Fase 3 — UI dashboard

- [x] 3.1 Sección vinculación Telegram en dashboard
- [x] 3.2 Estados loading/error/conectado

## Fase 4 — Deploy y docs

- [x] 4.1 Env vars en `deploy-hostinger.md` + `.env.prod.example`
- [x] 4.2 Crear bot BotFather + configurar webhook prod
- [x] 4.3 Variables en Hostinger `app-habitacion`

## Fase 5 — Verificación

- [ ] 5.1 Manual: vincular + escucha activa → mensaje al timbre
- [ ] 5.2 Manual: sin escucha → no mensaje
- [ ] 5.3 Manual: video call → mensaje distingue tipo
- [ ] 5.4 `npm run test:unit` + `npm run build`
- [ ] 5.5 `verify-report.md`

## Fase 6 — Cierre SDD

- [ ] 6.1 Fusionar deltas → `openspec/specs/`
- [ ] 6.2 Archivar change

## Dependencias

```
1 → 2 → 3 → 4 → 5 → 6
```

Estimación: **1–2 sesiones** (bot + webhook + UI).
