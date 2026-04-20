@AGENTS.md

# DailyRound

Responsive PWA for delivery drivers in France. Community terrain data, route management, employer reviews.

## Stack

- Next.js 16 (App Router, Turbopack, `cacheComponents: true`), TypeScript strict, Tailwind 4, Shadcn/ui
- Supabase (PostgreSQL + PostGIS + Auth + Realtime + RLS)
- Auth.js v5 (magic link + OAuth)
- TanStack Query (server state), Zustand (client UI state)
- React Hook Form + Zod (forms + validation)
- next-intl (FR + EN)
- Leaflet + OpenStreetMap
- Vitest + Testing Library
- Deployed on Vercel, CI/CD via GitHub Actions

## Architecture

Feature-based. Each feature is self-contained:

```
src/features/{feature}/
  components/  hooks/  actions/  types.ts  utils.ts
```

Shared code: `src/components/ui/` (Shadcn), `src/lib/` (utils, supabase, auth).

## Conventions

- Comments + docs in English
- Server Components by default; `'use client'` only for interactivity
- Supabase RLS enforces authZ — no manual auth checks in server actions
- Zod for ALL validation (shared client + server)
- Tailwind utilities only
- React Hook Form + `zodResolver` for all forms
- TanStack Query for all server data + mutations; no `useEffect` + `fetch`
- Zustand only for ephemeral UI state (modal open, selected tab)

## i18n

next-intl with `[locale]` dynamic segment. Default `fr`. Files: `messages/fr.json`, `messages/en.json`. `useTranslations('NS')` in clients, `getTranslations('NS')` in servers. Never hardcode user-facing strings.

## Build & Run

```bash
npm run dev          # Turbopack dev
npm run build        # Production build
npm run lint
npm run typecheck
npm run test         # Vitest
```

## Database

Supabase Postgres + PostGIS. Geospatial columns `GEOGRAPHY(POINT, 4326)` with GIST indexes. Types auto-gen: `npx supabase gen types typescript --local > src/lib/types/database.ts`. Migrations in `supabase/migrations/`. RLS on all tables.

## Testing

Vitest + Testing Library. Tests in `src/__tests__/` mirroring `src/`. Focus: pure functions, custom hooks, critical component interactions. Run `npm run test` before committing.

## Git

Branches: `feature/{name}`, `fix/{name}`, `refactor/{name}`. Conventional commits with leading emoji (`✨ feat:`, `🐛 fix:`, `🧪 test:`, `📝 docs:`, `♻️ refactor:`, `🔧 chore:`). PR against `main`. CI runs lint + typecheck + test + build.

## Design

Brand orange `#FF6B35`, navy `#1B2838`. Plus Jakarta Sans (body), JetBrains Mono (door codes). Mobile-first, 56px min tap targets, 7:1 contrast, bottom/thumb-zone nav, dark mode supported.

## Key Patterns

- Geospatial nearby: PostGIS `ST_DWithin(location, ST_MakePoint(lng, lat)::geography, radius_meters)`
- Optimistic updates: TanStack Query `onMutate` → rollback in `onError` → `invalidateQueries` in `onSettled`
- Realtime: Supabase Realtime channels for live updates
- PWA: service worker caches tournée data for offline (post-MVP)
- Auth: Auth.js session checked in `proxy.ts` (Next 16 renamed middleware)

## Caching & Rendering

Next 16 Cache Components model. `cacheComponents: true` in `next.config.ts` → PPR (Partial Prerendering) is default: every page = static shell + `<Suspense>`-streamed dynamic holes. Any server-side runtime read (`cookies()`, `headers()`, `auth()`, `searchParams`, `Math.random`, `Date.now`, `crypto.randomUUID`) MUST be inside `<Suspense>` OR inside a `'use cache'` scope, otherwise the build fails.

### Three lifetimes

| Lifetime | API | Use when |
| --- | --- | --- |
| Per-request | `cookies()`/`headers()`/`auth()` inside `<Suspense>` | Session / per-user data |
| Cached with TTL | `'use cache'` + `cacheLife('seconds'\|'minutes'\|'hours'\|'days'\|'weeks')` + `cacheTag('...')` | Data with a shelf life (rounds, codes, reviews) |
| Static until deploy | Plain JSX, or `'use cache'` + `cacheLife('max')` + `cacheTag('...')` | Deploy-scoped (i18n, feature flags) |

### Invalidation

| API | Where | Semantics |
| --- | --- | --- |
| `cacheLife(profile)` | Inside `'use cache'` | TTL expiry |
| `revalidateTag('tag', 'max')` | Server Action / Route Handler | Stale-while-revalidate (background refresh) |
| `updateTag('tag')` | Server Action only | Immediate expire (read-your-own-writes) |
| `revalidatePath('/path')` | Server Action / Route Handler | Last resort; prefer tags |

### Tag naming

`${domain}:${scope}` — e.g. `i18n:${locale}`, `tournees:${userId}`, `codes:${zipCode}`, `reviews:${employerId}`. User-scoped data must carry `userId` in key (argument to `'use cache'` function) or tag.

### Client side (TanStack Query)

`QueryClientProvider` mounted in `(app)/layout.tsx` (authenticated scope only). Defaults (mobile/4G/battery-conscious):

```ts
queries: {
  staleTime: 60_000, gcTime: 5 * 60_000,
  refetchOnWindowFocus: false, refetchOnReconnect: true, retry: 1,
}
mutations: { retry: 0 }
```

### Rendering defaults per file

| File | Default |
| --- | --- |
| `app/layout.tsx`, `(app)/layout.tsx`, `(auth)/layout.tsx` | Static |
| `[locale]/layout.tsx` | `'use cache'` helper around `getMessages`, `cacheLife('max')` |
| Auth pages (`login`/`verify`/`error`) | Static (no per-user data) |
| Feature pages reading shared data | `'use cache'` + TTL + tag |
| Feature pages reading session | Static shell + `<Suspense>` around session component |
| Route handlers (auth/webhooks) | No route config exports; runtime API access → dynamic |
| Server actions | Not cacheable; invalidate via `updateTag`/`revalidateTag` |

### Worked example (i18n — already implemented)

```ts
// src/app/[locale]/layout.tsx
async function getLocaleMessages(locale: string) {
  'use cache'
  cacheLife('max')
  cacheTag(`i18n:${locale}`)
  return getMessages({ locale })
}
```

`locale` is an argument → part of the cache key → `fr` and `en` cached separately. `cacheLife('max')` since JSON only changes on deploy. Tag enables targeted invalidation if translations move to a CMS later.

## MCP Servers

GitHub (PRs/issues), Context7 (library docs). See `.mcp.json`.

## Do NOT

- `localStorage` / `sessionStorage` — use React state or Zustand
- Bypass RLS with service role key in client code
- Hardcode user-facing strings — always translate
- `any` type
- Install packages without checking Supabase/Next/Shadcn first
- Create API routes when Server Actions suffice
- `useEffect` for data fetching — use TanStack Query
- Cache `auth()` / `cookies()` output or any per-user session data
- `cacheLife('max')` for DB-backed data (would outlive mutations forever)
- Non-deterministic ops (`Math.random`, `Date.now`, `crypto.randomUUID`) outside a cached scope or outside `<Suspense>` without `await connection()`
- Share cache entries across users — include `userId` in cache key if user-scoped
- Export legacy route segment config (`dynamic`, `revalidate`, `fetchCache`, `runtime`) — incompatible with `cacheComponents: true`
