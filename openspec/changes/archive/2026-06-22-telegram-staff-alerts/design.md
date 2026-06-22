# Design — Alertas Telegram staff

## Flujo vinculación

```mermaid
sequenceDiagram
  participant D as Dashboard
  participant API as POST /staff/telegram/link
  participant DB as Mongo link_tokens
  participant U as Staff phone
  participant Bot as Telegram Bot
  participant WH as POST /telegram/webhook

  D->>API: JWT
  API->>DB: store token userId TTL 15m
  API-->>D: t.me/bot?start=link_TOKEN
  U->>Bot: /start link_TOKEN
  Bot->>WH: update
  WH->>DB: validate token, set users.telegramChatId
  WH-->>Bot: reply "Vinculado OK"
```

## Colección `telegram_link_tokens` (opcional)

```typescript
{ token: string, userId: ObjectId, expiresAt: Date, used: boolean }
```
Índice TTL en `expiresAt`.

Alternativa: JWT firmado con `sub` + `exp` sin colección extra.

## Flujo notificación

```mermaid
sequenceDiagram
  participant R as POST /api/calls
  participant N as notifyTelegramStaff
  participant DB as Mongo
  participant TG as api.telegram.org

  R->>DB: insert call
  R->>N: fire-and-forget(call)
  N->>DB: active sessions + users telegram
  loop each recipient
    N->>TG: sendMessage
  end
  R-->>R: return 201 (no wait TG)
```

## `lib/telegram.ts`

```typescript
export async function sendCallAlert(chatId: string, call: SerializedCall): Promise<void>
export function formatCallAlertMessage(call: SerializedCall): string
```

HTML parse mode opcional; emojis para bell vs video.

## Resolver destinatarios

```typescript
// lib/telegram-recipients.ts
export async function findTelegramRecipientsForCall(
  call: Pick<Call, "floor" | "sector" | "targetRole">
): Promise<{ chatId: string; name: string }[]>
```

Query:
1. `staff_sessions.find({ active: true, floor, sector, role: targetRole })`
2. `users.find({ _id: { $in: userIds }, telegramChatId: { $exists: true, $ne: null }, telegramNotifyEnabled: { $ne: false } })`

## Webhook handler

- `POST /api/telegram/webhook` — body = Telegram Update JSON
- Handle `message.text` starting with `/start link_`
- Ignore other commands in v1 (reply help text)
- Set webhook via `setWebhook` API on deploy (document in runbook)

## UI dashboard

Bloque en `dashboard/page.tsx` bajo formulario escucha, o `dashboard/settings` — mínimo:
- Estado: Vinculado / No vinculado
- Botón Conectar → fetch link → `window.open(tgUrl)`
- Desvincular

## Decisiones cerradas

| ID | Decisión |
|----|----------|
| D1 | Solo escucha activa + vinculado |
| D2 | Un mensaje al crear llamado |
| D3 | Sin botones inline v1 |

## Rollback

Unset env token + remove `notifyTelegramStaff` call; webhook puede quedar inactivo.
