import type { CalendarEvent } from '@/types'
import { formatDateRange } from '@/lib/date-utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  MapPin,
  Users,
  ExternalLink,
  AlignLeft,
} from 'lucide-react'

interface EventDetailProps {
  event: CalendarEvent | null
  open: boolean
  onClose: () => void
}

/**
 * Modal dialog displaying full event details.
 * Shows time, location, description, and attendee list
 * with their response status.
 */
export function EventDetail({ event, open, onClose }: EventDetailProps) {
  if (!event) return null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl leading-tight pr-6">
            {event.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Time */}
          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <span className="text-sm">
              {formatDateRange(event.start, event.end)}
            </span>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <span className="text-sm min-w-0 break-all">{event.location}</span>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="flex items-start gap-3">
              <AlignLeft className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words min-w-0">
                {event.description}
              </p>
            </div>
          )}

          {/* Attendees */}
          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="space-y-1.5 flex-1">
                {event.attendees.map((attendee) => (
                  <div
                    key={attendee.email}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-sm truncate">
                      {attendee.displayName || attendee.email}
                    </span>
                    <ResponseBadge status={attendee.responseStatus} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Google Calendar link */}
          {event.htmlLink && (
            <a
              href={event.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open in Google Calendar
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Small badge showing an attendee's response status.
 */
function ResponseBadge({ status }: { status?: string }) {
  switch (status) {
    case 'accepted':
      return (
        <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
          Accepted
        </Badge>
      )
    case 'declined':
      return (
        <Badge variant="outline" className="text-red-600 border-red-200 text-xs">
          Declined
        </Badge>
      )
    case 'tentative':
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-200 text-xs">
          Maybe
        </Badge>
      )
    case 'needsAction':
      return (
        <Badge variant="outline" className="text-muted-foreground text-xs">
          Pending
        </Badge>
      )
    default:
      return null
  }
}
