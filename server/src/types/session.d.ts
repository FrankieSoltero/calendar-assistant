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
