import { settingsRepository } from '@/db'
import { GoogleAuthService } from './googleAuth'

export const GOOGLE_DRIVE_FOLDER_KEY = 'google_drive_folder_id'

const DRIVE_BASE_URL = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3'
const DRIVE_FOLDER_NAME = 'ArgentDePoche'
const APP_PROPERTY_KEY = 'app'
const APP_PROPERTY_VALUE = 'argent-de-poche'
const TYPE_PROPERTY_KEY = 'type'
const TYPE_PROPERTY_BACKUP = 'backup'
const TYPE_PROPERTY_FOLDER = 'backup-folder'

export interface DriveFileEntry {
  id: string
  name: string
  size?: number
  createdTime?: string
  modifiedTime?: string
  appProperties?: Record<string, string>
}

export interface DriveUploadRequest {
  name: string
  content: string
  mimeType?: string
  appProperties?: Record<string, string>
  description?: string
}

export class GoogleDriveError extends Error {
  status: number
  reason?: string

  constructor(message: string, status: number, reason?: string) {
    super(message)
    this.name = 'GoogleDriveError'
    this.status = status
    this.reason = reason
  }
}

export interface GoogleDriveAuthProvider {
  getAccessToken: (options?: { interactive?: boolean }) => Promise<string>
}

function buildDriveError(
  status: number,
  payload: unknown,
  fallbackMessage: string
): GoogleDriveError {
  const errorPayload = payload as {
    error?: { message?: string; errors?: Array<{ reason?: string }> }
  }
  const message = errorPayload?.error?.message ?? fallbackMessage
  const reason = errorPayload?.error?.errors?.[0]?.reason
  return new GoogleDriveError(message, status, reason)
}

function parseFileEntry(file: {
  id?: string
  name?: string
  size?: string
  createdTime?: string
  modifiedTime?: string
  appProperties?: Record<string, string>
}): DriveFileEntry {
  return {
    id: file.id ?? '',
    name: file.name ?? '',
    size: file.size ? Number(file.size) : undefined,
    createdTime: file.createdTime,
    modifiedTime: file.modifiedTime,
    appProperties: file.appProperties,
  }
}

export class GoogleDriveService {
  constructor(private auth: GoogleDriveAuthProvider = GoogleAuthService) {}

  async clearCachedFolder(): Promise<void> {
    await settingsRepository.delete(GOOGLE_DRIVE_FOLDER_KEY)
  }

  private async fetchWithAuth(
    url: string,
    options: RequestInit,
    interactive = true
  ): Promise<Response> {
    const token = await this.auth.getAccessToken({ interactive })
    const headers = new Headers(options.headers)
    headers.set('Authorization', `Bearer ${token}`)
    return await fetch(url, { ...options, headers })
  }

