/**
 * Service for scanning Tesla Dashcam library and extracting clip metadata
 */

import type { ClipEntry, TeslaLibrary, ClipCategory } from '@/types/library'
import { analyzeClips } from '@/utils/clipDetectionUtils'

export class LibraryScannerService {
  private readonly TIMESTAMP_PATTERN = /^(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})$/

  /**
   * Scan the root directory and build the complete library structure
   */
  async scanLibrary(rootHandle: FileSystemDirectoryHandle): Promise<TeslaLibrary> {
    const [recent, saved, sentry] = await Promise.all([
      this.scanRecentClips(rootHandle),
      this.scanSavedClips(rootHandle),
      this.scanSentryClips(rootHandle),
    ])

    return {
      rootHandle,
      categories: {
        recent,
        saved,
        sentry,
      },
    }
  }

  /**
   * Scan RecentClips directory
   * Files are directly in the directory, use clip detection to split into clips
   */
  private async scanRecentClips(rootHandle: FileSystemDirectoryHandle): Promise<ClipEntry[]> {
    try {
      const recentDir = await rootHandle.getDirectoryHandle('RecentClips', { create: false })
      const files = await this.getAllFilesFromDirectory(recentDir)
      
      if (files.length === 0) {
        return []
      }

      // Use existing clip detection logic
      const analysis = analyzeClips(files)
      
      // Convert detected clips to ClipEntry format
      const clips: ClipEntry[] = []
      for (const detectedClip of analysis.clips) {
        const clipEntry = await this.createClipEntryFromFiles(
          'recent',
          detectedClip.files,
          detectedClip.startTime,
          undefined, // no folder for recent clips
          undefined  // no folder handle for recent clips
        )
        clips.push(clipEntry)
      }

      // Sort by timestamp (newest first)
      return clips.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    } catch (error) {
      console.warn('Failed to scan RecentClips:', error)
      return []
    }
  }

  /**
   * Scan SavedClips directory
   * Each subfolder is a clip
   */
  private async scanSavedClips(rootHandle: FileSystemDirectoryHandle): Promise<ClipEntry[]> {
    return this.scanFolderBasedCategory(rootHandle, 'SavedClips', 'saved')
  }

  /**
   * Scan SentryClips directory
   * Each subfolder is a clip
   */
  private async scanSentryClips(rootHandle: FileSystemDirectoryHandle): Promise<ClipEntry[]> {
    return this.scanFolderBasedCategory(rootHandle, 'SentryClips', 'sentry')
  }

  /**
   * Scan a category where each subfolder is a clip
   */
  private async scanFolderBasedCategory(
    rootHandle: FileSystemDirectoryHandle,
    categoryDirName: string,
    category: ClipCategory
  ): Promise<ClipEntry[]> {
    try {
      const categoryDir = await rootHandle.getDirectoryHandle(categoryDirName, { create: false })
      const clips: ClipEntry[] = []

      // @ts-expect-error - FileSystemDirectoryHandle async iterator types may not be fully defined
      for await (const entry of categoryDir.values()) {
        if (entry.kind === 'directory') {
          const clipEntry = await this.scanClipFolder(entry, category)
          if (clipEntry) {
            clips.push(clipEntry)
          }
        }
      }

      // Sort by timestamp (newest first)
      return clips.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    } catch (error) {
      console.warn(`Failed to scan ${categoryDirName}:`, error)
      return []
    }
  }

  /**
   * Scan a single clip folder
   */
  private async scanClipFolder(
    folderHandle: FileSystemDirectoryHandle,
    category: ClipCategory
  ): Promise<ClipEntry | null> {
    try {
      const folderName = folderHandle.name
      const timestamp = this.parseTimestampFromFolderName(folderName)
      
      if (!timestamp) {
        console.warn(`Invalid folder name format: ${folderName}`)
        return null
      }

      const files = await this.getAllFilesFromDirectory(folderHandle)
      
      if (files.length === 0) {
        console.warn(`No files found in folder: ${folderName}`)
        return null
      }

      return await this.createClipEntryFromFiles(
        category,
        files,
        timestamp,
        folderName,
        folderHandle
      )
    } catch (error) {
      console.warn(`Failed to scan clip folder ${folderHandle.name}:`, error)
      return null
    }
  }

  /**
   * Create a ClipEntry from files
   */
  private async createClipEntryFromFiles(
    category: ClipCategory,
    files: File[],
    timestamp: Date,
    folderName?: string,
    folderHandle?: FileSystemDirectoryHandle
  ): Promise<ClipEntry> {
    // Extract video files
    const videoFiles = files.filter(f => f.name.endsWith('.mp4'))
    
    // Detect available cameras
    const cameras = this.detectCameras(videoFiles)
    
    // Check for event.json
    const hasEvent = files.some(f => f.name.toLowerCase() === 'event.json')
    
    // Calculate duration (estimate 60 seconds per unique timestamp)
    const uniqueTimestamps = this.getUniqueTimestamps(videoFiles)
    const duration = uniqueTimestamps * 60
    
    // Load thumbnail
    const { thumbnailUrl, thumbnailBlob } = await this.loadThumbnail(files)
    
    // Generate unique ID
    const id = `${category}-${timestamp.getTime()}-${folderName || 'recent'}`
    
    const clipEntry: ClipEntry = {
      id,
      category,
      timestamp,
      duration,
      files,
      cameras,
      hasEvent,
    }

    // Add optional properties only if they exist
    if (folderName) {
      clipEntry.folderName = folderName
    }
    if (folderHandle) {
      clipEntry.folderHandle = folderHandle
    }
    if (thumbnailUrl) {
      clipEntry.thumbnailUrl = thumbnailUrl
    }
    if (thumbnailBlob) {
      clipEntry.thumbnailBlob = thumbnailBlob
    }
    
    return clipEntry
  }

  /**
   * Get all files from a directory
   */
  private async getAllFilesFromDirectory(dirHandle: FileSystemDirectoryHandle): Promise<File[]> {
    const files: File[] = []
    
    // @ts-expect-error - FileSystemDirectoryHandle async iterator types may not be fully defined
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        const fileHandle = entry as FileSystemFileHandle
        try {
          const file = await fileHandle.getFile()
          files.push(file)
        } catch (error) {
          console.warn(`Failed to read file ${entry.name}:`, error)
        }
      }
    }
    
    return files
  }

  /**
   * Parse timestamp from folder name (format: YYYY-MM-DD_HH-MM-SS)
   */
  private parseTimestampFromFolderName(folderName: string): Date | null {
    const match = folderName.match(this.TIMESTAMP_PATTERN)
    
    if (!match) {
      return null
    }

    const [, year, month, day, hour, minute, second] = match

    try {
      const date = new Date(
        parseInt(year!),
        parseInt(month!) - 1, // Month is 0-indexed
        parseInt(day!),
        parseInt(hour!),
        parseInt(minute!),
        parseInt(second!)
      )

      if (isNaN(date.getTime())) {
        return null
      }

      return date
    } catch {
      return null
    }
  }

  /**
   * Detect available cameras from video files
   */
  private detectCameras(videoFiles: File[]): ('front' | 'back' | 'left_repeater' | 'right_repeater')[] {
    const cameras = new Set<'front' | 'back' | 'left_repeater' | 'right_repeater'>()
    
    for (const file of videoFiles) {
      if (file.name.includes('-front.mp4')) {
        cameras.add('front')
      } else if (file.name.includes('-back.mp4')) {
        cameras.add('back')
      } else if (file.name.includes('-left_repeater.mp4')) {
        cameras.add('left_repeater')
      } else if (file.name.includes('-right_repeater.mp4')) {
        cameras.add('right_repeater')
      }
    }
    
    return Array.from(cameras)
  }

  /**
   * Get unique timestamps from video files
   */
  private getUniqueTimestamps(videoFiles: File[]): number {
    const timestamps = new Set<string>()
    
    for (const file of videoFiles) {
      // Extract timestamp part (before camera suffix)
      const match = file.name.match(/^(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/)
      if (match && match[1]) {
        timestamps.add(match[1])
      }
    }
    
    return timestamps.size
  }

  /**
   * Load thumbnail from thumb.png if exists
   */
  private async loadThumbnail(files: File[]): Promise<{ thumbnailUrl?: string; thumbnailBlob?: Blob }> {
    const thumbFile = files.find(f => f.name.toLowerCase() === 'thumb.png')
    
    if (!thumbFile) {
      return {}
    }

    try {
      const blob = new Blob([thumbFile], { type: 'image/png' })
      const thumbnailUrl = URL.createObjectURL(blob)
      
      return {
        thumbnailUrl,
        thumbnailBlob: blob,
      }
    } catch (error) {
      console.warn('Failed to load thumbnail:', error)
      return {}
    }
  }

  // Public API methods for external use
  
  /**
   * Public API: Extract and load thumbnail from clip files
   */
  async getThumbnail(files: File[]): Promise<{ thumbnailUrl?: string; thumbnailBlob?: Blob }> {
    return this.loadThumbnail(files)
  }

  /**
   * Public API: Detect available camera positions from video files
   */
  getCameras(videoFiles: File[]): ('front' | 'back' | 'left_repeater' | 'right_repeater')[] {
    return this.detectCameras(videoFiles)
  }

  /**
   * Public API: Parse timestamp from Tesla folder name format (YYYY-MM-DD_HH-MM-SS)
   */
  getTimestampFromFolder(folderName: string): Date | null {
    return this.parseTimestampFromFolderName(folderName)
  }

  /**
   * Public API: Count unique timestamps in video files (for duration calculation)
   */
  countUniqueTimestamps(videoFiles: File[]): number {
    return this.getUniqueTimestamps(videoFiles)
  }
}
