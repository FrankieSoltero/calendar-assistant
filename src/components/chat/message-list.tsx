import { useEffect, useRef } from 'react'
import type { ChatMessage } from '@/types'
import { MessageBubble } from '@/components/chat/message-bubble'
import { CalendarDays } from 'lucide-react'

interface MessageListProps {
  messages: ChatMessage[]
  isStreaming: boolean
}

/**
 * Scrollable container for chat messages.
 * Auto-scrolls to the bottom when new messages arrive
 * or when the streaming message updates.
 */
export function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <CalendarDays className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Calendar Assistant</p>
            <p className="text-xs text-muted-foreground max-w-[240px]">
              Ask me about your schedule, or I can help draft emails and find
              meeting times.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          isStreaming={
            isStreaming &&
            message.role === 'assistant' &&
            index === messages.length - 1
          }
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
