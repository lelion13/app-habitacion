# UI — Delta telegram-call-actions

## ADDED Requirements

### REQ-UI-012: Página join video mobile

Route `/join/video` MUST be mobile-first and usable without prior dashboard navigation.

#### Scenario: Layout móvil
- **GIVEN** valid token exchanged to JWT
- **WHEN** page loads on phone viewport
- **THEN** video UI SHALL be fullscreen-friendly with clear end-call control
- **AND** MUST request camera/microphone permission via existing `VideoCallSession`

#### Scenario: Error de token
- **GIVEN** invalid token
- **WHEN** page loads
- **THEN** user SHALL see concise Spanish error and guidance to use dashboard

#### Scenario: Sin imágenes decorativas
- Page MUST follow project UI rules (accent teal, iconos CSS/SVG, no bitmap assets)
