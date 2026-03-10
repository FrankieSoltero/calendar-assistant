# Calendar AI Assistant — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web app where users authenticate with Google, view their calendar, and chat with an AI agent that understands their schedule — capable of scheduling analysis, email drafting, and time management recommendations.

**Architecture:** Monorepo with Express REST backend (`server/`) and Vite React frontend (`src/`). Backend handles OAuth token exchange, proxies Google Calendar API calls, and proxies AI chat requests (keeping all secrets server-side). Frontend renders the calendar and chat UI. AI agent receives calendar events as context with each chat message.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind CSS v4, shadcn/ui, Express, Google OAuth 2.0, Google Calendar API v3 (events + freebusy), Anthropic Claude API (streaming), React Bits (copy-paste component library — not npm).

**Design Decision: AI Provider** — Anthropic Claude selected over Hugging Face and Kimi-K2 for strong conversational reasoning, native streaming support, and well-documented SDK. This can be swapped later since the AI service is isolated behind `server/src/services/ai-agent.ts`.

**Design Decision: Read-only scope** — Using `calendar.readonly` scope. The agent *suggests* calendar changes and drafts emails but does not write to the calendar directly. This is intentional — the user maintains control.

---

## File Structure

```
tenex_interview/
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                    # Express entry point, CORS, session, routes
│       ├── routes/
│       │   ├── auth.ts                 # GET /auth/google, GET /auth/google/callback, GET /auth/me, POST /auth/logout
│       │   ├── calendar.ts             # GET /api/calendar/events
│       │   └── chat.ts                 # POST /api/chat (streamed)
│       ├── middleware/
│       │   └── require-auth.ts         # Session-based auth guard
│       ├── types/
│       │   └── session.d.ts            # Express session type augmentation (tokens, user profile)
│       └── services/
│           ├── google-calendar.ts      # Google Calendar API v3 client (events + freebusy)
│           └── ai-agent.ts             # Anthropic Claude client + system prompt + calendar context builder
├── src/
│   ├── App.tsx                         # Router: login vs main app based on auth state
│   ├── main.tsx                        # React entry point
│   ├── index.css                       # Tailwind + shadcn theme
│   ├── types/
│   │   └── index.ts                    # CalendarEvent, ChatMessage, User types
│   ├── services/
│   │   ├── auth.ts                     # Auth API calls (login redirect, logout, check session)
│   │   ├── calendar.ts                 # Calendar API calls (fetch events)
│   │   └── chat.ts                     # Chat API calls (send message, handle stream)
│   ├── hooks/
│   │   ├── use-auth.ts                 # Auth state + login/logout actions
│   │   ├── use-calendar.ts             # Calendar events state + fetch/refresh
│   │   └── use-chat.ts                 # Chat messages state + send/stream
│   ├── components/
│   │   ├── ui/                         # shadcn/ui primitives (managed by CLI)
│   │   ├── auth/
│   │   │   └── login-page.tsx          # Google sign-in screen with branding
│   │   ├── calendar/
│   │   │   ├── calendar-view.tsx       # Main calendar layout (grid + nav)
│   │   │   ├── week-grid.tsx           # Weekly time grid with event positioning
│   │   │   ├── day-grid.tsx            # Daily time grid with event positioning
│   │   │   ├── event-card.tsx          # Individual event block (color, title, time, expand)
│   │   │   ├── event-detail.tsx        # Expanded event detail (attendees, description, location)
│   │   │   ├── calendar-nav.tsx        # Week/day toggle, prev/next, today button
│   │   │   └── current-time-line.tsx   # Red line indicating current time
│   │   └── chat/
│   │       ├── chat-panel.tsx          # Side panel container (desktop: persistent, mobile: slide-over)
│   │       ├── message-list.tsx        # Scrollable message history
│   │       ├── message-bubble.tsx      # Individual message (user vs AI styling)
│   │       ├── chat-input.tsx          # Text input + send button
│   │       ├── email-card.tsx          # Copyable email draft card
│   │       └── markdown-renderer.tsx   # Renders markdown in AI responses
│   ├── pages/
│   │   └── main-page.tsx              # Calendar + chat side-by-side layout
│   └── lib/
│       ├── utils.ts                    # cn() helper (already exists)
│       └── date-utils.ts              # Date formatting, week boundaries, time slot helpers
├── .env.example                        # Documents all required env vars
└── docs/
```

