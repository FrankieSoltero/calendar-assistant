import type { ChatMessage } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/**
 * SSE event shape sent by our backend streaming endpoint.
 */
interface StreamEvent {
  type: 'text' | 'done' | 'error'
  content?: string
}

/**
 * Sends the conversation history to the backend and returns
 * an async generator that yields text chunks as they stream in.
 *
 * Uses the native fetch + ReadableStream API to consume SSE.
 * Batches tokens for smoother UI updates.
 */
export async function* sendMessage(
  messages: ChatMessage[]
): AsyncGenerator<StreamEvent> {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      messages: messages.map(({ role, content }) => ({ role, content })),
    }),
  })

  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // SSE messages are delimited by double newlines
    const parts = buffer.split('\n\n')
    // Keep the last partial chunk in the buffer
    buffer = parts.pop() ?? ''

    for (const part of parts) {
      const line = part.trim()
      if (!line.startsWith('data: ')) continue

      const json = line.slice(6) // Remove 'data: ' prefix
      try {
        const event: StreamEvent = JSON.parse(json)
        yield event
        // Small delay to allow UI breathing room, but not force re-render
        await new Promise((r) => requestAnimationFrame(r))
      } catch {
        // Skip malformed events
      }
    }
  }
}