  private async requestJson<T>(
    url: string,
    options: RequestInit,
    interactive = true
  ): Promise<T> {
    const response = await this.fetchWithAuth(url, options, interactive)
    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      throw buildDriveError(response.status, payload, 'Erreur Google Drive.')
    }
    return (await response.json()) as T
  }

  private async requestText(
    url: string,
    options: RequestInit,
    interactive = true
  ): Promise<string> {
    const response = await this.fetchWithAuth(url, options, interactive)
    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      throw buildDriveError(response.status, payload, 'Erreur Google Drive.')
    }
    return await response.text()
  }

  private async ensureFolderId(): Promise<string> {
    const cached = await settingsRepository.get(GOOGLE_DRIVE_FOLDER_KEY)
    if (cached) return cached

    // 1. Chercher d'abord les dossiers partagés (mode member/enfant)
    // IMPORTANT: Ne pas filtrer par appProperties car elles sont privées au propriétaire
    // et invisibles pour les utilisateurs avec qui le dossier est partagé
    const sharedQuery = [
      "mimeType='application/vnd.google-apps.folder'",
      "trashed=false",
      `name='${DRIVE_FOLDER_NAME}'`,
      "sharedWithMe=true",
    ].join(' and ')
    const sharedUrl = `${DRIVE_BASE_URL}/files?q=${encodeURIComponent(
      sharedQuery
    )}&fields=files(id,name,ownedByMe)&orderBy=modifiedTime desc`

    const sharedResponse = await this.requestJson<{ files?: Array<{ id?: string; ownedByMe?: boolean }> }>(
      sharedUrl,
      { method: 'GET' }
    )

    // Si un dossier partagé existe et n'est pas possédé par l'utilisateur, l'utiliser
    const sharedFolder = sharedResponse.files?.find(f => f.ownedByMe === false)
    if (sharedFolder?.id) {
      console.log('[GoogleDrive] Using shared folder:', sharedFolder.id)
      await settingsRepository.set(GOOGLE_DRIVE_FOLDER_KEY, sharedFolder.id)
      return sharedFolder.id
    }

    // 2. Sinon, chercher dans "My Drive" (mode owner/parent)
    const ownedQuery = [
      "mimeType='application/vnd.google-apps.folder'",
      "trashed=false",
      `name='${DRIVE_FOLDER_NAME}'`,
      `appProperties has { key='${APP_PROPERTY_KEY}' and value='${APP_PROPERTY_VALUE}' }`,
      `appProperties has { key='${TYPE_PROPERTY_KEY}' and value='${TYPE_PROPERTY_FOLDER}' }`,
    ].join(' and ')
    const ownedUrl = `${DRIVE_BASE_URL}/files?q=${encodeURIComponent(
      ownedQuery
    )}&fields=files(id,name)`

    const ownedResponse = await this.requestJson<{ files?: Array<{ id?: string }> }>(
      ownedUrl,
      { method: 'GET' }
    )

    const ownedId = ownedResponse.files?.[0]?.id
    if (ownedId) {
      console.log('[GoogleDrive] Using owned folder:', ownedId)
      await settingsRepository.set(GOOGLE_DRIVE_FOLDER_KEY, ownedId)
      return ownedId
    }

    // 3. Créer un nouveau dossier (premier usage, mode owner)
    console.log('[GoogleDrive] Creating new folder')
    const createUrl = `${DRIVE_BASE_URL}/files`
    const metadata = {
      name: DRIVE_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      appProperties: {
        [APP_PROPERTY_KEY]: APP_PROPERTY_VALUE,
        [TYPE_PROPERTY_KEY]: TYPE_PROPERTY_FOLDER,
      },
    }
    const createResponse = await this.requestJson<{ id: string }>(createUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata),
    })

    await settingsRepository.set(GOOGLE_DRIVE_FOLDER_KEY, createResponse.id)
    return createResponse.id
  }

  async listBackupFiles(): Promise<DriveFileEntry[]> {
    const folderId = await this.ensureFolderId()
    // Ne pas filtrer par appProperties car elles sont invisibles pour les membres (enfants)
    // Filtrer par nom de fichier à la place
    const query = [
      `'${folderId}' in parents`,
      'trashed=false',
    ].join(' and ')

    const fields =
      'files(id,name,size,createdTime,modifiedTime,appProperties)'
    const listUrl = `${DRIVE_BASE_URL}/files?q=${encodeURIComponent(
      query
    )}&fields=${encodeURIComponent(fields)}`

    const response = await this.requestJson<{ files?: Array<Record<string, any>> }>(
      listUrl,
      { method: 'GET' }
    )

    // Filtrer côté client par nom de fichier (pattern backup)
    const allFiles = (response.files ?? []).map(parseFileEntry)
    return allFiles.filter(f => f.name.startsWith('argent-de-poche-backup'))
  }

  /**
   * Liste tous les fichiers du dossier ArgentDePoche (sans filtrer par type)
   * Utilisé pour trouver SHARED_FOLDER_INFO.json et autres fichiers non-backup
   */
  async listAllFiles(): Promise<DriveFileEntry[]> {
    const folderId = await this.ensureFolderId()
    // Ne pas filtrer par appProperties car elles sont invisibles pour les membres (enfants)
    const query = [
      `'${folderId}' in parents`,
      'trashed=false',
    ].join(' and ')

    const fields =
      'files(id,name,size,createdTime,modifiedTime,appProperties)'
    const listUrl = `${DRIVE_BASE_URL}/files?q=${encodeURIComponent(
      query
    )}&fields=${encodeURIComponent(fields)}`

    const response = await this.requestJson<{ files?: Array<Record<string, any>> }>(
      listUrl,
      { method: 'GET' }
    )

    return (response.files ?? []).map(parseFileEntry)
  }

  async listFiles(): Promise<DriveFileEntry[]> {
    return await this.listBackupFiles()
  }

  async uploadFile(request: DriveUploadRequest): Promise<DriveFileEntry> {
    const folderId = await this.ensureFolderId()
    const boundary = `adp-${Math.random().toString(16).slice(2)}`
    const mimeType = request.mimeType ?? 'application/json'

    const metadata = {
      name: request.name,
      parents: [folderId],
      mimeType,
      description: request.description,
      appProperties: {
        [APP_PROPERTY_KEY]: APP_PROPERTY_VALUE,
        [TYPE_PROPERTY_KEY]: TYPE_PROPERTY_BACKUP,
        ...request.appProperties,
      },
    }

    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify(metadata),
      `--${boundary}`,
      `Content-Type: ${mimeType}`,
      '',
      request.content,
      `--${boundary}--`,
      '',
    ].join('\r\n')

    const uploadUrl = `${DRIVE_UPLOAD_URL}/files?uploadType=multipart&fields=id,name,size,createdTime,modifiedTime,appProperties`
    const response = await this.requestJson<Record<string, any>>(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    })

    return parseFileEntry(response)
  }

  async downloadFile(fileId: string): Promise<string> {
    const url = `${DRIVE_BASE_URL}/files/${fileId}?alt=media`
    return await this.requestText(url, { method: 'GET' })
  }

  async deleteFile(fileId: string): Promise<void> {
    const url = `${DRIVE_BASE_URL}/files/${fileId}`
    const response = await this.fetchWithAuth(url, { method: 'DELETE' })
    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      throw buildDriveError(response.status, payload, 'Erreur Google Drive.')
    }
  }
}
