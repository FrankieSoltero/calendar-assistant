import Anthropic from '@anthropic-ai/sdk'
import { CalendarEvent } from './google-calendar.js'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

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
export function buildSystemPrompt(events: CalendarEvent[]): string {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const eventsJson = JSON.stringify(events, null, 2)

  return `You are a helpful calendar assistant. Today is ${today}.

You have access to the user's Google Calendar events below. Use this data to answer questions about their schedule, analyze their time usage, suggest scheduling changes, and draft emails.

<calendar_events>
${eventsJson}
</calendar_events>

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
  events: CalendarEvent[]
) {
  const systemPrompt = buildSystemPrompt(events)

  const stream = client.messages.stream({
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
