import type { CalendarEvent } from '@/types'
import { formatTime } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

/**
 * Maps Google Calendar colorId values to left border colors.
 * Google uses string IDs "1" through "11" for event colors.
 */
const COLOR_MAP: Record<string, string> = {
  '1': 'border-l-indigo-500',
  '2': 'border-l-emerald-500',
  '3': 'border-l-purple-500',
  '4': 'border-l-pink-500',
  '5': 'border-l-yellow-500',
  '6': 'border-l-orange-500',
  '7': 'border-l-cyan-500',
  '8': 'border-l-slate-400',
  '9': 'border-l-blue-600',
  '10': 'border-l-teal-600',
  '11': 'border-l-red-500',
}

const DEFAULT_COLOR = 'border-l-blue-500'

interface EventCardProps {
  event: CalendarEvent
  onClick?: (event: CalendarEvent) => void
}

/**
 * Google Calendar-style event card.
 * 
 * Layout: Title + start time horizontally since width is flexible.
 * Shows only start time (end time omitted).
 */
export function EventCard({ event, onClick }: EventCardProps) {
  const borderColorClass = COLOR_MAP[event.colorId ?? ''] ?? DEFAULT_COLOR
  const tooltip = `${event.title}\n${formatTime(event.start)}${event.location ? `\n${event.location}` : ''}`
  
  // Calculate duration for layout decisions
  const startTime = new Date(event.start).getTime()
  const endTime = new Date(event.end).getTime()
  const durationMinutes = (endTime - startTime) / (1000 * 60)
  
  const isVeryShort = durationMinutes <= 15
  const isShort = durationMinutes <= 30
  
  return (
    <button
      onClick={() => onClick?.(event)}
      title={tooltip}
      className={cn(
        // Layout
        'w-full h-full min-w-0 text-left rounded-sm overflow-hidden',
        'flex flex-col',
        // Google Calendar style: white bg with colored left border
        'bg-white dark:bg-slate-800',
        'border border-border/50 dark:border-slate-700',
        'border-l-[3px]',
        borderColorClass,
        'text-foreground dark:text-slate-100',
        // Interaction
        'transition-colors duration-150 cursor-pointer',
        'hover:bg-slate-50 dark:hover:bg-slate-700/50',
        'focus:outline-none focus:ring-1 focus:ring-primary/30'
      )}
    >
      {/* Content */}
      <div className={cn(
        'flex-1 flex flex-col min-h-0 justify-center',
        isVeryShort ? 'px-1 py-px' : 'px-1.5 py-1'
      )}>
        
        {/* Row 1: Title + Start Time (horizontal layout) */}
        <div className="flex items-baseline gap-1.5 min-w-0">
          {/* Title */}
          <p className={cn(
            'font-medium text-foreground dark:text-slate-100 leading-tight',
            'truncate flex-1 min-w-0',
            isVeryShort ? 'text-[10px]' : 'text-[11px]'
          )}>
            {event.title}
          </p>
          
          {/* Start Time only */}
          <span className={cn(
            'text-muted-foreground dark:text-slate-400 shrink-0',
            'tabular-nums',
            isVeryShort ? 'text-[9px]' : 'text-[10px]'
          )}>
            {formatTime(event.start)}
          </span>
        </div>
        
        {/* Location (only for taller events) */}
        {!isShort && event.location && (
          <p className="text-[10px] text-muted-foreground/60 dark:text-slate-500 truncate mt-0.5 leading-none">
            {event.location}
          </p>
        )}
      </div>
    </button>
  )
}
