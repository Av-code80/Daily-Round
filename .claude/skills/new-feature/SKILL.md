---
name: new-feature
description: Scaffold a new DailyRound feature following all architecture, rendering, accessibility and code quality conventions
---

# New Feature Scaffold — DailyRound

When creating a new feature for DailyRound, follow every rule below without exception.

---

## 1. File Structure

Create `src/features/{name}/` with:
```
components/   — Feature-specific UI components
hooks/        — Custom hooks (business logic + state)
actions/      — Server Actions (DB queries via Supabase)
types.ts      — Feature TypeScript types (derived from Database type)
utils.ts      — Pure helper functions
```

Create page at `src/app/[locale]/{name}/page.tsx`.
Add translation keys to `messages/fr.json` AND `messages/en.json`.
Create test file at `src/__tests__/features/{name}/`.
If feature needs DB: create migration in `supabase/migrations/`.

---

## 2. Rendering Strategy — choose the right one

| Scenario | Strategy | How |
|---|---|---|
| Public content, rarely changes | **ISR** | `export const revalidate = 3600` in page |
| User-specific data, SEO needed | **SSR** | `export const dynamic = 'force-dynamic'` |
| Highly interactive UI | **CSR** | `'use client'` + TanStack Query |
| Static content, never changes | **SSG** | no config needed (Next.js default) |

Rules:
- Server Components by default — add `'use client'` ONLY when the component needs interactivity (onClick, useState, useEffect)
- Never fetch data in a Client Component — use Server Components or TanStack Query
- Prefer ISR over SSR when data does not need to be real-time
- Use Supabase Realtime only for live features (IncidentFlash)

---

## 3. Caching

- ISR pages: use `revalidate` + `revalidatePath()` / `revalidateTag()` in Server Actions after mutations
- TanStack Query: set `staleTime` intentionally — never leave it at 0 for stable data
- Optimistic updates with `onMutate` for instant UI feedback (stops, door codes)
- Cache Supabase queries with `unstable_cache` for public, non-user-specific data

---

## 4. Performance

- Lazy load heavy components: `const Map = dynamic(() => import('./Map'), { ssr: false })`
- Never import a full library — import only what you need
- Images: always use `next/image` with explicit `width` and `height`
- Fonts: loaded via `next/font` only (already configured)
- Bundle: no new packages without checking if Next.js/Supabase/Shadcn already provides it
- Avoid `useEffect` waterfalls — prefer parallel data fetching with `Promise.all`

---

## 5. Accessibility — WCAG 2.1 AA + RGAA 4.1

- Every interactive element must be keyboard-navigable (Tab, Enter, Space, Escape)
- Minimum contrast ratio: **7:1** for outdoor readability (brand requirement)
- All images need `alt` text; decorative images use `alt=""`
- Forms: every input must have an associated `<label>` (use Shadcn `FormLabel`)
- Modals/dialogs: focus must be trapped inside (Shadcn Dialog handles this)
- Use semantic HTML: `<nav>`, `<main>`, `<header>`, `<button>` not `<div onClick>`
- ARIA attributes only when semantic HTML is insufficient
- RGAA: provide French language attribute `lang="fr"` on root, text alternatives for all non-text content
- Minimum tap target: **56px** (mobile drivers, outdoor use)

---

## 6. Code Quality — DRY, SOLID, Clean Code

**DRY (Don't Repeat Yourself)**
- Extract repeated UI into a component after the second use
- Extract repeated logic into a custom hook or util function
- Shared Zod schemas live in `src/lib/validations/` — never duplicate validation

**SOLID**
- Single Responsibility: one component = one job. Split if it does two things
- Open/Closed: extend via props/composition, never modify shared components
- Dependency Inversion: components depend on abstractions (hooks), not direct Supabase calls

**Clean Code**
- Function names describe what they do: `markStopCompleted`, not `handleClick`
- No magic numbers: extract constants with meaningful names
- Max component length: ~150 lines. Split if longer
- No `any` type — ever. Use `unknown` and narrow if needed

---

## 7. Patterns to Always Follow

```ts
// Forms — always React Hook Form + Zod
const form = useForm<FormValues>({ resolver: zodResolver(schema) })

// Server data — always TanStack Query
const { data } = useQuery({ queryKey: ['stops', tourneeId], queryFn: fetchStops })

// Mutations — always with optimistic update
const mutation = useMutation({
  mutationFn: updateStop,
  onMutate: async (newStop) => { /* optimistic update */ },
  onError: (err, newStop, context) => { /* rollback */ },
})

// Client UI state — Zustand only
const useUIStore = create<UIState>((set) => ({ ... }))

// Text — always next-intl, never hardcode
const t = useTranslations('FeatureName')
<p>{t('label')}</p>

// Geospatial queries — PostGIS ST_DWithin
ST_DWithin(location, ST_MakePoint(lng, lat)::geography, radius_meters)

// Feature types — derived from DB types
import { Tables } from '@/lib/types/database'
export type Stop = Tables<'stops'>
```

---

## 8. Design System

- Brand orange: `#FF6B35`, navy: `#1B2838`
- Font: Plus Jakarta Sans (headings + body), JetBrains Mono (door codes only)
- Tailwind utility classes only — no CSS modules, no inline styles
- Shadcn/ui for all base components (Button, Input, Card, Dialog, Sheet, etc.)
- Mobile-first breakpoints, bottom navigation for thumb zone
- Dark mode supported — use Tailwind `dark:` variants
