import { useState, useEffect, useCallback } from 'react'
import type { CalendarEvent } from '@/types'
import { fetchEvents } from '@/services/calendar'
import { getWeekBounds } from '@/lib/date-utils'

type CalendarView = 'week' | 'day'

/**
 * Manages calendar state: current date, view mode, and events.
 * Auto-fetches events whenever the date range or view changes.
 */
export function useCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>('week')

  const fetchEventsForRange = useCallback(async () => {
    setLoading(true)
    try {
      let timeMin: string
      let timeMax: string

      if (view === 'week') {
        const { start, end } = getWeekBounds(currentDate)
        timeMin = start.toISOString()
        timeMax = end.toISOString()
      } else {
        const dayStart = new Date(currentDate)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(currentDate)
        dayEnd.setHours(23, 59, 59, 999)
        timeMin = dayStart.toISOString()
        timeMax = dayEnd.toISOString()
      }

      const data = await fetchEvents(timeMin, timeMax)
      setEvents(data)
    } catch (error) {
      console.error('Failed to fetch calendar events:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [currentDate, view])

  useEffect(() => {
    fetchEventsForRange()
  }, [fetchEventsForRange])

  const navigate = useCallback(
    (direction: 'prev' | 'next' | 'today') => {
      setCurrentDate((prev) => {
        if (direction === 'today') return new Date()

        const next = new Date(prev)
        const offset = direction === 'next' ? 1 : -1

        if (view === 'week') {
          next.setDate(next.getDate() + offset * 7)
        } else {
          next.setDate(next.getDate() + offset)
        }

        return next
      })
    },
    [view]
  )

  return {
    events,
    loading,
    currentDate,
    view,
    setView,
    navigate,
    refetch: fetchEventsForRange,
  }
}
