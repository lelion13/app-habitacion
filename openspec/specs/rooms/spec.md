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
- `label` (string, display name)
- `roomKey` (string, unique)
- `floorId`, `sectorId` (ObjectId refs to `floors` / `sectors`)
- `floor` (string, denormalized from `floor.name`)
- `sector` (string, denormalized from `sector.code`)
- `active` (boolean, default true)
- `createdAt`, `updatedAt` (optional timestamps)

### REQ-ROOM-003: Sin autenticación en habitación
The room client MUST NOT require user login. Authorization for call actions SHALL be implicit via possession of the correct `roomKey`.

### REQ-ROOM-004: Seed de desarrollo
In non-production (or when `BOOTSTRAP_ENABLED=true`), POST `/api/seed` with header `x-seed-secret` matching `JWT_SECRET` MUST create demo floors, sectors, rooms and admin user with `systemRole: admin`.

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
- **AND** MUST NOT show example URLs to end user

### REQ-ROOM-009: Catálogos piso y sector

The system MUST persist floors and sectors as separate MongoDB collections.

Admin MUST CRUD floors and sectors (soft-delete via `active: false`).

Rooms MUST reference `floorId` and `sectorId` and SHALL denormalize `floor` and `sector` strings for call routing and historial.

Authenticated staff (any role) MAY read active floors/sectors via `GET /api/staff/catalog`.

#### Scenario: Desactivar piso con habitaciones activas
- **GIVEN** an active floor linked to active rooms
- **WHEN** admin deactivates the floor
- **THEN** API MUST return 409 with clear error

### REQ-ROOM-010: ABM habitaciones (admin)

Admin MUST create, update, and soft-deactivate rooms via `/api/admin/rooms`.

On create, `roomKey` MUST be generated server-side from room **number** using format `room-{slug}-key` (with numeric suffix on collision) and MUST NOT be editable afterward.

#### Scenario: roomKey legible
- **GIVEN** admin creates room number `101`
- **WHEN** POST `/api/admin/rooms` succeeds
- **THEN** `roomKey` SHALL be `room-101-key` (or suffixed variant if collision)

#### Scenario: roomKey automático
- **GIVEN** admin creates a room
- **WHEN** POST `/api/admin/rooms` succeeds
- **THEN** response SHALL include unique `roomKey`
- **AND** PATCH MUST NOT allow changing `roomKey`

### REQ-ROOM-011: Habitación inactiva

When `room.active === false`:

#### Scenario: Tablet ve habitación inactiva
- **GIVEN** valid `roomKey` for inactive room
- **WHEN** GET `/api/room?key=...`
- **THEN** response MAY return room data with inactive indicator
- **AND** habitación UI MUST show clear inactive message

#### Scenario: No llamar desde inactiva
- **GIVEN** inactive room
- **WHEN** POST `/api/calls` with that `roomKey`
- **THEN** response MUST be 403 with generic inactive message

## URLs prod (tablets)

```
https://habitacion.lionapp.cloud/habitacion?key=room-101-key
https://habitacion.lionapp.cloud/habitacion?key=room-102-key
https://habitacion.lionapp.cloud/habitacion?key=room-201-key
```

## Out of scope

- Rotación manual de roomKey / rebind tablet
- Vinculación roomKey a hardware (MAC, serial)
