import { Router } from 'express'
import { google } from 'googleapis'

const router = Router()

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

/**
 * GET /auth/google
 * Generates a Google OAuth consent URL and redirects the browser.
 * Scopes:
 *  - calendar.readonly: read the user's calendar events
 *  - userinfo.email + userinfo.profile: get the user's identity
 * access_type: 'offline' requests a refresh_token so sessions survive
 * past the 1-hour access_token expiry.
 * prompt: 'consent' forces the consent screen even if previously approved,
 * ensuring we always receive a refresh_token.
 */
router.get('/google', (_req, res) => {
  const oauth2Client = getOAuth2Client()

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
  })

  res.redirect(authUrl)
})

/**
 * GET /auth/google/callback
 * Google redirects here after the user grants consent.
 * We exchange the one-time authorization code for tokens,
 * fetch the user's profile, store both in the session,
 * then redirect to the frontend.
 */
router.get('/google/callback', async (req, res) => {
  const code = req.query.code as string | undefined

  if (!code) {
    res.status(400).json({ error: 'Missing authorization code' })
    return
  }

  try {
    const oauth2Client = getOAuth2Client()
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data: userInfo } = await oauth2.userinfo.get()

    req.session.tokens = {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token ?? undefined,
      expiry_date: tokens.expiry_date ?? undefined,
    }

    req.session.user = {
      email: userInfo.email!,
      name: userInfo.name ?? userInfo.email!,
      picture: userInfo.picture ?? undefined,
    }

    res.redirect(process.env.CLIENT_URL || 'http://localhost:5173')
  } catch (error) {
    console.error('OAuth callback error:', error)
    res.status(500).json({ error: 'Authentication failed' })
  }
})

/**
 * GET /auth/me
 * Returns the current user's profile from the session.
 * The frontend calls this on load to check if a session exists.
 */
router.get('/me', (req, res) => {
  if (!req.session.user) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  res.json({ user: req.session.user })
})

/**
 * POST /auth/logout
 * Destroys the server-side session and clears the cookie.
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err)
      res.status(500).json({ error: 'Logout failed' })
      return
    }
    res.clearCookie('connect.sid')
    res.json({ success: true })
  })
})

export default router
