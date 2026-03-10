import { Request, Response, NextFunction } from 'express'
import { google } from 'googleapis'

/**
 * Auth middleware that guards protected routes.
 *
 * 1. Checks for tokens in the session — returns 401 if missing.
 * 2. If the access_token is expired (or within 5 min of expiring),
 *    attempts a refresh using the refresh_token.
 * 3. If refresh fails, returns 401 so the frontend can redirect to re-auth.
 * 4. Attaches the valid access_token to req for downstream route handlers.
 */

const REFRESH_BUFFER_MS = 5 * 60 * 1000 // 5 minutes

declare global {
  namespace Express {
    interface Request {
      accessToken?: string
    }
  }
}

export default async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { tokens } = req.session

  if (!tokens?.access_token) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  const now = Date.now()
  const isExpired =
    tokens.expiry_date && now >= tokens.expiry_date - REFRESH_BUFFER_MS

  if (isExpired) {
    if (!tokens.refresh_token) {
      req.session.destroy(() => {})
      res.status(401).json({ error: 'Session expired, please re-authenticate' })
      return
    }

    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      )
      oauth2Client.setCredentials({ refresh_token: tokens.refresh_token })

      const { credentials } = await oauth2Client.refreshAccessToken()

      req.session.tokens = {
        access_token: credentials.access_token!,
        refresh_token: tokens.refresh_token,
        expiry_date: credentials.expiry_date ?? undefined,
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      req.session.destroy(() => {})
      res.status(401).json({ error: 'Session expired, please re-authenticate' })
      return
    }
  }

  req.accessToken = req.session.tokens!.access_token
  next()
}
