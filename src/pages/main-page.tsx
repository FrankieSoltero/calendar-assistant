import { useState } from 'react'
import type { User, CalendarEvent } from '@/types'
import { useCalendar } from '@/hooks/use-calendar'
import { CalendarView } from '@/components/calendar/calendar-view'
import { EventDetail } from '@/components/calendar/event-detail'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

interface MainPageProps {
  user: User
  onLogout: () => void
}

/**
 * Primary app layout after authentication.
 * Currently: top bar + calendar. Chat panel added in Task 10.
 */
export function MainPage({ user, onLogout }: MainPageProps) {
  const { events, loading, currentDate, view, setView, navigate } =
    useCalendar()
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  )

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border/50">
        <h1 className="text-lg font-semibold">Calendar Assistant</h1>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={user.picture} alt={user.name} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user.name}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Calendar */}
      <main className="flex-1 overflow-hidden px-2">
        <CalendarView
          events={events}
          loading={loading}
          currentDate={currentDate}
          view={view}
          onViewChange={setView}
          onNavigate={navigate}
          onEventClick={setSelectedEvent}
        />
      </main>

      {/* Event detail modal */}
      <EventDetail
        event={selectedEvent}
        open={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  )
}
