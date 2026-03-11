import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

/**
 * Dotenv Setup:
 * We pull our env variables from the root of the project
 * instead of keeping one in both front end and back end
 * Prevents duplication of secrets
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import express, { type ErrorRequestHandler } from 'express'
import cors from 'cors'
import session from 'express-session'
import rateLimit from 'express-rate-limit'
import authRoutes from './routes/auth.js'
import calendarRoutes from './routes/calendar.js'
import chatRoutes from './routes/chat.js'
/**
 * Env Validation:
 * We implement a fail fast env validation
 * This means if any of the env variables are missing
 * we fail gracefully and do not start up with any missing env 
 * vars. This prevents silent failures down the road
 */
const requiredEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'SESSION_SECRET',
  'ANTHROPIC_API_KEY',
] as const

const missing = requiredEnvVars.filter((key) => !process.env[key])
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`)
  console.error('Copy .env.example to .env and fill in the values.')
  process.exit(1)
}

const app = express()
const PORT = process.env.PORT || 3001

console.log(process.env.VITE_API_URL)
/**
 * Cors:
 * We set up cors to have origin restricted to our front end Url
 * This stops random websites from requesting data from our backend
 * The credentials forces the browser to say its okay to send cookies 
 * across origin. Without this we would drop our session cookie and 
 * every request would fail silently
 */
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
)

app.use(express.json())

/**
 * Session Config: 
 * We need httpOnly to be true to prevent XSS from stealing sessions
 * sameSite: Lax to prevent CSRF on state changing requests
 * secure toggled false for local dev env and true for production environment
 * Enforces TLS in prod
 * resave: false, saveUninitialized: false -> only writes sessions when modified
 * Avoids unnecessary storage and avoids setting cookies on users who are not logged in
 */
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
)

/**
 * Rate Limiting:
 * Global limiter applies a baseline to all routes.
 * Stricter limiters on auth (prevent brute-force) and chat
 * (prevent Anthropic API cost abuse). Uses IP-based keying
 * by default; in production behind a proxy, set
 * app.set('trust proxy', 1) and use X-Forwarded-For.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later' },
})

const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages, please slow down' },
})

app.use(globalLimiter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/auth', authLimiter, authRoutes)
app.use('/api/calendar', calendarRoutes)
app.use('/api/chat', chatLimiter, chatRoutes)

/**
 * Centralized Error Handler:
 * Catches any unhandled errors that slip through route-level
 * try/catch blocks. Ensures every error response uses the
 * consistent { error: string } format and never leaks stack
 * traces or internal details to the client.
 */
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error('Unhandled error:', err)

  const status = err.status ?? err.statusCode ?? 500
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error'

  res.status(status).json({ error: message })
}

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
