import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getWeekBounds, formatWeekRange } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

interface CalendarNavProps {
  currentDate: Date
  view: 'week' | 'day'
  onViewChange: (view: 'week' | 'day') => void
  onNavigate: (direction: 'prev' | 'next' | 'today') => void
}

/**
 * Top navigation bar for the calendar.
 * Left: Today button + prev/next arrows.
 * Center: Current date range label.
 * Right: Week/Day view toggle with seamless styling.
 */
export function CalendarNav({
  currentDate,
  view,
  onViewChange,
  onNavigate,
}: CalendarNavProps) {
  const { start, end } = getWeekBounds(currentDate)

  const dateLabel =
    view === 'week'
      ? formatWeekRange(start, end)
      : currentDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })

  return (
    <div className="flex items-center justify-between py-3 px-1">
      {/* Left: Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('today')}
          className="cursor-pointer"
        >
          Today
        </Button>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            onClick={() => onNavigate('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            onClick={() => onNavigate('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Center: Date label */}
      <h2 className="text-lg font-semibold">{dateLabel}</h2>

      {/* Right: View toggle - seamless button group */}
      <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/30">
        <Button
          variant={view === 'week' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('week')}
          className={cn(
            "cursor-pointer rounded-sm border-0 shadow-none",
            view === 'week' && "bg-background shadow-sm"
          )}
        >
          Week
        </Button>
        <Button
          variant={view === 'day' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('day')}
          className={cn(
            "cursor-pointer rounded-sm border-0 shadow-none",
            view === 'day' && "bg-background shadow-sm"
          )}
        >
          Day
        </Button>
      </div>
    </div>
  )
}
