# Agentia Labs CRM

CRM operativo inspirado en Salesforce Sales Cloud para Leads, Cuentas, Contactos, Oportunidades, Propuestas, Facturas, Casos, Productos y Usuarios.

## Desarrollo local

```bash
npm install
npm run dev
```

Por defecto usa persistencia local en `data/agentia-crm.json`.

Login demo:

- `nuria@agentialabs.ai`
- `Agentia2026!`

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

El endpoint remoto usa Streamable HTTP y expone CRUD, importacion, dashboard y conversion de lead.
