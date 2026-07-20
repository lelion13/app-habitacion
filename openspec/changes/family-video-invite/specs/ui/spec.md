# UI — Delta family-video-invite

## ADDED Requirements

### REQ-UI-027: Sección Familiar en habitación

Route `/habitacion` MUST show a **Familiar** section with:

- Title «Familiar»
- Theme accent `#e879f9` (fuchsia) consistent with habitacion dark UI
- A single **Video** button spanning full width of the section (no Timbre)

#### Scenario: Layout Familiar
- **GIVEN** room loaded successfully
- **WHEN** user views call buttons
- **THEN** Familiar section SHALL be visible with one full-width Video button

### REQ-UI-028: Modal invite Familiar

Tapping Familiar **Video** MUST open a modal (Spanish) to collect:

- Email (required, strict format validation)
- Optional message
- Actions: **Enviar** and dismiss/cancel

No second confirmation step after Enviar.

On success, UI MUST show waiting/pending family-call state (existing modal/overlay patterns).
On failure (validation, 409, 429, SMTP), UI MUST show Spanish error toast/message without exposing SMTP internals.

#### Scenario: Email inválido
- **GIVEN** modal open
- **WHEN** user submits malformed email
- **THEN** invite MUST NOT be sent
- **AND** UI SHALL show validation error in Spanish

#### Scenario: Rate limit visible
- **GIVEN** room already invited within the last hour
- **WHEN** Enviar succeeds validation but API returns 429
- **THEN** UI SHALL explain limit in Spanish

### REQ-UI-029: Médico oculto (global)

The **Médico** (`doctor`) section MUST be hidden globally on `/habitacion` via a feature flag / constant (default hidden).

Code and theme for `doctor` MUST remain in the codebase for future re-enable.

Staff dashboard listen role «Médico» MAY remain available (out of room tablet UI scope for hide).

#### Scenario: Médico no visible
- **GIVEN** feature flag hide-doctor enabled (default)
- **WHEN** user views `/habitacion`
- **THEN** doctor section MUST NOT render
- **AND** nurse, quality, and family sections MUST render

### REQ-UI-030: Página join Familiar

Route `/join/familiar` MUST be mobile-first, usable without dashboard login.

#### Scenario: Link válido
- **GIVEN** valid unused family token
- **WHEN** page loads and exchanges token
- **THEN** UI SHALL start guest WebRTC session (`VideoCallSession` or equivalent)
- **AND** MUST request camera/microphone via user gesture as required by browser policy

#### Scenario: Link inválido
- **GIVEN** invalid, used, or expired token
- **WHEN** page loads
- **THEN** user SHALL see concise Spanish error

#### Scenario: Finalizar desde familiar
- **GIVEN** active family video session on guest page
- **WHEN** user ends the call
- **THEN** client MUST complete the call via API with family-join JWT
- **AND** MUST release media tracks

### REQ-UI-031: Habitación durante Familiar

While family call is `pending`, room UI MUST show waiting state (invitación enviada) and block staff call buttons.

When family call becomes `accepted`, room UI MUST show video overlay (same WebRTC shell as staff video where practical).

Both room and guest MUST expose an end-call control.

#### Scenario: Overlay al aceptar Familiar
- **GIVEN** room has family call `pending`
- **WHEN** status becomes `accepted` via SSE
- **THEN** room SHALL present video session UI

## MODIFIED Requirements

### REQ-UI-002: PWA habitación (MODIFIED)

Room call UI sections MUST be: Enfermería, Asistente de calidad, Familiar (Médico hidden by default).

Helper text MAY remain «Presione un botón para llamar al sector que necesita» or be adjusted slightly if Familiar wording is needed; MUST stay Spanish and concise.

#### Scenario: Tres secciones visibles
- **GIVEN** hide-doctor enabled
- **WHEN** room UI loads
- **THEN** exactly three role sections SHALL be visible: nurse, quality, family

### REQ-UI-014: Pantalla estadísticas (MODIFIED)

Role filter and table MUST support «Familiar» for `targetRole: family`.

Charts by role MUST include family when present in the filtered set.

#### Scenario: KPI / tabla Familiar
- **GIVEN** family calls in date range
- **WHEN** supervisor opens `/estadisticas`
- **THEN** family calls SHALL be listed with role label Familiar
