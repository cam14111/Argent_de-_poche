import { useState } from 'react'
import { Navigate } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { AppShell } from '@/components/layout'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui'
import { Dialog } from '@/components/ui/Dialog'
import { useAuth } from '@/contexts/AuthContext'
import { profileRepository } from '@/db'
import type { Profile } from '@/db/database'

type StatusMessage = { type: 'success' | 'error'; message: string }

export function ProfilesManagement() {
  const { isParentMode } = useAuth()
  const [status, setStatus] = useState<StatusMessage | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const activeProfiles = useLiveQuery(() => profileRepository.getActive(), [])
  const archivedProfiles = useLiveQuery(() => profileRepository.getArchived(), [])

  if (!isParentMode) {
    return <Navigate to="/" />
  }

  const handleArchiveClick = (profile: Profile) => {
    setSelectedProfile(profile)
    setArchiveDialogOpen(true)
    setStatus(null)
  }

  const handleRestoreClick = (profile: Profile) => {
    setSelectedProfile(profile)
    setRestoreDialogOpen(true)
    setStatus(null)
  }

  const handleArchive = async () => {
    if (!selectedProfile?.id) return

    setIsLoading(true)
    try {
      await profileRepository.archive(selectedProfile.id)
      setStatus({ type: 'success', message: 'Profil archive avec succes.' })
      setArchiveDialogOpen(false)
      setSelectedProfile(null)
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : "Erreur lors de l'archivage.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestore = async () => {
    if (!selectedProfile?.id) return

    setIsLoading(true)
    try {
      await profileRepository.restore(selectedProfile.id)
      setStatus({ type: 'success', message: 'Profil restaure avec succes.' })
      setRestoreDialogOpen(false)
      setSelectedProfile(null)
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erreur lors de la restauration.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (date?: Date) => {
    if (!date) return ''
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
    }).format(new Date(date))
  }

  return (
    <AppShell title="Gestion des profils" backTo="/settings">
      <div className="max-w-3xl mx-auto space-y-6">
        {status && (
          <div
            className={`rounded-lg px-3 py-2 text-sm ${
              status.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {status.message}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Profils actifs</CardTitle>
          </CardHeader>
          <CardContent>
            {!activeProfiles || activeProfiles.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun profil actif.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {activeProfiles.map((profile) => (
                  <li
                    key={profile.id}
                    className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                        style={{ backgroundColor: profile.color }}
                      >
                        {profile.icon}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-800">
                          {profile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Cree le {formatDate(profile.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArchiveClick(profile)}
                      disabled={isLoading || activeProfiles.length <= 1}
                    >
                      Archiver
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {activeProfiles && activeProfiles.length === 1 && (
              <p className="text-xs text-amber-600 mt-2">
                Vous devez avoir au moins un profil actif.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profils archives</CardTitle>
          </CardHeader>
          <CardContent>
            {!archivedProfiles || archivedProfiles.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun profil archive.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {archivedProfiles.map((profile) => (
                  <li
                    key={profile.id}
                    className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg opacity-50"
                        style={{ backgroundColor: profile.color }}
                      >
                        {profile.icon}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">
                          {profile.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          Archive le {formatDate(profile.archivedAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRestoreClick(profile)}
                      disabled={isLoading}
                    >
                      Restaurer
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={archiveDialogOpen}
        onClose={() => {
          setArchiveDialogOpen(false)
          setSelectedProfile(null)
        }}
        title="Archiver le profil"
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setArchiveDialogOpen(false)
                setSelectedProfile(null)
              }}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button variant="danger" onClick={handleArchive} loading={isLoading}>
              Archiver
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            Voulez-vous archiver le profil "{selectedProfile?.name}" ?
          </p>
          <p>Les transactions de ce profil seront conservees.</p>
          <p>Le profil n'apparaitra plus dans la liste principale.</p>
          <p>Vous pourrez restaurer ce profil a tout moment.</p>
        </div>
      </Dialog>

      <Dialog
        open={restoreDialogOpen}
        onClose={() => {
          setRestoreDialogOpen(false)
          setSelectedProfile(null)
        }}
        title="Restaurer le profil"
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setRestoreDialogOpen(false)
                setSelectedProfile(null)
              }}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button variant="primary" onClick={handleRestore} loading={isLoading}>
              Restaurer
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            Voulez-vous restaurer le profil "{selectedProfile?.name}" ?
          </p>
          <p>Le profil reapparaitra dans la liste principale avec ses transactions.</p>
        </div>
      </Dialog>
    </AppShell>
  )
}
