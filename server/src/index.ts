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

import express from 'express'
import cors from 'cors'
import session from 'express-session'
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

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/auth', authRoutes)
app.use('/api/calendar', calendarRoutes)
app.use('/api/chat', chatRoutes)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
