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

type AuthMode = 'PARENT' | 'ENFANT'

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
}

const AuthContext = createContext<AuthContextValue | null>(null)

const PIN_HASH_KEY = 'pin_hash'
const MODE_KEY = 'auth_mode'

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
