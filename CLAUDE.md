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

## Caching & Rendering Strategy

### Foundation — Cache Components + PPR

Enable `cacheComponents: true` in `next.config.ts`. This activates Next 16's Cache Components model and Partial Prerendering (PPR) by default. Under this model:

- Every page is a **static shell** + **dynamic holes**.
- Any server-side runtime read (`cookies()`, `headers()`, `auth()`, `searchParams`, `params` without `generateStaticParams`, `Math.random`, `Date.now`, `crypto.randomUUID`) MUST be either inside `<Suspense>` OR inside a `'use cache'` scope.
- Uncaught dynamic reads **fail the build** with "Uncached data was accessed outside of `<Suspense>`". That's intentional: it forces explicit streaming boundaries.

### Three lifetimes

| Lifetime | API | Use when |
| --- | --- | --- |
| **Per-request (dynamic)** | `cookies()`/`headers()`/`auth()` inside `<Suspense>` | Session-dependent, per-user data |
| **Cached with TTL** | `'use cache'` + `cacheLife('seconds'\|'minutes'\|'hours'\|'days'\|'weeks')` + `cacheTag('...')` | Data that changes over time but tolerates a shelf life |
| **Static until deploy** | Plain JSX, or `'use cache'` + `cacheLife('max')` + `cacheTag('...')` | File-bundled or deploy-scoped content (i18n JSON, feature flags, config) |

### Three invalidation APIs

| API | Where it runs | Semantics | Use case |
| --- | --- | --- | --- |
| `cacheLife(profile)` | Inside `'use cache'` | TTL expiry | Automatic background refresh |
| `revalidateTag('tag', 'max')` | Server Action / Route Handler | Stale-while-revalidate | Mutation where slight staleness is OK |
| `updateTag('tag')` | Server Action only | **Immediate** expire | Read-your-own-writes (user just mutated, must see it) |
| `revalidatePath('/path')` | Server Action / Route Handler | Path-scoped invalidation | Last resort — prefer tags (more surgical) |

### Per-feature strategy

#### i18n (messages)

- `getMessages({ locale })` wrapped in a `'use cache'` function.
- `cacheLife('max')` + `cacheTag('i18n:${locale}')`. Files only change on deploy.
- Called once in `[locale]/layout.tsx`, passed via `NextIntlClientProvider`.

#### Auth

- `/api/auth/[...nextauth]/route.ts` → `export const dynamic = 'force-dynamic'` (correct today — never cache).
- Auth pages (`login`, `verify`, `error`) → `'use cache'` + `cacheLife('max')`. Identical for every user.
- Profile page → static shell, session read split into a `<Suspense>`-wrapped child that calls `auth()`. Never cache `auth()` output.
- Server actions (`loginWithEmail`, `signOutUser`) → untagged; they redirect, don't mutate cached data directly.

#### Tournées (delivery rounds) — when implemented

- Server reads: `'use cache'` + `cacheLife('minutes')` + `cacheTag('tournees:${userId}')`.
- After user mutation: `updateTag('tournees:${userId}')` in the Server Action (user must see their change instantly).
- Client-side: TanStack Query with `onMutate` for optimistic UI; rollback on error.
- PWA offline cache of recent tournées in service worker (post-MVP).

#### Incidents (realtime flash feed)

- Initial seed (last 20): `'use cache'` + `cacheLife('seconds')` + `cacheTag('incidents:feed')`.
- Live updates: Supabase Realtime channel on the client, no caching.
- Render inside `<Suspense>` with a skeleton; live updates patch the TanStack Query cache via `setQueryData`.
- After user reports an incident: `revalidateTag('incidents:feed', 'max')` (stale-while-revalidate is fine — realtime channel fills the gap).

#### Door codes & terrain data (shared, read-heavy)

