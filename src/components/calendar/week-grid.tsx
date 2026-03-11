import type { CalendarEvent } from '@/types'
import { getWeekBounds, getWeekDays, getDayHours, getEventPosition, isSameDay, getEventOutOfRangeStatus, calculateEventLayout, DAY_START_HOUR, DAY_END_HOUR } from '@/lib/date-utils'
import { EventCard } from '@/components/calendar/event-card'
import { CurrentTimeLine } from '@/components/calendar/current-time-line'
import { cn } from '@/lib/utils'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface WeekGridProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
}

/**
 * Weekly calendar grid with time axis on the left and 7 day columns.
 * Events are absolutely positioned within each day column based on
 * their start/end times. The day header stays pinned while the
 * time grid scrolls vertically.
 */
export function WeekGrid({ currentDate, events, onEventClick }: WeekGridProps) {
  const { start: weekStart } = getWeekBounds(currentDate)
  const days = getWeekDays(weekStart)
  const hours = getDayHours()
  const today = new Date()

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Day header row — stays pinned above the scroll area */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/30 shrink-0">
        <div className="p-2" /> {/* Spacer for time column */}
        {days.map((day) => {
          const isToday = isSameDay(day, today)
          return (
            <div
              key={day.toISOString()}
              className="p-2 text-center border-l border-border/30"
            >
              <p className="text-xs text-muted-foreground">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </p>
              <p
                className={cn(
                  'text-sm font-medium mt-0.5',
                  isToday &&
                    'bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center mx-auto'
                )}
              >
                {day.getDate()}
              </p>
            </div>
          )
        })}
      </div>

      {/* Scrollable time grid — native scroll for reliable flex behavior */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] relative" style={{ height: '1024px' }}>
          {/* Time labels column */}
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

          {/* Day columns */}
          {days.map((day) => {
            const dayEvents = events.filter((e) =>
              isSameDay(new Date(e.start), day)
            )
            const isToday = isSameDay(day, today)

            // Check for events outside visible range
            const beforeEvents = dayEvents.filter(e => getEventOutOfRangeStatus(e.start, e.end) === 'before')
            const afterEvents = dayEvents.filter(e => getEventOutOfRangeStatus(e.start, e.end) === 'after')
            const visibleEvents = dayEvents.filter(e => getEventOutOfRangeStatus(e.start, e.end) === null)

            // Calculate layout for overlapping events
            const eventLayouts = calculateEventLayout(visibleEvents)

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'relative border-l border-border/30 min-w-0',
                  isToday && 'bg-primary/[0.02]'
                )}
              >
                {/* Indicator for events before visible range */}
                {beforeEvents.length > 0 && (
                  <div className="absolute top-0 left-0 right-0 z-30 bg-muted/80 backdrop-blur-sm border-b border-border/30 py-0.5 px-1 flex items-center justify-center gap-1 cursor-pointer hover:bg-muted"
                       title={`${beforeEvents.length} event${beforeEvents.length > 1 ? 's' : ''} before ${DAY_START_HOUR} AM`}>
                    <ChevronUp className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {beforeEvents.length} more
                    </span>
                  </div>
                )}

                {/* Indicator for events after visible range */}
                {afterEvents.length > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 z-30 bg-muted/80 backdrop-blur-sm border-t border-border/30 py-0.5 px-1 flex items-center justify-center gap-1 cursor-pointer hover:bg-muted"
                       title={`${afterEvents.length} event${afterEvents.length > 1 ? 's' : ''} after ${DAY_END_HOUR}:00`}>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {afterEvents.length} more
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
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
                  const { top, height } = getEventPosition(
                    event.start,
                    event.end
                  )
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
            )
          })}
        </div>
      </div>
    </div>
  )
}
