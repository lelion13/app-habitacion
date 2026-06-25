# Rooms — Delta: admin-rbac-abm

## ADDED Requirements

### REQ-ROOM-009: Catálogos piso y sector

The system MUST persist floors and sectors as separate MongoDB collections.

Admin MUST CRUD floors and sectors (soft-delete via `active: false`).

Rooms MUST reference `floorId` and `sectorId` and SHALL denormalize `floor` and `sector` strings for call routing and historial.

#### Scenario: Desactivar piso con habitaciones activas
- **GIVEN** an active floor linked to active rooms
- **WHEN** admin deactivates the floor
- **THEN** API MUST return 409 with clear error

### REQ-ROOM-010: ABM habitaciones (admin)

Admin MUST create, update, and soft-deactivate rooms.

On create, `roomKey` MUST be generated server-side and MUST NOT be editable afterward.

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

## MODIFIED Requirements

### REQ-ROOM-002: Modelo de datos

Each room document MUST contain:
- `number`, `label`, `roomKey` (unique)
- `floorId`, `sectorId` (ObjectId refs)
- `floor`, `sector` (denormalized strings)
- `active` (boolean, default true)

### REQ-ROOM-004: Seed de desarrollo

Seed MUST create demo floors/sectors and assign `systemRole: admin` to demo admin user.

## REMOVED Requirements

### Out of scope (previous)
- ~~UI admin para CRUD de habitaciones~~ — now in scope via admin-rbac-abm
