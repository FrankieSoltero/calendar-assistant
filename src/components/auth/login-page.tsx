import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import SplitText from '@/components/ui/split-text'
import TextType from '@/components/ui/text-type'
import ClickSpark from '@/components/ui/click-spark'
import Hyperspeed from '@/components/ui/hyper-speed'

interface LoginPageProps {
  onLogin: () => void
}

/**
 * Landing page shown to unauthenticated users.
 * Three visual layers:
 * 1. HyperSpeed — fixed fullscreen 3D road animation (pointer-events disabled)
 * 2. ClickSpark — interactive spark particles on click
 * 3. Login card — centered glass card with SplitText title and TextType features
 */
export function LoginPage({ onLogin }: LoginPageProps) {
  return (
    <div className="relative min-h-screen bg-black">
      {/* Layer 1: HyperSpeed background — fixed so it fills viewport regardless of layout */}
      <div className="fixed inset-0 pointer-events-none opacity-60">
        <Hyperspeed
          effectOptions={{
            distortion: 'turbulentDistortion',
            length: 400,
            roadWidth: 10,
            lanesPerRoad: 4,
            fov: 90,
            fovSpeedUp: 150,
            speedUp: 2,
            carLightsFade: 0.4,
            totalSideLightSticks: 20,
            lightPairsPerRoadWay: 40,
            colors: {
              roadColor: 0x080808,
              islandColor: 0x0a0a0a,
              background: 0x000000,
              shoulderLines: 0x131318,
              brokenLines: 0x131318,
              leftCars: [0x6366f1, 0x8b5cf6, 0xa78bfa],
              rightCars: [0x06b6d4, 0x0ea5e9, 0x38bdf8],
              sticks: 0x6366f1,
            },
            animationSpeed: 0.667,
            cameraSway: 1,
            maxSwayPixels: 20,
          }}
        />
      </div>

      {/* Layer 2: ClickSpark + centered login card */}
      <ClickSpark sparkColor="#a78bfa" sparkSize={12} sparkRadius={20} sparkCount={10}>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md mx-4 shadow-2xl border-white/10 backdrop-blur-md bg-black/60 text-white">
            <CardHeader className="text-center space-y-2 pb-2">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500 text-white">
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
                <SplitText
                  text="Calendar Assistant"
                  delay={40}
                  duration={0.8}
                  ease="power3.out"
                  splitType="chars"
                  from={{ opacity: 0, y: 30 }}
                  to={{ opacity: 1, y: 0 }}
                  threshold={0.1}
                  rootMargin="-50px"
                  textAlign="center"
                  tag="span"
                />
              </CardTitle>
              <CardDescription className="text-base text-white/60">
                Connect your Google Calendar and let AI help you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {/* Cycling feature highlights */}
              <div className="flex items-center justify-center h-8">
                <TextType
                  text={[
                    'Analyze your schedule and time usage',
                    'Draft emails and coordinate meetings',
                    'Get smart scheduling recommendations',
                    'Find the best time for your next meeting',
                  ]}
                  typingSpeed={40}
                  deletingSpeed={25}
                  pauseDuration={2500}
                  loop={true}
                  showCursor={true}
                  cursorCharacter="_"
                  cursorClassName="text-indigo-400"
                  className="text-sm text-white/50 text-center"
                />
              </div>

              <Button
                onClick={onLogin}
                className="w-full h-11 text-base font-medium gap-3 cursor-pointer border-white/20 bg-white/10 text-white hover:bg-white/20"
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

              <p className="text-xs text-center text-white/40">
                Read-only access to your calendar. We never modify your events.
              </p>
            </CardContent>
          </Card>
        </div>
      </ClickSpark>
    </div>
  )
}
