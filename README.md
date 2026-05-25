# DailyRound

> A community-powered, open-source PWA for drivers in France.

Status: **in progress** — public roadmap, MVP under active development.

---

## Why this product is hard

DailyRound is a **multi-phase, multi-domain product** that sits at the intersection of several non-trivial engineering and product problems. Each feature is small on the surface and demanding underneath — the project deliberately uses these challenges as a vehicle for high-quality engineering practice and as a credible commercial offering for last-mile logistics.

## Tech stack (detailed)

### Application framework

- **[Next.js 16](https://nextjs.org)** with the App Router and **Turbopack** dev/build, running on **React 19**.
  Uses `cacheComponents: true` (Partial Prerendering / PPR) — every page is a static shell with `<Suspense>`-streamed dynamic holes.
- **TypeScript 5** in strict mode. No `any`, no `as T` casts — runtime validation via Zod, compile-time shape checks via `satisfies`.

### Server state & rendering

- **Server Components by default**; `'use client'` only when interactivity is required.
- **`'use cache'` + `cacheLife` + `cacheTag`** — per-feature cache scopes, tag-based invalidation (`updateTag`, `revalidateTag`).
- **[TanStack Query v5](https://tanstack.com/query)** for client-side server-state (mutations, optimistic updates, query invalidation). Defaults tuned for mobile/4G (60 s `staleTime`, no refetch-on-focus, single retry).

### Forms & validation

- **[React Hook Form](https://react-hook-form.com)** for all forms — uncontrolled inputs, low re-render cost.
- **[Zod](https://zod.dev)** for every validation surface — same schema runs on the client (via `@hookform/resolvers`) and inside Server Actions, so the contract is single-sourced.

### Client state

- **[Zustand](https://zustand.docs.pmnd.rs)** for ephemeral UI state only (modal open, selected tab, form draft recovery). Factory-based stores, `useShallow` selectors. **Never** for server data.

### Internationalisation

- **[next-intl 4](https://next-intl.dev)** — `[locale]` dynamic segment, FR default, EN fallback. `useTranslations` in client components, `getTranslations` in server components. All messages live in `messages/{fr,en}.json`.

### AI / LLM / Voice / Vision

- **[OpenAI](https://platform.openai.com)** — Whisper for voice transcription, GPT-4o-mini for structured field extraction.
- **Anthropic Claude (Sonnet 4.6 / Opus 4.7)** — Vision for parcel-label and screenshot parsing; plan-explainer assistant; voice-driven re-routing while driving.

### Testing & quality

- **[Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com)** — unit tests for pure functions, hooks, server actions, critical component interactions.
- **[happy-dom](https://github.com/capricorn86/happy-dom)** as the test environment.
- **ESLint 9** (Next config), **TypeScript** typecheck, full test suite — all run in CI on every PR.

### Infrastructure & DX

- **Vercel** deployment.
- **GitHub Actions** CI/CD — lint + typecheck + test + build on every PR.
- **MCP servers** — GitHub (PRs/issues), Context7 (library docs). Configured in `.mcp.json`.

---

## Getting started

```bash
# install
npm install

# dev (Turbopack)
npm run dev          # http://localhost:3000

# quality gates
npm run lint
npm run typecheck
npm run test         # Vitest

# production build
npm run build
```

## Conventions

- Comments and docs in English; UI strings always translated.
- Server Components by default; `'use client'` only for interactivity.
- Zod for **all** validation (shared client + server).
- TanStack Query for server data and mutations; **no** `useEffect` + `fetch`.
- Zustand only for ephemeral UI state.
- Conventional commits with leading emoji (`✨ feat:`, `🐛 fix:`, `🧪 test:`, `📝 docs:`, `♻️ refactor:`, `🔧 chore:`).
- Branches: `feature/{name}`, `fix/{name}`, `refactor/{name}`. PR against `main`.

---

## License

Open source. License file forthcoming.
