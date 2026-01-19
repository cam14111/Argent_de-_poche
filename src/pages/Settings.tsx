import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AppShell } from '@/components/layout'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
} from '@/components/ui'
import { Dialog } from '@/components/ui/Dialog'
import { SyncButton } from '@/components/sync/SyncButton'
import { useAuth } from '@/contexts/AuthContext'
import { useSyncStatus } from '@/hooks/useSyncStatus'
import {
  BackupError,
  JsonExporter,
  JsonImporter,
  buildBackupFileName,
  getBackupSummary,
  type BackupPayload,
  type BackupSummary,
  type ImportMode,
} from '@/lib/backup'
import { backupManager, type DriveBackupItem } from '@/lib/backupManager'
import { GoogleAuthError, GoogleAuthService, type GoogleAuthSession } from '@/lib/googleAuth'
import { GoogleDriveError } from '@/lib/googleDrive'

type StatusMessage = { type: 'success' | 'error'; message: string }

export function Settings() {
  const { isParentMode, isPinSet, resetPin } = useAuth()
  const syncStatus = useSyncStatus()
  const [exportStatus, setExportStatus] = useState<StatusMessage | null>(null)
  const [importStatus, setImportStatus] = useState<StatusMessage | null>(null)
  const [resetPinStatus, setResetPinStatus] = useState<StatusMessage | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [pendingPayload, setPendingPayload] = useState<BackupPayload | null>(null)
  const [summary, setSummary] = useState<BackupSummary | null>(null)
  const [importMode, setImportMode] = useState<ImportMode>('replace')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmResetPinOpen, setConfirmResetPinOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isResettingPin, setIsResettingPin] = useState(false)
  const [fileName, setFileName] = useState('')
  const [fileInputKey, setFileInputKey] = useState(0)
  const [googleSession, setGoogleSession] = useState<GoogleAuthSession | null>(null)
  const [googleStatus, setGoogleStatus] = useState<StatusMessage | null>(null)
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false)
  const [isDisconnectingGoogle, setIsDisconnectingGoogle] = useState(false)
  const [driveBackups, setDriveBackups] = useState<DriveBackupItem[]>([])
  const [driveStatus, setDriveStatus] = useState<StatusMessage | null>(null)
  const [isDriveLoading, setIsDriveLoading] = useState(false)
  const [isDriveBackingUp, setIsDriveBackingUp] = useState(false)
  const [lastDriveBackupAt, setLastDriveBackupAt] = useState<string | null>(null)
  const [retentionLimit, setRetentionLimit] = useState('')
  const [retentionStatus, setRetentionStatus] = useState<StatusMessage | null>(null)
  const [isRetentionSaving, setIsRetentionSaving] = useState(false)
  const [backupState, setBackupState] = useState(() => backupManager.getState())
  const [previewingBackupId, setPreviewingBackupId] = useState<string | null>(null)
  const [restoreStatus, setRestoreStatus] = useState<StatusMessage | null>(null)
  const [restorePreview, setRestorePreview] = useState<BackupSummary | null>(null)
  const [selectedDriveBackup, setSelectedDriveBackup] = useState<DriveBackupItem | null>(null)
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [deletingBackupId, setDeletingBackupId] = useState<string | null>(null)

  const formattedExportedAt = useMemo(() => {
    if (!summary?.exportedAt) return ''
    const date = new Date(summary.exportedAt)
    if (Number.isNaN(date.getTime())) return summary.exportedAt
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  }, [summary?.exportedAt])

  const isGoogleConnected = !!googleSession && !googleSession.isExpired
  const googleEmail = googleSession?.profile?.email ?? 'Email indisponible'
  const googleStatusLabel = isGoogleConnected
    ? 'Connecte'
    : googleSession
      ? 'Session expiree'
      : 'Non connecte'
  const syncStatusLabel = (() => {
    if (!isGoogleConnected) return 'Non connecte'
    if (!syncStatus.isOnline) return 'Hors ligne'
    if (syncStatus.status === 'syncing') return 'Synchronisation en cours'
    if (syncStatus.status === 'pending') {
      return syncStatus.pendingCount > 0
        ? `En attente (${syncStatus.pendingCount})`
        : 'En attente'
    }
    if (syncStatus.status === 'error') return 'Erreur'
    return 'A jour'
  })()

  const formatDateTime = (value?: string | Date | null) => {
    if (!value) return ''
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return String(value)
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  }

  const formatFileSize = (size?: number) => {
    if (!size) return '0 KB'
    const units = ['B', 'KB', 'MB', 'GB']
    let value = size
    let unitIndex = 0
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024
      unitIndex += 1
    }
    const digits = value < 10 && unitIndex > 0 ? 1 : 0
    return `${value.toFixed(digits)} ${units[unitIndex]}`
  }

  const getDriveErrorMessage = (error: unknown) => {
    if (error instanceof GoogleDriveError) {
      if (error.reason === 'quotaExceeded') {
        return 'Quota Google Drive depasse.'
      }
      if (error.reason === 'insufficientPermissions') {
        return 'Permissions Google Drive insuffisantes.'
      }
      return error.message
    }
    return error instanceof Error ? error.message : 'Erreur Google Drive.'
  }

  const getAuthErrorMessage = (error: unknown) => {
    if (error instanceof GoogleAuthError) {
      if (error.code === 'not_connected') {
        return 'Connexion Google requise.'
      }
      if (error.code === 'missing_client_id') {
        return 'Client Google manquant.'
      }
      return error.message
    }
    return error instanceof Error ? error.message : "Erreur d'authentification Google."
  }

  useEffect(() => {
    let mounted = true

    const loadSession = async () => {
      const session = await GoogleAuthService.getSession()
      if (mounted) {
        setGoogleSession(session)
        if (session && !session.isExpired) {
          await loadDriveBackups(session)
        }
      }
    }

    const loadLastBackup = async () => {
      const lastBackup = await backupManager.getLastBackupAt()
      if (mounted) {
        setLastDriveBackupAt(lastBackup)
      }
    }

    const loadRetentionLimit = async () => {
      const limit = await backupManager.getRetentionLimit()
      if (mounted) {
        setRetentionLimit(limit === null ? '' : String(limit))
      }
    }

    void loadSession()
    void loadLastBackup()
    void loadRetentionLimit()

    const unsubscribe = backupManager.subscribe(setBackupState)
    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const resetImportState = () => {
    setPendingPayload(null)
    setSummary(null)
    setFileName('')
    setParseError(null)
    setFileInputKey((prev) => prev + 1)
  }

  const loadDriveBackups = async (
    session?: GoogleAuthSession | null,
    options?: { preserveStatus?: boolean }
  ) => {
    const currentSession = session ?? googleSession
    if (!currentSession || currentSession.isExpired) {
      setDriveBackups([])
      return
    }
    setIsDriveLoading(true)
    if (!options?.preserveStatus) {
      setDriveStatus(null)
    }
    try {
      const backups = await backupManager.listBackups()
      setDriveBackups(backups)
    } catch (error) {
      setDriveStatus({
        type: 'error',
        message: getDriveErrorMessage(error),
      })
    } finally {
      setIsDriveLoading(false)
    }
  }

  const handleGoogleConnect = async () => {
    setGoogleStatus(null)
    setIsConnectingGoogle(true)
    try {
      const session = await GoogleAuthService.signIn()
      setGoogleSession(session)
      setGoogleStatus({
        type: 'success',
        message: 'Connexion Google reussie.',
      })
      await loadDriveBackups(session)
    } catch (error) {
      setGoogleStatus({
        type: 'error',
        message: getAuthErrorMessage(error),
      })
    } finally {
      setIsConnectingGoogle(false)
    }
  }

  const handleGoogleDisconnect = async () => {
    setGoogleStatus(null)
    setIsDisconnectingGoogle(true)
    try {
      await GoogleAuthService.signOut()
      await backupManager.clearLastBackup()
      await backupManager.clearDriveCache()
      setGoogleSession(null)
      setDriveBackups([])
      setLastDriveBackupAt(null)
      setDriveStatus(null)
      setRestoreStatus(null)
      setGoogleStatus({
        type: 'success',
        message: 'Deconnexion Google terminee.',
      })
    } catch (error) {
      setGoogleStatus({
        type: 'error',
        message: getAuthErrorMessage(error),
      })
    } finally {
      setIsDisconnectingGoogle(false)
    }
  }

  const handleDriveBackup = async () => {
    setDriveStatus(null)
    setIsDriveBackingUp(true)
    try {
      const backup = await backupManager.backup()
      setLastDriveBackupAt(backup.exportedAt ?? new Date().toISOString())
      setDriveStatus({
        type: 'success',
        message: 'Backup envoye sur Google Drive.',
      })
      await loadDriveBackups(undefined, { preserveStatus: true })
    } catch (error) {
      setDriveStatus({
        type: 'error',
        message: getDriveErrorMessage(error),
      })
    } finally {
      setIsDriveBackingUp(false)
    }
  }

  const handleRetentionSave = async () => {
    setRetentionStatus(null)
    const trimmed = retentionLimit.trim()
    if (!trimmed) {
      setIsRetentionSaving(true)
      try {
        await backupManager.setRetentionLimit(null)
        setRetentionLimit('')
        setRetentionStatus({
          type: 'success',
          message: 'Limite de conservation desactivee.',
        })
      } catch (error) {
        setRetentionStatus({
          type: 'error',
          message: getDriveErrorMessage(error),
        })
      } finally {
        setIsRetentionSaving(false)
      }
      return
    }

    const parsed = Number.parseInt(trimmed, 10)
    if (Number.isNaN(parsed) || parsed < 0) {
      setRetentionStatus({
        type: 'error',
        message: 'Veuillez entrer un nombre entier valide.',
      })
      return
    }

    setIsRetentionSaving(true)
    try {
      await backupManager.setRetentionLimit(parsed)
      setRetentionLimit(String(parsed))
      if (isGoogleConnected && parsed > 0) {
        await backupManager.pruneBackups(parsed)
        await loadDriveBackups(undefined, { preserveStatus: true })
      }
      setRetentionStatus({
        type: 'success',
        message: 'Limite de conservation mise a jour.',
      })
    } catch (error) {
      setRetentionStatus({
        type: 'error',
        message: getDriveErrorMessage(error),
      })
    } finally {
      setIsRetentionSaving(false)
    }
  }

  const handleRestorePreview = async (backup: DriveBackupItem) => {
    setPreviewingBackupId(backup.id)
    setRestoreStatus(null)
    setRestorePreview(null)
    setSelectedDriveBackup(null)
    try {
      const preview = await backupManager.preview(backup.id)
      setRestorePreview(preview)
      setSelectedDriveBackup(backup)
      setIsRestoreDialogOpen(true)
    } catch (error) {
      setRestoreStatus({
        type: 'error',
        message: getDriveErrorMessage(error),
      })
    } finally {
      setPreviewingBackupId(null)
    }
  }

  const handleDeleteBackup = async (backup: DriveBackupItem) => {
    const confirmed = window.confirm(
      `Supprimer le backup "${backup.name}" ? Cette action est irreversible.`
    )
    if (!confirmed) return

    setDriveStatus(null)
    setDeletingBackupId(backup.id)
    try {
      await backupManager.deleteBackup(backup.id)
      setDriveStatus({
        type: 'success',
        message: 'Backup supprime.',
      })
      await loadDriveBackups(undefined, { preserveStatus: true })
      const lastBackup = await backupManager.getLastBackupAt()
      setLastDriveBackupAt(lastBackup)
    } catch (error) {
      setDriveStatus({
        type: 'error',
        message: getDriveErrorMessage(error),
      })
    } finally {
      setDeletingBackupId(null)
    }
  }

  const handleConfirmRestore = async () => {
    if (!selectedDriveBackup) return
    setIsRestoring(true)
    setRestoreStatus(null)
    try {
      await backupManager.restore(selectedDriveBackup.id, 'replace')
      setRestoreStatus({
        type: 'success',
        message: 'Restauration terminee.',
      })
      setIsRestoreDialogOpen(false)
      setRestorePreview(null)
      setSelectedDriveBackup(null)
    } catch (error) {
      setRestoreStatus({
        type: 'error',
        message: getDriveErrorMessage(error),
      })
    } finally {
      setIsRestoring(false)
    }
  }

  const handleExport = async () => {
    setExportStatus(null)
    try {
      const json = await JsonExporter.exportToJson()
      const name = buildBackupFileName()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = name
      link.click()
      URL.revokeObjectURL(url)
      setExportStatus({
        type: 'success',
        message: `Backup telecharge : ${name}`,
      })
    } catch (error) {
      setExportStatus({
        type: 'error',
        message: "Echec de l'export. Veuillez reessayer.",
      })
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setImportStatus(null)
    setParseError(null)
    setPendingPayload(null)
    setSummary(null)

    const file = event.target.files?.[0]
    if (!file) {
      setFileName('')
      return
    }

    setFileName(file.name)
    try {
      const text = await file.text()
      const payload = JsonImporter.parse(text)
      setPendingPayload(payload)
      setSummary(getBackupSummary(payload))
    } catch (error) {
      const message =
        error instanceof BackupError || error instanceof Error
          ? error.message
          : 'Le fichier est invalide.'
      setParseError(message)
    }
  }

  const handleConfirmImport = async () => {
    if (!pendingPayload) return
    setIsImporting(true)
    setImportStatus(null)
    try {
      await JsonImporter.importPayload(pendingPayload, importMode)
      setImportStatus({
        type: 'success',
        message: 'Import termine avec succes.',
      })
      resetImportState()
    } catch (error) {
      const message =
        error instanceof BackupError || error instanceof Error
          ? error.message
          : "Erreur lors de l'import."
      setImportStatus({
        type: 'error',
        message,
      })
    } finally {
      setIsImporting(false)
      setConfirmOpen(false)
    }
  }

  const handleResetPin = async () => {
    if (!isPinSet) return
    setIsResettingPin(true)
    setResetPinStatus(null)
    try {
      await resetPin()
      setResetPinStatus({
        type: 'success',
        message: 'Code PIN reinitialise.',
      })
    } catch (error) {
      setResetPinStatus({
        type: 'error',
        message: 'Echec de la reinitialisation du code PIN.',
      })
    } finally {
      setIsResettingPin(false)
      setConfirmResetPinOpen(false)
    }
  }

  const importModeLabel =
    importMode === 'replace'
      ? 'Remplacer toutes les donnees'
      : 'Fusionner avec les donnees existantes'

  return (
    <AppShell title={isParentMode ? 'Parametres' : 'Synchronisation'}>
      <div className="max-w-3xl mx-auto space-y-6">
        {isParentMode && (
          <Card>
            <CardHeader>
              <CardTitle>Exporter les donnees</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Telechargez un fichier JSON pour sauvegarder toutes vos donnees.
              </p>
              <Button variant="primary" onClick={handleExport}>
                Exporter
              </Button>
              {exportStatus && (
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    exportStatus.type === 'success'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {exportStatus.message}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Google Drive</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Connectez votre compte Google pour activer la synchronisation et les backups cloud.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1 text-sm text-gray-700">
                <p>
                  Statut : <span className="font-medium">{googleStatusLabel}</span>
                </p>
                {isGoogleConnected && (
                  <p className="text-gray-600">Compte : {googleEmail}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  onClick={handleGoogleConnect}
                  loading={isConnectingGoogle}
                  disabled={isGoogleConnected}
                >
                  Connexion Google
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleGoogleDisconnect}
                  loading={isDisconnectingGoogle}
                  disabled={!googleSession}
                >
                  Deconnexion
                </Button>
              </div>
            </div>
            {googleStatus && (
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
                  googleStatus.type === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {googleStatus.message}
              </div>
            )}
          </CardContent>
        </Card>

        {!isParentMode && (
          <Card>
            <CardHeader>
              <CardTitle>Synchronisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Synchronisez cet appareil pour recuperer les donnees les plus recentes.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1 text-sm text-gray-700">
                  <p>
                    Statut : <span className="font-medium">{syncStatusLabel}</span>
                  </p>
                  <p className="text-gray-600">
                    Derniere synchronisation :{' '}
                    <span className="font-medium">
                      {syncStatus.lastSyncAt
                        ? formatDateTime(syncStatus.lastSyncAt)
                        : 'Aucune synchronisation'}
                    </span>
                  </p>
                  {syncStatus.error && (
                    <p className="text-red-600">{syncStatus.error}</p>
                  )}
                </div>
                <SyncButton
                  variant="primary"
                  size="sm"
                  label="Synchroniser"
                  disabled={!isGoogleConnected}
                />
              </div>
              {!isGoogleConnected && (
                <div className="rounded-lg bg-yellow-50 text-yellow-700 px-3 py-2 text-sm">
                  Connectez-vous a Google pour synchroniser les donnees.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isParentMode && (
          <Card>
            <CardHeader>
              <CardTitle>Sauvegarde Google Drive</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Sauvegardez vos donnees dans le dossier "ArgentDePoche".
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1 text-sm text-gray-700">
                  <p>
                    Dernier backup :{' '}
                    <span className="font-medium">
                      {lastDriveBackupAt
                        ? formatDateTime(lastDriveBackupAt)
                        : 'Aucun backup'}
                    </span>
                  </p>
                  {backupState.status === 'in_progress' && (
                    <p className="text-indigo-600">
                      {backupState.operation === 'backup'
                        ? 'Backup en cours...'
                        : backupState.operation === 'restore'
                          ? 'Restauration en cours...'
                          : 'Operation en cours...'}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    onClick={handleDriveBackup}
                    loading={isDriveBackingUp}
                    disabled={!isGoogleConnected}
                  >
                    Sauvegarder sur Drive
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => loadDriveBackups()}
                    loading={isDriveLoading}
                    disabled={!isGoogleConnected}
                  >
                    Rafraichir la liste
                  </Button>
                </div>
              </div>
              {!isGoogleConnected && (
                <div className="rounded-lg bg-yellow-50 text-yellow-700 px-3 py-2 text-sm">
                  Connectez-vous a Google pour activer les backups Drive.
                </div>
              )}
              {driveStatus && (
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    driveStatus.type === 'success'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {driveStatus.message}
                </div>
              )}
              {restoreStatus && (
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    restoreStatus.type === 'success'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {restoreStatus.message}
                </div>
              )}
              <div className="rounded-lg border border-gray-200 p-3 space-y-3">
                <div className="text-sm font-medium text-gray-800">
                  Conservation des backups
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <Input
                    label="Backups a conserver"
                    type="number"
                    min="0"
                    step="1"
                    value={retentionLimit}
                    onChange={(event) => setRetentionLimit(event.target.value)}
                    helperText="Laissez vide pour conserver tous les backups."
                    disabled={isRetentionSaving}
                  />
                  <Button
                    variant="secondary"
                    onClick={handleRetentionSave}
                    loading={isRetentionSaving}
                    disabled={isRetentionSaving}
                  >
                    Enregistrer
                  </Button>
                </div>
                {retentionStatus && (
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      retentionStatus.type === 'success'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {retentionStatus.message}
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="font-medium text-gray-700">
                    Backups disponibles
                  </span>
                  <span>{driveBackups.length} fichier(s)</span>
                </div>
                {driveBackups.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Aucun backup disponible sur Drive.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {driveBackups.map((backup) => (
                      <li
                        key={backup.id}
                        className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-800">
                            {backup.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDateTime(backup.exportedAt ?? backup.createdTime)} -{' '}
                            {formatFileSize(backup.size)} - v
                            {backup.schemaVersion ?? 'n/a'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRestorePreview(backup)}
                            loading={previewingBackupId === backup.id}
                            disabled={!isGoogleConnected}
                          >
                            Restaurer
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteBackup(backup)}
                            loading={deletingBackupId === backup.id}
                            disabled={!isGoogleConnected}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {isParentMode && (
          <Card>
            <CardHeader>
              <CardTitle>Code PIN parent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                {isPinSet
                  ? 'Un code PIN est defini pour le mode parent.'
                  : 'Aucun code PIN defini pour le mode parent.'}
              </p>
              <Button
                variant="danger"
                onClick={() => {
                  setResetPinStatus(null)
                  setConfirmResetPinOpen(true)
                }}
                disabled={!isPinSet}
              >
                Reinitialiser le code PIN
              </Button>
              {resetPinStatus && (
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    resetPinStatus.type === 'success'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {resetPinStatus.message}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isParentMode && (
          <Card>
            <CardHeader>
              <CardTitle>Gestion des donnees</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Gerez vos profils et motifs de transactions.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link to="/settings/profiles">
                  <Button variant="secondary">Gerer les profils</Button>
                </Link>
                <Link to="/settings/motifs">
                  <Button variant="secondary">Gerer les motifs</Button>
                </Link>
                <Link to="/help">
                  <Button variant="ghost">Aide</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {isParentMode && (
          <Card>
            <CardHeader>
              <CardTitle>Importer un backup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                key={fileInputKey}
                type="file"
                label="Fichier JSON"
                accept="application/json"
                onChange={handleFileChange}
                helperText="Selectionnez un fichier de backup genere par l'application."
              />

              {fileName && (
                <p className="text-sm text-gray-600">
                  Fichier selectionne:{' '}
                  <span className="font-medium">{fileName}</span>
                </p>
              )}

              {parseError && (
                <div className="rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm">
                  {parseError}
                </div>
              )}

              {summary && (
                <div className="rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-700 space-y-1">
                  <p>Backup du {formattedExportedAt}</p>
                  <p>{summary.counts.transactions} transactions</p>
                  <p>
                    {summary.counts.profiles} profils, {summary.counts.users} utilisateurs,{' '}
                    {summary.counts.motifs} motifs, {summary.counts.settings} parametres
                  </p>
                </div>
              )}

              <Select
                label="Mode d'import"
                value={importMode}
                onChange={(event) => setImportMode(event.target.value as ImportMode)}
                options={[
                  { value: 'replace', label: 'Remplacer toutes les donnees' },
                  { value: 'merge', label: 'Fusionner avec les donnees existantes' },
                ]}
                helperText="Le mode replace ecrase l'ensemble des donnees locales."
              />

              <Button
                variant={importMode === 'replace' ? 'danger' : 'primary'}
                onClick={() => setConfirmOpen(true)}
                disabled={!pendingPayload || !!parseError}
              >
                Importer
              </Button>

              {importStatus && (
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    importStatus.type === 'success'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {importStatus.message}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {isParentMode && (
        <Dialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title="Confirmer l'import"
          actions={
            <>
              <Button
                variant="ghost"
                onClick={() => setConfirmOpen(false)}
                disabled={isImporting}
              >
                Annuler
              </Button>
              <Button
                variant={importMode === 'replace' ? 'danger' : 'primary'}
                onClick={handleConfirmImport}
                loading={isImporting}
              >
                Importer
              </Button>
            </>
          }
        >
          <div className="space-y-2 text-sm text-gray-600">
            <p>Mode selectionne : {importModeLabel}.</p>
            {summary ? (
              <>
                <p>Backup du {formattedExportedAt}</p>
                <p>{summary.counts.transactions} transactions seront restaurees.</p>
              </>
            ) : (
              <p>Aucune previsualisation disponible.</p>
            )}
            <p>Cette action est irreversible.</p>
          </div>
        </Dialog>
      )}

      {isParentMode && (
        <Dialog
          open={isRestoreDialogOpen}
          onClose={() => {
            setIsRestoreDialogOpen(false)
            setRestorePreview(null)
            setSelectedDriveBackup(null)
          }}
          title="Restaurer un backup Drive"
          actions={
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsRestoreDialogOpen(false)
                  setRestorePreview(null)
                  setSelectedDriveBackup(null)
                }}
                disabled={isRestoring}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmRestore}
                loading={isRestoring}
                disabled={!restorePreview}
              >
                Restaurer
              </Button>
            </>
          }
        >
          <div className="space-y-2 text-sm text-gray-600">
            {selectedDriveBackup ? (
              <p>Backup selectionne : {selectedDriveBackup.name}</p>
            ) : (
              <p>Backup selectionne : -</p>
            )}
            {restorePreview ? (
              <>
                <p>Backup du {formatDateTime(restorePreview.exportedAt)}</p>
                <p>{restorePreview.counts.transactions} transactions seront restaurees.</p>
                <p>
                  {restorePreview.counts.profiles} profils, {restorePreview.counts.users}{' '}
                  utilisateurs, {restorePreview.counts.motifs} motifs,{' '}
                  {restorePreview.counts.settings} parametres
                </p>
              </>
            ) : (
              <p>Aucune previsualisation disponible.</p>
            )}
            <p>Cette action remplace les donnees locales.</p>
          </div>
        </Dialog>
      )}

      {isParentMode && (
        <Dialog
          open={confirmResetPinOpen}
          onClose={() => setConfirmResetPinOpen(false)}
          title="Reinitialiser le code PIN"
          actions={
            <>
              <Button
                variant="ghost"
                onClick={() => setConfirmResetPinOpen(false)}
                disabled={isResettingPin}
              >
                Annuler
              </Button>
              <Button variant="danger" onClick={handleResetPin} loading={isResettingPin}>
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
      )}
    </AppShell>
  )
}
