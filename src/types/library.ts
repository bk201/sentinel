/**
 * Type definitions for Tesla Dashcam Library feature
 */

export type ClipCategory = 'recent' | 'saved' | 'sentry'

export interface ClipEntry {
  id: string // unique identifier
  category: ClipCategory
  timestamp: Date // extracted from folder name or files
  duration: number // in seconds
  folderName?: string // for saved/sentry (e.g., "2025-10-27_08-42-37")
  folderHandle?: FileSystemDirectoryHandle // for saved/sentry folders
  files: File[] // all video files for this clip
  cameras: ('front' | 'back' | 'left_repeater' | 'right_repeater')[] // available cameras
  hasEvent: boolean // if event.json exists
  thumbnailUrl?: string // data URL from thumb.png if exists
  thumbnailBlob?: Blob // the actual thumb.png blob
}

export interface TeslaLibrary {
  rootHandle: FileSystemDirectoryHandle
  categories: {
    recent: ClipEntry[]
    saved: ClipEntry[]
    sentry: ClipEntry[]
  }
}

export interface LibraryValidationResult {
  isValid: boolean
  isRootDirectory: boolean // true if root directory, false if single clip folder
  hasRecentClips: boolean
  hasSavedClips: boolean
  hasSentryClips: boolean
  error?: string
}

/**
 * Day group for organizing clips by date
 */
export interface ClipDayGroup {
  date: Date
  dateString: string // e.g., "October 27, 2025"
  clips: ClipEntry[]
}
