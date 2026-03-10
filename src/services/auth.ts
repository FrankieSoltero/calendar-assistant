import type { User } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/**
 * Returns the URL the browser should navigate to in order
 * to start the Google OAuth consent flow.
 */
export function getLoginUrl(): string {
  return `${API_URL}/auth/google`
}

/**
 * Checks if a valid session exists by calling the backend.
 * credentials: 'include' sends the session cookie cross-origin.
 * Returns the user profile or null if not authenticated.
 */
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      credentials: 'include',
    })

    if (!response.ok) return null

    const data = await response.json()
    return data.user
  } catch {
    return null
  }
}

/**
 * Destroys the server-side session and clears the cookie.
 */
export async function logout(): Promise<void> {
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
}
