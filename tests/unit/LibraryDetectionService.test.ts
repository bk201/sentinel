import { describe, it, expect, beforeEach } from 'vitest'
import { LibraryDetectionService } from '../../src/services/LibraryDetectionService'

// Mock FileSystemDirectoryHandle
class MockFileSystemDirectoryHandle {
  name: string
  kind: string = 'directory'
  private entries: Map<string, MockFileSystemDirectoryHandle | MockFileSystemFileHandle>

  constructor(nameOrEntries?: string | Map<string, MockFileSystemDirectoryHandle | MockFileSystemFileHandle>, entries?: Map<string, MockFileSystemDirectoryHandle | MockFileSystemFileHandle>) {
    if (typeof nameOrEntries === 'string') {
      this.name = nameOrEntries
      this.entries = entries || new Map()
    } else {
      this.name = 'root'
      this.entries = nameOrEntries || new Map()
    }
  }

  async *values() {
    for (const entry of this.entries.values()) {
      yield entry
    }
  }

  async getDirectoryHandle(name: string) {
    const entry = this.entries.get(name)
    if (!entry) {
      throw new Error(`Directory not found: ${name}`)
    }
    if (!(entry instanceof MockFileSystemDirectoryHandle)) {
      throw new Error(`Not a directory: ${name}`)
    }
    return entry
  }
}

class MockFileSystemFileHandle {
  name: string
  kind: string = 'file'
  
  constructor(name: string) {
    this.name = name
  }
}

