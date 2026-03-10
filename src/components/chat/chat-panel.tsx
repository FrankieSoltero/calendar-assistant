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
import { MessageCircle, Trash2 } from 'lucide-react'

interface ChatPanelProps {
  messages: ChatMessage[]
  isStreaming: boolean
  onSend: (content: string) => void
  onClear: () => void
}

/**
 * Chat interface container.
 * Desktop (lg+): persistent right side panel.
 * Mobile: shadcn Sheet triggered by a floating action button.
 */
export function ChatPanel({
  messages,
  isStreaming,
  onSend,
  onClear,
}: ChatPanelProps) {
  return (
    <>
      {/* Desktop: persistent side panel */}
      <div className="hidden lg:flex flex-col h-full border-l border-border/50 w-[400px]">
        <ChatPanelContent
          messages={messages}
          isStreaming={isStreaming}
          onSend={onSend}
          onClear={onClear}
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
}: ChatPanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <h2 className="text-sm font-semibold">Calendar Assistant</h2>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 cursor-pointer"
            onClick={onClear}
            disabled={isStreaming}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <MessageList messages={messages} isStreaming={isStreaming} />

      {/* Input */}
      <ChatInput onSend={onSend} disabled={isStreaming} />
    </div>
  )
}
