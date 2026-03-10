import type { CalendarEvent } from '@/types'
import { getWeekBounds, getWeekDays, getDayHours, getEventPosition, isSameDay } from '@/lib/date-utils'
import { EventCard } from '@/components/calendar/event-card'
import { CurrentTimeLine } from '@/components/calendar/current-time-line'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface WeekGridProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
}

/**
 * Weekly calendar grid with time axis on the left and 7 day columns.
 * Events are absolutely positioned within each day column based on
 * their start/end times.
 */
export function WeekGrid({ currentDate, events, onEventClick }: WeekGridProps) {
  const { start: weekStart } = getWeekBounds(currentDate)
  const days = getWeekDays(weekStart)
  const hours = getDayHours()
  const today = new Date()

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Day header row */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/30">
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

      {/* Scrollable time grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] min-h-[960px]">
          {/* Time labels column */}
          <div className="relative">
            {hours.map((label, i) => (
              <div
                key={label}
                className="absolute right-2 text-xs text-muted-foreground -translate-y-1/2"
                style={{
                  top: `${(i / hours.length) * 100}%`,
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

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'relative border-l border-border/30',
                  isToday && 'bg-primary/[0.02]'
                )}
              >
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
                  const { top, height } = getEventPosition(
                    event.start,
                    event.end
                  )
                  return (
                    <div
                      key={event.id}
                      className="absolute left-0.5 right-0.5 z-10"
                      style={{ top: `${top}%`, height: `${height}%` }}
                    >
                      <EventCard event={event} onClick={onEventClick} />
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