describe('LibraryDetectionService', () => {
  let service: LibraryDetectionService

  beforeEach(() => {
    service = new LibraryDetectionService()
  })

  describe('isTeslaVideoFilename', () => {
    it('should validate correct Tesla video filenames', () => {
      expect(service['isTeslaVideoFilename']('2025-10-27_14-30-25-front.mp4')).toBe(true)
      expect(service['isTeslaVideoFilename']('2025-10-27_14-30-25-back.mp4')).toBe(true)
      expect(service['isTeslaVideoFilename']('2025-10-27_14-30-25-left_repeater.mp4')).toBe(true)
      expect(service['isTeslaVideoFilename']('2025-10-27_14-30-25-right_repeater.mp4')).toBe(true)
    })

    it('should reject invalid filenames', () => {
      expect(service['isTeslaVideoFilename']('random.mp4')).toBe(false)
      expect(service['isTeslaVideoFilename']('2025-10-27.mp4')).toBe(false)
      expect(service['isTeslaVideoFilename']('video.avi')).toBe(false)
      expect(service['isTeslaVideoFilename']('2025-10-27_14-30-25.mp4')).toBe(false) // missing camera
    })

    it('should reject non-mp4 extensions', () => {
      expect(service['isTeslaVideoFilename']('2025-10-27_14-30-25-front.avi')).toBe(false)
      expect(service['isTeslaVideoFilename']('2025-10-27_14-30-25-front.mov')).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(service['isTeslaVideoFilename']('')).toBe(false)
      expect(service['isTeslaVideoFilename']('2025-10-27_14-30-25-unknown.mp4')).toBe(false)
    })
  })

  describe('validateDirectory - root directory mode', () => {
    it('should detect valid root directory with all three categories', async () => {
      const mockRoot = new MockFileSystemDirectoryHandle(new Map([
        ['RecentClips', new MockFileSystemDirectoryHandle('RecentClips')],
        ['SavedClips', new MockFileSystemDirectoryHandle('SavedClips')],
        ['SentryClips', new MockFileSystemDirectoryHandle('SentryClips')]
      ]))

      const result = await service.validateDirectory(mockRoot as any)

      expect(result.isRootDirectory).toBe(true)
      expect(result.hasRecentClips).toBe(true)
      expect(result.hasSavedClips).toBe(true)
      expect(result.hasSentryClips).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should detect root directory with only RecentClips', async () => {
      const mockRoot = new MockFileSystemDirectoryHandle(new Map([
        ['RecentClips', new MockFileSystemDirectoryHandle()]
      ]))

      const result = await service.validateDirectory(mockRoot as any)

      expect(result.isRootDirectory).toBe(true)
      expect(result.hasRecentClips).toBe(true)
      expect(result.hasSavedClips).toBe(false)
      expect(result.hasSentryClips).toBe(false)
    })

    it('should detect root directory with only SavedClips', async () => {
      const mockRoot = new MockFileSystemDirectoryHandle(new Map([
        ['SavedClips', new MockFileSystemDirectoryHandle()]
      ]))

      const result = await service.validateDirectory(mockRoot as any)

      expect(result.isRootDirectory).toBe(true)
      expect(result.hasRecentClips).toBe(false)
      expect(result.hasSavedClips).toBe(true)
      expect(result.hasSentryClips).toBe(false)
    })

    it('should detect root directory with only SentryClips', async () => {
      const mockRoot = new MockFileSystemDirectoryHandle(new Map([
        ['SentryClips', new MockFileSystemDirectoryHandle()]
      ]))

      const result = await service.validateDirectory(mockRoot as any)

      expect(result.isRootDirectory).toBe(true)
      expect(result.hasRecentClips).toBe(false)
      expect(result.hasSavedClips).toBe(false)
      expect(result.hasSentryClips).toBe(true)
    })

    it('should detect root directory with two categories', async () => {
      const mockRoot = new MockFileSystemDirectoryHandle(new Map([
        ['RecentClips', new MockFileSystemDirectoryHandle()],
        ['SentryClips', new MockFileSystemDirectoryHandle()]
      ]))

      const result = await service.validateDirectory(mockRoot as any)

      expect(result.isRootDirectory).toBe(true)
      expect(result.hasRecentClips).toBe(true)
      expect(result.hasSavedClips).toBe(false)
      expect(result.hasSentryClips).toBe(true)
    })
  })

  describe('validateDirectory - fallback mode', () => {
    it('should detect fallback mode with Tesla video files', async () => {
      const mockRoot = new MockFileSystemDirectoryHandle(new Map([
        ['2025-10-27_14-30-25-front.mp4', new MockFileSystemFileHandle('2025-10-27_14-30-25-front.mp4')],
        ['2025-10-27_14-30-25-back.mp4', new MockFileSystemFileHandle('2025-10-27_14-30-25-back.mp4')]
      ]))

      const result = await service.validateDirectory(mockRoot as any)

      expect(result.isRootDirectory).toBe(false)
      expect(result.hasRecentClips).toBe(false)
      expect(result.hasSavedClips).toBe(false)
      expect(result.hasSentryClips).toBe(false)
      expect(result.error).toBeUndefined()
    })

    it('should detect fallback mode with nested folder containing videos', async () => {
      const clipFolder = new MockFileSystemDirectoryHandle(
        '2025-10-27_14-30-25',
        new Map([
          ['2025-10-27_14-30-25-front.mp4', new MockFileSystemFileHandle('2025-10-27_14-30-25-front.mp4')]
        ])
      )

      const mockRoot = new MockFileSystemDirectoryHandle(
        'root',
        new Map([
          ['2025-10-27_14-30-25', clipFolder]
        ])
      )

      const result = await service.validateDirectory(mockRoot as any)

      expect(result.isRootDirectory).toBe(false)
      expect(result.error).toBeUndefined()
    })
  })

  describe('validateDirectory - error cases', () => {
    it('should return error for empty directory', async () => {
      const mockRoot = new MockFileSystemDirectoryHandle()

      const result = await service.validateDirectory(mockRoot as any)

      expect(result.isRootDirectory).toBe(false)
      expect(result.hasRecentClips).toBe(false)
      expect(result.hasSavedClips).toBe(false)
      expect(result.hasSentryClips).toBe(false)
      expect(result.error).toBe('No valid Tesla dashcam folders or video files found.')
    })

    it('should return error for directory with only non-Tesla files', async () => {
      const mockRoot = new MockFileSystemDirectoryHandle(new Map([
        ['random.txt', new MockFileSystemFileHandle('random.txt')],
        ['video.avi', new MockFileSystemFileHandle('video.avi')]
      ]))

      const result = await service.validateDirectory(mockRoot as any)

      expect(result.isRootDirectory).toBe(false)
      expect(result.error).toBe('No valid Tesla dashcam folders or video files found.')
    })

    it('should handle directory access errors gracefully', async () => {
      const mockRoot = {
        values: async function* () {
          throw new Error('Permission denied')
        }
      }

      const result = await service.validateDirectory(mockRoot as any)

      expect(result.isRootDirectory).toBe(false)
      expect(result.isValid).toBe(false)
      // The implementation handles errors gracefully and returns standard error message
      expect(result.error).toBe('No valid Tesla dashcam folders or video files found.')
    })
  })

  describe('getCategoryDirectory', () => {
    it('should return directory handle for valid category', async () => {
      const recentClips = new MockFileSystemDirectoryHandle()
      const mockRoot = new MockFileSystemDirectoryHandle(new Map([
        ['RecentClips', recentClips]
      ]))

      const result = await service.getCategoryDirectory(mockRoot as any, 'recent')

      expect(result).toBe(recentClips)
    })

    it('should return null for non-existent category', async () => {
      const mockRoot = new MockFileSystemDirectoryHandle()

      const result = await service.getCategoryDirectory(mockRoot as any, 'recent')

      expect(result).toBeNull()
    })

    it('should handle all category types', async () => {
      const recentClips = new MockFileSystemDirectoryHandle()
      const savedClips = new MockFileSystemDirectoryHandle()
      const sentryClips = new MockFileSystemDirectoryHandle()
      
      const mockRoot = new MockFileSystemDirectoryHandle(new Map([
        ['RecentClips', recentClips],
        ['SavedClips', savedClips],
        ['SentryClips', sentryClips]
      ]))

      expect(await service.getCategoryDirectory(mockRoot as any, 'recent')).toBe(recentClips)
      expect(await service.getCategoryDirectory(mockRoot as any, 'saved')).toBe(savedClips)
      expect(await service.getCategoryDirectory(mockRoot as any, 'sentry')).toBe(sentryClips)
    })

    it('should handle errors gracefully', async () => {
      const mockRoot = {
        getDirectoryHandle: async () => {
          throw new Error('Access denied')
        }
      }

      const result = await service.getCategoryDirectory(mockRoot as any, 'recent')

      expect(result).toBeNull()
    })
  })

  describe('hasDirectory', () => {
    it('should return true for existing directory', async () => {
      const mockRoot = new MockFileSystemDirectoryHandle(new Map([
        ['RecentClips', new MockFileSystemDirectoryHandle()]
      ]))

      const result = await service['hasDirectory'](mockRoot as any, 'RecentClips')

      expect(result).toBe(true)
    })

    it('should return false for non-existent directory', async () => {
      const mockRoot = new MockFileSystemDirectoryHandle()

      const result = await service['hasDirectory'](mockRoot as any, 'RecentClips')

      expect(result).toBe(false)
    })

    it('should return false if entry is a file, not a directory', async () => {
      const mockRoot = new MockFileSystemDirectoryHandle(new Map([
        ['RecentClips', new MockFileSystemFileHandle('RecentClips')]
      ]))

      const result = await service['hasDirectory'](mockRoot as any, 'RecentClips')

      expect(result).toBe(false)
    })
  })

  describe('hasVideoFiles', () => {
    it('should return true when directory contains Tesla video files', async () => {
      const mockDir = new MockFileSystemDirectoryHandle(new Map([
        ['2025-10-27_14-30-25-front.mp4', new MockFileSystemFileHandle('2025-10-27_14-30-25-front.mp4')]
      ]))

      const result = await service['hasVideoFiles'](mockDir as any)

      expect(result).toBe(true)
    })

    it('should return true when subdirectory contains Tesla video files', async () => {
      const clipFolder = new MockFileSystemDirectoryHandle(
        '2025-10-27_14-30-25',
        new Map([
          ['2025-10-27_14-30-25-front.mp4', new MockFileSystemFileHandle('2025-10-27_14-30-25-front.mp4')]
        ])
      )

      const mockDir = new MockFileSystemDirectoryHandle(
        'root',
        new Map([
          ['2025-10-27_14-30-25', clipFolder]
        ])
      )

      const result = await service['hasVideoFiles'](mockDir as any)

      expect(result).toBe(true)
    })

    it('should return false when directory has no video files', async () => {
      const mockDir = new MockFileSystemDirectoryHandle(new Map([
        ['random.txt', new MockFileSystemFileHandle('random.txt')]
      ]))

      const result = await service['hasVideoFiles'](mockDir as any)

      expect(result).toBe(false)
    })

    it('should return false for empty directory', async () => {
      const mockDir = new MockFileSystemDirectoryHandle()

      const result = await service['hasVideoFiles'](mockDir as any)

      expect(result).toBe(false)
    })

    it('should handle nested empty directories', async () => {
      const emptyFolder = new MockFileSystemDirectoryHandle()
      const mockDir = new MockFileSystemDirectoryHandle(new Map([
        ['EmptyFolder', emptyFolder]
      ]))

      const result = await service['hasVideoFiles'](mockDir as any)

      expect(result).toBe(false)
    })
  })
})
