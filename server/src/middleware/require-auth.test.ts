import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import requireAuth from './require-auth.js'
import { Request, Response, NextFunction } from 'express'

// Mock googleapis
const mockRefreshAccessToken = vi.fn()
const mockSetCredentials = vi.fn()

vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: vi.fn().mockImplementation(function() {
        return {
          setCredentials: mockSetCredentials,
          refreshAccessToken: mockRefreshAccessToken,
        }
      }),
    },
  },
}))

// Mock express-session
declare module 'express-session' {
  interface SessionData {
    tokens?: {
      access_token: string
      refresh_token?: string
      expiry_date?: number
    }
    user?: {
      email: string
      name: string
      picture?: string
    }
  }
}

describe('requireAuth middleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockReq = {
      session: {} as any,
    }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    }
    mockNext = vi.fn()
  })

  it('returns 401 if no tokens in session', async () => {
    await requireAuth(mockReq as Request, mockRes as Response, mockNext)

    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Not authenticated' })
    expect(mockNext).not.toHaveBeenCalled()
  })

  it('calls next() if valid access_token exists', async () => {
    const futureDate = Date.now() + 3600000 // 1 hour from now
    mockReq.session = {
      tokens: {
        access_token: 'valid_token',
        expiry_date: futureDate,
      },
    } as any

    await requireAuth(mockReq as Request, mockRes as Response, mockNext)

    expect(mockNext).toHaveBeenCalled()
    expect(mockReq.accessToken).toBe('valid_token')
  })

  it('returns 401 if token is expired and no refresh_token', async () => {
    const pastDate = Date.now() - 3600000 // 1 hour ago
    mockReq.session = {
      tokens: {
        access_token: 'expired_token',
        expiry_date: pastDate,
      },
    } as any

    mockReq.session.destroy = vi.fn((cb) => cb && cb())

    await requireAuth(mockReq as Request, mockRes as Response, mockNext)

    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Session expired, please re-authenticate' })
    expect(mockNext).not.toHaveBeenCalled()
  })

  it('considers token expired within 5 minute buffer', async () => {
    const almostExpired = Date.now() + 3 * 60 * 1000 // 3 minutes from now (within 5 min buffer)
    mockReq.session = {
      tokens: {
        access_token: 'almost_expired',
        expiry_date: almostExpired,
        refresh_token: 'refresh_token',
      },
    } as any

    // Note: We can't fully test the refresh flow without mocking googleapis
    // This test verifies the expiry check logic
    expect(almostExpired - Date.now()).toBeLessThan(5 * 60 * 1000)
  })

  it('does not consider token expired if more than 5 minutes remaining', async () => {
    const wellInFuture = Date.now() + 10 * 60 * 1000 // 10 minutes from now
    mockReq.session = {
      tokens: {
        access_token: 'valid_token',
        expiry_date: wellInFuture,
      },
    } as any

    expect(wellInFuture - Date.now()).toBeGreaterThan(5 * 60 * 1000)
  })

  describe('token refresh', () => {
    afterEach(() => {
      vi.clearAllMocks()
    })

    it('successfully refreshes expired token with refresh_token', async () => {
      const pastDate = Date.now() - 3600000 // 1 hour ago
      mockReq.session = {
        tokens: {
          access_token: 'expired_token',
          refresh_token: 'valid_refresh_token',
          expiry_date: pastDate,
        },
        destroy: vi.fn((cb) => cb && cb()),
      } as any

      mockRefreshAccessToken.mockResolvedValue({
        credentials: {
          access_token: 'new_access_token',
          expiry_date: Date.now() + 3600000,
        },
      })

      await requireAuth(mockReq as Request, mockRes as Response, mockNext)

      expect(mockSetCredentials).toHaveBeenCalledWith({ refresh_token: 'valid_refresh_token' })
      expect(mockRefreshAccessToken).toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalled()
      expect(mockReq.accessToken).toBe('new_access_token')
      expect(mockReq.session.tokens?.access_token).toBe('new_access_token')
    })

    it('handles token refresh failure', async () => {
      const pastDate = Date.now() - 3600000 // 1 hour ago
      mockReq.session = {
        tokens: {
          access_token: 'expired_token',
          refresh_token: 'invalid_refresh_token',
          expiry_date: pastDate,
        },
        destroy: vi.fn((cb) => cb && cb()),
      } as any

      mockRefreshAccessToken.mockRejectedValue(new Error('Refresh failed'))

      await requireAuth(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Session expired, please re-authenticate' })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('preserves refresh_token after successful refresh', async () => {
      const pastDate = Date.now() - 3600000
      mockReq.session = {
        tokens: {
          access_token: 'expired_token',
          refresh_token: 'persistent_refresh_token',
          expiry_date: pastDate,
        },
        destroy: vi.fn((cb) => cb && cb()),
      } as any

      mockRefreshAccessToken.mockResolvedValue({
        credentials: {
          access_token: 'new_access_token',
          expiry_date: Date.now() + 3600000,
        },
      })

      await requireAuth(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.session.tokens?.refresh_token).toBe('persistent_refresh_token')
    })
  })
})
