# Proposal — Videollamada Familiar por email

**Change:** `family-video-invite`  
**Status:** Implementado — pendiente verify manual SMTP + archive  
**Dominios:** `calls`, `ui`, `realtime` (y docs deploy/runbook)

## Intent

En la tablet de habitación, **ocultar** (no eliminar) la sección Médico y agregar **Familiar**: un solo botón Video que invita por email a un familiar a unirse por magic link WebRTC, sin pasar por el dashboard staff.

Hoy el flujo es habitación → staff (nurse/quality/doctor). Familiar es un canal **habitación ↔ invitado externo**, con SMTP desde variables de entorno.

## Decisiones de producto (cerradas)

| # | Tema | Decisión |
|---|------|----------|
| A1 | Médico | Oculto **globalmente** (flag/código); no borrar UI ni rol `doctor` |
| A2 | Botón Familiar | Un solo **Video** a ancho completo |
| A3 | Tema visual | Acento Familiar: `#e879f9` (fucsia suave), ícono Users/HeartHandshake (lucide) |
| A4 | Modal | Email **requerido** + mensaje **opcional** |
| A5 | Validación email | Formato estricto (regex) |
| A6 | Idioma | Solo español |
| B7 | Inicio video | Familiar abre link → tablet muestra overlay (opción B) |
| B8 | Auth familiar | Magic link sin login (como `/join/video`) |
| B9 | Concurrencia | **Un** familiar a la vez; si hay llamado staff activo → esperar |
| B10 | Paralelo staff | No: Timbre/Video staff bloqueados mientras Familiar activo/pendiente |
| B11 | Colgar | Ambos (habitación y familiar) |
| B12 | Token | TTL **3 h**, **uso único** |
| B13 | No abre link | Expira solo (sin cancel forzado por timeout UI aparte del TTL) |
| B14 | Estadísticas | Sí; `targetRole = family` (etiqueta «Familiar») |
| C15 | Quién carga email | Paciente / acompañante en tablet |
| C16 | Rate limit | **1 invite / habitación / hora** |
| C17 | Confirmación | No; solo Enviar |
| D | Correo | **SMTP genérico** vía `.env` (`SMTP_*`) |
| E18 | Alcance | **Completo**: modal + API + email + join + WebRTC |
| E19 | Dashboard | No aparece en Llamador staff |
| E20 | Telegram | No notifica |
| E21 | Nombre | `family-video-invite` |
| F22 | Token | Ligado a habitación + callId, one-time |
| F23 | Email en BD | Guardar email completo en el invite/call; **no loguear** email en claro |

## Scope

### In scope

- Flag global para ocultar sección Médico en `/habitacion`
- Sección **Familiar** (solo Video) + modal email/mensaje
- Modelo de llamado/invite Familiar (`targetRole: "family"`) con exclusión mutua vs llamados staff activos
- Tokens magic link (3 h, one-time) + página `/join/familiar`
- Envío SMTP del link + mensaje opcional
- WebRTC reutilizando `VideoCallSession` (roles room + guest)
- Rate limit 1 invite/hora por habitación
- Inclusión en historial `/estadisticas` con rol Familiar
- Env vars SMTP documentadas en runbook / `.env*.example`
- Tests unitarios: validación email, rate limit, token TTL/consumo, exclusión mutua

### Out of scope

- Reactivar Médico por habitación (solo flag global)
- Timbre Familiar
- Notificaciones Telegram / dashboard Llamador
- Multi-familiar / sala de espera
- Plantillas HTML avanzadas / cola de reintentos mail sofisticada
- Security hardening general (seed, IDOR staff) — change aparte
- Precarga de email desde ABM paciente

## Approach

1. Extender el dominio de roles de llamado: `family` **no** es `StaffRole` de escucha; es `CallTargetRole` / valor de `targetRole` válido en calls + analytics, excluido del catálogo de escucha dashboard.
2. `POST` invite desde habitación (`roomKey`): valida email, rate limit, sin llamado activo → crea call `type: video`, `targetRole: family`, `status: pending`, token, envía SMTP.
3. Familiar abre `/join/familiar?token=…` → consume token → JWT corto scope `family-join` → WebRTC como peer “staff/guest”.
4. Habitación, al detectar call Familiar `pending`/`accepted`, muestra overlay; al pasar a `accepted` (primer join) inicia sesión video.
5. Complete/cancel desde habitación o familiar finalizan y liberan la habitación.

```mermaid
sequenceDiagram
  participant Room as Tablet habitación
  participant API as API
  participant SMTP as SMTP
  participant Fam as Familiar (browser)
  participant DB as Mongo

  Room->>API: POST invite (email, msg?, roomKey)
  API->>DB: call family pending + token
  API->>SMTP: email con magic link
  Note over Room: espera; botones staff bloqueados
  Fam->>API: GET/POST consume token
  API->>DB: accepted + WebRTC ready
  Fam->>Room: WebRTC via signaling/SSE
  Room-->>Fam: ambos pueden finalizar
```

## Affected areas

| Área | Impacto |
|------|---------|
| `web/lib/types.ts` | `family` en target de call; tipos invite/token |
| `web/lib/habitacion-theme.ts` | Tema Familiar; flag hide doctor |
| `web/app/habitacion/*` | UI secciones + modal |
| `web/lib/family-invite*.ts` | Token, rate limit, SMTP |
| `web/app/api/...` | Invite + join + (reuso) signal/calls |
| `web/app/join/familiar/` | Página guest |
| `web/components/VideoCallSession.tsx` | Guest family si hace falta |
| `web/lib/call-history` / stats | Rol Familiar |
| `docs/runbook.md`, `.env*.example` | SMTP |
| `openspec/specs/{calls,ui,realtime}` | Deltas |

## Risks

| Riesgo | Likelihood | Mitigation |
|--------|------------|------------|
| SMTP mal configurado / spam | Med | Fail claro en UI; log error sin email; docs DNS SPF |
| Token en URL (email clients) | Med | TTL 3h + one-time + bind callId/room |
| Confusión con flujo staff video | Med | `targetRole: family`; sin publish a listen channels |
| Rate limit bypasseable | Low | Enforce server-side por `roomId` |
| Médico oculto pero APIs siguen | Low | Documentado; flag solo UI (doctor sigue en modelo) |

## Rollback

1. Flag UI: volver a mostrar Médico y ocultar Familiar.
2. Deshabilitar rutas invite/join (404).
3. Campos/tokens Familiar opcionales — sin migración destructiva.
4. Quitar env SMTP no rompe el resto de la app.

## Dependencies

- WebRTC + `VideoCallSession` existentes
- Patrón magic link de `telegram-video-join` (referencia)
- SMTP reachable desde el contenedor prod

## Success criteria

- [ ] Médico no visible en tablet; Familiar visible con un Video full-width
- [ ] Modal email+mensaje → envío SMTP con link
- [ ] Familiar abre link → videollamada con la tablet
- [ ] Ambos pueden finalizar; TTL 3h / one-time
- [ ] 1 invite/hora/habitación; bloqueo si hay llamado activo
- [ ] Aparece en `/estadisticas` como Familiar
- [ ] `npm run test:unit` + `npm run build` OK
