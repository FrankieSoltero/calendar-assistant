import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { EmailCard } from '@/components/chat/email-card'
import type { Components } from 'react-markdown'
import { useMemo } from 'react'

interface MarkdownRendererProps {
  content: string
}

/**
 * Renders markdown content from AI responses.
 * Uses remark-gfm for tables, strikethrough, and task lists.
 * Intercepts fenced code blocks tagged "email" and renders
 * them as copyable EmailCard components.
 */
export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Memoize components to prevent re-creation on every render
  const components: Components = useMemo(() => ({
    code({ className, children }) {
      const language = className?.replace('language-', '')
      const text = String(children).replace(/\n$/, '')

      if (language === 'email') {
        return <EmailCard content={text} />
      }

      return (
        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
          {children}
        </code>
      )
    },
    pre({ children }) {
      return (
        <div className="my-2 rounded-md bg-muted p-3 overflow-x-auto">
          {children}
        </div>
      )
    },
    table({ children }) {
      return (
        <div className="my-2 overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">{children}</table>
        </div>
      )
    },
    thead({ children }) {
      return <thead className="bg-muted/50">{children}</thead>
    },
    th({ children }) {
      return (
        <th className="px-3 py-1.5 text-left font-medium text-muted-foreground border-b border-border">
          {children}
        </th>
      )
    },
    td({ children }) {
      return (
        <td className="px-3 py-1.5 border-b border-border/50">{children}</td>
      )
    },
    ul({ children }) {
      return <ul className="list-disc pl-5 space-y-1 my-1">{children}</ul>
    },
    ol({ children }) {
      return <ol className="list-decimal pl-5 space-y-1 my-1">{children}</ol>
    },
    p({ children }) {
      return <p className="my-1.5 leading-relaxed">{children}</p>
    },
    h1({ children }) {
      return <h1 className="text-lg font-bold mt-3 mb-1">{children}</h1>
    },
    h2({ children }) {
      return <h2 className="text-base font-bold mt-2.5 mb-1">{children}</h2>
    },
    h3({ children }) {
      return <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>
    },
    strong({ children }) {
      return <strong className="font-semibold">{children}</strong>
    },
  }), [])

  return (
    <div className="text-sm">
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </Markdown>
    </div>
  )
}