- Per-ZIP cache: `'use cache'` + `cacheLife('hours')` + `cacheTag('codes:${zipCode}')`.
- Nearby queries (`ST_DWithin`): `'use cache'` + `cacheLife('hours')` + `cacheTag('codes:near:${geohash}')` where `geohash` is computed from rounded lat/lng.
- After user submits a new code: `updateTag('codes:${zipCode}')` so the submitter sees their addition immediately.

#### Employer reviews (shared, read-heavy, eventually-consistent is fine)

- Per-employer list: `'use cache'` + `cacheLife('hours')` + `cacheTag('reviews:${employerId}')`.
- After new review: `revalidateTag('reviews:${employerId}', 'max')` — background refresh, other users can tolerate ~1h staleness.

#### Map pins

- Compose from cached `codes:near:${geohash}` + cached `incidents:feed`. Leaflet renders on client only.

### Client-side (TanStack Query)

Provider scope: mount `QueryClientProvider` in `(app)/layout.tsx` only — the authenticated area. Auth pages don't need it.

Default options (mobile-first, battery-conscious for drivers on 4G):

```ts
{
  queries: {
    staleTime: 60_000,           // 1 min — data is fresh, avoid refetch storms
    gcTime: 5 * 60_000,          // 5 min cache after unmount
    refetchOnWindowFocus: false, // drivers switch apps constantly
    refetchOnReconnect: true,    // resync when back on signal
    retry: 1,                    // don't hammer flaky networks
  },
  mutations: {
    retry: 0,                    // let each feature decide retry policy
  },
}
```

Mutations must follow the optimistic pattern: `onMutate` patches cache → `onError` rolls back → `onSettled` calls `queryClient.invalidateQueries`.

### Rendering decisions — default per file type

| File | Default |
| --- | --- |
| `app/layout.tsx`, `(app)/layout.tsx`, `(auth)/layout.tsx` | Static (no data) |
| `[locale]/layout.tsx` | Cached (`'use cache'` around `getMessages`) |
| Auth pages (`login`, `verify`, `error`) | Cached static (`cacheLife('max')`) |
| Feature pages reading shared data (tournées, codes, reviews) | Cached with TTL + tag |
| Feature pages reading per-user session | Static shell + `<Suspense>` around session component |
| Route handlers for auth/webhooks | `dynamic = 'force-dynamic'` |
| Server actions | No caching on the action itself; invalidate via `updateTag`/`revalidateTag` |

### Do's

- Tag every cached entry. Anonymous cache entries can't be surgically invalidated.
- Prefer `updateTag` over `revalidateTag` when the user who triggered the mutation must see the result.
- Prefer `revalidateTag` over `revalidatePath` — more precise, less over-invalidation.
- Split session reading into its own `<Suspense>`-wrapped component so the rest of the page is part of the static shell.
- Pass runtime-extracted values (e.g. `userId` from `auth()`) as arguments to `'use cache'` functions — they become part of the cache key.

### Don'ts

- Do not cache `auth()` output, `cookies()` result, or any per-user session data.
- Do not use `cacheLife('max')` for DB-backed data — stale entries would outlive mutations forever (the only escape would be a deploy).
- Do not call non-deterministic APIs (`Math.random`, `Date.now`, `crypto.randomUUID`) outside a cached scope or outside `<Suspense>` without `await connection()` first.
- Do not share cache entries across users unintentionally — if data is user-scoped, the userId must be in the cache key (either as an argument or via the tag).
- Do not use `useEffect` + `fetch` for data — use TanStack Query on the client or server reads in the component.

## Do NOT

- Do not use `localStorage` or `sessionStorage` — use React state or Zustand
- Do not bypass RLS with service role key in client code
- Do not hardcode text strings — use next-intl translations
- Do not use `any` type — always type explicitly
- Do not install packages without checking if Supabase/Next.js/Shadcn already provides the functionality
- Do not create API routes when Server Actions suffice
- Do not use `useEffect` for data fetching — use TanStack Query
