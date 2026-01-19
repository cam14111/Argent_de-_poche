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
      if (!session || !session.profile) {
        return 'none'
      }

      const userEmail = session.profile.email

      // Chercher le fichier SHARED_FOLDER_INFO.json
      const info = await this.getSharedFolderInfo()

      if (!info) {
        // Pas de fichier info trouvé, l'utilisateur sera owner
        return 'owner'
      }

      // Comparer l'email de l'utilisateur avec l'owner
      if (info.ownerId === userEmail) {
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
   * Récupère les informations du dossier partagé
   */
  async getSharedFolderInfo(): Promise<SharedFolderInfo | null> {
    try {
      // Lister TOUS les fichiers dans le dossier ArgentDePoche (pas seulement les backups)
      const files = await this.drive.listAllFiles()

      // Chercher SHARED_FOLDER_INFO.json
      const infoFile = files.find(
        (f) => f.name === SHARED_FOLDER_INFO_FILENAME
      )

      if (!infoFile) {
        return null
      }

      // Télécharger et parser le fichier
      const content = await this.drive.downloadFile(infoFile.id)
      const info = JSON.parse(content) as SharedFolderInfo

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
        ownerId: ownerEmail,
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
   * Récupère l'email du propriétaire
   */
  async getOwnerId(): Promise<string | null> {
    const info = await this.getSharedFolderInfo()
    return info?.ownerId ?? null
  }
}
