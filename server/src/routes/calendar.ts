import { Router } from 'express'
import requireAuth from '../middleware/require-auth.js'
import { getCalendarEvents, getFreeBusy } from '../services/google-calendar.js'

const router = Router()

/**
 * GET /api/calendar/events
 * Returns normalized calendar events for a given time range.
 * Requires timeMin and timeMax as ISO 8601 query params.
 */
router.get('/events', requireAuth, async (req, res) => {
  const { timeMin, timeMax } = req.query

  if (!timeMin || !timeMax) {
    res.status(400).json({ error: 'timeMin and timeMax query params are required' })
    return
  }

  try {
    const events = await getCalendarEvents(
      req.accessToken!,
      timeMin as string,
      timeMax as string
    )
    res.json({ events })
  } catch (error) {
    console.error('Calendar events fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch calendar events' })
  }
})

/**
 * GET /api/calendar/freebusy
 * Checks availability for one or more email addresses.
 * Query params: timeMin, timeMax (ISO 8601), emails (comma-separated).
 * Used by the chat endpoint to give the AI agent availability context.
 */
router.get('/freebusy', requireAuth, async (req, res) => {
  const { timeMin, timeMax, emails } = req.query

  if (!timeMin || !timeMax || !emails) {
    res.status(400).json({ error: 'timeMin, timeMax, and emails query params are required' })
    return
  }

  const emailList = (emails as string).split(',').map((e) => e.trim())

  try {
    const freeBusy = await getFreeBusy(
      req.accessToken!,
      timeMin as string,
      timeMax as string,
      emailList
    )
    res.json({ freeBusy })
  } catch (error) {
    console.error('FreeBusy fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch availability' })
  }
})

export default router
