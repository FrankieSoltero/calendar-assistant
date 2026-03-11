import { useState, memo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Check, Mail } from 'lucide-react'

interface EmailCardProps {
  content: string
}

/**
 * Renders an email draft in a distinct, copyable card.
 * The AI agent outputs email drafts in fenced code blocks
 * tagged "email" — the markdown renderer detects this and
 * renders this component instead of a regular code block.
 */
function EmailCardComponent({ content }: EmailCardProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Parse subject line if present
  const lines = content.trim().split('\n')
  const subjectLine = lines[0]?.startsWith('Subject:')
    ? lines[0].replace('Subject:', '').trim()
    : null
  const body = subjectLine ? lines.slice(1).join('\n').trim() : content.trim()

  return (
    <Card className="my-2 border-border/50 bg-muted/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-muted/50">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
          Email Draft
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs cursor-pointer"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-green-500" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="px-3 py-2.5 space-y-1.5">
        {subjectLine && (
          <p className="text-sm">
            <span className="font-medium text-muted-foreground">Subject: </span>
            {subjectLine}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{body}</p>
      </div>
    </Card>
  )
}

export const EmailCard = memo(EmailCardComponent)
