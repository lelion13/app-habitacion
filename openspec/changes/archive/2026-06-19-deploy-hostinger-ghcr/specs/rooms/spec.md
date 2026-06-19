# Rooms — Delta deploy-hostinger-ghcr

## MODIFIED Requirements

### REQ-ROOM-001: Identidad por roomKey (MODIFIED)

In production, room identity MUST be configurable at runtime via URL query parameter `key` on `/habitacion`.

#### Scenario: Tablet con query param
- **GIVEN** room `room-101-key` exists in MongoDB
- **WHEN** client opens `/habitacion?key=room-101-key`
- **THEN** the room UI SHALL load that room without requiring `NEXT_PUBLIC_ROOM_KEY` at build time

#### Scenario: API room con query
- **WHEN** GET `/api/room?key=room-101-key`
- **THEN** room data SHALL be returned

### REQ-ROOM-005: Calls con roomKey explícito (ADDED)

POST `/api/calls` and PATCH `/api/calls/room` MUST accept `roomKey` in body or query when env fallback is empty.

## ADDED Requirements

### REQ-ROOM-006: Prod sin env roomKey
In production build, `NEXT_PUBLIC_ROOM_KEY` MAY be empty; tablets MUST use `?key=` URLs.
