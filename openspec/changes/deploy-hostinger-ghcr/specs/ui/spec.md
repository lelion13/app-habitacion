# UI — Delta deploy-hostinger-ghcr

## MODIFIED Requirements

### REQ-UI-002: PWA habitación (MODIFIED)

Route `/habitacion` MUST read `key` from URL search params (`useSearchParams`).

#### Scenario: Sin key en URL
- **GIVEN** no `key` param and no server env fallback
- **WHEN** page loads
- **THEN** UI SHALL show clear error instructing to open `/habitacion?key={roomKey}`

#### Scenario: Con key válida
- **WHEN** `/habitacion?key=room-101-key`
- **THEN** all API calls from room client SHALL include that roomKey

### REQ-UI-008: PWA manifest (ADDED note)

`start_url` in manifest MAY remain `/habitacion`; deployed tablets SHOULD use pinned shortcut with full `?key=` URL per device.

## ADDED Requirements

### REQ-UI-009: URL pública prod
`NEXT_PUBLIC_APP_URL` in production MUST be `https://habitacion.lionapp.cloud` for correct absolute links if needed.
