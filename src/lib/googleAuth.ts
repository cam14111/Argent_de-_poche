import { settingsRepository } from '@/db'

export const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
export const GOOGLE_AUTH_TOKEN_KEY = 'google_drive_token'
export const GOOGLE_AUTH_PROFILE_KEY = 'google_profile'
export const GOOGLE_USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo'

const TOKEN_EXPIRY_BUFFER_MS = 60_000
const GOOGLE_AUTH_SCOPES = [GOOGLE_DRIVE_SCOPE, 'openid', 'email'].join(' ')

type TokenResponse = {
  access_token?: string
  expires_in?: number
  scope?: string
  token_type?: string
  error?: string
  error_description?: string
}

type UserInfoResponse = {
  email?: string
}

export interface StoredToken {
  accessToken: string
  expiresAt: number
  scope: string
  tokenType?: string
}

export interface GoogleProfile {
  email?: string
}

export interface GoogleAuthSession {
  token: StoredToken
  profile: GoogleProfile | null
  isExpired: boolean
}

export class GoogleAuthError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'GoogleAuthError'
    this.code = code
  }
}

let tokenClient: google.accounts.oauth2.TokenClient | null = null
let clientIdOverride: string | null = null

export function setGoogleClientIdForTests(clientId: string | null): void {
  clientIdOverride = clientId
}

export function resetGoogleAuthForTests(): void {
  tokenClient = null
}

function getClientId(): string {
  const clientId = clientIdOverride ?? import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new GoogleAuthError(
      'missing_client_id',
      'Client Google manquant. Verifiez la configuration.'
    )
  }
  return clientId
}

async function ensureGoogleLoaded(timeoutMs = 5_000): Promise<void> {
  if (typeof window === 'undefined') {
    throw new GoogleAuthError('no_window', "L'environnement navigateur est indisponible.")
  }

  if (window.google?.accounts?.oauth2) {
    return
  }

  await new Promise<void>((resolve, reject) => {
    const startedAt = Date.now()
    const timer = window.setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        window.clearInterval(timer)
        resolve()
        return
      }
      if (Date.now() - startedAt > timeoutMs) {
        window.clearInterval(timer)
        reject(
          new GoogleAuthError(
            'gsi_unavailable',
            'Google Identity Services indisponible. Vérifiez que le script est chargé et que votre connexion internet fonctionne.'
          )
        )
      }
    }, 100)
  })
}

function buildStoredToken(response: TokenResponse): StoredToken {
  if (!response.access_token) {
    throw new GoogleAuthError('token_error', 'Access token manquant.')
  }

  const expiresIn = response.expires_in ?? 0
  return {
    accessToken: response.access_token,
    expiresAt: Date.now() + expiresIn * 1_000,
    scope: response.scope ?? GOOGLE_AUTH_SCOPES,
    tokenType: response.token_type,
  }
}

function isTokenExpired(token: StoredToken): boolean {
  return token.expiresAt - TOKEN_EXPIRY_BUFFER_MS <= Date.now()
}

async function readJsonSetting<T>(key: string): Promise<T | null> {
  const raw = await settingsRepository.get(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

async function writeJsonSetting(key: string, value: unknown): Promise<void> {
  await settingsRepository.set(key, JSON.stringify(value))
}

async function clearSetting(key: string): Promise<void> {
  await settingsRepository.delete(key)
}

function getTokenClient(): google.accounts.oauth2.TokenClient {
  if (!tokenClient) {
    if (!window.google?.accounts?.oauth2) {
      throw new GoogleAuthError('gsi_unavailable', 'Google Identity Services non disponible.')
    }
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: getClientId(),
      scope: GOOGLE_AUTH_SCOPES,
      callback: () => {},
    })
  }
  return tokenClient
}

async function requestAccessToken(prompt: string): Promise<TokenResponse> {
  await ensureGoogleLoaded()
  const client = getTokenClient()

  return await new Promise<TokenResponse>((resolve, reject) => {
    let resolved = false
    const timeoutId = window.setTimeout(() => {
      if (!resolved) {
        resolved = true
        reject(
          new GoogleAuthError(
            'timeout',
            'Délai d\'attente dépassé. La popup a peut-être été bloquée par le navigateur.'
          )
        )
      }
    }, 60000) // 60 secondes

    client.callback = (response) => {
      if (resolved) return
      resolved = true
      window.clearTimeout(timeoutId)

      if (response.error) {
        reject(
          new GoogleAuthError(
            response.error,
            response.error_description ?? "Erreur d'authentification Google."
          )
        )
        return
      }
      resolve(response as TokenResponse)
    }

    try {
      client.requestAccessToken({ prompt })
    } catch (error) {
      if (!resolved) {
        resolved = true
        window.clearTimeout(timeoutId)
        reject(
          new GoogleAuthError(
            'token_error',
            error instanceof Error ? error.message : "Erreur d'authentification Google."
          )
        )
      }
    }
  })
}

