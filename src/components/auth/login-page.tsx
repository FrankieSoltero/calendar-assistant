import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface LoginPageProps {
  onLogin: () => void
}

/**
 * Landing page shown to unauthenticated users.
 * Clean centered layout with animated gradient background,
 * value proposition, and Google sign-in CTA.
 */
export function LoginPage({ onLogin }: LoginPageProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-indigo-950/30 dark:to-purple-950/20" />
      <div className="absolute inset-0 opacity-30 dark:opacity-20">
        <div className="absolute top-1/4 -left-20 h-72 w-72 rounded-full bg-blue-300 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 h-96 w-96 rounded-full bg-purple-300 blur-3xl animate-pulse [animation-delay:2s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-indigo-300 blur-3xl animate-pulse [animation-delay:4s]" />
      </div>

      {/* Login card */}
      <Card className="relative z-10 w-full max-w-md mx-4 shadow-xl border-border/50 backdrop-blur-sm bg-card/80 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader className="text-center space-y-2 pb-2">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Calendar Assistant
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Connect your Google Calendar. Chat with your AI scheduling
            assistant.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">
                1
              </span>
              Analyze your schedule and time usage
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">
                2
              </span>
              Draft emails and coordinate meetings
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">
                3
              </span>
              Get smart scheduling recommendations
            </div>
          </div>

          <Button
            onClick={onLogin}
            className="w-full h-11 text-base font-medium gap-3 cursor-pointer"
            variant="outline"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          <p className="text-xs text-center text-muted-foreground/60">
            Read-only access to your calendar. We never modify your events.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
