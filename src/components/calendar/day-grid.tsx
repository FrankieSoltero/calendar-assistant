import type { CalendarEvent } from '@/types'
import { getDayHours, getEventPosition, isSameDay, getEventOutOfRangeStatus, calculateEventLayout, DAY_START_HOUR, DAY_END_HOUR } from '@/lib/date-utils'
import { EventCard } from '@/components/calendar/event-card'
import { CurrentTimeLine } from '@/components/calendar/current-time-line'
import { ChevronUp, ChevronDown } from 'lucide-react'

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

  // Check for events outside visible range
  const beforeEvents = dayEvents.filter(e => getEventOutOfRangeStatus(e.start, e.end) === 'before')
  const afterEvents = dayEvents.filter(e => getEventOutOfRangeStatus(e.start, e.end) === 'after')
  const visibleEvents = dayEvents.filter(e => getEventOutOfRangeStatus(e.start, e.end) === null)

  // Calculate layout for overlapping events
  const eventLayouts = calculateEventLayout(visibleEvents)

  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      <div className="grid grid-cols-[60px_1fr] relative" style={{ height: '1024px' }}>
        {/* Time labels */}
        <div className="relative">
          {hours.map((label, i) => (
            <div
              key={label}
              className="absolute right-2 text-xs text-muted-foreground"
              style={{
                top: `${(i / hours.length) * 100}%`,
                transform: i === 0 ? 'none' : 'translateY(-50%)',
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Day column */}
        <div className="relative border-l border-border/30 min-w-0">
          {/* Indicator for events before visible range */}
          {beforeEvents.length > 0 && (
            <div className="absolute top-0 left-0 right-0 z-30 bg-muted/80 backdrop-blur-sm border-b border-border/30 py-1 px-2 flex items-center justify-center gap-1 cursor-pointer hover:bg-muted"
                 title={`${beforeEvents.length} event${beforeEvents.length > 1 ? 's' : ''} before ${DAY_START_HOUR} AM`}>
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">
                {beforeEvents.length} event{beforeEvents.length > 1 ? 's' : ''} before {DAY_START_HOUR}:00
              </span>
            </div>
          )}

          {/* Indicator for events after visible range */}
          {afterEvents.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 z-30 bg-muted/80 backdrop-blur-sm border-t border-border/30 py-1 px-2 flex items-center justify-center gap-1 cursor-pointer hover:bg-muted"
                 title={`${afterEvents.length} event${afterEvents.length > 1 ? 's' : ''} after ${DAY_END_HOUR}:00`}>
              <span className="text-xs text-muted-foreground font-medium">
                {afterEvents.length} event{afterEvents.length > 1 ? 's' : ''} after {DAY_END_HOUR}:00
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          )}

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

          {/* Events with collision detection */}
          {eventLayouts.map(({ event, width, offset }) => {
            const { top, height } = getEventPosition(event.start, event.end)
            return (
              <div
                key={event.id}
                className="absolute z-10 min-w-0 px-0.5"
                style={{ 
                  top: `${top}%`, 
                  height: `${height}%`,
                  left: `${offset}%`,
                  width: `${width}%`,
                }}
              >
                <EventCard event={event} onClick={onEventClick} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
