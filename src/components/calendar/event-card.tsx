import type { CalendarEvent } from '@/types'
import { formatTime } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

/**
 * Maps Google Calendar colorId values to Tailwind background classes.
 * Google uses string IDs "1" through "11" for event colors.
 * Falls back to blue if no colorId is set.
 */
const COLOR_MAP: Record<string, string> = {
  '1': 'bg-indigo-500/90 hover:bg-indigo-500',
  '2': 'bg-green-500/90 hover:bg-green-500',
  '3': 'bg-purple-500/90 hover:bg-purple-500',
  '4': 'bg-pink-500/90 hover:bg-pink-500',
  '5': 'bg-yellow-500/90 hover:bg-yellow-500',
  '6': 'bg-orange-500/90 hover:bg-orange-500',
  '7': 'bg-cyan-500/90 hover:bg-cyan-500',
  '8': 'bg-gray-500/90 hover:bg-gray-500',
  '9': 'bg-blue-600/90 hover:bg-blue-600',
  '10': 'bg-emerald-600/90 hover:bg-emerald-600',
  '11': 'bg-red-500/90 hover:bg-red-500',
}

const DEFAULT_COLOR = 'bg-blue-500/90 hover:bg-blue-500'

interface EventCardProps {
  event: CalendarEvent
  onClick?: (event: CalendarEvent) => void
}

/**
 * Individual event block rendered on the calendar grid.
 * Color-coded by Google Calendar colorId.
 * Tactile hover effect with slight scale-up and shadow.
 */
export function EventCard({ event, onClick }: EventCardProps) {
  const colorClass = COLOR_MAP[event.colorId ?? ''] ?? DEFAULT_COLOR

  return (
    <button
      onClick={() => onClick?.(event)}
      className={cn(
        'w-full text-left rounded-md px-2 py-1 text-xs text-white',
        'transition-all duration-200 hover:scale-[1.02] hover:shadow-lg',
        'cursor-pointer overflow-hidden',
        colorClass
      )}
    >
      <p className="font-medium truncate leading-tight">{event.title}</p>
      <p className="opacity-80 truncate leading-tight">
        {formatTime(event.start)}
      </p>
    </button>
  )
}
