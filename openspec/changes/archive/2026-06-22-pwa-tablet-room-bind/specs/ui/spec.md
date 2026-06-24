# UI — Delta pwa-tablet-room-bind

## MODIFIED Requirements

### REQ-UI-002: PWA habitación (MODIFIED)

Route `/habitacion` MUST:
- Read `key` from URL search params (`?key={roomKey}`) in production
- Fall back to persisted `roomKey` when launch URL has no query (installed PWA)
- Display room label, floor, sector
- Show large buttons for bell/video per target role
- Block new calls while an active call exists
- Show active call banner with cancel action
- Subscribe to room SSE for status updates
- Expose dynamic manifest for Android install when room is validated
- MUST NOT provide UI for end user to type or change `roomKey`

#### Scenario: Sin key en URL
- **GIVEN** no `key` param and no valid stored `roomKey`
- **WHEN** page loads
- **THEN** UI SHALL show fixed support screen (contact technical support)
- **AND** MUST NOT show `/habitacion?key=` example to end user

#### Scenario: PWA instalada abre habitación correcta
- **GIVEN** tablet installed from `/habitacion?key=room-101-key`
- **WHEN** user opens app from home screen
- **THEN** room 101 UI SHALL load without user entering a key

### REQ-UI-008: PWA manifest prod (MODIFIED)

Production tablets MUST install via Chrome Android from the room-specific URL.

The dynamic manifest `start_url` MUST include `?key={roomKey}`.

`web/public/manifest.json` MAY remain as generic fallback for non-room routes.

## ADDED Requirements

### REQ-UI-017: Banner instalar PWA

When room is loaded and browser supports install:

#### Scenario: Banner en Chrome Android
- **GIVEN** valid room loaded, not standalone, `beforeinstallprompt` fired
- **WHEN** user views `/habitacion`
- **THEN** UI SHALL show discrete banner **Instalar en esta tablet**
- **AND** tapping it SHALL trigger native install prompt

#### Scenario: Ya instalada
- **GIVEN** `display-mode: standalone`
- **WHEN** user views `/habitacion`
- **THEN** install banner MUST NOT show

### REQ-UI-018: Navegación restringida en PWA standalone

#### Scenario: Redirect desde landing
- **GIVEN** PWA launched in standalone mode with stored `roomKey`
- **WHEN** user navigates to `/` or `/dashboard`
- **THEN** client MUST redirect to `/habitacion` with resolved room

#### Scenario: Nombre del ícono
- **GIVEN** room label `Habitación 101`
- **WHEN** manifest is generated for that room
- **THEN** `name` SHALL reflect room label (short_name MAY truncate)

## ADDED to Known gaps (backlog)

| Item | Priority | Spec domain |
|------|----------|-------------|
| Modo kiosko — salir solo con PIN soporte | Medium | ui |
