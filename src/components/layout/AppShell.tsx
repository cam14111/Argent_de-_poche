import { type ReactNode, useState } from 'react'
import { TopBar } from './TopBar'
import { PinPad } from '../PinPad'
import { useAuth, type ParentAuthResult } from '@/contexts/AuthContext'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { GoogleAuthService } from '@/lib/googleAuth'

interface AppShellProps {
  title: string
  children: ReactNode
  showModeSwitch?: boolean
  backTo?: string
  showVersion?: boolean
}

export function AppShell({ title, children, showModeSwitch = true, backTo, showVersion = false }: AppShellProps) {
  const { isPinSet, setPin, switchToParentMode, resetPin, checkParentAuthorization } = useAuth()
  const [showPinDialog, setShowPinDialog] = useState(false)
  const [showSetupPinDialog, setShowSetupPinDialog] = useState(false)
  const [showResetPinDialog, setShowResetPinDialog] = useState(false)
  const [pinError, setPinError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const isOnline = useOnlineStatus()

  // Nouveaux états pour la sécurisation du mode parent
  const [showVerifyingDialog, setShowVerifyingDialog] = useState(false)
  const [showConnectionRequiredDialog, setShowConnectionRequiredDialog] = useState(false)
  const [showAccessDeniedDialog, setShowAccessDeniedDialog] = useState(false)
  const [authResult, setAuthResult] = useState<ParentAuthResult | null>(null)
  const [connectLoading, setConnectLoading] = useState(false)

  const handleParentModeClick = async () => {
    if (isPinSet) {
      // PIN déjà configuré - demander le code directement
      setShowPinDialog(true)
    } else {
      // Nouveau setup - vérifier l'autorisation d'abord
      setShowVerifyingDialog(true)
      try {
        const result = await checkParentAuthorization()
        setAuthResult(result)
        setShowVerifyingDialog(false)

        if (result.authorized) {
          // Autorisé - afficher la création de PIN
          setShowSetupPinDialog(true)
        } else if (result.reason === 'not_connected') {
          // Pas connecté à Google
          setShowConnectionRequiredDialog(true)
        } else {
          // Non autorisé (not_owner ou error)
          setShowAccessDeniedDialog(true)
        }
      } catch (error) {
        console.error('[AppShell] Error checking parent authorization:', error)
        setShowVerifyingDialog(false)
        setAuthResult({
          authorized: false,
          reason: 'error',
          message: 'Erreur lors de la vérification. Veuillez réessayer.'
        })
        setShowAccessDeniedDialog(true)
      }
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
    // Vérifier l'autorisation avant de permettre le reset
    setResetLoading(true)
    try {
      const result = await checkParentAuthorization()

      if (!result.authorized) {
        setShowResetPinDialog(false)
        setShowPinDialog(false)
        setAuthResult(result)

        if (result.reason === 'not_connected') {
          setShowConnectionRequiredDialog(true)
        } else {
          setShowAccessDeniedDialog(true)
        }
        return
      }

      await resetPin()
      setShowResetPinDialog(false)
      setShowPinDialog(false)
      setPinError('')
    } finally {
      setResetLoading(false)
    }
  }

  const handleGoogleConnect = async () => {
    setConnectLoading(true)
    try {
      await GoogleAuthService.signIn()
      setShowConnectionRequiredDialog(false)
      // Réessayer la vérification après connexion
      handleParentModeClick()
    } catch (error) {
      console.error('[AppShell] Error connecting to Google:', error)
    } finally {
      setConnectLoading(false)
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

      {/* Dialog Vérification en cours */}
      <Dialog
        open={showVerifyingDialog}
        onClose={() => {}}
        title="Vérification"
      >
        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Vérification de vos droits d'accès...</p>
        </div>
      </Dialog>

      {/* Dialog Connexion Google requise */}
      <Dialog
        open={showConnectionRequiredDialog}
        onClose={() => setShowConnectionRequiredDialog(false)}
        title="Connexion requise"
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() => setShowConnectionRequiredDialog(false)}
              disabled={connectLoading}
            >
              Annuler
            </Button>
            <Button onClick={handleGoogleConnect} loading={connectLoading}>
              Se connecter à Google
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            Pour configurer le mode parent, vous devez d'abord vous connecter avec votre compte Google.
          </p>
          <p>
            Cela permet de vérifier que vous êtes bien autorisé à accéder au mode parent.
          </p>
        </div>
      </Dialog>

      {/* Dialog Accès refusé */}
      <Dialog
        open={showAccessDeniedDialog}
        onClose={() => setShowAccessDeniedDialog(false)}
        title="Accès non autorisé"
        actions={
          <Button
            variant="ghost"
            onClick={() => setShowAccessDeniedDialog(false)}
          >
            Fermer
          </Button>
        }
      >
        <div className="space-y-3 text-sm text-gray-600">
          <p className="text-red-600 font-medium">
            {authResult?.message || "Vous n'êtes pas autorisé à accéder au mode parent."}
          </p>
          <p>
            Si vous êtes un parent, demandez à un parent déjà enregistré de vous ajouter
            à la liste des co-parents dans les paramètres.
          </p>
        </div>
      </Dialog>
    </div>
  )
}
