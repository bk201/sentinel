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
   * Scan library from File[] array (file input fallback mode)
   * Parses webkitRelativePath to reconstruct library structure
   */
  async scanLibraryFromFiles(files: File[]): Promise<TeslaLibrary> {
    console.log('Processing file array for library mode...')
    
    // Group files by category based on paths
    const categorizedFiles: {
      recent: Map<string, File[]>
      saved: Map<string, File[]>
      sentry: Map<string, File[]>
    } = {
      recent: new Map(),
      saved: new Map(),
      sentry: new Map(),
    }
    
    // Organize files by category and folder
    for (const file of files) {
      const path = file.webkitRelativePath || file.name
      
      if (path.includes('RecentClips/')) {
        // RecentClips files are directly in the folder
        const key = 'recent-all'
        if (!categorizedFiles.recent.has(key)) {
          categorizedFiles.recent.set(key, [])
        }
        categorizedFiles.recent.get(key)!.push(file)
      } else if (path.includes('SavedClips/')) {
        // Extract folder name from path like "TeslaCam/SavedClips/2025-10-27_14-30-25/..."
        const match = path.match(/SavedClips\/([^/]+)/)
        const folderName = match?.[1]
        if (folderName) {
          if (!categorizedFiles.saved.has(folderName)) {
            categorizedFiles.saved.set(folderName, [])
          }
          categorizedFiles.saved.get(folderName)!.push(file)
        }
      } else if (path.includes('SentryClips/')) {
        // Extract folder name from path
        const match = path.match(/SentryClips\/([^/]+)/)
        const folderName = match?.[1]
        if (folderName) {
          if (!categorizedFiles.sentry.has(folderName)) {
            categorizedFiles.sentry.set(folderName, [])
          }
          categorizedFiles.sentry.get(folderName)!.push(file)
        }
      }
    }
    
    // Convert to ClipEntry format
    const recentClips: ClipEntry[] = []
    const savedClips: ClipEntry[] = []
    const sentryClips: ClipEntry[] = []
    
    // Process RecentClips (use clip detection)
    for (const [, folderFiles] of categorizedFiles.recent) {
      const analysis = analyzeClips(folderFiles)
      for (const clip of analysis.clips) {
        // Filter to only video files
        const videoFiles = clip.files.filter(f => f.name.endsWith('.mp4'))
        if (videoFiles.length > 0) {
          // Calculate duration from unique timestamps (60 seconds per timestamp)
          const uniqueTimestamps = new Set(videoFiles.map(f => {
            const match = f.name.match(/\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}/)
            return match ? match[0] : ''
          })).size
          
          // Load thumbnail
          const thumbnail = await this.getThumbnail(clip.files)
          
          recentClips.push({
            id: `recent-${clip.startTime.getTime()}`,
            category: 'recent',
            timestamp: clip.startTime,
            duration: uniqueTimestamps * 60,
            files: clip.files, // Keep all files for event.json, thumb.png
            hasEvent: clip.files.some(f => f.name.toLowerCase() === 'event.json'),
            ...thumbnail,
          })
        }
      }
    }
    
    // Process SavedClips
    for (const [folderName, folderFiles] of categorizedFiles.saved) {
      const timestamp = this.getTimestampFromFolder(folderName)
      if (timestamp) {
        const videoFiles = folderFiles.filter(f => f.name.endsWith('.mp4'))
        if (videoFiles.length > 0) {
          // Load thumbnail
          const thumbnail = await this.getThumbnail(folderFiles)
          
          savedClips.push({
            id: `saved-${timestamp.getTime()}-${folderName}`,
            category: 'saved',
            timestamp,
            duration: this.countUniqueTimestamps(videoFiles) * 60,
            files: folderFiles,
            hasEvent: folderFiles.some(f => f.name.toLowerCase() === 'event.json'),
            folderName,
            ...thumbnail,
          })
        }
      }
    }
    
    // Process SentryClips
    for (const [folderName, folderFiles] of categorizedFiles.sentry) {
      const timestamp = this.getTimestampFromFolder(folderName)
      if (timestamp) {
        const videoFiles = folderFiles.filter(f => f.name.endsWith('.mp4'))
        if (videoFiles.length > 0) {
          // Load thumbnail
          const thumbnail = await this.getThumbnail(folderFiles)
          
          sentryClips.push({
            id: `sentry-${timestamp.getTime()}-${folderName}`,
            category: 'sentry',
            timestamp,
            duration: this.countUniqueTimestamps(videoFiles) * 60,
            files: folderFiles,
            hasEvent: folderFiles.some(f => f.name.toLowerCase() === 'event.json'),
            folderName,
            ...thumbnail,
          })
        }
      }
    }
    
    // Sort by timestamp (newest first)
    recentClips.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    savedClips.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    sentryClips.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    
    // Create library object
    return {
      rootHandle: null as any, // No handle in File[] mode
      categories: {
        recent: recentClips,
        saved: savedClips,
        sentry: sentryClips,
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
