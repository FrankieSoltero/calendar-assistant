import { useAuth } from '@/hooks/use-auth'
import { LoginPage } from '@/components/auth/login-page'
import { MainPage } from '@/pages/main-page'

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

  return <MainPage user={user} onLogout={logout} />
}

export default App
