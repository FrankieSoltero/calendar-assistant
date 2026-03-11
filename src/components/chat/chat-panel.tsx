import type { ChatMessage } from '@/types'
import { MessageList } from '@/components/chat/message-list'
import { ChatInput } from '@/components/chat/chat-input'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { MessageCircle, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatPanelProps {
  messages: ChatMessage[]
  isStreaming: boolean
  onSend: (content: string) => void
  onClear: () => void
  isOpen?: boolean
  onClose?: () => void
}

/**
 * Chat interface container.
 * Desktop (lg+): Collapsible right side panel.
 * Mobile: shadcn Sheet triggered by a floating action button.
 */
export function ChatPanel({
  messages,
  isStreaming,
  onSend,
  onClear,
  isOpen = true,
  onClose,
}: ChatPanelProps) {
  return (
    <>
      {/* Desktop: Collapsible side panel */}
      <div 
        className={cn(
          "hidden lg:flex flex-col h-full border-l border-border/50 bg-background transition-all duration-300 ease-in-out overflow-hidden",
          isOpen ? "w-[400px] opacity-100" : "w-0 opacity-0 border-l-0"
        )}
      >
        <ChatPanelContent
          messages={messages}
          isStreaming={isStreaming}
          onSend={onSend}
          onClear={onClear}
          onClose={onClose}
        />
      </div>

      {/* Mobile: floating button + sheet */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger
            render={
              <Button
                size="icon"
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl z-50 cursor-pointer"
              />
            }
          >
            <MessageCircle className="h-6 w-6" />
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-full sm:max-w-md p-0 flex flex-col [&>button]:hidden"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Calendar Assistant</SheetTitle>
            </SheetHeader>
            <ChatPanelContent
              messages={messages}
              isStreaming={isStreaming}
              onSend={onSend}
              onClear={onClear}
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}

/**
 * Inner content shared between desktop panel and mobile sheet.
 * Header + message list + input.
 */
function ChatPanelContent({
  messages,
  isStreaming,
  onSend,
  onClear,
  onClose,
}: ChatPanelProps & { onClose?: () => void }) {
  return (
    <div className="flex flex-col h-full w-[400px] min-w-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Calendar Assistant</h2>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 cursor-pointer"
              onClick={onClear}
              disabled={isStreaming}
              title="Clear conversation"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 cursor-pointer"
              onClick={onClose}
              title="Close panel"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} isStreaming={isStreaming} />

      {/* Input */}
      <ChatInput onSend={onSend} disabled={isStreaming} />
    </div>
  )
}
