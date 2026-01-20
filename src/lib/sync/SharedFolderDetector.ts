/**
 * Service de détection du dossier partagé entre appareils
 * Détermine si l'utilisateur est le propriétaire (owner) ou rejoint un dossier existant (member)
 */

import { GoogleDriveService } from '../googleDrive'
import { GoogleAuthService } from '../googleAuth'
import type { SharedFolderInfo, SyncMode } from './types'

const SHARED_FOLDER_INFO_FILENAME = 'SHARED_FOLDER_INFO.json'

/**
 * Erreur de détection de dossier partagé
 */
export class SharedFolderError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SharedFolderError'
  }
}

/**
 * Service de détection de dossier partagé
 */
export class SharedFolderDetector {
  constructor(
    private drive: GoogleDriveService = new GoogleDriveService(),
    private auth = GoogleAuthService
  ) {}

  /**
   * Détecte le mode de synchronisation (owner/member/none)
   */
  async detectMode(): Promise<SyncMode> {
    try {
      // Vérifier si l'utilisateur est connecté
      const session = await this.auth.getSession()
      if (!session || !session.profile || !session.profile.email) {
        return 'none'
      }

      const userEmail = session.profile.email

      // Chercher le fichier SHARED_FOLDER_INFO.json
      const info = await this.getSharedFolderInfo()

      if (!info) {
        // Pas de fichier info trouvé, l'utilisateur sera owner
        return 'owner'
      }

      // Vérifier si l'utilisateur est dans la liste des owners (parents)
      if (this.isOwner(info, userEmail)) {
        return 'owner'
      } else {
        return 'member'
      }
    } catch (error) {
      console.error('[SharedFolderDetector] Error detecting mode:', error)
      return 'none'
    }
  }

  /**
   * Vérifie si un email est dans la liste des owners
   * Gère la rétrocompatibilité avec l'ancien format (ownerId seul)
   */
  private isOwner(info: SharedFolderInfo, email: string): boolean {
    // Nouveau format: vérifier dans ownerIds
    if (info.ownerIds && info.ownerIds.length > 0) {
      return info.ownerIds.includes(email)
    }
    // Ancien format: vérifier ownerId (rétrocompatibilité)
    if (info.ownerId) {
      return info.ownerId === email
    }
    return false
  }

  /**
   * Récupère les informations du dossier partagé
   */
  async getSharedFolderInfo(): Promise<SharedFolderInfo | null> {
    try {
      // Lister TOUS les fichiers dans le dossier ArgentDePoche (pas seulement les backups)
      const files = await this.drive.listAllFiles()
      console.log('[SharedFolderDetector] All files in folder:', files.map(f => f.name))

      // Chercher SHARED_FOLDER_INFO.json
      const infoFile = files.find(
        (f) => f.name === SHARED_FOLDER_INFO_FILENAME
      )

      if (!infoFile) {
        console.log('[SharedFolderDetector] SHARED_FOLDER_INFO.json not found')
        return null
      }

      // Télécharger et parser le fichier
      const content = await this.drive.downloadFile(infoFile.id)
      const info = JSON.parse(content) as SharedFolderInfo
      console.log('[SharedFolderDetector] Loaded folder info:', info)

      return info
    } catch (error) {
      console.error('[SharedFolderDetector] Error getting folder info:', error)
      return null
    }
  }

  /**
   * Crée le fichier SHARED_FOLDER_INFO.json pour marquer le dossier comme partagé
   */
  async createSharedFolderInfo(ownerEmail: string): Promise<void> {
    try {
      const info: SharedFolderInfo = {
        ownerIds: [ownerEmail],
        createdAt: new Date().toISOString(),
        appVersion: '1.0.0', // TODO: Récupérer depuis package.json
        sharedMode: true,
      }

      // Upload le fichier
      await this.drive.uploadFile({
        name: SHARED_FOLDER_INFO_FILENAME,
        content: JSON.stringify(info, null, 2),
        mimeType: 'application/json',
        appProperties: {
          type: 'shared-folder-info',
        },
      })

      console.log(
        '[SharedFolderDetector] Created SHARED_FOLDER_INFO.json',
        info
      )
    } catch (error) {
      console.error(
        '[SharedFolderDetector] Error creating folder info:',
        error
      )
      throw new SharedFolderError(
        'Impossible de créer le fichier de partage'
      )
    }
  }

