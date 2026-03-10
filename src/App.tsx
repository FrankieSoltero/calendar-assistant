import { useAuth } from '@/hooks/use-auth'
import { LoginPage } from '@/components/auth/login-page'

function App() {
  const { user, loading, login, logout } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <LoginPage onLogin={login} />
  }

  // Placeholder — MainPage replaces this in Task 7
  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Calendar Assistant</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user.name}</span>
          <button
            onClick={logout}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>
      <p className="text-muted-foreground">
        Authenticated as {user.email}. Calendar view coming next.
      </p>
    </div>
  )
}

export default App
