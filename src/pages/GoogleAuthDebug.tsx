import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { GoogleAuthService } from '@/lib/googleAuth'

export function GoogleAuthDebug() {
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const checkGoogleScript = () => {
      const info: Record<string, any> = {
        scriptLoaded: !!window.google,
        oauth2Available: !!window.google?.accounts?.oauth2,
        idAvailable: !!window.google?.accounts?.id,
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'NON DÉFINI',
        userAgent: navigator.userAgent,
        url: window.location.href,
      }
      setDebugInfo(info)
    }

    checkGoogleScript()
    const interval = setInterval(checkGoogleScript, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleTestAuth = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const session = await GoogleAuthService.signIn()
      setSuccess(
        `Authentification réussie ! Email: ${session.profile?.email || 'non disponible'}`
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (value: boolean) => {
    return value ? 'text-green-600' : 'text-red-600'
  }

  const getStatusIcon = (value: boolean) => {
    return value ? '✓' : '✗'
  }

  return (
    <AppShell title="Debug Google Auth">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>État du système</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="font-mono text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span>Script Google chargé:</span>
                <span className={getStatusColor(debugInfo.scriptLoaded)}>
                  {getStatusIcon(debugInfo.scriptLoaded)} {String(debugInfo.scriptLoaded)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>OAuth2 API disponible:</span>
                <span className={getStatusColor(debugInfo.oauth2Available)}>
                  {getStatusIcon(debugInfo.oauth2Available)} {String(debugInfo.oauth2Available)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>ID API disponible:</span>
                <span className={getStatusColor(debugInfo.idAvailable)}>
                  {getStatusIcon(debugInfo.idAvailable)} {String(debugInfo.idAvailable)}
                </span>
              </div>
              <div className="flex flex-col gap-1 pt-2 border-t">
                <span className="font-semibold">Client ID:</span>
                <span className="text-xs break-all text-gray-600">{debugInfo.clientId}</span>
              </div>
              <div className="flex flex-col gap-1 pt-2 border-t">
                <span className="font-semibold">URL actuelle:</span>
                <span className="text-xs break-all text-gray-600">{debugInfo.url}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test d'authentification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Cliquez sur le bouton pour tester l'authentification Google. Une popup devrait s'ouvrir.
            </p>

            <Button variant="primary" onClick={handleTestAuth} loading={loading}>
              Tester l'authentification
            </Button>

            {error && (
              <div className="rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm">
                <strong>Erreur:</strong> {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-green-50 text-green-700 px-3 py-2 text-sm">
                <strong>Succès:</strong> {success}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instructions de dépannage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">Si le script n'est pas chargé:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Vérifiez votre connexion internet</li>
                <li>Vérifiez que le script est bien présent dans index.html</li>
                <li>Vérifiez la console pour des erreurs de chargement</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-1">Si la popup ne s'ouvre pas:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Vérifiez que les popups ne sont pas bloquées par le navigateur</li>
                <li>Regardez la barre d'adresse pour une icône de popup bloquée</li>
                <li>Autorisez les popups pour localhost</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-1">
                Si l'authentification échoue:
              </h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Vérifiez que le Client ID est correct dans le fichier .env</li>
                <li>
                  Vérifiez dans Google Cloud Console que http://localhost:5173 est dans les
                  "Origines JavaScript autorisées"
                </li>
                <li>Vérifiez que l'API Google Drive est activée</li>
                <li>Vérifiez que le scope drive.file est autorisé</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
