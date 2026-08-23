# @aiv/web — OPTWEB multi-surface platform frontend

Next.js (App Router) frontend implementing the three-surface architecture
from the build brief: a public marketing site, an authenticated Client
Portal, and an internal Ops console — sharing one Apple-inspired dark
design system (`#0B0C10` canvas, `#F5F5F7` text, `#E2B774` accent).

This app is UI-only, wired to static mock data (`lib/mock-data.ts`), not to
the real `@aiv/scanner` / `@aiv/scoring` / `@aiv/ai-probe` agents or a real
database. It's a scaffold for the platform surfaces described in the build
brief, meant to be connected to a real data API and auth provider next.

## Layout

```
app/
  page.tsx              Public landing (hero, live sample playground, bento
                         feature grid, pricing/CTA)
  portal/                Client Portal — RBAC-gated, role "customer"
    page.tsx              overview
    data/                 Schema Explorer (filter/sort/columns/export)
    api-keys/              API key & webhook management
    usage/                 usage & billing meters
    integrations/          Postgres/BigQuery/Snowflake/Sheets/Zapier hub
  admin/                  Internal Ops — RBAC-gated, role "admin"
    page.tsx               overview
    scrapers/               scraper fleet + proxy health + queue
    pipeline/                schema-mapping / pipeline builder
    qa/                      manual review queue (accept/reject)
    tenants/                 tenant rate limits, access, audit
components/
  ui/          shared primitives (Button, GlassCard, StatusPill, Meter, Table)
  marketing/   landing-page sections
  dashboard/   shell (sidebar/topbar), route gate, sign-in panel
lib/
  auth-context.tsx   demo RBAC stub (see below)
  mock-data.ts       static data backing every table/meter/chart
```

## Auth / RBAC — this is a stub

`lib/auth-context.tsx` is a **client-side demo auth stub**: it persists a
chosen role (`customer` | `admin`) to `localStorage` so `/portal` and
`/admin` can be gated without a real identity provider. There are no
credentials, no sessions, no server-side verification — anyone can open the
"sign in" panel and pick a role.

Swap this for **Supabase Auth or Clerk** (per the build brief) before this
ships: real session verification belongs in middleware/server components,
not a `useEffect`. `RouteGate` (`components/dashboard/route-gate.tsx`) is
the single seam to replace — everything downstream just reads `useAuth()`.

## Running it

From the repo root (this app is an npm workspace, `@aiv/web`):

```bash
npm install
npm run dev:web      # http://localhost:3000
npm run build:web
```

Or from `apps/web` directly: `npm run dev` / `npm run build`.

## Design system

Tokens live in `app/globals.css` (Tailwind v4 `@theme`): `canvas` /
`structure` / `accent` colors per the brief, `Inter` for text, `Geist Mono`
for code/data, a `.glass` / `.glass-raised` glassmorphism utility (1px
`rgba(255,255,255,0.08)` borders + backdrop blur), and a `text-gradient-accent`
utility for headline emphasis.
