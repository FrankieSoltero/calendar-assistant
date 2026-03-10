import { google } from 'googleapis'

/**
 * Normalized calendar event shape returned to the frontend.
 * We normalize Google's response to decouple our app from
 * Google's API structure — if we ever swap providers, only
 * this service changes.
 */
export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
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

function createCalendarClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
  oauth2Client.setCredentials({ access_token: accessToken })
  return google.calendar({ version: 'v3', auth: oauth2Client })
}

/**
 * Fetches events from the user's primary Google Calendar.
 * Normalizes the response into our CalendarEvent shape.
 * Single events only (recurring events are expanded).
 */
export async function getCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  const calendar = createCalendarClient(accessToken)

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250,
  })

  const events = response.data.items ?? []

  return events.map((event) => ({
    id: event.id ?? '',
    title: event.summary ?? '(No title)',
    start: event.start?.dateTime ?? event.start?.date ?? '',
    end: event.end?.dateTime ?? event.end?.date ?? '',
    description: event.description ?? undefined,
    location: event.location ?? undefined,
    attendees: event.attendees?.map((a) => ({
      email: a.email ?? '',
      displayName: a.displayName ?? undefined,
      responseStatus: a.responseStatus ?? undefined,
    })),
    colorId: event.colorId ?? undefined,
    htmlLink: event.htmlLink ?? undefined,
  }))
}

/**
 * Queries Google Calendar's freebusy API to check availability
 * for a list of email addresses within a time range.
 * Used by the AI agent to coordinate multi-person scheduling.
 */
export async function getFreeBusy(
  accessToken: string,
  timeMin: string,
  timeMax: string,
  emails: string[]
): Promise<Record<string, { start: string; end: string }[]>> {
  const calendar = createCalendarClient(accessToken)

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      items: emails.map((email) => ({ id: email })),
    },
  })

  const calendars = response.data.calendars ?? {}
  const result: Record<string, { start: string; end: string }[]> = {}

  for (const [email, data] of Object.entries(calendars)) {
    result[email] = (data.busy ?? []).map((slot) => ({
      start: slot.start ?? '',
      end: slot.end ?? '',
    }))
  }

  return result
}
