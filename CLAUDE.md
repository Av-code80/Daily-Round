@AGENTS.md

# DailyRound

Responsive PWA for delivery drivers in France. Community terrain data, route management, employer reviews.

## Stack

- Next.js 16 (App Router), TypeScript strict, Tailwind CSS 4, Shadcn/ui
- Supabase (PostgreSQL + PostGIS + Auth + Realtime + RLS)
- Auth.js v5 (magic link + OAuth)
- TanStack Query (server state), Zustand (client state)
- React Hook Form + Zod (forms + validation)
- next-intl (FR + EN internationalization)
- Leaflet + OpenStreetMap (maps, geospatial)
- Vitest + Testing Library (tests)
- Deployed on Vercel, CI/CD via GitHub Actions

## Architecture

Feature-based, NOT type-based. Each feature is self-contained:

```
src/features/{feature}/
  components/   — UI specific to feature
  hooks/        — business logic + state
  actions/      — server actions (DB queries)
  types.ts      — feature types
  utils.ts      — feature helpers
```

Shared code lives in `src/components/ui/` (Shadcn), `src/lib/` (utils, supabase, auth).

## Code Conventions

- All comments in English
- All documentation in English
- Server Components by default. Add `'use client'` only for interactivity
- Supabase RLS enforces authorization — no manual auth checks in server actions
- Zod schemas for ALL form validation (shared between client + server)
- Tailwind utility classes only — no CSS modules, no styled-components
- Shadcn/ui for base components (Button, Input, Card, Dialog, Sheet, etc.)
- React Hook Form for all forms
- TanStack Query for all server data fetching and mutations
- Zustand only for ephemeral client UI state (selected tab, modal open, etc.)

## i18n

next-intl with `[locale]` dynamic route segment. Default locale: `fr`. Translation files in `messages/fr.json` and `messages/en.json`. Use `useTranslations('Namespace')` in client components, `getTranslations('Namespace')` in server components. All user-facing text MUST go through translation — never hardcode French or English strings.

## Build & Run

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run typecheck    # TypeScript check (tsc --noEmit)
npm run test         # Vitest
npm run test:watch   # Vitest watch mode
```

## Database

Supabase PostgreSQL with PostGIS extension. All geospatial queries use `GEOGRAPHY(POINT, 4326)` columns with GIST indexes. Types auto-generated: run `npx supabase gen types typescript --local > src/lib/types/database.ts` after schema changes. Migrations in `supabase/migrations/`. RLS enabled on ALL tables.

## Testing

Vitest + Testing Library. Test files in `src/__tests__/` mirroring `src/` structure. Focus on: pure functions (geo.ts, validation.ts), custom hooks (useTournee, useCodePorte), critical component interactions (StopCard tap-to-complete, CodeForm submit). Run `npm run test` before committing.

## Git

Branch naming: `feature/{name}`, `fix/{name}`, `refactor/{name}`. Commit messages: conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`). PR against `main`. GitHub Actions runs lint + typecheck + test + build on every PR.

## Design

Brand orange `#FF6B35`, navy `#1B2838`. Font: Plus Jakarta Sans (headings + body), JetBrains Mono (door codes). Mobile-first, minimum tap target 56px. High contrast 7:1 for outdoor readability. Bottom navigation for thumb-zone. Dark mode supported.

## Key Patterns

- Geospatial nearby queries: use PostGIS `ST_DWithin(location, ST_MakePoint(lng, lat)::geography, radius_meters)`
- Optimistic updates: TanStack Query `onMutate` for instant UI feedback
- Realtime: Supabase Realtime channels for IncidentFlash live updates
- PWA: Service worker caches tournée data for offline viewing
- Auth: Auth.js session checked in `proxy.ts` (Next.js 16 renamed middleware)
- Forms: `useForm()` with `zodResolver(schema)` pattern everywhere

## MCP Servers

GitHub MCP for PRs and issues. Context7 for up-to-date library docs. See `.mcp.json` for project-scoped servers.

## React 19 & Next 16

- Use React 19 new hooks, features and potentials if only needed

## Do NOT

- Do not use `localStorage` or `sessionStorage` — use React state or Zustand
- Do not bypass RLS with service role key in client code
- Do not hardcode text strings — use next-intl translations
- Do not use `any` type — always type explicitly
- Do not install packages without checking if Supabase/Next.js/Shadcn already provides the functionality
- Do not create API routes when Server Actions suffice
- Do not use `useEffect` for data fetching — use TanStack Query
