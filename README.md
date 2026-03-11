# Calendar Assistant

A modern, AI-powered calendar application built with React, TypeScript, and Google Calendar integration. Features a smooth typewriter animation chat interface, intuitive week/day views, and intelligent scheduling assistance powered by Anthropic's Claude.

![Calendar Assistant](https://img.shields.io/badge/React-19.2-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![Vite](https://img.shields.io/badge/Vite-7.3-purple)

## Features

### Calendar Integration
- **Google Calendar OAuth** - Secure authentication with Google
- **Week & Day Views** - Toggle between weekly overview and detailed daily view
- **Event Display** - Color-coded events with collision detection for overlapping events
- **Time Indicators** - Current time line with auto-scroll
- **Event Details** - Modal with full event information including attendees and responses

### AI Chat Assistant
- **Streaming Responses** - Smooth typewriter animation (50 chars/sec) like Claude/ChatGPT
- **Calendar-Aware** - Assistant can read your schedule and help with planning
- **Email Drafting** - Generate professional emails for meeting requests
- **Collapsible Panel** - Hide/show chat to maximize calendar space

### UI/UX
- **Modern Design** - Built with shadcn/ui components and Tailwind CSS
- **Dark Mode Support** - Full dark mode compatibility
- **Responsive Layout** - Works on desktop and mobile
- **Smooth Animations** - requestAnimationFrame-powered transitions

## Tech Stack

### Frontend
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast development and building
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - Accessible component primitives
- **@base-ui/react** - Headless UI components

### Backend
- **Node.js + Express** - API server (in `/server` directory)
- **Google Calendar API** - Calendar data sync
- **Anthropic Claude** - AI chat responses
- **Session-based Auth** - Secure authentication

### Testing
- **Vitest** - Unit testing framework
- **@testing-library/react** - React component testing
- **jsdom** - Browser environment simulation

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── auth/           # Login page components
│   │   ├── calendar/       # Calendar grid, event cards, navigation
│   │   ├── chat/           # Chat panel, messages, input
│   │   └── ui/             # shadcn/ui components
│   ├── hooks/
│   │   ├── use-auth.ts     # Authentication state
│   │   ├── use-calendar.ts # Calendar data fetching
│   │   └── use-chat.ts     # Chat streaming with typewriter animation
│   ├── lib/
│   │   ├── date-utils.ts   # Date/calendar utility functions
│   │   └── utils.ts        # General utilities (cn helper)
│   ├── services/
│   │   ├── auth.ts         # Auth API calls
│   │   ├── calendar.ts     # Calendar API calls
│   │   └── chat.ts         # Chat streaming API
│   ├── types/
│   │   └── index.ts        # TypeScript type definitions
│   ├── pages/
│   │   └── main-page.tsx   # Main application layout
│   ├── test/
│   │   └── setup.ts        # Test configuration
│   └── App.tsx             # Root component
├── server/                 # Backend API server
├── docs/                   # Documentation
└── public/                 # Static assets
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- Google OAuth credentials
- Anthropic API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tenex_interview
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install server dependencies**
   ```bash
   cd server && npm install && cd ..
   ```

4. **Configure environment variables**
   
   Create `.env` in the root:
   ```env
   VITE_API_URL=http://localhost:3001
   ```
   
   Create `server/.env`:
   ```env
   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback

   # Session
   SESSION_SECRET=your_random_session_secret

   # Anthropic
   ANTHROPIC_API_KEY=your_anthropic_api_key

   # Frontend
   CLIENT_URL=http://localhost:5173
   ```

5. **Start the development servers**
   ```bash
   # Start both frontend and backend
   npm run dev:all
   
   # Or start separately:
   npm run dev          # Frontend only
   npm run dev:server   # Backend only
   ```

6. **Open the application**
   
   Navigate to `http://localhost:5173`

## Available Scripts

### Frontend
| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:ui` | Open Vitest UI |
| `npm run test:coverage` | Run tests with coverage |

### Backend (in `/server` directory)
| Command | Description |
|---------|-------------|
| `npm run dev:server` | Start backend only |
| `npm test` | Run backend tests (watch mode) |
| `npm run test:run` | Run backend tests (CI) |
| `npm run test:ui` | Open Vitest UI |

### Combined
| Command | Description |
|---------|-------------|
| `npm run dev:all` | Start frontend + backend concurrently |

## Architecture

### Smooth Streaming Implementation

The chat uses a typewriter animation for smooth text streaming:

```
Network chunks → Buffer in ref → Animation loop → Character-by-character display
                     ↓                    ↓
                fullContentRef      requestAnimationFrame
                                         ↓
                                    20ms per character
                                         ↓
                                    setMessages() update
```

**Key files:**
- `src/hooks/use-chat.ts` - Animation loop and state management
- `src/services/chat.ts` - SSE streaming from backend

**Adjusting animation speed:**
Edit `src/hooks/use-chat.ts` line 55:
```typescript
const charsToAdd = Math.floor(elapsed / 20)  // Lower = faster
```

### Calendar Event Layout

Overlapping events are handled with collision detection:

```typescript
// Events are grouped by overlap, then divided horizontally
const layout = calculateEventLayout(events)
// Returns: [{ width: 50, offset: 0 }, { width: 50, offset: 50 }]
```

**Key files:**
- `src/lib/date-utils.ts` - Layout algorithm
- `src/components/calendar/week-grid.tsx` - Week view rendering

## Testing

Run the test suite:

```bash
# Watch mode (recommended during development)
npm run test

# Run once (for CI)
npm run test:run

# With UI
npm run test:ui

# With coverage report
npm run test:coverage
```

### Test Coverage

**Frontend tests:**
- `src/lib/date-utils.test.ts` - Date manipulation functions
- `src/lib/utils.test.ts` - Utility helpers

**Backend tests (in `/server`):**
- `src/services/ai-agent.test.ts` - AI prompt building
- `src/services/google-calendar.test.ts` - Calendar event types
- `src/middleware/require-auth.test.ts` - Auth middleware
- `src/routes/auth.test.ts` - Auth routes
- `src/routes/calendar.test.ts` - Calendar routes  
- `src/routes/chat.test.ts` - Chat routes

### Coverage Reports

**Frontend Coverage: ~96%**
```bash
npm run test:coverage
```

**Backend Coverage: ~83%**
```bash
cd server && npm run test:coverage
```

### Running Backend Tests

```bash
cd server

# Watch mode
npm run test

# Run once
npm run test:run

# With UI
npm run test:ui
```

## API Integration

### Google Calendar
The app uses Google OAuth 2.0 for authentication and fetches events from the user's primary calendar.

**Scopes required:**
- `https://www.googleapis.com/auth/calendar.events.readonly`
- `https://www.googleapis.com/auth/userinfo.profile`
- `https://www.googleapis.com/auth/userinfo.email`

### Anthropic Claude
Chat responses are streamed using Server-Sent Events (SSE) for real-time updates.

## Customization

### Calendar Time Range

Edit visible hours in `src/lib/date-utils.ts`:
```typescript
const DAY_START_HOUR = 6   // 6 AM
const DAY_END_HOUR = 22    // 10 PM
```

### Event Colors

Colors map to Google Calendar's color IDs in `src/components/calendar/event-card.tsx`.

## Deployment

### Frontend (Static)

```bash
npm run build
```

Deploy the `dist/` folder to your static hosting provider (Vercel, Netlify, etc.)

### Backend

The server in `/server` can be deployed to any Node.js hosting platform:

```bash
cd server
npm install
npm start
```

**Environment variables for production:**
- Update `GOOGLE_REDIRECT_URI` to your production domain
- Update `CLIENT_URL` to your frontend URL
- Generate a secure `SESSION_SECRET`

## Troubleshooting

### Common Issues

**Chat not streaming smoothly**
- Check that the backend SSE endpoint is working
- Verify `requestAnimationFrame` is not blocked by other scripts

**Google OAuth errors**
- Ensure `GOOGLE_REDIRECT_URI` matches exactly in Google Console
- Check that OAuth consent screen is configured

**Build errors**
- Make sure TypeScript version is 5.9+
- Clear `node_modules` and reinstall

## License

MIT

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Tailwind CSS](https://tailwindcss.com/) for the styling system
- [Base UI](https://base-ui.com/) for accessible primitives
