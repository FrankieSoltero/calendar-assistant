import { useState, useCallback, useRef, useEffect } from 'react'
import type { ChatMessage } from '@/types'
import { sendMessage as sendChatMessage } from '@/services/chat'

/**
 * Manages chat conversation state and streaming.
 * 
 * Uses a smooth typewriter animation for streaming text.
 * Text is revealed character-by-character at a consistent 20ms interval
 * (50 characters/second), which feels smooth like Claude/ChatGPT.
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [displayedContent, setDisplayedContent] = useState('') // For animated text
  
  // Refs for streaming state
  const abortRef = useRef(false)
  const fullContentRef = useRef('') // Complete text from API
  const assistantIdRef = useRef<string | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastCharTimeRef = useRef(0)
  const displayIndexRef = useRef(0)

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Typewriter animation loop - reveals text at consistent speed
  const runTypewriterAnimation = useCallback(() => {
    const animate = (timestamp: number) => {
      const fullText = fullContentRef.current
      
      // If streaming stopped and we've displayed all text, exit
      if (!assistantIdRef.current) {
        animationFrameRef.current = null
        return
      }
      
      // If no new text to display, keep animation running for future tokens
      if (displayIndexRef.current >= fullText.length) {
        // Reset timer so we don't burst when text arrives
        lastCharTimeRef.current = timestamp
        animationFrameRef.current = requestAnimationFrame(animate)
        return
      }

      // Add characters based on elapsed time (20ms per character = 50 chars/sec)
      const elapsed = timestamp - lastCharTimeRef.current
      const charsToAdd = Math.floor(elapsed / 10)
      
      if (charsToAdd > 0) {
        const newIndex = Math.min(
          displayIndexRef.current + charsToAdd,
          fullText.length
        )
        
        displayIndexRef.current = newIndex
        lastCharTimeRef.current = timestamp
        
        const newDisplay = fullText.slice(0, newIndex)
        setDisplayedContent(newDisplay)
        
        // Update the actual message
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantIdRef.current
              ? { ...msg, content: newDisplay }
              : msg
          )
        )
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    lastCharTimeRef.current = performance.now()
    animationFrameRef.current = requestAnimationFrame(animate)
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return

    // Reset state
    abortRef.current = false
    fullContentRef.current = ''
    displayIndexRef.current = 0
    setDisplayedContent('')
    assistantIdRef.current = null

    // Stop any existing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    // Update React state
    setIsStreaming(true)

    // Append user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)

    // Create placeholder assistant message
    const assistantId = crypto.randomUUID()
    assistantIdRef.current = assistantId

    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, assistantMessage])

    // Start typewriter animation
    runTypewriterAnimation()

    try {
      const stream = sendChatMessage(updatedMessages)

      for await (const event of stream) {
        if (abortRef.current) break

        if (event.type === 'text' && event.content) {
          // Append to full content - animation will pick it up
          fullContentRef.current += event.content
        }

        if (event.type === 'error') {
          break
        }

        if (event.type === 'done') break
      }
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      // Wait for animation to finish revealing all text
      const finishAnimation = () => {
        if (displayIndexRef.current >= fullContentRef.current.length) {
          // Animation complete
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
          }
          
          // Ensure final content is set
          const finalContent = fullContentRef.current
          setDisplayedContent(finalContent)
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantIdRef.current
                ? { ...msg, content: finalContent }
                : msg
            )
          )
          
          assistantIdRef.current = null
          setIsStreaming(false)
        } else {
          // Check again in 100ms
          setTimeout(finishAnimation, 100)
        }
      }
      
      finishAnimation()
    }
  }, [messages, isStreaming, runTypewriterAnimation])

  const clearMessages = useCallback(() => {
    abortRef.current = true
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    fullContentRef.current = ''
    displayIndexRef.current = 0
    setDisplayedContent('')
    assistantIdRef.current = null
    setMessages([])
    setIsStreaming(false)
  }, [])

  return { messages, isStreaming, sendMessage, clearMessages }
}
