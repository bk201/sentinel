import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LibraryScannerService } from '../../src/services/LibraryScannerService'

// Mock FileSystemDirectoryHandle
class MockFileSystemDirectoryHandle {
  name: string
  kind: string = 'directory'
  private entries: Map<string, MockFileSystemDirectoryHandle | MockFileSystemFileHandle>

  constructor(
    name: string,
    entries: Map<string, MockFileSystemDirectoryHandle | MockFileSystemFileHandle> = new Map()
  ) {
    this.name = name
    this.entries = entries
  }

  async *values() {
    for (const entry of this.entries.values()) {
      yield entry
    }
  }

  async getFileHandle(name: string) {
    const entry = this.entries.get(name)
    if (!entry || !(entry instanceof MockFileSystemFileHandle)) {
      throw new Error(`File not found: ${name}`)
    }
    return entry
  }

  async getDirectoryHandle(name: string) {
    const entry = this.entries.get(name)
    if (!entry || !(entry instanceof MockFileSystemDirectoryHandle)) {
      throw new Error(`Directory not found: ${name}`)
    }
    return entry
  }
}

class MockFileSystemFileHandle {
  name: string
  kind: string = 'file'
  private content: Blob

  constructor(
    name: string,
    content: Blob = new Blob()
  ) {
    this.name = name
    this.content = content
  }

  async getFile() {
    return new File([this.content], this.name)
  }
}

