import type { CalendarEvent } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/**
 * Fetches calendar events for a given time range from our backend proxy.
 * The backend handles the Google Calendar API call using the session token.
 */
export async function fetchEvents(
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({ timeMin, timeMax })

  const response = await fetch(`${API_URL}/api/calendar/events?${params}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.status}`)
  }

  const data = await response.json()
  return data.events
}