  /**
   * Initialise le dossier partagé si nécessaire
   */
  async initializeIfNeeded(): Promise<SyncMode> {
    const mode = await this.detectMode()

    if (mode === 'owner') {
      // Vérifier si le fichier info existe déjà
      const info = await this.getSharedFolderInfo()

      if (!info) {
        // Créer le fichier info
        const session = await this.auth.getSession()
        if (session && session.profile && session.profile.email) {
          await this.createSharedFolderInfo(session.profile.email)
        }
      } else {
        // Migrer vers le nouveau format si nécessaire
        await this.migrateToOwnerIds()
      }
    }

    return mode
  }

  /**
   * Vérifie si le dossier est partagé
   */
  async isShared(): Promise<boolean> {
    const info = await this.getSharedFolderInfo()
    return info !== null && info.sharedMode === true
  }

  /**
   * Récupère l'email du propriétaire principal (premier owner)
   * @deprecated Utiliser getOwnerIds() pour obtenir tous les owners
   */
  async getOwnerId(): Promise<string | null> {
    const info = await this.getSharedFolderInfo()
    if (!info) return null
    // Nouveau format
    if (info.ownerIds && info.ownerIds.length > 0) {
      return info.ownerIds[0]
    }
    // Ancien format (rétrocompatibilité)
    return info.ownerId ?? null
  }

  /**
   * Récupère la liste des emails des owners (parents)
   */
  async getOwnerIds(): Promise<string[]> {
    const info = await this.getSharedFolderInfo()
    if (!info) return []
    // Nouveau format
    if (info.ownerIds && info.ownerIds.length > 0) {
      return info.ownerIds
    }
    // Ancien format (rétrocompatibilité)
    if (info.ownerId) {
      return [info.ownerId]
    }
    return []
  }

  /**
   * Ajoute un co-parent (owner) au dossier partagé
   * Seul un owner existant peut ajouter un autre owner
   */
  async addOwner(newOwnerEmail: string): Promise<void> {
    const session = await this.auth.getSession()
    if (!session || !session.profile || !session.profile.email) {
      throw new SharedFolderError('Non connecté')
    }

    const currentUserEmail = session.profile.email
    const info = await this.getSharedFolderInfo()

    if (!info) {
      throw new SharedFolderError('Aucun dossier partagé trouvé')
    }

    // Vérifier que l'utilisateur actuel est un owner
    if (!this.isOwner(info, currentUserEmail)) {
      throw new SharedFolderError('Seul un parent peut ajouter un autre parent')
    }

    // Normaliser l'email
    const normalizedEmail = newOwnerEmail.toLowerCase().trim()

    // Construire la nouvelle liste des owners
    let ownerIds: string[] = []
    if (info.ownerIds && info.ownerIds.length > 0) {
      ownerIds = [...info.ownerIds]
    } else if (info.ownerId) {
      // Migration depuis l'ancien format
      ownerIds = [info.ownerId]
    }

    // Vérifier que l'email n'est pas déjà dans la liste
    if (ownerIds.includes(normalizedEmail)) {
      console.log('[SharedFolderDetector] Owner already exists:', normalizedEmail)
      return
    }

    // Ajouter le nouvel owner
    ownerIds.push(normalizedEmail)

    // Mettre à jour le fichier
    const updatedInfo: SharedFolderInfo = {
      ownerIds,
      createdAt: info.createdAt,
      appVersion: info.appVersion,
      sharedMode: true,
    }

    await this.updateSharedFolderInfo(updatedInfo)
    console.log('[SharedFolderDetector] Added new owner:', normalizedEmail)
  }

