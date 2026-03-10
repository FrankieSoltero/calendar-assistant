import type { CalendarEvent } from '@/types'
import { CalendarNav } from '@/components/calendar/calendar-nav'
import { WeekGrid } from '@/components/calendar/week-grid'
import { DayGrid } from '@/components/calendar/day-grid'

interface CalendarViewProps {
  events: CalendarEvent[]
  loading: boolean
  currentDate: Date
  view: 'week' | 'day'
  onViewChange: (view: 'week' | 'day') => void
  onNavigate: (direction: 'prev' | 'next' | 'today') => void
  onEventClick?: (event: CalendarEvent) => void
}

/**
 * Composes the navigation bar with the appropriate grid view.
 * Displays a loading skeleton when events are being fetched.
 */
export function CalendarView({
  events,
  loading,
  currentDate,
  view,
  onViewChange,
  onNavigate,
  onEventClick,
}: CalendarViewProps) {
  return (
    <div className="flex flex-col h-full">
      <CalendarNav
        currentDate={currentDate}
        view={view}
        onViewChange={onViewChange}
        onNavigate={onNavigate}
      />

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : view === 'week' ? (
        <WeekGrid
          currentDate={currentDate}
          events={events}
          onEventClick={onEventClick}
        />
      ) : (
        <DayGrid
          currentDate={currentDate}
          events={events}
          onEventClick={onEventClick}
        />
      )}
    </div>
  )
}
