# Rooms — Habitaciones

## Requirements

### REQ-ROOM-001: Identidad por roomKey
Each room MUST be uniquely identified by `roomKey` stored in MongoDB.

In production, room identity MUST be configurable at runtime via URL query parameter `key` on `/habitacion`.

Additionally, the room client MUST persist a validated `roomKey` in browser `localStorage` so installed PWAs can resolve the room without `?key=` in the launch URL.

#### Scenario: Resolver habitación
- **GIVEN** a valid `roomKey`
- **WHEN** GET `/api/room?key={roomKey}`
- **THEN** the response SHALL include `{ id, number, floor, sector, label }`

#### Scenario: Tablet con query param
- **GIVEN** room `room-101-key` exists in MongoDB
- **WHEN** client opens `/habitacion?key=room-101-key`
- **THEN** the room UI SHALL load that room
- **AND** the validated `roomKey` SHALL be persisted locally

#### Scenario: PWA instalada sin query en launch URL
- **GIVEN** tablet previously opened `/habitacion?key=room-101-key` and validated room
- **AND** `roomKey` is stored locally
- **WHEN** user opens installed PWA with launch URL `/habitacion` (no query)
- **THEN** the client SHALL read stored `roomKey` and load room 101

#### Scenario: Sobrescribir habitación vía URL
- **GIVEN** stored `roomKey` is `room-101-key`
- **WHEN** client opens `/habitacion?key=room-102-key` and API validates
- **THEN** stored key SHALL update to `room-102-key`
- **AND** UI SHALL show room 102

#### Scenario: Clave inválida
- **GIVEN** an unknown `roomKey`
- **WHEN** GET `/api/room`
- **THEN** the response MUST be 404
- **AND** client MUST NOT persist invalid key

### REQ-ROOM-002: Modelo de datos
Each room document MUST contain:
- `number` (string)
- `floor` (string)
- `sector` (string)
- `roomKey` (string, unique)
- `label` (string, display name)

### REQ-ROOM-003: Sin autenticación en habitación
The room client MUST NOT require user login. Authorization for call actions SHALL be implicit via possession of the correct `roomKey`.

### REQ-ROOM-004: Seed de desarrollo
In non-production (or when `BOOTSTRAP_ENABLED=true`), POST `/api/seed` with header `x-seed-secret` matching `JWT_SECRET` MUST create demo rooms and admin user.

Demo rooms:
| label | floor | sector | roomKey |
|-------|-------|--------|---------|
| Habitación 101 | 1 | A | room-101-key |
| Habitación 102 | 1 | A | room-102-key |
| Habitación 201 | 2 | B | room-201-key |

### REQ-ROOM-005: Calls con roomKey explícito
POST `/api/calls` and PATCH `/api/calls/room` MUST accept `roomKey` in body or query when env fallback is empty.

### REQ-ROOM-006: Prod sin env roomKey
In production build, `NEXT_PUBLIC_ROOM_KEY` MAY be empty; tablets MUST use `?key=` URLs.

### REQ-ROOM-007: Manifest dinámico por habitación

The system MUST expose a Web App Manifest per validated `roomKey` for PWA installation.

#### Scenario: Manifest con start_url completo
- **GIVEN** valid `roomKey` `room-101-key` with label `Habitación 101`
- **WHEN** GET `/api/manifest?key=room-101-key`
- **THEN** response SHALL be `application/manifest+json`
- **AND** `start_url` MUST be `/habitacion?key=room-101-key`
- **AND** `name` SHOULD use room `label`
- **AND** `display` SHOULD be `fullscreen`

#### Scenario: Manifest key inválida
- **GIVEN** unknown `roomKey`
- **WHEN** GET `/api/manifest?key=invalid`
- **THEN** response MUST be 404

### REQ-ROOM-008: Tablet sin configuración

#### Scenario: Sin key en URL ni storage
- **GIVEN** no `?key=` and no stored `roomKey`
- **WHEN** `/habitacion` loads
- **THEN** UI MUST show support message without editable key field
- **AND** MUST NOT expose example URLs to end user

## URLs prod (tablets)

```
https://habitacion.lionapp.cloud/habitacion?key=room-101-key
https://habitacion.lionapp.cloud/habitacion?key=room-102-key
https://habitacion.lionapp.cloud/habitacion?key=room-201-key
```

## Out of scope

- UI admin para CRUD de habitaciones
- Rotación de roomKey
- Vinculación roomKey a hardware (MAC, serial)
