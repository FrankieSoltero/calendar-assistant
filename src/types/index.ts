/**
 * Normalized calendar event from our backend.
 * Mirrors the shape returned by GET /api/calendar/events.
 * Decoupled from Google's raw API response.
 */
export interface CalendarEvent {
  id: string
  title: string
  start: string // ISO 8601
  end: string // ISO 8601
  description?: string
  location?: string
  attendees?: {
    email: string
    displayName?: string
    responseStatus?: string
  }[]
  colorId?: string
  htmlLink?: string
}

/**
 * Chat message in the conversation history.
 * Matches the shape expected by POST /api/chat.
 */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

/**
 * Authenticated user profile from the session.
 * Returned by GET /auth/me.
 */
export interface User {
  email: string
  name: string
  picture?: string
}
