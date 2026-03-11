import { Router } from 'express'
import requireAuth from '../middleware/require-auth.js'
import { getCalendarEvents, getCalendarTimeZone } from '../services/google-calendar.js'
import { streamChat, ChatMessage } from '../services/ai-agent.js'

const router = Router()

/**
 * POST /api/chat
 * Accepts the conversation history, fetches the user's calendar
 * events for context, and streams the AI response back via SSE.
 *
 * The frontend reads the stream as text/event-stream and appends
 * tokens to the UI in real-time.
 */
router.post('/', requireAuth, async (req, res) => {
  const { messages } = req.body as { messages?: ChatMessage[] }

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages array is required' })
    return
  }

  try {
    // Fetch calendar events for the next 2 weeks as agent context
    const now = new Date()
    const twoWeeksOut = new Date(now)
    twoWeeksOut.setDate(twoWeeksOut.getDate() + 14)

    const [events, timeZone] = await Promise.all([
      getCalendarEvents(req.accessToken!, now.toISOString(), twoWeeksOut.toISOString()),
      getCalendarTimeZone(req.accessToken!),
    ])

    // Set SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no') // Disable nginx/proxy buffering
    res.flushHeaders() // Send headers immediately, start chunked transfer

    const stream = await streamChat(messages, events, timeZone)

    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`)
      if (typeof (res as any).flush === 'function') (res as any).flush()
    })

    stream.on('end', () => {
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
      res.end()
    })

    stream.on('error', (error) => {
      console.error('Stream error:', error)
      res.write(`data: ${JSON.stringify({ type: 'error', content: 'Stream interrupted' })}\n\n`)
      res.end()
    })

    // Handle client disconnect
    req.on('close', () => {
      stream.abort()
    })
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({ error: 'Failed to process chat request' })
  }
})

export default router
