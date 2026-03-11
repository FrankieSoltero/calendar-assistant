import { useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '@/types'
import { MessageBubble } from '@/components/chat/message-bubble'
import { CalendarDays } from 'lucide-react'

interface MessageListProps {
  messages: ChatMessage[]
  isStreaming: boolean
}

/**
 * Scrollable container for chat messages.
 * Auto-scrolls to the bottom when new messages arrive.
 * During streaming, scrolls smoothly without causing layout shifts.
 */
export function MessageList({ messages, isStreaming }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastMessageCountRef = useRef(messages.length)
  const [autoScroll, setAutoScroll] = useState(true)

  // Handle scroll on new messages
  useEffect(() => {
    const isNewMessage = messages.length > lastMessageCountRef.current
    lastMessageCountRef.current = messages.length

    if (autoScroll && bottomRef.current) {
      // Use instant scroll for streaming to avoid jitter
      bottomRef.current.scrollIntoView({ 
        behavior: isStreaming ? 'auto' : 'smooth',
        block: 'end'
      })
    }
  }, [messages, isStreaming, autoScroll])

  // Monitor scroll to detect if user scrolls up (disable auto-scroll)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
      setAutoScroll(isAtBottom)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

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
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth"
    >
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
