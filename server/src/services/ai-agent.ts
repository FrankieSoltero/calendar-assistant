import Anthropic from '@anthropic-ai/sdk'
import { CalendarEvent } from './google-calendar.js'

/**
 * Lazily initialized Anthropic client.
 * The client is created on first use rather than at module load time
 * so that dotenv has finished injecting env vars from the root .env.
 */
let client: Anthropic | null = null
function getClient(): Anthropic {
  if (!client) {
    const key = process.env.ANTHROPIC_API_KEY?.trim()
    client = new Anthropic({ apiKey: key })
  }
  return client
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Builds the system prompt with the user's calendar context injected.
 * The agent receives the full event list as structured JSON so it can
 * reason about scheduling, time analysis, and draft contextual emails.
 *
 * Formatting instructions ensure the AI produces output the frontend
 * can parse — markdown for rich text, fenced code blocks tagged
 * "email" for copyable email drafts.
 */
export function buildSystemPrompt(events: CalendarEvent[], timeZone: string): string {
  const now = new Date()
  const today = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone,
  })

  // Build a date-to-day-of-week reference for the next 14 days so the
  // model never has to compute day-of-week from a date (LLMs get this wrong).
  const dateReference: string[] = []
  for (let i = 0; i < 14; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    const label = d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      timeZone,
    })
    dateReference.push(`  ${label}`)
  }

  // Enrich events with explicit dayOfWeek so the model doesn't guess
  const enrichedEvents = events.map((e) => {
    const startDate = new Date(e.start)
    const dayOfWeek = startDate.toLocaleDateString('en-US', { weekday: 'long', timeZone })
    return { ...e, dayOfWeek }
  })

  const eventsJson = JSON.stringify(enrichedEvents, null, 2)

  return `You are a helpful calendar assistant. Today is ${today}. The user's time zone is ${timeZone}.

<date_reference>
The following is the authoritative date-to-day mapping for the next 14 days.
ALWAYS use this reference when mentioning days — never compute day-of-week yourself.
${dateReference.join('\n')}
</date_reference>

You have access to the user's Google Calendar events below. Use this data to answer questions about their schedule, analyze their time usage, suggest scheduling changes, and draft emails.

<calendar_events>
${eventsJson}
</calendar_events>

## Critical rules:
- NEVER compute day-of-week from a date. ALWAYS use the <date_reference> table above and the dayOfWeek field on each event.
- If a user asks about "Friday" or "next Tuesday", cross-reference with the date_reference to find the correct date.
- Only respond to questions related to the user's calendar, scheduling, time management, and email drafting for meetings. Politely decline any unrelated topics by steering the conversation back to how you can help with their schedule.

## Your capabilities:
- **Schedule analysis**: Break down how the user spends their time (meetings vs focus time, by category, by day).
- **Email drafting**: When asked to draft an email, format it as a fenced code block with the language tag "email" so the UI can render it as a copyable card. Include a Subject line and Body.
- **Scheduling suggestions**: Suggest optimal times for new meetings based on the user's existing schedule. Respect stated preferences (e.g., "block mornings for workouts").
- **Multi-person coordination**: When the user mentions scheduling with specific people, suggest times that avoid conflicts with the user's existing events.

## Formatting rules:
- Use markdown for structured responses (headers, bullet points, bold).
- For email drafts, always use this format:
\`\`\`email
Subject: Your subject here

Body of the email here.
\`\`\`
- For time breakdowns, use tables or bullet lists — never walls of text.
- Be concise and actionable. The user is busy.`
}

/**
 * Streams a chat response from Claude with calendar context.
 * Returns an async iterable of text chunks for SSE streaming.
 */
export async function streamChat(
  messages: ChatMessage[],
  events: CalendarEvent[],
  timeZone: string
) {
  const systemPrompt = buildSystemPrompt(events, timeZone)

  const stream = getClient().messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
  })

  return stream
}
