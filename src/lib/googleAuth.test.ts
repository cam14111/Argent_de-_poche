import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/db'
import { settingsRepository } from '@/db'
import {
  GOOGLE_AUTH_TOKEN_KEY,
  GOOGLE_DRIVE_SCOPE,
  GOOGLE_USERINFO_ENDPOINT,
  GoogleAuthService,
  resetGoogleAuthForTests,
  setGoogleClientIdForTests,
} from './googleAuth'

const originalFetch = globalThis.fetch

function setupGoogleMock() {
  const tokenClient = {
    callback: (_response: any) => {},
    requestAccessToken: vi.fn(),
  }

  const initTokenClient = vi.fn(() => tokenClient)
  const revoke = vi.fn((_token: string, done: () => void) => done())

  globalThis.google = {
    accounts: {
      oauth2: {
        initTokenClient,
        revoke,
      },
    },
  } as any

  return { tokenClient, initTokenClient, revoke }
}

function mockUserInfo(email: string) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ email }),
  })
  ;(globalThis as any).fetch = fetchMock
  return fetchMock
}

beforeEach(async () => {
  db.close()
  await db.delete()
  await db.open()
  setGoogleClientIdForTests('test-client-id')
  resetGoogleAuthForTests()
})

afterEach(() => {
  db.close()
  resetGoogleAuthForTests()
  setGoogleClientIdForTests(null)
  vi.restoreAllMocks()
  delete (globalThis as any).google
  if (originalFetch) {
    ;(globalThis as any).fetch = originalFetch
  } else {
    delete (globalThis as any).fetch
  }
})

describe('GoogleAuthService', () => {
  it('stores access token and email on sign in', async () => {
    const { tokenClient } = setupGoogleMock()
    const fetchMock = mockUserInfo('parent@test.com')
    tokenClient.requestAccessToken.mockImplementation(() => {
      tokenClient.callback({
        access_token: 'token-123',
        expires_in: 3600,
        scope: GOOGLE_DRIVE_SCOPE,
        token_type: 'Bearer',
      })
    })

    const session = await GoogleAuthService.signIn()

    expect(fetchMock).toHaveBeenCalledWith(GOOGLE_USERINFO_ENDPOINT, {
      headers: {
        Authorization: 'Bearer token-123',
      },
    })
    expect(session.profile?.email).toBe('parent@test.com')
    const stored = await settingsRepository.get(GOOGLE_AUTH_TOKEN_KEY)
    expect(stored).toContain('token-123')
  })

  it('refreshes expired token silently', async () => {
    const { tokenClient } = setupGoogleMock()
    await settingsRepository.set(
      GOOGLE_AUTH_TOKEN_KEY,
      JSON.stringify({
        accessToken: 'old-token',
        expiresAt: Date.now() - 5_000,
        scope: GOOGLE_DRIVE_SCOPE,
      })
    )

    tokenClient.requestAccessToken.mockImplementation(() => {
      tokenClient.callback({
        access_token: 'new-token',
        expires_in: 3600,
        scope: GOOGLE_DRIVE_SCOPE,
      })
    })

    const token = await GoogleAuthService.getAccessToken({ interactive: false })

    expect(token).toBe('new-token')
    expect(tokenClient.requestAccessToken).toHaveBeenCalled()
  })

  it('surface authentication errors from Google', async () => {
    const { tokenClient } = setupGoogleMock()
    tokenClient.requestAccessToken.mockImplementation(() => {
      tokenClient.callback({
        error: 'consent_required',
        error_description: 'Consent required',
      })
    })

    await expect(GoogleAuthService.getAccessToken({ interactive: true })).rejects.toThrow(
      'Consent required'
    )
  })
})
