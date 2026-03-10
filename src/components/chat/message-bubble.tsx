import type { ChatMessage } from '@/types'
import { MarkdownRenderer } from '@/components/chat/markdown-renderer'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  message: ChatMessage
  isStreaming?: boolean
}

/**
 * Individual chat message bubble.
 * User messages: right-aligned, primary color.
 * AI messages: left-aligned, muted background, markdown-rendered.
 */
export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'flex animate-in fade-in slide-in-from-bottom-2 duration-300',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted rounded-bl-md'
        )}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <>
            <MarkdownRenderer content={message.content} />
            {isStreaming && message.content.length > 0 && (
              <span className="inline-block w-1.5 h-4 bg-foreground/70 animate-pulse ml-0.5 -mb-0.5" />
            )}
          </>
        )}
      </div>
    </div>
  )
}