// Mock analyzeClips from clipDetectionUtils
vi.mock('../../src/utils/clipDetectionUtils', () => ({
  analyzeClips: vi.fn((files: File[]) => {
    // Simple mock: group by timestamp prefix
    const timestamps = new Set<string>()
    files.forEach(file => {
      const match = file.name.match(/^(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/)
      if (match && match[1]) timestamps.add(match[1])
    })

    if (timestamps.size > 1) {
      const clips = Array.from(timestamps).map(ts => ({
        timestamp: ts,
        files: files.filter(f => f.name.startsWith(ts))
      }))
      return { hasMultipleClips: true, clips }
    }

    return { hasMultipleClips: false, singleClipFiles: files }
  })
}))

describe('LibraryScannerService', () => {
  let service: LibraryScannerService

  beforeEach(() => {
    service = new LibraryScannerService()
  })

  describe('parseTimestampFromFolderName', () => {
    it('should parse valid folder names', () => {
      const result = service.getTimestampFromFolder('2025-10-27_14-30-25')
      expect(result).toBeInstanceOf(Date)
      expect(result?.getFullYear()).toBe(2025)
      expect(result?.getMonth()).toBe(9) // October (0-indexed)
      expect(result?.getDate()).toBe(27)
      expect(result?.getHours()).toBe(14)
      expect(result?.getMinutes()).toBe(30)
      expect(result?.getSeconds()).toBe(25)
    })

    it('should return null for invalid folder names', () => {
      expect(service.getTimestampFromFolder('invalid')).toBeNull()
      expect(service.getTimestampFromFolder('2025-10-27')).toBeNull()
      expect(service.getTimestampFromFolder('random_folder')).toBeNull()
    })

    it('should handle edge case timestamps', () => {
      // Start of day
      const midnight = service.getTimestampFromFolder('2025-01-01_00-00-00')
      expect(midnight?.getHours()).toBe(0)
      expect(midnight?.getMinutes()).toBe(0)

      // End of day
      const endOfDay = service.getTimestampFromFolder('2025-12-31_23-59-59')
      expect(endOfDay?.getHours()).toBe(23)
      expect(endOfDay?.getMinutes()).toBe(59)
    })
  })

  describe('getUniqueTimestamps', () => {
    it('should count unique timestamps', () => {
      const files = [
        new File([], '2025-10-27_14-30-25-front.mp4'),
        new File([], '2025-10-27_14-30-25-back.mp4'),
        new File([], '2025-10-27_14-31-25-front.mp4'),
        new File([], '2025-10-27_14-31-25-back.mp4')
      ]

      const count = service.countUniqueTimestamps(files)

      expect(count).toBe(2) // Two unique timestamps: 14-30-25 and 14-31-25
    })

    it('should return 0 for no video files', () => {
      const files = [
        new File([], 'thumb.png'),
        new File([], 'event.json')
      ]

      const count = service.countUniqueTimestamps(files)

      expect(count).toBe(0)
    })

    it('should handle single timestamp', () => {
      const files = [
        new File([], '2025-10-27_14-30-25-front.mp4'),
        new File([], '2025-10-27_14-30-25-back.mp4'),
        new File([], '2025-10-27_14-30-25-left_repeater.mp4'),
        new File([], '2025-10-27_14-30-25-right_repeater.mp4')
      ]

      const count = service.countUniqueTimestamps(files)

      expect(count).toBe(1)
    })
  })

  describe('createClipEntryFromFiles', () => {
    it('should create basic clip entry without optional fields', async () => {
      const files = [
        new File([], '2025-10-27_14-30-25-front.mp4'),
        new File([], '2025-10-27_14-30-25-back.mp4')
      ]

      const entry = await service['createClipEntryFromFiles'](
        'saved',
        files,
        new Date('2025-10-27T14:30:25')
      )

      expect(entry.id).toContain('saved')
      expect(entry.category).toBe('saved')
      expect(entry.timestamp).toEqual(new Date('2025-10-27T14:30:25'))
      expect(entry.duration).toBe(60) // 1 unique timestamp * 60
      expect(entry.files).toEqual(files)
      expect(entry.hasEvent).toBe(false)
      expect(entry.folderName).toBeUndefined()
      expect(entry.folderHandle).toBeUndefined()
      expect(entry.thumbnailUrl).toBeUndefined()
      expect(entry.thumbnailBlob).toBeUndefined()
    })

    it('should include event.json detection', async () => {
      const files = [
        new File([], '2025-10-27_14-30-25-front.mp4'),
        new File([], 'event.json')
      ]

      const entry = await service['createClipEntryFromFiles'](
        'sentry',
        files,
        new Date('2025-10-27T14:30:25')
      )

      expect(entry.hasEvent).toBe(true)
    })

    it('should include optional folder information', async () => {
      const files = [new File([], '2025-10-27_14-30-25-front.mp4')]
      const folderHandle = new MockFileSystemDirectoryHandle('2025-10-27_14-30-25')

      const entry = await service['createClipEntryFromFiles'](
        'saved',
        files,
        new Date('2025-10-27T14:30:25'),
        '2025-10-27_14-30-25',
        folderHandle as any
      )

      expect(entry.folderName).toBe('2025-10-27_14-30-25')
      expect(entry.folderHandle).toBe(folderHandle)
    })

    it('should include thumbnail from files', async () => {
      const thumbnailContent = new Blob(['fake image'], { type: 'image/png' })
      const files = [
        new File([], '2025-10-27_14-30-25-front.mp4'),
        new File([thumbnailContent], 'thumb.png', { type: 'image/png' })
      ]

      const entry = await service['createClipEntryFromFiles'](
        'saved',
        files,
        new Date('2025-10-27T14:30:25')
      )

      // Thumbnail should be loaded from files
      expect(entry.thumbnailBlob).toBeDefined()
      expect(entry.thumbnailUrl).toBeDefined()
    })

    it('should calculate duration based on unique timestamps', async () => {
      const files = [
        new File([], '2025-10-27_14-30-25-front.mp4'),
        new File([], '2025-10-27_14-31-25-front.mp4'),
        new File([], '2025-10-27_14-32-25-front.mp4')
      ]

      const entry = await service['createClipEntryFromFiles'](
        'recent',
        files,
        new Date('2025-10-27T14:30:25')
      )

      expect(entry.duration).toBe(180) // 3 timestamps * 60
    })
  })

  describe('loadThumbnail', () => {
    it('should return empty object when thumb.png does not exist', async () => {
      const files = [
        new File([], '2025-10-27_14-30-25-front.mp4')
      ]

      const result = await service.getThumbnail(files)

      expect(result.thumbnailUrl).toBeUndefined()
      expect(result.thumbnailBlob).toBeUndefined()
    })

    it('should load thumbnail when thumb.png exists in files', async () => {
      const thumbFile = new MockFileSystemFileHandle('thumb.png')
      const files = [thumbFile]

      const result = await service.getThumbnail(files as any[])

      expect(result.thumbnailBlob).toBeInstanceOf(Blob)
      expect(result.thumbnailUrl).toBeDefined()
      // Implementation creates blob URL (blob:...) which is correct for browser usage
      expect(result.thumbnailUrl).toMatch(/^blob:/)
    })
  })

  describe('scanClipFolder', () => {
    it('should scan folder and create clip entry', async () => {
      const folderHandle = new MockFileSystemDirectoryHandle(
        '2025-10-27_14-30-25',
        new Map([
          ['2025-10-27_14-30-25-front.mp4', new MockFileSystemFileHandle('2025-10-27_14-30-25-front.mp4')],
          ['2025-10-27_14-30-25-back.mp4', new MockFileSystemFileHandle('2025-10-27_14-30-25-back.mp4')]
        ])
      )

      const entry = await service['scanClipFolder'](folderHandle as any, 'saved')

      expect(entry).not.toBeNull()
      expect(entry?.category).toBe('saved')
      expect(entry?.folderName).toBe('2025-10-27_14-30-25')
    })

    it('should return null for folder without video files', async () => {
      const folderHandle = new MockFileSystemDirectoryHandle(
        'empty-folder',
        new Map([
          ['readme.txt', new MockFileSystemFileHandle('readme.txt')]
        ])
      )

      const entry = await service['scanClipFolder'](folderHandle as any, 'saved')

      expect(entry).toBeNull()
    })

    it('should return null for invalid folder name', async () => {
      const folderHandle = new MockFileSystemDirectoryHandle(
        'invalid-name',
        new Map([
          ['2025-10-27_14-30-25-front.mp4', new MockFileSystemFileHandle('2025-10-27_14-30-25-front.mp4')]
        ])
      )

      const entry = await service['scanClipFolder'](folderHandle as any, 'saved')

      expect(entry).toBeNull()
    })

    it('should include thumbnail if present', async () => {
      const thumbnailContent = new Blob(['fake image'], { type: 'image/png' })
      const folderHandle = new MockFileSystemDirectoryHandle(
        '2025-10-27_14-30-25',
        new Map([
          ['2025-10-27_14-30-25-front.mp4', new MockFileSystemFileHandle('2025-10-27_14-30-25-front.mp4')],
          ['thumb.png', new MockFileSystemFileHandle('thumb.png', thumbnailContent)]
        ])
      )

      const entry = await service['scanClipFolder'](folderHandle as any, 'saved')

      expect(entry).not.toBeNull()
      expect(entry?.thumbnailUrl).toBeDefined()
      expect(entry?.thumbnailBlob).toBeDefined()
    })

    it('should detect event.json', async () => {
      const folderHandle = new MockFileSystemDirectoryHandle(
        '2025-10-27_14-30-25',
        new Map([
          ['2025-10-27_14-30-25-front.mp4', new MockFileSystemFileHandle('2025-10-27_14-30-25-front.mp4')],
          ['event.json', new MockFileSystemFileHandle('event.json')]
        ])
      )

      const entry = await service['scanClipFolder'](folderHandle as any, 'sentry')

      expect(entry).not.toBeNull()
      expect(entry?.hasEvent).toBe(true)
    })
  })

  describe('getAllFilesFromDirectory', () => {
    it('should get all files from directory', async () => {
      const dirHandle = new MockFileSystemDirectoryHandle(
        'test-dir',
        new Map<string, MockFileSystemDirectoryHandle | MockFileSystemFileHandle>([
          ['file1.mp4', new MockFileSystemFileHandle('file1.mp4')],
          ['file2.mp4', new MockFileSystemFileHandle('file2.mp4')],
          ['thumb.png', new MockFileSystemFileHandle('thumb.png')]
        ])
      )

      const files = await service['getAllFilesFromDirectory'](dirHandle as any)

      expect(files).toHaveLength(3)
      expect(files.map(f => f.name).sort()).toEqual(['file1.mp4', 'file2.mp4', 'thumb.png'])
    })

    it('should return empty array for empty directory', async () => {
      const dirHandle = new MockFileSystemDirectoryHandle('empty-dir')

      const files = await service['getAllFilesFromDirectory'](dirHandle as any)

      expect(files).toHaveLength(0)
    })

    it('should skip subdirectories', async () => {
      const dirHandle = new MockFileSystemDirectoryHandle(
        'test-dir',
        new Map<string, MockFileSystemDirectoryHandle | MockFileSystemFileHandle>([
          ['file1.mp4', new MockFileSystemFileHandle('file1.mp4')],
          ['subfolder', new MockFileSystemDirectoryHandle('subfolder')]
        ])
      )

      const files = await service['getAllFilesFromDirectory'](dirHandle as any)

      expect(files).toHaveLength(1)
      expect(files[0]?.name).toBe('file1.mp4')
    })
  })

  describe('integration - scanFolderBasedCategory', () => {
    it('should scan category with multiple clip folders', async () => {
      const clip1 = new MockFileSystemDirectoryHandle(
        '2025-10-27_14-30-25',
        new Map<string, MockFileSystemDirectoryHandle | MockFileSystemFileHandle>([
          ['2025-10-27_14-30-25-front.mp4', new MockFileSystemFileHandle('2025-10-27_14-30-25-front.mp4')]
        ])
      )

      const clip2 = new MockFileSystemDirectoryHandle(
        '2025-10-27_15-45-10',
        new Map<string, MockFileSystemDirectoryHandle | MockFileSystemFileHandle>([
          ['2025-10-27_15-45-10-front.mp4', new MockFileSystemFileHandle('2025-10-27_15-45-10-front.mp4')]
        ])
      )

      const categoryHandle = new MockFileSystemDirectoryHandle(
        'SavedClips',
        new Map<string, MockFileSystemDirectoryHandle | MockFileSystemFileHandle>([
          ['2025-10-27_14-30-25', clip1],
          ['2025-10-27_15-45-10', clip2]
        ])
      )

      const rootHandle = new MockFileSystemDirectoryHandle(
        'root',
        new Map<string, MockFileSystemDirectoryHandle | MockFileSystemFileHandle>([
          ['SavedClips', categoryHandle]
        ])
      )

      const clips = await service['scanFolderBasedCategory'](rootHandle as any, 'SavedClips', 'saved')

      expect(clips).toHaveLength(2)
      // Should be sorted newest first
      expect(clips[0]?.folderName).toBe('2025-10-27_15-45-10')
      expect(clips[1]?.folderName).toBe('2025-10-27_14-30-25')
    })

    it('should skip invalid folders', async () => {
      const validClip = new MockFileSystemDirectoryHandle(
        '2025-10-27_14-30-25',
        new Map<string, MockFileSystemDirectoryHandle | MockFileSystemFileHandle>([
          ['2025-10-27_14-30-25-front.mp4', new MockFileSystemFileHandle('2025-10-27_14-30-25-front.mp4')]
        ])
      )

      const invalidClip = new MockFileSystemDirectoryHandle(
        'invalid-folder',
        new Map<string, MockFileSystemDirectoryHandle | MockFileSystemFileHandle>([
          ['some-file.mp4', new MockFileSystemFileHandle('some-file.mp4')]
        ])
      )

      const categoryHandle = new MockFileSystemDirectoryHandle(
        'SavedClips',
        new Map<string, MockFileSystemDirectoryHandle | MockFileSystemFileHandle>([
          ['2025-10-27_14-30-25', validClip],
          ['invalid-folder', invalidClip]
        ])
      )

      const rootHandle = new MockFileSystemDirectoryHandle(
        'root',
        new Map<string, MockFileSystemDirectoryHandle | MockFileSystemFileHandle>([
          ['SavedClips', categoryHandle]
        ])
      )

      const clips = await service['scanFolderBasedCategory'](rootHandle as any, 'SavedClips', 'saved')

      expect(clips).toHaveLength(1)
      expect(clips[0]?.folderName).toBe('2025-10-27_14-30-25')
    })

    it('should return empty array for empty category', async () => {
      const categoryHandle = new MockFileSystemDirectoryHandle('SavedClips')

      const rootHandle = new MockFileSystemDirectoryHandle(
        'root',
        new Map<string, MockFileSystemDirectoryHandle | MockFileSystemFileHandle>([
          ['SavedClips', categoryHandle]
        ])
      )

      const clips = await service['scanFolderBasedCategory'](rootHandle as any, 'SavedClips', 'saved')

      expect(clips).toHaveLength(0)
    })
  })
})
