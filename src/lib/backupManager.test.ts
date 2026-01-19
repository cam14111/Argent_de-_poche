import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/db'
import { settingsRepository } from '@/db'
import { BackupManager, GOOGLE_DRIVE_LAST_BACKUP_KEY } from './backupManager'

const payload = {
  schemaVersion: 1,
  exportedAt: '2025-01-01T10:00:00.000Z',
  data: {
    profiles: [],
    users: [],
    transactions: [],
    motifs: [],
    settings: [],
  },
}

beforeEach(async () => {
  db.close()
  await db.delete()
  await db.open()
})

afterEach(() => {
  db.close()
  vi.useRealTimers()
})

describe('BackupManager', () => {
  it('creates a Drive backup and stores last backup date', async () => {
    const driveService = {
      uploadFile: vi.fn().mockResolvedValue({
        id: 'file-1',
        name: 'backup.json',
        size: 120,
        createdTime: '2025-01-01T10:00:00.000Z',
        appProperties: {
          exportedAt: payload.exportedAt,
          schemaVersion: '1',
        },
      }),
      listBackupFiles: vi.fn(),
      downloadFile: vi.fn(),
      clearCachedFolder: vi.fn(),
    }

    const exporter = {
      exportPayload: vi.fn().mockResolvedValue(payload),
    }

    const importer = {
      parse: vi.fn().mockReturnValue(payload),
      importPayload: vi.fn().mockResolvedValue(undefined),
    }

    const manager = new BackupManager({
      driveService: driveService as any,
      exporter: exporter as any,
      importer: importer as any,
    })

    const backup = await manager.backup()

    expect(backup.id).toBe('file-1')
    expect(driveService.uploadFile).toHaveBeenCalled()
    const stored = await settingsRepository.get(GOOGLE_DRIVE_LAST_BACKUP_KEY)
    expect(stored).toBe(payload.exportedAt)
  })

  it('restores data from Drive backup', async () => {
    const driveService = {
      uploadFile: vi.fn(),
      listBackupFiles: vi.fn(),
      downloadFile: vi.fn().mockResolvedValue(JSON.stringify(payload)),
      clearCachedFolder: vi.fn(),
    }

    const exporter = {
      exportPayload: vi.fn().mockResolvedValue(payload),
    }

    const importer = {
      parse: vi.fn().mockReturnValue(payload),
      importPayload: vi.fn().mockResolvedValue(undefined),
    }

    const manager = new BackupManager({
      driveService: driveService as any,
      exporter: exporter as any,
      importer: importer as any,
    })

    await manager.restore('file-1', 'replace')

    expect(driveService.downloadFile).toHaveBeenCalledWith('file-1')
    expect(importer.importPayload).toHaveBeenCalledWith(payload, 'replace')
  })

  it('retries transient network errors when uploading', async () => {
    vi.useFakeTimers()
    const driveService = {
      uploadFile: vi
        .fn()
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce({
          id: 'file-2',
          name: 'backup.json',
          size: 120,
          createdTime: '2025-01-01T10:00:00.000Z',
          appProperties: {
            exportedAt: payload.exportedAt,
            schemaVersion: '1',
          },
        }),
      listBackupFiles: vi.fn(),
      downloadFile: vi.fn(),
      clearCachedFolder: vi.fn(),
    }

    const exporter = {
      exportPayload: vi.fn().mockResolvedValue(payload),
    }

    const manager = new BackupManager({
      driveService: driveService as any,
      exporter: exporter as any,
    })

    const promise = manager.backup()
    await vi.runAllTimersAsync()
    await promise

    expect(driveService.uploadFile).toHaveBeenCalledTimes(2)
  })
})
