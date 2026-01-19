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
  Input,
} from '@/components/ui'
import { Dialog } from '@/components/ui/Dialog'
import { useAuth } from '@/contexts/AuthContext'
import { motifRepository } from '@/db'
import type { Motif } from '@/db/database'

type StatusMessage = { type: 'success' | 'error'; message: string }

export function MotifsManagement() {
  const { isParentMode } = useAuth()
  const [status, setStatus] = useState<StatusMessage | null>(null)
  const [selectedMotif, setSelectedMotif] = useState<Motif | null>(null)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const activeMotifs = useLiveQuery(() => motifRepository.getActive(), [])
  const archivedMotifs = useLiveQuery(() => motifRepository.getArchived(), [])

  if (!isParentMode) {
    return <Navigate to="/" />
  }

  const handleRenameClick = (motif: Motif) => {
    setSelectedMotif(motif)
    setNewLabel(motif.label)
    setRenameDialogOpen(true)
    setStatus(null)
  }

  const handleArchiveClick = (motif: Motif) => {
    setSelectedMotif(motif)
    setArchiveDialogOpen(true)
    setStatus(null)
  }

  const handleRename = async () => {
    if (!selectedMotif?.id || !newLabel.trim()) return

    setIsLoading(true)
    try {
      await motifRepository.rename(selectedMotif.id, newLabel.trim())
      setStatus({ type: 'success', message: 'Motif renomme avec succes.' })
      setRenameDialogOpen(false)
      setSelectedMotif(null)
      setNewLabel('')
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erreur lors du renommage.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!selectedMotif?.id) return

    setIsLoading(true)
    try {
      await motifRepository.archive(selectedMotif.id)
      setStatus({ type: 'success', message: 'Motif archive avec succes.' })
      setArchiveDialogOpen(false)
      setSelectedMotif(null)
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : "Erreur lors de l'archivage.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestore = async (motif: Motif) => {
    if (!motif.id) return

    setIsLoading(true)
    setStatus(null)
    try {
      await motifRepository.restore(motif.id)
      setStatus({ type: 'success', message: 'Motif restaure avec succes.' })
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erreur lors de la restauration.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeLabel = (type: Motif['type']) => {
    switch (type) {
      case 'CREDIT':
        return 'Credit'
      case 'DEBIT':
        return 'Debit'
      case 'BOTH':
        return 'Les deux'
      default:
        return type
    }
  }

  return (
    <AppShell title="Gestion des motifs" backTo="/settings">
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
            <CardTitle>Motifs actifs</CardTitle>
          </CardHeader>
          <CardContent>
            {!activeMotifs || activeMotifs.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun motif actif.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {activeMotifs.map((motif) => (
                  <li
                    key={motif.id}
                    className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-800">
                        {motif.icon} {motif.label}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getTypeLabel(motif.type)}
                        {motif.isDefault && ' - Motif systeme'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRenameClick(motif)}
                        disabled={isLoading}
                      >
                        Renommer
                      </Button>
                      {!motif.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchiveClick(motif)}
                          disabled={isLoading}
                        >
                          Archiver
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Motifs archives</CardTitle>
          </CardHeader>
          <CardContent>
            {!archivedMotifs || archivedMotifs.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun motif archive.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {archivedMotifs.map((motif) => (
                  <li
                    key={motif.id}
                    className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">
                        {motif.icon} {motif.label}
                      </p>
                      <p className="text-xs text-gray-400">
                        {getTypeLabel(motif.type)} - Archive le{' '}
                        {motif.archivedAt
                          ? new Intl.DateTimeFormat('fr-FR', {
                              dateStyle: 'short',
                            }).format(new Date(motif.archivedAt))
                          : ''}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRestore(motif)}
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
        open={renameDialogOpen}
        onClose={() => {
          setRenameDialogOpen(false)
          setSelectedMotif(null)
          setNewLabel('')
        }}
        title="Renommer le motif"
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setRenameDialogOpen(false)
                setSelectedMotif(null)
                setNewLabel('')
              }}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleRename}
              loading={isLoading}
              disabled={!newLabel.trim() || newLabel.trim() === selectedMotif?.label}
            >
              Renommer
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Motif actuel : {selectedMotif?.icon} {selectedMotif?.label}
          </p>
          <Input
            label="Nouveau libelle"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            disabled={isLoading}
            autoFocus
          />
        </div>
      </Dialog>

      <Dialog
        open={archiveDialogOpen}
        onClose={() => {
          setArchiveDialogOpen(false)
          setSelectedMotif(null)
        }}
        title="Archiver le motif"
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setArchiveDialogOpen(false)
                setSelectedMotif(null)
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
            Voulez-vous archiver le motif "{selectedMotif?.icon} {selectedMotif?.label}" ?
          </p>
          <p>Les transactions existantes conserveront ce motif.</p>
          <p>Vous pourrez restaurer ce motif a tout moment.</p>
        </div>
      </Dialog>
    </AppShell>
  )
}