---

## Chunk 1: Backend + Authentication

### Task 1: Express Server Scaffold

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/src/index.ts`
- Create: `.env.example`
- Create: `.env`
- Modify: root `package.json` (add dev scripts)

- [ ] **Step 1: Initialize server package**

```bash
mkdir -p server/src/routes server/src/middleware server/src/services
```

Create `server/package.json`:
```json
{
  "name": "tenex-server",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

- [ ] **Step 2: Install server dependencies**

```bash
cd server && npm install express cors express-session dotenv googleapis @anthropic-ai/sdk && npm install -D tsx typescript @types/express @types/cors @types/express-session
```

- [ ] **Step 3: Create server tsconfig**

Create `server/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Update .gitignore FIRST (before creating any .env)**

Add to `.gitignore`:
```
.env
.env.local
```

This MUST happen before any `.env` file is created to prevent accidental credential commits.

- [ ] **Step 5: Create .env.example and .env**

Create `.env.example` at **project root** (both frontend and server read from here):
```env
# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback

# Session
SESSION_SECRET=

# Anthropic
ANTHROPIC_API_KEY=

# Frontend
CLIENT_URL=http://localhost:5173
```

Create `.env` with the same keys (user fills in values). The `.env` file lives at the project root. The server loads it via `dotenv.config({ path: '../.env' })` since the server runs from `server/`.

- [ ] **Step 6: Create Express entry point**

Create `server/src/index.ts`:
- `dotenv.config({ path: '../.env' })` — load env vars from project root
- **Env validation:** On startup, check that `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`, and `ANTHROPIC_API_KEY` are set. If any are missing, log a clear error and `process.exit(1)`.
- CORS configured with `origin: process.env.CLIENT_URL`, `credentials: true` — the `credentials: true` is required for cross-origin session cookies to work with `fetch({ credentials: 'include' })` on the frontend.
- `express-session` configured with:
  - `secret: process.env.SESSION_SECRET`
  - `cookie: { httpOnly: true, sameSite: 'lax', secure: false }` (secure: false for localhost dev, true in production)
  - `resave: false`, `saveUninitialized: false`
- JSON parsing, mount route placeholders, listen on port 3001.

- [ ] **Step 7: Create session type declaration**

Create `server/src/types/session.d.ts`:
```typescript
import 'express-session'

declare module 'express-session' {
  interface SessionData {
    tokens?: {
      access_token: string
      refresh_token?: string
      expiry_date?: number
    }
    user?: {
      email: string
      name: string
      picture?: string
    }
  }
}
```

This prevents TypeScript errors when accessing `req.session.tokens` and `req.session.user`.

- [ ] **Step 8: Install concurrently and add root-level dev scripts**

Install first, then update scripts:
```bash
npm install -D concurrently
```

Then modify root `package.json`:
```json
"scripts": {
  "dev": "vite",
  "dev:server": "cd server && npm run dev",
  "dev:all": "concurrently \"npm run dev\" \"npm run dev:server\"",
  "build": "tsc -b && vite build"
}
```

- [ ] **Step 9: Verify server starts**

Run: `cd server && npm run dev`
Expected: Server listening on port 3001

- [ ] **Step 10: Commit**

```bash
git add server/ .env.example .gitignore package.json package-lock.json
git commit -m "feat: scaffold Express backend with session, CORS, env config"
```

---

### Task 2: Google OAuth Flow

**Files:**
- Create: `server/src/routes/auth.ts`
- Create: `server/src/middleware/require-auth.ts`
- Modify: `server/src/index.ts` (mount auth routes)

- [ ] **Step 1: Create auth routes**

Create `server/src/routes/auth.ts` with four endpoints:

1. `GET /auth/google` — Generates Google OAuth URL with scopes (`calendar.readonly`, `userinfo.email`, `userinfo.profile`) and `access_type: 'offline'` (to get a refresh token). Redirects the browser to Google's consent screen.
2. `GET /auth/google/callback` — Receives the authorization code from Google, exchanges it for access + refresh tokens using `googleapis`, fetches user profile info from Google's userinfo endpoint, stores both tokens and user profile in the session, redirects to `CLIENT_URL`.
3. `GET /auth/me` — Returns the current user's profile (email, name, picture) from session, or 401 if not authenticated.
4. `POST /auth/logout` — Destroys the session, returns 200.

Use `google-auth-library` (included in `googleapis` package) for OAuth2Client.

- [ ] **Step 2: Create auth middleware with token refresh**

Create `server/src/middleware/require-auth.ts`:
- Checks for valid tokens in session. Returns 401 if missing.
- **Token refresh:** If `tokens.expiry_date` is in the past (or within 5 minutes of expiring), use the `refresh_token` to get a new `access_token` via OAuth2Client. Update the session with the new tokens.
- If refresh fails (no refresh_token or Google rejects it), return 401 so the frontend can redirect to re-auth.
- Attaches the (possibly refreshed) access token to `req` for downstream use.

- [ ] **Step 3: Mount auth routes in index.ts**

Modify `server/src/index.ts` to import and mount auth routes at `/auth`.

- [ ] **Step 4: Test OAuth flow manually**

1. Start server: `npm run dev:server`
2. Open browser to `http://localhost:3001/auth/google`
3. Should redirect to Google consent screen (will fail without valid credentials, but the redirect URL generation confirms the flow works)

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/auth.ts server/src/middleware/require-auth.ts server/src/index.ts
git commit -m "feat: Google OAuth flow with session-based token storage"
```

---

### Task 3: Google Calendar API Proxy

**Files:**
- Create: `server/src/services/google-calendar.ts`
- Create: `server/src/routes/calendar.ts`
- Modify: `server/src/index.ts` (mount calendar routes)

- [ ] **Step 1: Create Google Calendar service**

Create `server/src/services/google-calendar.ts` — exports two functions:

1. `getCalendarEvents(accessToken, timeMin, timeMax)`:
   - Creates an OAuth2Client, sets credentials with the access token
   - Uses `google.calendar('v3').events.list()` to fetch events from the primary calendar
   - Returns normalized event objects: `{ id, title, start, end, description, location, attendees, colorId, htmlLink }`

2. `getFreeBusy(accessToken, timeMin, timeMax, emails)`:
   - Uses `google.calendar('v3').freebusy.query()` to check availability for a list of email addresses
   - Returns a map of `{ email: { busy: { start, end }[] } }`
   - This enables the AI agent to consider other attendees' availability when suggesting meeting times

- [ ] **Step 2: Create calendar routes**

Create `server/src/routes/calendar.ts` with:
- `GET /api/calendar/events` — protected by `requireAuth` middleware. Accepts `timeMin` and `timeMax` query params. Calls the calendar service. Returns JSON array of events.
- `GET /api/calendar/freebusy` — protected by `requireAuth`. Accepts `timeMin`, `timeMax`, and `emails` (comma-separated) query params. Returns freebusy data. Used by the chat endpoint to provide availability context to the AI agent.

- [ ] **Step 3: Mount calendar routes**

Modify `server/src/index.ts` to import and mount calendar routes at `/api/calendar`.

- [ ] **Step 4: Commit**

```bash
git add server/src/services/google-calendar.ts server/src/routes/calendar.ts server/src/index.ts
git commit -m "feat: Google Calendar API proxy with event normalization"
```

---

### Task 4: AI Agent Endpoint

**Files:**
- Create: `server/src/services/ai-agent.ts`
- Create: `server/src/routes/chat.ts`
- Modify: `server/src/index.ts` (mount chat routes)

- [ ] **Step 1: Create AI agent service**

Create `server/src/services/ai-agent.ts`:
1. Initialize Anthropic client from env
2. Export `buildSystemPrompt(events)` — constructs a system prompt that includes:
   - The agent's role: calendar assistant that can analyze schedules, draft emails, suggest scheduling changes
   - The user's current calendar events as structured JSON
   - Instructions for formatting: use markdown, use code blocks for email drafts
3. Export `streamChat(messages, events)` — calls Anthropic's messages API with streaming enabled, returns the stream

- [ ] **Step 2: Create chat route**

Create `server/src/routes/chat.ts`:
- `POST /api/chat` — protected by `requireAuth`. Accepts `{ messages: ChatMessage[] }` in body. Fetches the user's calendar events (next 2 weeks) using the calendar service from Task 3 (import dependency). Calls `streamChat()` with events as context. Pipes the streamed response back using SSE (`text/event-stream` content type).

**Note:** This route imports `getCalendarEvents` from `server/src/services/google-calendar.ts`, so Task 4 depends on Task 3.

- [ ] **Step 3: Mount chat routes**

Modify `server/src/index.ts` to mount chat routes at `/api/chat`.

- [ ] **Step 4: Commit**

```bash
git add server/src/services/ai-agent.ts server/src/routes/chat.ts server/src/index.ts
git commit -m "feat: AI chat endpoint with calendar context and streaming"
```

---

## Chunk 2: Frontend — Auth + Calendar

### Task 5: TypeScript Types + Frontend Services

**Files:**
- Create: `src/types/index.ts`
- Create: `src/services/auth.ts`
- Create: `src/services/calendar.ts`
- Create: `src/services/chat.ts`
- Create: `src/lib/date-utils.ts`

- [ ] **Step 1: Define shared types**

Create `src/types/index.ts`:
```typescript
export interface CalendarEvent {
  id: string
  title: string
  start: string    // ISO 8601
  end: string      // ISO 8601
  description?: string
  location?: string
  attendees?: { email: string; displayName?: string; responseStatus?: string }[]
  colorId?: string
  htmlLink?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface User {
  email: string
  name: string
  picture?: string
}
```

- [ ] **Step 2: Create auth service**

Create `src/services/auth.ts`:
- `getLoginUrl()` — returns `http://localhost:3001/auth/google`
- `fetchCurrentUser()` — calls `GET /auth/me` with `credentials: 'include'`, returns `User | null`
- `logout()` — calls `POST /auth/logout` with `credentials: 'include'`

- [ ] **Step 3: Create calendar service**

Create `src/services/calendar.ts`:
- `fetchEvents(timeMin, timeMax)` — calls `GET /api/calendar/events` with `credentials: 'include'`, returns `CalendarEvent[]`

- [ ] **Step 4: Create chat service**

Create `src/services/chat.ts`:
- `sendMessage(messages: ChatMessage[])` — calls `POST /api/chat` with `credentials: 'include'` and the message history. Returns a `ReadableStream` for SSE consumption. Handles streaming by reading the response body reader and yielding text chunks.

- [ ] **Step 5: Create date utilities**

Create `src/lib/date-utils.ts`:
- `getWeekBounds(date)` — returns `{ start: Date, end: Date }` for the week containing `date` (Sunday to Saturday)
- `getDayHours()` — returns array of hour labels (6 AM to 10 PM)
- `formatTime(isoString)` — formats to "9:00 AM"
- `formatDateRange(start, end)` — "Mon, Jan 15 · 9:00 - 10:00 AM"
- `getEventPosition(event, dayStart)` — calculates `top` and `height` percentages for positioning an event on the time grid
- `getWeekDays(weekStart)` — returns array of 7 dates for the week

- [ ] **Step 6: Commit**

```bash
git add src/types/ src/services/ src/lib/date-utils.ts
git commit -m "feat: TypeScript types, API services, and date utilities"
```

---

### Task 6: Auth Hook + Login Page

**Files:**
- Create: `src/hooks/use-auth.ts`
- Create: `src/components/auth/login-page.tsx`
- Modify: `src/App.tsx`
- Install: shadcn card component

- [ ] **Step 1: Install shadcn components needed for auth**

```bash
npx shadcn@latest add card avatar
```

- [ ] **Step 2: Create auth hook**

Create `src/hooks/use-auth.ts`:
- State: `user: User | null`, `loading: boolean`
- On mount: call `fetchCurrentUser()` to check session
- `login()` — redirects to `getLoginUrl()`
- `logout()` — calls `logout()` service, clears user state
- Returns `{ user, loading, login, logout }`

- [ ] **Step 3: Create login page**

Create `src/components/auth/login-page.tsx`:
- Centered layout (`min-h-screen flex items-center justify-center`)
- shadcn `Card` with app name, brief description ("Connect your Google Calendar. Chat with your AI scheduling assistant.")
- Google sign-in button (shadcn `Button` with Google icon from Lucide or inline SVG)
- React Bits animation for visual polish (animated gradient background or text reveal — decide during implementation based on available React Bits effects)

- [ ] **Step 4: Wire up App.tsx with auth routing**

Modify `src/App.tsx`:
- Uses `useAuth()` hook
- If `loading`: show a centered spinner/skeleton
- If no `user`: render `<LoginPage />`
- If `user`: render `<MainPage />`  (placeholder for now)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-auth.ts src/components/auth/ src/App.tsx src/components/ui/
git commit -m "feat: Google auth flow with login page and session check"
```

---

### Task 7: Calendar View — Grid + Navigation

**Files:**
- Create: `src/hooks/use-calendar.ts`
- Create: `src/components/calendar/calendar-view.tsx`
- Create: `src/components/calendar/calendar-nav.tsx`
- Create: `src/components/calendar/week-grid.tsx`
- Create: `src/components/calendar/day-grid.tsx`
- Create: `src/components/calendar/current-time-line.tsx`
- Create: `src/pages/main-page.tsx`
- Install: shadcn components as needed

- [ ] **Step 1: Install shadcn components for calendar**

```bash
npx shadcn@latest add toggle-group separator scroll-area badge
```

- [ ] **Step 2: Create calendar hook**

Create `src/hooks/use-calendar.ts`:
- State: `events: CalendarEvent[]`, `loading: boolean`, `currentDate: Date`, `view: 'week' | 'day'`
- `fetchEventsForRange()` — calls calendar service for the current view's date range
- `setView(view)` — switches between week/day
- `navigate(direction: 'prev' | 'next' | 'today')` — shifts currentDate and re-fetches
- Auto-fetches on mount and when currentDate/view changes

- [ ] **Step 3: Create calendar navigation**

Create `src/components/calendar/calendar-nav.tsx`:
- Left side: "Today" button, prev/next arrows (ChevronLeft, ChevronRight from Lucide)
- Center: formatted date range ("Mar 10 – 16, 2026")
- Right side: Week/Day toggle (shadcn ToggleGroup)

- [ ] **Step 4: Create week grid**

Create `src/components/calendar/week-grid.tsx`:
- Header row: days of the week (Mon, Tue, ...) with date numbers
- Time column: hours 6 AM – 10 PM on the left
- Grid cells: positioned relatively so event cards can be absolutely positioned within
- Subtle gray grid lines (`border-border/30`)
- Uses `getEventPosition()` from date-utils to position events
- Renders `<EventCard />` for each event (placeholder component for now)

- [ ] **Step 5: Create day grid**

Create `src/components/calendar/day-grid.tsx`:
- Single column version of week grid
- Same time axis, same event positioning logic
- Wider event cards since there's only one column

- [ ] **Step 6: Create current time line**

Create `src/components/calendar/current-time-line.tsx`:
- Red/primary colored horizontal line positioned at the current time
- Updates every minute via `setInterval`
- Only visible when viewing today's date range

- [ ] **Step 7: Create calendar view container**

Create `src/components/calendar/calendar-view.tsx`:
- Composes `CalendarNav` + `WeekGrid` or `DayGrid` based on view state
- Receives events, currentDate, view, navigation actions as props from the hook

- [ ] **Step 8: Create main page**

Create `src/pages/main-page.tsx`:
- Uses `useCalendar()` hook
- Layout: full width for calendar (chat panel added later)
- Top bar with user avatar/name, logout button
- `<CalendarView />` as main content

- [ ] **Step 9: Verify calendar renders**

Start both servers (`npm run dev:all`). Login with Google. Calendar should display with events from Google Calendar.

- [ ] **Step 10: Commit**

```bash
git add src/hooks/use-calendar.ts src/components/calendar/ src/pages/main-page.tsx src/components/ui/
git commit -m "feat: calendar view with weekly/daily grid, navigation, and event display"
```

---

### Task 8: Event Cards + Detail View

**Files:**
- Create: `src/components/calendar/event-card.tsx`
- Create: `src/components/calendar/event-detail.tsx`
- Install: shadcn dialog/popover

- [ ] **Step 1: Install shadcn components**

```bash
npx shadcn@latest add dialog popover
```

- [ ] **Step 2: Create event card**

Create `src/components/calendar/event-card.tsx`:
- Receives `CalendarEvent` as prop
- Renders as a rounded card with category color (from `colorId` mapping or defaults)
- Shows title + time range
- `hover:scale-[1.02]` transition for tactile feel
- Drop shadow on hover
- Click opens event detail

- [ ] **Step 3: Create event detail**

Create `src/components/calendar/event-detail.tsx`:
- shadcn `Dialog` or `Popover` showing full event info
- Title, time range, location (with map icon), description, attendee list with response status
- Link to Google Calendar event (`htmlLink`)
- Clean layout, no clutter

- [ ] **Step 4: Commit**

```bash
git add src/components/calendar/event-card.tsx src/components/calendar/event-detail.tsx src/components/ui/
git commit -m "feat: event cards with color coding, hover effects, and detail view"
```

---

## Chunk 3: Chat Interface + AI Agent

### Task 9: Chat Hook + Streaming

**Files:**
- Create: `src/hooks/use-chat.ts`

- [ ] **Step 1: Create chat hook**

Create `src/hooks/use-chat.ts`:
- State: `messages: ChatMessage[]`, `isStreaming: boolean`
- `sendMessage(content: string)` — appends user message to state, calls chat service with full message history, reads the SSE stream chunk by chunk, appends/updates the assistant message in real-time as tokens arrive
- `clearMessages()` — resets chat history
- Generates unique IDs for messages (crypto.randomUUID or nanoid)

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-chat.ts
git commit -m "feat: chat hook with streaming message support"
```

---

### Task 10: Chat UI Components

**Files:**
- Create: `src/components/chat/chat-panel.tsx`
- Create: `src/components/chat/message-list.tsx`
- Create: `src/components/chat/message-bubble.tsx`
- Create: `src/components/chat/chat-input.tsx`
- Create: `src/components/chat/email-card.tsx`
- Create: `src/components/chat/markdown-renderer.tsx`
- Modify: `src/pages/main-page.tsx` (add chat panel)
- Install: shadcn sheet, react-markdown

- [ ] **Step 1: Install dependencies**

```bash
npx shadcn@latest add sheet input textarea
npm install react-markdown remark-gfm
```

`remark-gfm` enables GitHub-flavored markdown (tables, strikethrough, task lists) — useful for schedule breakdowns and structured AI responses.

- [ ] **Step 2: Create markdown renderer**

Create `src/components/chat/markdown-renderer.tsx`:
- Wraps `react-markdown` with `remarkGfm` plugin and Tailwind prose styling
- Detects email draft blocks (e.g., fenced code blocks with `email` language tag) and renders them as `<EmailCard />`

- [ ] **Step 3: Create email card**

Create `src/components/chat/email-card.tsx`:
- shadcn `Card` with distinct styling (muted background, border)
- Shows email content with subject/body formatting
- Copy button (Lucide `Copy` icon) that copies the email text to clipboard
- "Copied!" feedback on click

- [ ] **Step 4: Create message bubble**

Create `src/components/chat/message-bubble.tsx`:
- User messages: right-aligned, primary color background, white text
- AI messages: left-aligned, muted background, foreground text
- AI messages render content through `<MarkdownRenderer />`
- Subtle fade-in animation on mount
- Timestamp below each message

- [ ] **Step 5: Create message list**

Create `src/components/chat/message-list.tsx`:
- shadcn `ScrollArea` containing message bubbles
- Auto-scrolls to bottom when new messages arrive (ref + scrollIntoView)
- Empty state: "Ask me about your schedule, or I can help draft emails and find meeting times."

- [ ] **Step 6: Create chat input**

Create `src/components/chat/chat-input.tsx`:
- shadcn `Textarea` (auto-resizing) + send button
- Submit on Enter (Shift+Enter for newline)
- Disabled while streaming
- Placeholder: "Ask about your schedule..."

- [ ] **Step 7: Create chat panel**

Create `src/components/chat/chat-panel.tsx`:
- Desktop (lg+): persistent right side panel, fixed width (~400px), full height
- Mobile: shadcn `Sheet` triggered by a floating action button (bottom-right). Apply `backdrop-blur-sm` to the calendar content behind the sheet overlay for the frosted glass effect specified in the design guide.
- Contains `<MessageList />` + `<ChatInput />`
- Header with "Calendar Assistant" title and close/minimize button

- [ ] **Step 8: Integrate chat into main page**

Modify `src/pages/main-page.tsx`:
- Desktop layout: `grid grid-cols-[1fr_400px]` with calendar on left, chat panel on right
- Mobile: calendar full width, floating chat button in bottom-right corner
- Uses `useChat()` hook, passes messages/actions to chat panel
- Passes calendar events from `useCalendar()` as context (chat service sends events with each message)

- [ ] **Step 9: Verify end-to-end chat flow**

1. Start both servers
2. Login, verify calendar loads
3. Type a message in chat, verify it streams back
4. Ask "How much time am I in meetings this week?" — verify it references actual calendar data
5. Ask for an email draft — verify it renders in a copyable card

- [ ] **Step 10: Commit**

```bash
git add src/components/chat/ src/pages/main-page.tsx src/components/ui/
git commit -m "feat: chat interface with streaming, markdown rendering, and email cards"
```

---

### Task 11: Visual Polish + React Bits

**Files:**
- Modify: `src/components/auth/login-page.tsx` (add animations)
- Modify: various components (transitions, hover states)
- Install: react-bits

- [ ] **Step 1: Add React Bits animations**

React Bits (reactbits.dev) is a **copy-paste component library**, not an npm package. Browse the site, select desired animation components (e.g., animated gradients, text reveals, hover effects), and copy them into `src/components/ui/`. Adapt imports and styling to use our Tailwind + shadcn setup.

- [ ] **Step 2: Add login page animations**

Modify `src/components/auth/login-page.tsx`:
- Animated gradient background or subtle particle effect
- Text reveal animation on the heading
- Fade-in on the sign-in card

- [ ] **Step 3: Add calendar transitions**

- Event cards: `transition-all duration-200 hover:scale-[1.02] hover:shadow-lg`
- View transitions: fade between week/day views
- Navigation: subtle slide when changing weeks

- [ ] **Step 4: Add chat animations**

- Chat panel slide-in: `transition-transform duration-300`
- Message bubbles: fade-in-up animation on mount
- Streaming text: cursor blink effect at the end of streaming messages

- [ ] **Step 5: Dark mode toggle**

Add a theme toggle button (Sun/Moon icon from Lucide) in the top bar. Toggle `dark` class on `<html>`. Respect `prefers-color-scheme` on first load.

- [ ] **Step 6: Final visual review**

Walk through every screen:
- Login → auth → calendar → open chat → send message → receive response → view email draft → toggle dark mode → switch week/day view → navigate weeks → click event → view detail

- [ ] **Step 7: Commit**

```bash
git add src/components/ src/pages/ src/App.tsx
git commit -m "feat: visual polish with animations, transitions, and dark mode"
```

---

### Task 12: Environment Setup + Documentation

**Files:**
- Verify: `.env.example` is complete
- Verify: `.gitignore` excludes `.env`, `node_modules`, `dist`
- Create: `docs/mistakes-and-fixes.md`

- [ ] **Step 1: Verify .gitignore**

Ensure `.gitignore` includes:
```
node_modules
dist
.env
```

- [ ] **Step 2: Create docs/mistakes-and-fixes.md**

Per CLAUDE.md requirements — document any issues encountered and fixes applied during development.

- [ ] **Step 3: Final build check**

```bash
npm run build
cd server && npm run build
```

Both should complete with zero errors.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "docs: environment setup, gitignore, and project documentation"
```

---

## Execution Order Summary

| # | Task | Depends On | Parallelizable |
|---|------|-----------|----------------|
| 1 | Express Server Scaffold | — | — |
| 2 | Google OAuth Flow | 1 | — |
| 3 | Calendar API Proxy | 2 | — |
| 4 | AI Agent Endpoint | 3 | — |
| 5 | Types + Frontend Services | 4 (API contracts finalized) | — |
| 6 | Auth Hook + Login Page | 5 | — |
| 7 | Calendar View + Grid | 5, 6 | — |
| 8 | Event Cards + Detail | 7 | — |
| 9 | Chat Hook + Streaming | 5 | with 7, 8 |
| 10 | Chat UI Components | 9 | — |
| 11 | Visual Polish | 6, 7, 8, 10 | — |
| 12 | Docs + Final Build | 11 | — |

**Parallelization opportunities:**
- Task 9 (chat hook) can be built in parallel with Tasks 7-8 (calendar UI) since they're independent frontend concerns
- Tasks 7+8 (calendar UI) and Tasks 9+10 (chat UI) can be developed concurrently after Task 6 completes
