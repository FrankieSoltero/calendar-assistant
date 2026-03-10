import { useState, useCallback, useRef } from 'react'
import type { ChatMessage } from '@/types'
import { sendMessage as sendChatMessage } from '@/services/chat'

/**
 * Manages chat conversation state and streaming.
 * Sends the full message history with each request so the AI
 * maintains conversational context. Streams the response
 * token-by-token, updating the assistant message in real-time.
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef(false)

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return

    abortRef.current = false

    // Append user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsStreaming(true)

    // Create placeholder assistant message
    const assistantId = crypto.randomUUID()
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, assistantMessage])

    try {
      const stream = sendChatMessage(updatedMessages)

      for await (const event of stream) {
        if (abortRef.current) break

        if (event.type === 'text' && event.content) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: msg.content + event.content }
                : msg
            )
          )
        }

        if (event.type === 'error') {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? {
                    ...msg,
                    content:
                      msg.content ||
                      'Sorry, something went wrong. Please try again.',
                  }
                : msg
            )
          )
          break
        }

        if (event.type === 'done') break
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content:
                  msg.content || 'Failed to connect. Please try again.',
              }
            : msg
        )
      )
    } finally {
      setIsStreaming(false)
    }
  }, [messages, isStreaming])

  const clearMessages = useCallback(() => {
    abortRef.current = true
    setMessages([])
    setIsStreaming(false)
  }, [])

  return { messages, isStreaming, sendMessage, clearMessages }
}
