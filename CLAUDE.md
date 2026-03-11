# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered calendar assistant with Google Calendar integration, Claude-powered chat, and a React frontend. Monorepo with frontend at root and Express backend in `/server`.

## Commands

### Frontend (root)
- `npm run dev` — Vite dev server (localhost:5173)
- `npm run build` — TypeScript check + Vite production build
- `npm run lint` — ESLint
- `npm run test` — Vitest watch mode
- `npm run test:run` — Vitest single run (CI)
- `npm run test:coverage` — Coverage report

### Backend (`/server`)
- `npm run dev` (from server/) — `tsx watch` dev server (localhost:3001)
- `npm run test:run` (from server/) — Vitest single run

### Both
- `npm run dev:all` — Runs frontend + backend concurrently
- `npm run dev:server` — Shortcut to start backend from root

### Running a single test
```bash
# Frontend
npx vitest run src/lib/date-utils.test.ts

# Backend
cd server && npx vitest run src/services/ai-agent.test.ts
```

## Architecture

### Data Flow
```
Google OAuth → Session cookie → Express backend → Google Calendar API → Events
User chat → POST /api/chat → Anthropic Claude (with calendar context in system prompt) → SSE stream → Frontend typewriter animation
```

### Frontend (`src/`)
- **App.tsx** — Auth gate: shows `LoginPage` or `MainPage` based on `useAuth` state
- **pages/main-page.tsx** — Primary layout: calendar view + collapsible chat panel side-by-side
- **hooks/** — `use-auth.ts`, `use-calendar.ts`, `use-chat.ts` (streaming with requestAnimationFrame typewriter at 20ms/char)
- **services/** — API clients: `auth.ts`, `calendar.ts`, `chat.ts` (SSE via fetch + ReadableStream, not EventSource)
- **components/calendar/** — Week/day grid with collision detection for overlapping events
- **components/chat/** — Streaming chat panel with markdown rendering and email draft cards
- **components/ui/** — shadcn/ui primitives (managed by CLI, base-nova style)
- **lib/date-utils.ts** — Calendar layout algorithm, date math, DAY_START_HOUR/DAY_END_HOUR constants

### Backend (`server/src/`)
- **index.ts** — Express app with fail-fast env validation, session auth, CORS
- **routes/** — `auth.ts` (Google OAuth flow), `calendar.ts` (event fetching), `chat.ts` (SSE streaming)
- **services/ai-agent.ts** — Claude prompt building with calendar context injection; provider-swappable
- **services/google-calendar.ts** — Google Calendar API client
- **middleware/require-auth.ts** — Session-based auth guard

### Key API Routes
- `GET /auth/google` — OAuth redirect
- `GET /auth/google/callback` — OAuth callback
- `GET /auth/me` — Current user session
- `POST /auth/logout` — Logout
- `GET /api/calendar/events` — Fetch user's calendar events
- `POST /api/chat` — Chat endpoint (SSE streaming response)
- `GET /health` — Health check

## Important Conventions

- **Path alias:** `@/` maps to `src/` (configured in tsconfig + vite)
- **shadcn/ui v4 uses @base-ui/react, NOT Radix.** Use `render` prop instead of `asChild`. Check actual component APIs — they differ from Radix.
- **Styling:** Tailwind CSS v4 utility classes only. Custom CSS only in `index.css` for theme variables. shadcn components use `base-nova` style with CSS variables.
- **File naming:** kebab-case for files, PascalCase for components, camelCase for hooks/utils
- **TypeScript:** `verbatimModuleSyntax` enabled — use `import { type X }` for type-only imports
- **Environment:** All secrets in root `.env` file (server reads from `../../.env`). Never duplicate secrets between frontend and backend.
- **SSE streaming:** Chat uses fetch + ReadableStream manual parsing (not EventSource) because POST is required. See `src/services/chat.ts`.
- **State in streams:** Always use functional `setState(prev => ...)` inside async/stream callbacks to avoid stale closures.

## Docs

- `docs/design-guide.md` — Full design spec, visual language, and architecture decisions
- `docs/mistakes-and-fixes.md` — Known pitfalls and their solutions (shadcn v4 gotchas, THREE.js issues, SSE patterns)
