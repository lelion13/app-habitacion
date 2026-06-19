# Realtime — Delta deploy-hostinger-ghcr

## ADDED Requirements

### REQ-RT-005: Prod single instance
Production deployment MUST run exactly one web replica until SSE is backed by Redis (future change).

### REQ-RT-006: Traefik SSE
SSE streams (`/api/calls/stream`, `/api/calls/room/stream`) MUST NOT be buffered indefinitely by the reverse proxy.

#### Scenario: Evento en prod
- **GIVEN** dashboard connected via HTTPS
- **WHEN** a new call is created
- **THEN** `call:new` event SHALL arrive within 5 seconds without page reload

## MODIFIED Requirements

_None._