  /**
   * Retire un co-parent (owner) du dossier partagé
   * Le premier owner (créateur) ne peut pas être retiré
   */
  async removeOwner(ownerEmailToRemove: string): Promise<void> {
    const session = await this.auth.getSession()
    if (!session || !session.profile || !session.profile.email) {
      throw new SharedFolderError('Non connecté')
    }

    const currentUserEmail = session.profile.email
    const info = await this.getSharedFolderInfo()

    if (!info) {
      throw new SharedFolderError('Aucun dossier partagé trouvé')
    }

    // Vérifier que l'utilisateur actuel est un owner
    if (!this.isOwner(info, currentUserEmail)) {
      throw new SharedFolderError('Seul un parent peut retirer un autre parent')
    }

    // Construire la liste des owners
    let ownerIds: string[] = info.ownerIds && info.ownerIds.length > 0
      ? [...info.ownerIds]
      : info.ownerId ? [info.ownerId] : []

    // Ne pas permettre de retirer le premier owner (créateur)
    if (ownerIds.length > 0 && ownerIds[0].toLowerCase() === ownerEmailToRemove.toLowerCase()) {
      throw new SharedFolderError('Impossible de retirer le créateur du dossier')
    }

    // Retirer l'owner
    const normalizedEmail = ownerEmailToRemove.toLowerCase().trim()
    ownerIds = ownerIds.filter(e => e.toLowerCase() !== normalizedEmail)

    // Mettre à jour le fichier
    const updatedInfo: SharedFolderInfo = {
      ownerIds,
      createdAt: info.createdAt,
      appVersion: info.appVersion,
      sharedMode: true,
    }

    await this.updateSharedFolderInfo(updatedInfo)
    console.log('[SharedFolderDetector] Removed owner:', normalizedEmail)
  }

  /**
   * Met à jour le fichier SHARED_FOLDER_INFO.json
   */
  private async updateSharedFolderInfo(info: SharedFolderInfo): Promise<void> {
    try {
      // Trouver le fichier existant pour obtenir son ID
      const files = await this.drive.listAllFiles()
      const existingFile = files.find(f => f.name === SHARED_FOLDER_INFO_FILENAME)

      if (existingFile) {
        // Mettre à jour le fichier existant
        await this.drive.updateFile(existingFile.id, {
          content: JSON.stringify(info, null, 2),
        })
      } else {
        // Créer un nouveau fichier
        await this.drive.uploadFile({
          name: SHARED_FOLDER_INFO_FILENAME,
          content: JSON.stringify(info, null, 2),
          mimeType: 'application/json',
          appProperties: {
            type: 'shared-folder-info',
          },
        })
      }

      console.log('[SharedFolderDetector] Updated SHARED_FOLDER_INFO.json', info)
    } catch (error) {
      console.error('[SharedFolderDetector] Error updating folder info:', error)
      throw new SharedFolderError('Impossible de mettre à jour le fichier de partage')
    }
  }

  /**
   * Vérifie l'éligibilité d'un utilisateur à être parent
   * Méthode helper sans effets de bord pour la vérification d'autorisation
   * @returns 'owner' si dans ownerIds, 'first_user' si pas de SHARED_FOLDER_INFO, 'member' sinon, 'not_connected' si pas connecté
   */
  async checkParentEligibility(): Promise<'owner' | 'first_user' | 'member' | 'not_connected'> {
    try {
      // Vérifier si l'utilisateur est connecté
      const session = await this.auth.getSession()
      if (!session || !session.profile || !session.profile.email) {
        return 'not_connected'
      }

      const userEmail = session.profile.email

      // Chercher le fichier SHARED_FOLDER_INFO.json
      const info = await this.getSharedFolderInfo()

      if (!info) {
        // Pas de fichier info trouvé, l'utilisateur sera le premier (owner)
        return 'first_user'
      }

      // Vérifier si l'utilisateur est dans la liste des owners (parents)
      if (this.isOwner(info, userEmail)) {
        return 'owner'
      }

      return 'member'
    } catch (error) {
      console.error('[SharedFolderDetector] Error checking parent eligibility:', error)
      // En cas d'erreur réseau, retourner not_connected pour forcer une nouvelle tentative
      return 'not_connected'
    }
  }

  /**
   * Migre l'ancien format (ownerId) vers le nouveau format (ownerIds)
   * Appelée automatiquement lors de l'initialisation si nécessaire
   */
  async migrateToOwnerIds(): Promise<boolean> {
    const info = await this.getSharedFolderInfo()
    if (!info) return false

    // Déjà au nouveau format
    if (info.ownerIds && info.ownerIds.length > 0) {
      return false
    }

    // Migration nécessaire
    if (info.ownerId) {
      const updatedInfo: SharedFolderInfo = {
        ownerIds: [info.ownerId],
        createdAt: info.createdAt,
        appVersion: info.appVersion,
        sharedMode: info.sharedMode,
      }

      await this.updateSharedFolderInfo(updatedInfo)
      console.log('[SharedFolderDetector] Migrated ownerId to ownerIds')
      return true
    }

    return false
  }
}
