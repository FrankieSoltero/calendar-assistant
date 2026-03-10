import type { CalendarEvent } from '@/types'
import { getDayHours, getEventPosition, isSameDay } from '@/lib/date-utils'
import { EventCard } from '@/components/calendar/event-card'
import { CurrentTimeLine } from '@/components/calendar/current-time-line'
import { ScrollArea } from '@/components/ui/scroll-area'

interface DayGridProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
}

/**
 * Single-day calendar grid. Same time axis as week grid
 * but with one wide column for events.
 */
export function DayGrid({ currentDate, events, onEventClick }: DayGridProps) {
  const hours = getDayHours()
  const today = new Date()
  const isToday = isSameDay(currentDate, today)

  const dayEvents = events.filter((e) =>
    isSameDay(new Date(e.start), currentDate)
  )

  return (
    <ScrollArea className="flex-1">
      <div className="grid grid-cols-[60px_1fr] min-h-[960px]">
        {/* Time labels */}
        <div className="relative">
          {hours.map((label, i) => (
            <div
              key={label}
              className="absolute right-2 text-xs text-muted-foreground -translate-y-1/2"
              style={{ top: `${(i / hours.length) * 100}%` }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Day column */}
        <div className="relative border-l border-border/30">
          {/* Hour grid lines */}
          {hours.map((label, i) => (
            <div
              key={label}
              className="absolute left-0 right-0 border-t border-border/20"
              style={{ top: `${(i / hours.length) * 100}%` }}
            />
          ))}

          {/* Current time indicator */}
          {isToday && <CurrentTimeLine />}

          {/* Events */}
          {dayEvents.map((event) => {
            const { top, height } = getEventPosition(event.start, event.end)
            return (
              <div
                key={event.id}
                className="absolute left-1 right-1 z-10"
                style={{ top: `${top}%`, height: `${height}%` }}
              >
                <EventCard event={event} onClick={onEventClick} />
              </div>
            )
          })}
        </div>
      </div>
    </ScrollArea>
  )
}
