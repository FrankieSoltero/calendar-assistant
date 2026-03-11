import 'express-session'

/**
 * TS Module augmentation:
 * This extends express's Session Data interface to include
 * custom fields such as (token, user)
 */
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
