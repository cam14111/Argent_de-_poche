import { type ReactNode, useState } from 'react'
import { TopBar } from './TopBar'
import { PinPad } from '../PinPad'
import { useAuth } from '@/contexts/AuthContext'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

interface AppShellProps {
  title: string
  children: ReactNode
  showModeSwitch?: boolean
  backTo?: string
  showVersion?: boolean
}

export function AppShell({ title, children, showModeSwitch = true, backTo, showVersion = false }: AppShellProps) {
  const { isPinSet, setPin, switchToParentMode, resetPin } = useAuth()
  const [showPinDialog, setShowPinDialog] = useState(false)
  const [showSetupPinDialog, setShowSetupPinDialog] = useState(false)
  const [showResetPinDialog, setShowResetPinDialog] = useState(false)
  const [pinError, setPinError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const isOnline = useOnlineStatus()

  const handleParentModeClick = () => {
    if (isPinSet) {
      setShowPinDialog(true)
    } else {
      setShowSetupPinDialog(true)
    }
  }

  const handlePinSubmit = async (pin: string) => {
    setLoading(true)
    setPinError('')
    try {
      const success = await switchToParentMode(pin)
      if (success) {
        setShowPinDialog(false)
      } else {
        setPinError('Code PIN incorrect')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSetupPin = async (pin: string) => {
    setLoading(true)
    try {
      await setPin(pin)
      setShowSetupPinDialog(false)
      setShowPinDialog(true)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPin = async () => {
    setResetLoading(true)
    try {
      await resetPin()
      setShowResetPinDialog(false)
      setShowPinDialog(false)
      setPinError('')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar
        title={title}
        showModeSwitch={showModeSwitch}
        onParentModeClick={handleParentModeClick}
        backTo={backTo}
        showVersion={showVersion}
      />
      {!isOnline && (
        <div className="bg-amber-50 text-amber-900 border-b border-amber-100 px-3 sm:px-4 py-2 text-sm">
          Hors ligne : vos actions restent disponibles et seront synchronisees des que possible.
        </div>
      )}
      <main className="p-3 sm:p-4">{children}</main>

      <Dialog
        open={showPinDialog}
        onClose={() => {
          setShowPinDialog(false)
          setPinError('')
        }}
        title="Accès Mode Parent"
      >
        <div className="space-y-4">
          <PinPad
            onSubmit={handlePinSubmit}
            onCancel={() => {
              setShowPinDialog(false)
              setPinError('')
            }}
            error={pinError}
            loading={loading}
          />
          {isPinSet && (
            <div className="flex justify-center">
              <Button variant="ghost" onClick={() => setShowResetPinDialog(true)}>
                Reinitialiser le code PIN
              </Button>
            </div>
          )}
        </div>
      </Dialog>

      <Dialog
        open={showSetupPinDialog}
        onClose={() => setShowSetupPinDialog(false)}
        title="Créer un code PIN"
      >
        <p className="text-gray-600 mb-4">
          Créez un code PIN à 4 chiffres pour protéger le mode parent.
        </p>
        <PinPad
          onSubmit={handleSetupPin}
          onCancel={() => setShowSetupPinDialog(false)}
          title="Créez votre code PIN"
          loading={loading}
        />
      </Dialog>

      <Dialog
        open={showResetPinDialog}
        onClose={() => setShowResetPinDialog(false)}
        title="Reinitialiser le code PIN"
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() => setShowResetPinDialog(false)}
              disabled={resetLoading}
            >
              Annuler
            </Button>
            <Button variant="danger" onClick={handleResetPin} loading={resetLoading}>
              Reinitialiser
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-sm text-gray-600">
          <p>Cette action supprime le code PIN actuel.</p>
          <p>Un nouveau code PIN sera demande lors du prochain acces au mode parent.</p>
        </div>
      </Dialog>
    </div>
  )
}
