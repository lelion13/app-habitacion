# Skill registry — App Habitación

Registro de skills y convenciones relevantes para SDD/apply en este proyecto.

## Stack skills

| Skill | Cuándo usar |
|-------|-------------|
| microprompt | Microapps Next.js + MongoDB; convenciones base del repo |
| dockerSeguridadHostinger | Despliegue prod VPS (futuro) |
| api-design-principles | Nuevos endpoints REST |

## Convenciones proyecto

| Archivo | Contenido |
|---------|-----------|
| [AGENTS.md](file:///C:/Users/llion/AGENTS.md) | Stack general Lion apps (FastAPI/React baseline) |
| [MICRO-PROMPT.md](../MICRO-PROMPT.md) | Origen funcional microprompt |
| [openspec/config.yaml](../openspec/config.yaml) | Reglas SDD |

## SDD workflow skills

| Skill | Fase |
|-------|------|
| sdd-explore | Investigación previa |
| sdd-propose | Propuesta de cambio |
| sdd-spec | Delta specs |
| sdd-design | Diseño técnico |
| sdd-tasks | Desglose tareas |
| sdd-apply | Implementación |
| sdd-verify | Verificación vs specs |
| sdd-archive | Cierre y merge specs |

## Comandos verify (desde `web/`)

```bash
npm run test:unit
npm run build
npm run test:e2e
```
