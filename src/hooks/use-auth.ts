import { useState, useEffect, useCallback } from 'react'
import type { User } from '@/types'
import {
  fetchCurrentUser,
  getLoginUrl,
  logout as logoutService,
} from '@/services/auth'

/**
 * Manages authentication state for the app.
 * On mount, checks for an existing session via the backend.
 * Provides login (redirect to Google) and logout actions.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      const currentUser = await fetchCurrentUser()
      if (!cancelled) {
        setUser(currentUser)
        setLoading(false)
      }
    }

    checkSession()

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(() => {
    window.location.href = getLoginUrl()
  }, [])

  const logout = useCallback(async () => {
    await logoutService()
    setUser(null)
  }, [])

  return { user, loading, login, logout }
}
