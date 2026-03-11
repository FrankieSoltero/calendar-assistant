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
 * AI messages: left-aligned, muted background.
 * 
 * During streaming, raw text is shown (no markdown parsing)
 * to avoid expensive re-renders on every character.
 */
export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'flex',
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
          <div className="relative">
            {/* During streaming: show raw text (no markdown for performance) */}
            {/* After streaming: parse markdown */}
            {isStreaming ? (
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {message.content}
                <span 
                  className="inline-block w-1.5 h-4 bg-current/70 ml-0.5 align-middle"
                  style={{ animation: 'pulse-cursor 1s ease-in-out infinite' }}
                />
              </p>
            ) : (
              <MarkdownRenderer content={message.content} />
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-cursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
