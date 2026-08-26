# Oakbase CRM

CRM operativo de Oakbase para Leads, Cuentas, Contactos, Oportunidades, Propuestas, Facturas, Casos, Productos y Usuarios.

## Desarrollo local

```bash
npm install
cp .env.example .env
npm run dev
```

Por defecto usa persistencia local en `data/agentia-crm.json`.

Login demo:

- `nuria@oakbase.ai`
- La contraseña se configura de forma privada en `CRM_DEFAULT_PASSWORD`; no se almacena en el repositorio.

## Supabase

El esquema productivo vive en:

```text
supabase/migrations/20260624083825_create_agentia_crm_schema.sql
```

La migración crea tablas `crm_*`, relaciones, checks de moneda EUR/revenue type, RLS y grants explícitos para `authenticated` y `service_role`.

Para ejecutar el backend contra Supabase:

```bash
CRM_DATA_BACKEND=supabase
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SECRET_KEY=sb_secret_xxx
CRM_AUTH_SECRET=<long-random-secret>
CRM_DEFAULT_PASSWORD=<strong-private-password>
CRM_MCP_TOKEN=<long-random-secret>
```

Para cargar el JSON local en Supabase cuando tengas las env vars:

```bash
npm run supabase:push-json
```

## Vercel

Este repo tiene una app en subcarpeta, así que en Vercel configura:

- Root Directory: `crm`
- Build Command: `npm run build`
- Output Directory: `dist`
- Framework: Vite

Variables necesarias en Production y Preview:

```text
CRM_DATA_BACKEND=supabase
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SECRET_KEY=sb_secret_xxx
CRM_AUTH_SECRET=<long-random-secret>
CRM_DEFAULT_PASSWORD=<strong-private-password>
CRM_MCP_TOKEN=<long-random-secret>
```

`vercel.json` deja el frontend como SPA y las rutas `/api/*` como serverless functions.

## MCP

Local:

```bash
npm run mcp
```

Produccion:

```text
POST https://<deployment>/api/mcp
Authorization: Bearer <CRM_MCP_TOKEN>
```

Claude:

```text
https://<deployment>/api/mcp
```

El MCP remoto usa Streamable HTTP y OAuth 2.1 con PKCE. Claude descubre la autenticacion en `/.well-known/oauth-protected-resource`, registra o identifica su cliente, abre `/api/oauth/authorize` y el usuario entra con su email y contraseña del CRM. El token emitido queda vinculado al usuario del CRM que autorizo la conexion. `CRM_MCP_TOKEN` sigue funcionando como token estatico para automatizaciones internas.

Las herramientas expuestas mantienen el CRUD generico, importacion, dashboard y conversion de lead. Tambien hay acciones CRM de alto nivel para asistentes:

- `crm_list_tasks`: lista tareas con `ownerName` y filtros por estado, owner, fechas y texto.
- `crm_list_opportunities`: lista oportunidades abiertas por defecto, con cuenta, contacto, owner, etapa y productos relacionados.
- `crm_list_accounts`: lista cuentas con owner, contactos y resumen de oportunidades/pipeline.
- `crm_move_opportunity_stage`: mueve una oportunidad a una etapa valida de `pathConfigs.opportunities`; la probabilidad se recalcula en el store.
- `crm_add_opportunity_product`: crea un `opportunityLineItems` usando `listPrice`/`revenueType` del producto si no se pasan overrides, y por defecto cambia la oportunidad a `amountMode=syncProducts`.