async function fetchUserEmail(accessToken: string): Promise<string | undefined> {
  let response: Response
  try {
    response = await fetch(GOOGLE_USERINFO_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch (error) {
    throw new GoogleAuthError(
      'userinfo_error',
      error instanceof Error ? error.message : "Impossible de recuperer l'email Google."
    )
  }

  if (!response.ok) {
    throw new GoogleAuthError('userinfo_error', "Impossible de recuperer l'email Google.")
  }

  const data = (await response.json()) as UserInfoResponse
  return typeof data.email === 'string' ? data.email : undefined
}


export class GoogleAuthService {
  static async getSession(): Promise<GoogleAuthSession | null> {
    const token = await readJsonSetting<StoredToken>(GOOGLE_AUTH_TOKEN_KEY)
    if (!token) return null
    let profile = await readJsonSetting<GoogleProfile>(GOOGLE_AUTH_PROFILE_KEY)
    if (!profile?.email && !isTokenExpired(token)) {
      try {
        const email = await fetchUserEmail(token.accessToken)
        if (email) {
          profile = { email }
          await writeJsonSetting(GOOGLE_AUTH_PROFILE_KEY, profile)
        }
      } catch {
        // Ignore userinfo errors to keep drive access usable.
      }
    }

    return {
      token,
      profile,
      isExpired: isTokenExpired(token),
    }
  }

  static async getProfile(): Promise<GoogleProfile | null> {
    return await readJsonSetting<GoogleProfile>(GOOGLE_AUTH_PROFILE_KEY)
  }

  static async signIn(): Promise<GoogleAuthSession> {
    const response = await requestAccessToken('consent')
    const token = buildStoredToken(response)
    await writeJsonSetting(GOOGLE_AUTH_TOKEN_KEY, token)

    try {
      const email = await fetchUserEmail(token.accessToken)
      if (email) {
        await writeJsonSetting(GOOGLE_AUTH_PROFILE_KEY, { email })
      }
    } catch {
      // Keep sign-in successful even if userinfo fails.
    }

    const profile = await readJsonSetting<GoogleProfile>(GOOGLE_AUTH_PROFILE_KEY)
    return {
      token,
      profile,
      isExpired: false,
    }
  }

  static async getAccessToken(options?: { interactive?: boolean }): Promise<string> {
    const stored = await readJsonSetting<StoredToken>(GOOGLE_AUTH_TOKEN_KEY)
    if (stored && !isTokenExpired(stored)) {
      return stored.accessToken
    }

    if (stored) {
      try {
        const response = await requestAccessToken('')
        const token = buildStoredToken(response)
        await writeJsonSetting(GOOGLE_AUTH_TOKEN_KEY, token)
        return token.accessToken
      } catch (error) {
        if (!options?.interactive) {
          throw error
        }
      }
    }

    if (!stored && !options?.interactive) {
      throw new GoogleAuthError('not_connected', 'Connexion Google requise.')
    }

    const response = await requestAccessToken('consent')
    const token = buildStoredToken(response)
    await writeJsonSetting(GOOGLE_AUTH_TOKEN_KEY, token)
    return token.accessToken
  }

  static async signOut(): Promise<void> {
    const stored = await readJsonSetting<StoredToken>(GOOGLE_AUTH_TOKEN_KEY)
    if (stored && window.google?.accounts?.oauth2?.revoke) {
      await new Promise<void>((resolve) => {
        window.google.accounts.oauth2.revoke(stored.accessToken, () => resolve())
      })
    }
    await clearSetting(GOOGLE_AUTH_TOKEN_KEY)
    await clearSetting(GOOGLE_AUTH_PROFILE_KEY)
  }

  static async clearStoredSession(): Promise<void> {
    await clearSetting(GOOGLE_AUTH_TOKEN_KEY)
    await clearSetting(GOOGLE_AUTH_PROFILE_KEY)
  }
}
