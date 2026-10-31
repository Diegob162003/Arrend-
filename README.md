# Arrendú

Herramienta web para que el propietario pequeño (1 a 5 inmuebles) administre sus arriendos sin inmobiliaria, y para que el inquilino construya un historial de buen pagador con referencias verificables.

## Stack

- **Next.js 16** (App Router, Server Actions, `proxy.ts`) + React 19 + TypeScript estricto
- **Tailwind CSS 4** + shadcn/ui (Base UI)
- **Supabase**: Postgres con Row Level Security, Auth (código por correo y Google) y Storage
- **Zod** + react-hook-form para validar en el navegador y en el servidor
- **Cloudflare Turnstile** contra bots en el ingreso
- **Sentry** (errores) y **PostHog** (métricas del piloto), apagados si no hay llaves
- **Vitest**, **pgTAP** (políticas RLS) y **Playwright** (E2E en celular)

## Requisitos

- Node.js 22 o superior
- Docker Desktop encendido (para Supabase local)

## Puesta en marcha

```bash
npm install
cp supabase/.env.example supabase/.env
npm run db:start
cp .env.example .env.local
```

Copia en `.env.local` la `Publishable key` que muestra `npx supabase status`. Luego:

```bash
npm run dev
```

- App: http://localhost:3000
- Correos de prueba (aquí llega el código de ingreso): http://127.0.0.1:54324
- Panel de la base de datos: http://127.0.0.1:54323

## Comandos

| Comando             | Qué hace                                   |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | Servidor de desarrollo                     |
| `npm run lint`      | ESLint                                     |
| `npm run typecheck` | Tipos de rutas + TypeScript                |
| `npm test`          | Pruebas unitarias (Vitest)                 |
| `npm run db:test`   | Pruebas de políticas RLS (pgTAP)           |
| `npm run test:e2e`  | Flujo completo en el build de producción   |
| `npm run db:reset`  | Recrea la base local desde las migraciones |
| `npm run db:types`  | Regenera `src/lib/database.types.ts`       |
| `npm run format`    | Formatea con Prettier                      |

## Seguridad

- **RLS en todas las tablas.** Cada persona solo ve sus propias filas, aunque haya un error en el código. Una prueba falla si alguna tabla de `public` queda sin RLS.
- **CSP con nonce por petición** (`src/proxy.ts`), HSTS, `X-Frame-Options: DENY` y `Permissions-Policy`.
- **Sin contraseñas**: código de 6 dígitos por correo (vence en 15 minutos), con Turnstile y límites de envío.
- Las Server Actions verifican la sesión por su cuenta y validan con Zod.

## Para producción (pendiente)

1. Crear el proyecto en Supabase (región São Paulo) y aplicar las migraciones con `npx supabase db push`.
2. Configurar un SMTP propio en Supabase (por ejemplo Resend): el correo incluido tiene un límite muy bajo.
3. Crear las llaves reales de Cloudflare Turnstile y poner la secreta en Supabase (Auth > Bot protection).
4. Desplegar en Netlify con las variables de `.env.example`.
5. Opcional: credenciales de Google, Sentry y PostHog.
