import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import { settingsRepository } from '@/db'
import { hashPin, verifyPin } from '@/lib/crypto'
import { SharedFolderDetector } from '@/lib/sync/SharedFolderDetector'
import { GoogleAuthService } from '@/lib/googleAuth'

type AuthMode = 'PARENT' | 'ENFANT'

export type ParentAuthResult = {
  authorized: boolean
  reason: 'first_user' | 'owner' | 'not_owner' | 'not_connected' | 'offline_cached' | 'error'
  message?: string
}

interface AuthContextValue {
  mode: AuthMode
  isParentMode: boolean
  isChildMode: boolean
  isPinSet: boolean
  switchToParentMode: (pin: string) => Promise<boolean>
  switchToChildMode: () => void
  setPin: (pin: string) => Promise<void>
  changePin: (oldPin: string, newPin: string) => Promise<boolean>
  resetPin: () => Promise<void>
  checkParentAuthorization: () => Promise<ParentAuthResult>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const PIN_HASH_KEY = 'pin_hash'
const MODE_KEY = 'auth_mode'
const VERIFIED_PARENT_EMAIL_KEY = 'verified_parent_email'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AuthMode>('ENFANT')
  const [isPinSet, setIsPinSet] = useState(false)

  useEffect(() => {
    const initAuth = async () => {
      const pinHash = await settingsRepository.get(PIN_HASH_KEY)
      setIsPinSet(!!pinHash)

      const savedMode = await settingsRepository.get(MODE_KEY)
      if (savedMode === 'PARENT' || savedMode === 'ENFANT') {
        setMode(savedMode)
      }
    }
    initAuth()
  }, [])

  const switchToParentMode = useCallback(async (pin: string): Promise<boolean> => {
    const storedHash = await settingsRepository.get(PIN_HASH_KEY)
    if (!storedHash) return false

    const isValid = await verifyPin(pin, storedHash)
    if (isValid) {
      setMode('PARENT')
      await settingsRepository.set(MODE_KEY, 'PARENT')
    }
    return isValid
  }, [])

  const switchToChildMode = useCallback(async () => {
    setMode('ENFANT')
    await settingsRepository.set(MODE_KEY, 'ENFANT')
  }, [])

  const resetPin = useCallback(async () => {
    await settingsRepository.delete(PIN_HASH_KEY)
    setIsPinSet(false)
    await switchToChildMode()
  }, [switchToChildMode])

  const setPin = useCallback(async (pin: string): Promise<void> => {
    const hash = await hashPin(pin)
    await settingsRepository.set(PIN_HASH_KEY, hash)
    setIsPinSet(true)
  }, [])

  const changePin = useCallback(
    async (oldPin: string, newPin: string): Promise<boolean> => {
      const storedHash = await settingsRepository.get(PIN_HASH_KEY)
      if (!storedHash) return false

      const isValid = await verifyPin(oldPin, storedHash)
      if (!isValid) return false

      await setPin(newPin)
      return true
    },
    [setPin]
  )

  const checkParentAuthorization = useCallback(async (): Promise<ParentAuthResult> => {
    try {
      // Vérifier si connecté à Google
      const session = await GoogleAuthService.getSession()
      const isConnected = !!(session && session.profile && session.profile.email)
      const currentEmail = session?.profile?.email?.toLowerCase()

      if (!isConnected) {
        // Vérifier le cache pour le mode offline
        const cachedEmail = await settingsRepository.get(VERIFIED_PARENT_EMAIL_KEY)
        if (cachedEmail) {
          return {
            authorized: true,
            reason: 'offline_cached',
            message: 'Accès autorisé (vérifié précédemment)'
          }
        }
        return {
          authorized: false,
          reason: 'not_connected',
          message: 'Connexion à Google requise pour la première configuration du mode parent'
        }
      }

      // Utiliser SharedFolderDetector pour vérifier l'éligibilité
      const detector = new SharedFolderDetector()
      const eligibility = await detector.checkParentEligibility()

      switch (eligibility) {
        case 'owner':
          // Mettre en cache l'email vérifié pour le mode offline
          if (currentEmail) {
            await settingsRepository.set(VERIFIED_PARENT_EMAIL_KEY, currentEmail)
          }
          return {
            authorized: true,
            reason: 'owner',
            message: 'Vous êtes enregistré comme parent'
          }

        case 'first_user':
          // Premier utilisateur, sera owner après création du PIN
          if (currentEmail) {
            await settingsRepository.set(VERIFIED_PARENT_EMAIL_KEY, currentEmail)
          }
          return {
            authorized: true,
            reason: 'first_user',
            message: 'Première configuration - vous deviendrez le parent principal'
          }

        case 'member':
          return {
            authorized: false,
            reason: 'not_owner',
            message: 'Vous n\'êtes pas enregistré comme parent. Contactez un parent pour être ajouté à la liste.'
          }

        case 'not_connected':
        default:
          return {
            authorized: false,
            reason: 'not_connected',
            message: 'Connexion à Google requise'
          }
      }
    } catch (error) {
      console.error('[AuthContext] Error checking parent authorization:', error)
      return {
        authorized: false,
        reason: 'error',
        message: 'Erreur lors de la vérification. Veuillez réessayer.'
      }
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        mode,
        isParentMode: mode === 'PARENT',
        isChildMode: mode === 'ENFANT',
        isPinSet,
        switchToParentMode,
        switchToChildMode,
        setPin,
        changePin,
        resetPin,
        checkParentAuthorization,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
