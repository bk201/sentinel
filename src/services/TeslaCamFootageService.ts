// Tesla Dashcam Footage Management Service
// Handles grouping files by timestamp and managing footage-based playback

import type { ProcessedVideoFile, CameraPosition } from '@/types'
import type { 
  TeslaCamFootage, 
  TeslaClip,
  TeslaClipEvent,
  FootageTransitionSettings, 
  FootageNavigationState,
  FootageProcessingResult 
} from '@/types/TeslaCamFootage'

export class TeslaCamFootageService {
  private static readonly DEFAULT_TRANSITION_SETTINGS: FootageTransitionSettings = {
    autoAdvance: true,
    transitionDelay: 500,
    seamlessTransition: true,
    showFootageIndicator: true,
    loop: false
  }

  /**
   * Process video files and group them into footages by timestamp
   */
  async processVideoFilesIntoFootages(
    videoFiles: ProcessedVideoFile[],
    directoryName: string = 'TeslaCam',
    event?: TeslaClipEvent
  ): Promise<FootageProcessingResult> {
    const startTime = performance.now()
    const errors: string[] = []
    const warnings: string[] = []

    try {
      if (videoFiles.length === 0) {
        errors.push('No video files provided')
        return {
          success: false,
          clip: null,
          errors,
          warnings,
          processingTime: performance.now() - startTime
        }
      }

      // Group files by timestamp
      const footageMap = this.groupFilesByTimestamp(videoFiles)
      
      if (footageMap.size === 0) {
        errors.push('No valid Tesla dashcam footages found')
        return {
          success: false,
          clip: null,
          errors,
          warnings,
          processingTime: performance.now() - startTime
        }
      }

      // Create footages from grouped files
      const footages = Array.from(footageMap.entries())
        .map(([timestamp, files]) => this.createFootage(timestamp, files))
        .sort((a, b) => a.footageDate.getTime() - b.footageDate.getTime())

      // Calculate footage durations based on time gaps between footages
      this.calculateFootageDurations(footages)

      // Validate footages
      this.validateFootages(footages, warnings)

      // Create Tesla clip
      const clip: TeslaClip = {
        clipId: this.generateClipId(),
        directoryName,
        recordingDate: footages[0]?.footageDate || new Date(),
        footages,
        currentFootageIndex: 0,
        totalDuration: footages.reduce((sum, footage) => sum + footage.duration, 0),
        totalFootages: footages.length,
        totalSize: footages.reduce((sum, footage) => sum + footage.totalSize, 0),
        ...(event && { event }), // Add event data if present
        isPlaying: false,
        autoAdvance: TeslaCamFootageService.DEFAULT_TRANSITION_SETTINGS.autoAdvance,
        loop: TeslaCamFootageService.DEFAULT_TRANSITION_SETTINGS.loop
      }

      return {
        success: true,
        clip,
        errors,
        warnings,
        processingTime: performance.now() - startTime
      }
    } catch (error) {
      errors.push(`Footage processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return {
        success: false,
        clip: null,
        errors,
        warnings,
        processingTime: performance.now() - startTime
      }
    }
  }

  /**
   * Group video files by their timestamp prefix
   */
  private groupFilesByTimestamp(videoFiles: ProcessedVideoFile[]): Map<string, ProcessedVideoFile[]> {
    const footageMap = new Map<string, ProcessedVideoFile[]>()

    for (const videoFile of videoFiles) {
      const timestamp = this.extractTimestampFromFilename(videoFile.originalFile.name)
      if (timestamp) {
        if (!footageMap.has(timestamp)) {
          footageMap.set(timestamp, [])
        }
        footageMap.get(timestamp)!.push(videoFile)
      }
    }

    return footageMap
  }

  /**
   * Extract timestamp from Tesla dashcam filename
   * Example: 2024-06-19_16-43-35-front.mp4 -> 2024-06-19_16-43-35
   */
  private extractTimestampFromFilename(filename: string): string | null {
    const match = filename.match(/^(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/)
    return match?.[1] || null
  }

  /**
   * Create a TeslaCamFootage from grouped files
   */
  private createFootage(timestamp: string, videoFiles: ProcessedVideoFile[]): TeslaCamFootage {
    const videoMap = new Map<CameraPosition, ProcessedVideoFile>()
    let totalSize = 0
    let maxDuration = 0
    let longestDurationCamera: CameraPosition = 'front'

    console.log(`Creating footage for timestamp: ${timestamp} with ${videoFiles.length} files`)
    for (const videoFile of videoFiles) {
      console.log(`  Adding file for camera ${videoFile.cameraPosition}: ${videoFile.originalFile.name}, duration: ${videoFile.metadata.duration}`)
      videoMap.set(videoFile.cameraPosition, videoFile)
      totalSize += videoFile.originalFile.size

      if (videoFile.metadata.duration > maxDuration) {
        longestDurationCamera = videoFile.cameraPosition
        maxDuration = videoFile.metadata.duration
      }
    }

    const availableCameras = Array.from(videoMap.keys())
    const expectedCameras: CameraPosition[] = ['front', 'back', 'left_repeater', 'right_repeater']
    const isComplete = expectedCameras.every(camera => videoMap.has(camera))

    return {
      timestamp,
      footageDate: this.parseTimestamp(timestamp),
      duration: maxDuration,
      videoFiles: videoMap,
      availableCameras,
      longestDurationCamera,
      totalSize,
      isComplete,
      processingTime: 0 // Will be calculated if needed
    }
  }

  /**
   * Calculate footage durations based on time gaps between consecutive footages.
   * For each footage (except the last), duration = next footage start time - current footage start time.
   * For the last footage, use the maximum duration from video metadata.
   */
  private calculateFootageDurations(footages: TeslaCamFootage[]): void {
    for (let i = 0; i < footages.length; i++) {
      const currentFootage = footages[i]
      if (!currentFootage) continue

      const nextFootage = footages[i + 1]

      if (nextFootage) {
        // Calculate duration as time difference to next footage (in seconds)
        const durationMs = nextFootage.footageDate.getTime() - currentFootage.footageDate.getTime()
        currentFootage.duration = Math.ceil(durationMs / 1000)
        console.log(`Footage ${i}: ${currentFootage.timestamp} duration calculated from time gap: ${currentFootage.duration}s`)
      } else {
        // Last footage: keep the duration from video metadata (already set in createFootage)
        console.log(`Footage ${i} (last): ${currentFootage.timestamp} duration from metadata: ${currentFootage.duration}s`)
      }
    }
  }

  /**
   * Parse timestamp string into Date object
   * Example: 2024-06-19_16-43-35 -> Date object
   */
  private parseTimestamp(timestamp: string): Date {
    const [datePart, timePart] = timestamp.split('_')
    if (!datePart || !timePart) {
      return new Date() // Fallback to current date if parsing fails
    }

    const dateComponents = datePart.split('-').map(Number)
    const timeComponents = timePart.split('-').map(Number)
    
    const [year, month, day] = dateComponents
    const [hour, minute, second] = timeComponents
    
    if (dateComponents.length !== 3 || timeComponents.length !== 3) {
      return new Date() // Fallback to current date if parsing fails
    }
    
    return new Date(
      year || 0, 
      (month || 1) - 1, 
      day || 1, 
      hour || 0, 
      minute || 0, 
      second || 0
    )
  }

  /**
   * Validate footages and add warnings
   */
  private validateFootages(footages: TeslaCamFootage[], warnings: string[]): void {
    const incompleteFootages = footages.filter(footage => !footage.isComplete)
    if (incompleteFootages.length > 0) {
      warnings.push(`${incompleteFootages.length} footage(s) missing some camera angles`)
    }

    const shortFootages = footages.filter(footage => footage.duration < 5)
    if (shortFootages.length > 0) {
      warnings.push(`${shortFootages.length} footage(s) are very short (< 5 seconds)`)
    }
  }

  /**
   * Get navigation state for current clip
   */
  getNavigationState(clip: TeslaClip): FootageNavigationState {
    const currentFootage = clip.currentFootageIndex
    const totalFootages = clip.totalFootages

    return {
      canGoPrevious: currentFootage > 0,
      canGoNext: currentFootage < totalFootages - 1,
      currentFootage: currentFootage + 1, // 1-based for UI
      totalFootages,
      footageProgress: 0, // Would need sync state to calculate
      clipProgress: totalFootages > 0 ? (currentFootage + 1) / totalFootages : 0
    }
  }

  /**
   * Navigate to specific footage
   */
  navigateToFootage(clip: TeslaClip, footageIndex: number): TeslaCamFootage | null {
    if (footageIndex < 0 || footageIndex >= clip.totalFootages) {
      return null
    }

    clip.currentFootageIndex = footageIndex
    return clip.footages[footageIndex] || null
  }

  /**
   * Navigate to next footage
   */
  navigateToNextFootage(clip: TeslaClip): TeslaCamFootage | null {
    return this.navigateToFootage(clip, clip.currentFootageIndex + 1)
  }

  /**
   * Navigate to previous footage
   */
  navigateToPreviousFootage(clip: TeslaClip): TeslaCamFootage | null {
    return this.navigateToFootage(clip, clip.currentFootageIndex - 1)
  }

  /**
   * Get current footage
   */
  getCurrentFootage(clip: TeslaClip): TeslaCamFootage | null {
    if (clip.currentFootageIndex < 0 || clip.currentFootageIndex >= clip.totalFootages) {
      return null
    }
    return clip.footages[clip.currentFootageIndex] || null
  }

  /**
   * Check if should auto-advance to next footage
   */
  shouldAutoAdvance(clip: TeslaClip, currentTime: number): boolean {
    const currentFootage = this.getCurrentFootage(clip)
    if (!currentFootage || !clip.autoAdvance) {
      return false
    }

    // Auto-advance when current footage is finished
    return currentTime >= currentFootage.duration
  }

  /**
   * Generate unique clip ID
   */
  private generateClipId(): string {
    return `tesla-clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Parse event.json file if present
   */
  static async parseEventJson(files: File[]): Promise<TeslaClipEvent | undefined> {
    const eventFile = files.find(f => f.name.toLowerCase() === 'event.json')
    if (!eventFile) {
      return undefined
    }

    try {
      const text = await eventFile.text()
      const event = JSON.parse(text) as TeslaClipEvent
      return event
    } catch (error) {
      console.warn('Failed to parse event.json:', error)
      return undefined
    }
  }
}
