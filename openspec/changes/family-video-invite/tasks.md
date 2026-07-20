# Tasks — family-video-invite

## Fase 1 — Specs / design

- [x] 1.1 `proposal.md` + decisiones cerradas
- [x] 1.2 Deltas `calls`, `ui`, `realtime`
- [x] 1.3 `design.md`

## Fase 2 — Modelo y backend core

- [x] 2.1 Tipos: `CallTargetRole` / `family`, campos invite en `Call`, `FamilyJoinToken`
- [x] 2.2 `validation.ts`: email estricto + `isCallTargetRole` (family ≠ listen StaffRole)
- [x] 2.3 `auth.ts`: `signFamilyJoinToken` / helpers scope `family-join`
- [x] 2.4 `lib/family-invite.ts`: crear/consumir token (3h, one-time, bind roomId+callId), rate limit 1/h
- [x] 2.5 `lib/smtp.ts`: envío texto SMTP desde `SMTP_*`
- [x] 2.6 `POST /api/calls/family-invite` (roomKey, mutex, rate limit, SMTP)
- [x] 2.7 `POST /api/calls/family-join` (consume → accept → JWT)
- [x] 2.8 Mutex: `POST /api/calls` y room flows → 409 si Familiar activo; invite 409 si staff activo
- [x] 2.9 PATCH/signal: autorizar family-join JWT (complete + signal scoped a callId)
- [x] 2.10 SSE: publicar family solo a canal room (no listen staff); no Telegram

## Fase 3 — Frontend habitación + join

- [x] 3.1 Flag `SHOW_DOCTOR_SECTION=false` + tema Familiar `#e879f9`
- [x] 3.2 Sección Familiar (Video full-width) en UI habitación
- [x] 3.3 Modal email + mensaje opcional (ES) → invite API
- [x] 3.4 Estados pending/accepted/terminal Familiar en `HabitacionClient` (overlay video)
- [x] 3.5 Página `/join/familiar` + client WebRTC guest
- [x] 3.6 Ambos lados pueden finalizar; cleanup tracks

## Fase 4 — Estadísticas y docs

- [x] 4.1 Labels/filtros `/estadisticas` + history params para `family`
- [x] 4.2 `.env.example` / `.env.prod.example` + `docs/runbook.md` SMTP
- [x] 4.3 `docs/quick-map.md` rutas nuevas

## Fase 5 — Tests y verify

- [x] 5.1 Unit: email, rate limit, token consume, call target role
- [x] 5.2 Unit: SMTP config helper (no real send in CI)
- [x] 5.3 `npm run test:unit` + `npm run build`
- [ ] 5.4 Manual: invite real SMTP → join → video → colgar ambos
- [ ] 5.5 `verify-report.md`

## Fase 6 — Cierre SDD

- [ ] 6.1 Fusionar deltas → `openspec/specs/`
- [ ] 6.2 Archivar change

## Dependencias

```
1 → 2 → 3 → 4 → 5 → 6
2.5 antes de 2.6; 2.4/2.7 antes de 3.5; 2.8/2.9 antes de 3.4/3.6
```

Estimación: **2–3 sesiones** (SMTP + WebRTC guest + UI modal).
