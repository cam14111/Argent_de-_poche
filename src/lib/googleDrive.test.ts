import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/db'
import { settingsRepository } from '@/db'
import {
  GOOGLE_DRIVE_FOLDER_KEY,
  GoogleDriveError,
  GoogleDriveService,
} from './googleDrive'

const authProvider = {
  getAccessToken: vi.fn().mockResolvedValue('test-token'),
}

function buildJsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response
}

beforeEach(async () => {
  db.close()
  await db.delete()
  await db.open()
  authProvider.getAccessToken.mockClear()
})

afterEach(() => {
  db.close()
  vi.restoreAllMocks()
  delete (globalThis as any).fetch
})

describe('GoogleDriveService', () => {
  it('lists backup files from Drive', async () => {
    await settingsRepository.set(GOOGLE_DRIVE_FOLDER_KEY, 'folder-123')

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        buildJsonResponse({
          files: [
            {
              id: 'file-1',
              name: 'backup.json',
              size: '512',
              createdTime: '2025-01-01T10:00:00.000Z',
              appProperties: {
                exportedAt: '2025-01-01T10:00:00.000Z',
                schemaVersion: '1',
              },
            },
          ],
        })
      )

    globalThis.fetch = fetchMock as any

    const service = new GoogleDriveService(authProvider)
    const files = await service.listBackupFiles()

    expect(files).toHaveLength(1)
    expect(files[0].id).toBe('file-1')
    expect(files[0].size).toBe(512)
    expect(fetchMock).toHaveBeenCalled()
  })

  it('uploads backup files to Drive', async () => {
    await settingsRepository.set(GOOGLE_DRIVE_FOLDER_KEY, 'folder-123')

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        buildJsonResponse({
          id: 'file-2',
          name: 'backup.json',
          size: '128',
          createdTime: '2025-01-01T11:00:00.000Z',
        })
      )

    globalThis.fetch = fetchMock as any

    const service = new GoogleDriveService(authProvider)
    const file = await service.uploadFile({
      name: 'backup.json',
      content: '{"ok":true}',
      appProperties: { exportedAt: '2025-01-01T11:00:00.000Z' },
    })

    expect(file.id).toBe('file-2')
    expect(fetchMock).toHaveBeenCalled()
    const request = fetchMock.mock.calls[0]
    expect(request[0]).toContain('/upload/drive/v3/files')
    const options = request[1] as RequestInit
    expect(options.headers).toBeDefined()
  })

  it('downloads backup files from Drive', async () => {
    await settingsRepository.set(GOOGLE_DRIVE_FOLDER_KEY, 'folder-123')

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '{"data":"ok"}',
    })

    globalThis.fetch = fetchMock as any

    const service = new GoogleDriveService(authProvider)
    const content = await service.downloadFile('file-3')

    expect(content).toBe('{"data":"ok"}')
  })

  it('maps Drive API errors with reasons', async () => {
    await settingsRepository.set(GOOGLE_DRIVE_FOLDER_KEY, 'folder-123')

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        buildJsonResponse(
          {
            error: {
              message: 'Quota exceeded',
              errors: [{ reason: 'quotaExceeded' }],
            },
          },
          false,
          403
        )
      )

    globalThis.fetch = fetchMock as any

    const service = new GoogleDriveService(authProvider)

    const promise = service.listBackupFiles()
    await expect(promise).rejects.toBeInstanceOf(GoogleDriveError)
    await expect(promise).rejects.toMatchObject({ reason: 'quotaExceeded' })
  })

  it('surfaces permission errors', async () => {
    await settingsRepository.set(GOOGLE_DRIVE_FOLDER_KEY, 'folder-123')

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        buildJsonResponse(
          {
            error: {
              message: 'Insufficient permissions',
              errors: [{ reason: 'insufficientPermissions' }],
            },
          },
          false,
          403
        )
      )

    globalThis.fetch = fetchMock as any

    const service = new GoogleDriveService(authProvider)

    const promise = service.listBackupFiles()
    await expect(promise).rejects.toBeInstanceOf(GoogleDriveError)
    await expect(promise).rejects.toMatchObject({ reason: 'insufficientPermissions' })
  })
})
