# Design Guide: Calendar AI Assistant

## 1. Architecture & Tech Stack

- **Frontend Framework:** React via Vite (TypeScript)
- **Styling:** Tailwind CSS v4 + shadcn/ui components
- **UI Enhancements:** React Bits for creative animations and effects
- **Path Aliases:** `@/` maps to `src/`
- **Font:** Geist Variable (installed via shadcn init)
- **Authentication:** Google OAuth 2.0 (GSuite) — grants access to Google Calendar API
- **Calendar Data:** Google Calendar API v3 — read events, free/busy info, attendee details
- **AI Agent:** Anthropic Claude (streaming) — selected for strong conversational reasoning and native streaming SDK. Receives calendar context for scheduling analysis, email drafting, and time management recommendations. Provider is isolated behind a service layer and can be swapped.
- **Backend:** Lightweight server needed to securely handle OAuth token exchange and proxy AI API calls (keeps secrets out of the browser)

## 2. Styling Rules

- **Methodology:** Use Tailwind utility classes exclusively. Component-level styles come from shadcn/ui primitives. Custom CSS is only permitted inside `index.css` for theme variables and global resets.
- **Component Library:** All base UI primitives (buttons, inputs, cards, dialogs, etc.) must use shadcn/ui. Custom components build on top of these — never reimplement what shadcn provides.
- **Layout Integrity:** Keep flexbox/grid alignments clean and deliberate. Avoid duplicate alignment rules. Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`) for breakpoints.

## 3. Visual Language

- **Color Palette:** Support light and dark modes via shadcn's CSS variable system. Crisp, solid backgrounds. Vibrant, highly saturated colors for calendar event categorization (e.g., green for personal, blue for team meetings, red for external calls) — pull category colors from Google Calendar where available.
- **Depth & Elevation:** Soft, diffused drop shadows for layering. The calendar grid sits at the base layer; the chat panel floats above it.
- **Shapes:** Consistent rounded corners using shadcn's `--radius` variable. All event blocks, cards, and chat bubbles use the theme radius.
- **Clean UI:** Two primary surfaces — the calendar and the chat. No dashboards, metrics panels, or clutter. Every element earns its place.
- **Typography:** Geist Variable font. Tailwind type scale with `font-medium` and `font-bold` for hierarchy.

## 4. Animation & Interaction

- **Micro-interactions:** React Bits for creative effects — text animations on the landing/login page, smooth transitions between views, hover states on event cards.
- **Event Cards:** Clicking/tapping an event triggers a slight scale-up and reveals detail (time, attendees, description). Feels tactile and responsive.
- **Chat Panel:** Slide-in animation when opened. Messages animate in with a subtle fade/slide.
- **Performance:** Animations use CSS transitions on `transform`/`opacity` for GPU acceleration. Never block the main thread.

## 5. Core Views

### 5a. Login / Auth Screen
- Clean, centered layout with Google Sign-In button (shadcn `Button` variant).
- Brief value proposition text — what the app does and why to connect Google Calendar.
- React Bits animation for visual polish (e.g., animated gradient, text reveal).
- On successful OAuth, redirect to the main calendar view.

### 5b. Calendar View
- **Layout:** Weekly view as the default. Day view available as a toggle. The calendar is the main content area.
- **Event Blocks:** Rendered as tactile cards on the time grid. Color-coded by calendar/category. Show title and time at minimum; expand on click for full details (attendees, description, location).
- **Time Grid:** Subtle low-opacity gray grid lines. Hours labeled on the left axis. Current time indicated with a colored line.
- **Navigation:** Week/day toggle, previous/next arrows, "Today" button. Simple top bar — no bloat.
- **Data Source:** Events fetched from Google Calendar API using the authenticated user's OAuth token.

### 5c. Chat Interface
- **Positioning:** Persistent side panel (right side) on desktop. On mobile, a floating action button that opens a full-screen or slide-over chat.
- **Backdrop:** When chat is prominent/modal, apply `backdrop-blur` to the calendar behind it.
- **Message Bubbles:** User messages right-aligned in a primary color bubble. AI responses left-aligned in a muted/neutral bubble.
- **Agent Capabilities the UI must support:**
  - **Scheduling analysis:** "How much time am I in meetings?" — agent reads calendar data, responds with breakdown.
  - **Email drafting:** "Write me an email to reschedule with Joe" — AI response renders as a copyable email card (distinct formatting, copy button).
  - **Scheduling suggestions:** "Block my mornings for workouts" — agent suggests calendar changes.
  - **Multi-person coordination:** "Schedule meetings with Joe, Dan, and Sally" — agent considers free/busy, proposes times.
- **Output Formatting:** Structured data (email drafts, time breakdowns, schedules) renders in distinct, copyable cards — never walls of text. Support markdown rendering in AI responses.
- **Streaming:** AI responses stream token-by-token for a responsive feel.
- **Context:** Every chat message sends the user's calendar data as context to the AI, so the agent always knows the current schedule.

## 6. Data Flow

```
User → Google OAuth → Access Token → Google Calendar API → Calendar Events
                                                               ↓
User → Chat Input → Backend → AI Provider (with calendar context) → Streamed Response → Chat UI
```

- OAuth tokens stored securely (httpOnly cookies or server-side session — never localStorage for refresh tokens).
- Calendar data fetched on login and refreshable. Passed as context to the AI agent on each chat request.
- AI API keys live server-side only — never exposed to the browser.

## 7. Project Conventions

- **Imports:** Use `@/` path alias for all internal imports.
- **File Organization:**
  - `src/components/ui/` — shadcn/ui primitives (managed by CLI)
  - `src/components/calendar/` — calendar grid, event cards, navigation
  - `src/components/chat/` — chat panel, message bubbles, email cards
  - `src/components/auth/` — login screen, OAuth flow
  - `src/pages/` — page-level components (login, main app)
  - `src/hooks/` — custom React hooks (useCalendar, useChat, useAuth)
  - `src/services/` — Google Calendar API client, AI agent client, auth service
  - `src/types/` — TypeScript types (CalendarEvent, ChatMessage, User, etc.)
  - `src/lib/` — utilities (`cn()` helper, date formatting, etc.)
- **Naming:** PascalCase for components, camelCase for hooks/utils, kebab-case for file names.
- **Environment Variables:** All secrets (Google Client ID/Secret, AI API keys) in `.env` — never committed. A `.env.example` file documents required variables.
