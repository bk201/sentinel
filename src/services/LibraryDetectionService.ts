/**
 * Service for detecting and validating Tesla Dashcam USB root directory structure
 */

import type { LibraryValidationResult } from '@/types/library'

export class LibraryDetectionService {
  private readonly RECENT_CLIPS_DIR = 'RecentClips'
  private readonly SAVED_CLIPS_DIR = 'SavedClips'
  private readonly SENTRY_CLIPS_DIR = 'SentryClips'

  /**
   * Validate if the selected directory is a Tesla USB root directory
   * or a single clip folder (fallback mode)
   */
  async validateDirectory(
    directoryHandle: FileSystemDirectoryHandle
  ): Promise<LibraryValidationResult> {
    try {
      // Check for category directories
      const hasRecentClips = await this.hasDirectory(directoryHandle, this.RECENT_CLIPS_DIR)
      const hasSavedClips = await this.hasDirectory(directoryHandle, this.SAVED_CLIPS_DIR)
      const hasSentryClips = await this.hasDirectory(directoryHandle, this.SENTRY_CLIPS_DIR)

      // If at least one category exists, it's a root directory
      if (hasRecentClips || hasSavedClips || hasSentryClips) {
        return {
          isValid: true,
          isRootDirectory: true,
          hasRecentClips,
          hasSavedClips,
          hasSentryClips,
        }
      }

      // Check if it's a single clip folder (fallback mode)
      const hasVideoFiles = await this.hasVideoFiles(directoryHandle)
      if (hasVideoFiles) {
        return {
          isValid: true,
          isRootDirectory: false,
          hasRecentClips: false,
          hasSavedClips: false,
          hasSentryClips: false,
        }
      }

      // Not a valid directory
      return {
        isValid: false,
        isRootDirectory: false,
        hasRecentClips: false,
        hasSavedClips: false,
        hasSentryClips: false,
        error: 'No valid Tesla dashcam folders or video files found.',
      }
    } catch (error) {
      return {
        isValid: false,
        isRootDirectory: false,
        hasRecentClips: false,
        hasSavedClips: false,
        hasSentryClips: false,
        error: error instanceof Error ? error.message : 'Unknown error validating directory',
      }
    }
  }

  /**
   * Check if a directory has a subdirectory with the given name
   */
  private async hasDirectory(
    parentHandle: FileSystemDirectoryHandle,
    dirName: string
  ): Promise<boolean> {
    try {
      const handle = await parentHandle.getDirectoryHandle(dirName, { create: false })
      return handle !== null
    } catch {
      return false
    }
  }

  /**
   * Check if a directory contains any video files (for fallback mode detection)
   */
  private async hasVideoFiles(directoryHandle: FileSystemDirectoryHandle): Promise<boolean> {
    try {
      // @ts-expect-error - FileSystemDirectoryHandle async iterator types may not be fully defined
      for await (const entry of directoryHandle.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.mp4')) {
          // Check if it matches Tesla dashcam format
          if (this.isTeslaVideoFilename(entry.name)) {
            return true
          }
        } else if (entry.kind === 'directory') {
          // Check subdirectories recursively (one level)
          try {
            const subDirHandle = await directoryHandle.getDirectoryHandle(entry.name)
            // @ts-expect-error - FileSystemDirectoryHandle async iterator types may not be fully defined
            for await (const subEntry of subDirHandle.values()) {
              if (subEntry.kind === 'file' && subEntry.name.endsWith('.mp4')) {
                if (this.isTeslaVideoFilename(subEntry.name)) {
                  return true
                }
              }
            }
          } catch {
            // Ignore subdirectory errors
          }
        }
      }
      return false
    } catch {
      return false
    }
  }

  /**
   * Check if a filename matches Tesla dashcam format
   * Format: YYYY-MM-DD_HH-MM-SS-camera.mp4
   */
  private isTeslaVideoFilename(filename: string): boolean {
    const pattern = /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}-(front|back|left_repeater|right_repeater)\.mp4$/
    return pattern.test(filename)
  }

  /**
   * Get directory handle for a category
   */
  async getCategoryDirectory(
    rootHandle: FileSystemDirectoryHandle,
    category: 'recent' | 'saved' | 'sentry'
  ): Promise<FileSystemDirectoryHandle | null> {
    const dirName = category === 'recent' ? this.RECENT_CLIPS_DIR :
                    category === 'saved' ? this.SAVED_CLIPS_DIR :
                    this.SENTRY_CLIPS_DIR

    try {
      return await rootHandle.getDirectoryHandle(dirName, { create: false })
    } catch {
      return null
    }
  }
}
