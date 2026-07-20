# Design — Videollamada Familiar por email

## Technical approach

Reutilizar el patrón **magic link → JWT corto → VideoCallSession** de Telegram video-join, pero:

- Sin usuario staff / sin `staff_sessions`
- `targetRole: "family"` (nuevo valor de llamado, **no** `StaffRole` de escucha)
- Entrega del link por **SMTP** (env), no Telegram
- Exclusión mutua con cualquier llamado activo de la habitación
- UI tablet: ocultar médico (flag), agregar Familiar

## Architecture decisions

| ID | Decisión | Alternativa descartada | Por qué |
|----|----------|------------------------|---------|
| D1 | `targetRole: "family"` en `Call` | Colección `family_sessions` aparte | Reusa métricas, history, WebRTC, estados |
| D2 | `family` ∉ `StaffRole` | Meter `family` en listen roles | Evita Llamador/Telegram basura |
| D3 | API dedicada `POST /api/calls/family-invite` | `POST /api/calls` con targetRole family | Auth roomKey + rate limit + SMTP claros |
| D4 | Colección `family_join_tokens` | Reusar `telegram_video_join_tokens` | Semántica distinta (sin userId staff; bind roomId) |
| D5 | JWT `scope: "family-join"` | Token en cada request | Igual patrón video-join staff |
| D6 | SMTP nodemailer (o fetch SMTP lib mínima) | Resend SaaS | Pedido explícito: host/port/user/pass en `.env` |
| D7 | Flag `SHOW_DOCTOR_SECTION = false` | Borrar componente doctor | Reversible sin redeploy de datos |
| D8 | Accept al consumir token (pending→accepted) | Accept manual en tablet | Opción B producto: video al abrir link |
| D9 | Rate limit en Mongo (último `familyInviteSentAt` / count 1h) | Redis | Un solo store ya existente |
| D10 | Email completo en call doc | Solo hash | Soporte; no loguear en claro |

## Data model

```typescript
// Ampliar roles de llamado (no listen):
type CallTargetRole = StaffRole | "family";
// Call.targetRole: CallTargetRole

// Campos opcionales en Call cuando targetRole === "family":
inviteEmail?: string;
inviteMessage?: string;
familyInviteSentAt?: Date;

// family_join_tokens
{
  token: string;
  callId: ObjectId;
  roomId: ObjectId;
  expiresAt: Date; // now + 3h
  used: boolean;
  createdAt: Date;
}
```

Índice TTL opcional en `expiresAt`. Índice `{ roomId: 1, createdAt: -1 }` para rate limit.

## Env (SMTP)

| Variable | Uso |
|----------|-----|
| `SMTP_HOST` | Host SMTP |
| `SMTP_PORT` | Puerto (ej. 465/587) |
| `SMTP_USER` | Usuario |
| `SMTP_PASS` | Clave |
| `SMTP_FROM` | From visible (ej. `Habitación <noreply@dominio>`) |
| `SMTP_SECURE` | `true` si TLS implícito (465) |

Documentar en `.env.example`, `.env.prod.example`, `docs/runbook.md`. Fail invite con 503 si SMTP no configurado en runtime de envío.

## API surface

| Method | Path | Auth | Rol |
|--------|------|------|-----|
| POST | `/api/calls/family-invite` | `roomKey` | Crea call + token + SMTP |
| POST | `/api/calls/family-join` | body `token` | Consume token → JWT + callId |
| PATCH | `/api/calls/[id]` | family-join JWT | Solo `complete` (y callId match) |
| POST/GET | `/api/calls/[id]/signal` | roomKey **o** family-join JWT | WebRTC |
| Existing | room stream / room cancel | roomKey | Overlay + colgar habitación |

### POST `/api/calls/family-invite` body

```json
{
  "roomKey": "...",
  "email": "familiar@ejemplo.com",
  "message": "opcional"
}
```

Checks: room active, no active call, rate limit 1/hour, email regex, SMTP send.

### Email content (Spanish)

Asunto: `Videollamada — {roomLabel}`  
Cuerpo texto: saludo breve, mensaje opcional del paciente, link `/join/familiar?token=…`, aviso TTL 3 h / un solo uso. Sin `roomKey`.

## Sequence

```mermaid
sequenceDiagram
  participant T as Tablet
  participant I as family-invite API
  participant DB as Mongo
  participant M as SMTP
  participant F as Familiar
  participant J as family-join API
  participant S as signal/SSE

  T->>I: POST email+message+roomKey
  I->>DB: insert call pending family + token
  I->>M: send magic link
  I-->>T: call serialized
  T->>T: waiting UI; block staff buttons
  F->>J: POST token
  J->>DB: consume token; accept call
  J-->>F: JWT family-join
  F->>S: WebRTC as guest
  T->>S: WebRTC as room
  Note over T,F: either side completes/cancels
```

## UI modules

| Pieza | Notas |
|-------|-------|
| `SHOW_DOCTOR_SECTION` | `false` por defecto en `habitacion-theme` o constante habitacion |
| `ROLE_THEME` / label Familiar | Acento `#e879f9`; ícono lucide `Users` o similar |
| `HabitacionFamilyInviteModal` | Email + mensaje + Enviar |
| `HabitacionClient` | Wire Familiar click → modal → invite; mutex UI |
| `/join/familiar` | Mirror `/join/video` con family-join |

## WebRTC roles

Guest Familiar actúa como peer **staff** en `VideoCallSession` (`role="staff"`) para reutilizar signaling `from: "staff"`. Room sigue `from: "room"`. Documentar en código que “staff” aquí significa “non-room peer”.

Authorize signal POST staff branch: accept family-join JWT when `payload.callId === id`.

## Stats

- `ROLE_LABELS` / filters: `family → Familiar`
- `isStaffRole` unchanged; new `isCallTargetRole` includes family
- Charts `byRole` already groups `targetRole` — will pick up family automatically once stored

## Security notes (this change)

- Rate limit + mutex reduce abuse from physical tablet
- One-time token + TTL
- No Telegram / no dashboard fan-out
- Do not log full emails
- Still inherits broader app issues (roomKey entropy) — out of scope

## File map (expected)

| Path | Change |
|------|--------|
| `web/lib/types.ts` | `family`, invite fields, token type |
| `web/lib/validation.ts` | email + call target role |
| `web/lib/family-invite.ts` | create/consume token, rate limit |
| `web/lib/smtp.ts` | send mail |
| `web/lib/auth.ts` | `signFamilyJoinToken` / scope check |
| `web/lib/calls-service.ts` | mutex vs family; accept on join |
| `web/app/api/calls/family-invite/route.ts` | new |
| `web/app/api/calls/family-join/route.ts` | new |
| `web/app/api/calls/[id]/signal/route.ts` | family JWT |
| `web/app/api/calls/route.ts` | 409 if family active |
| `web/app/join/familiar/*` | new pages |
| `web/components/habitacion/*` | modal + section visibility |
| `web/app/estadisticas/page.tsx` | filtro Familiar |
| `docs/runbook.md`, env examples | SMTP |

## Test plan

- Unit: email validation, rate limit helper, token consume races, `isCallTargetRole`
- Unit: SMTP mock (no real network in CI)
- Build + manual: invite → open link → video → hang both sides
