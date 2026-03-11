import { useState } from 'react'
import type { User, CalendarEvent } from '@/types'
import { useCalendar } from '@/hooks/use-calendar'
import { useChat } from '@/hooks/use-chat'
import { CalendarView } from '@/components/calendar/calendar-view'
import { EventDetail } from '@/components/calendar/event-detail'
import { ChatPanel } from '@/components/chat/chat-panel'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { LogOut, MessageSquare, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MainPageProps {
  user: User
  onLogout: () => void
}

/**
 * Primary app layout after authentication.
 * Desktop: calendar on the left, collapsible chat panel on the right.
 * Mobile: calendar full width, chat accessible via floating button.
 */
export function MainPage({ user, onLogout }: MainPageProps) {
  const { events, loading, currentDate, view, setView, navigate } =
    useCalendar()
  const { messages, isStreaming, sendMessage, clearMessages } = useChat()
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  )
  const [chatOpen, setChatOpen] = useState(true)

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
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Calendar Assistant</h1>
        </div>

        <div className="flex items-center gap-1">
          {/* Chat toggle (desktop only) */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden lg:flex items-center gap-2 cursor-pointer"
            onClick={() => setChatOpen(!chatOpen)}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm">Chat</span>
            {chatOpen ? (
              <PanelRightClose className="h-3.5 w-3.5 ml-1" />
            ) : (
              <PanelRightOpen className="h-3.5 w-3.5 ml-1" />
            )}
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1 hidden lg:block" />

          {/* User info */}
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

      {/* Main content: calendar + chat */}
      <div className="flex-1 flex overflow-hidden">
        {/* Calendar - expands to fill available space */}
        <main 
          className={cn(
            "flex-1 overflow-hidden px-2 transition-all duration-300 ease-in-out"
          )}
        >
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

        {/* Chat panel - collapsible on desktop */}
        <ChatPanel
          messages={messages}
          isStreaming={isStreaming}
          onSend={sendMessage}
          onClear={clearMessages}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      </div>

      {/* Event detail modal */}
      <EventDetail
        event={selectedEvent}
        open={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  )
}
