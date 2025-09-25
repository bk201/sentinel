import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { analyzeClips } from '@/utils/clipDetectionUtils'

/**
 * Helper to create mock File objects with Tesla dashcam naming pattern
 * Format: YYYY-MM-DD_HH-MM-SS-camera.mp4
 */
function createMockFile(timestamp: string, camera: string = 'front'): File {
  const filename = `${timestamp}-${camera}.mp4`
  const blob = new Blob(['mock video content'], { type: 'video/mp4' })
  return new File([blob], filename, { type: 'video/mp4' })
}

describe('clipDetectionUtils - analyzeClips', () => {
  beforeEach(() => {
    // Suppress console warnings during tests
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Single Clip Detection', () => {
    it('should detect single clip with one footage (4 camera files)', () => {
      // Arrange - One timestamp, all 4 cameras
      const files = [
        createMockFile('2024-10-27_14-30-00', 'front'),
        createMockFile('2024-10-27_14-30-00', 'back'),
        createMockFile('2024-10-27_14-30-00', 'left_repeater'),
        createMockFile('2024-10-27_14-30-00', 'right_repeater')
      ]

      // Act
      const result = analyzeClips(files)

      // Assert
      expect(result.hasMultipleClips).toBe(false)
      expect(result.singleClipFiles).toEqual(files)
      expect(result.clips).toHaveLength(1)
      expect(result.clips[0]!.footageCount).toBe(1)
      expect(result.clips[0]!.files).toHaveLength(4)
    })

    it('should detect single clip with multiple footages in sequence', () => {
      // Arrange - Sequential timestamps within 60s
      const files = [
        createMockFile('2024-10-27_14-30-00', 'front'),
        createMockFile('2024-10-27_14-30-00', 'back'),
        createMockFile('2024-10-27_14-30-30', 'front'), // 30s later
        createMockFile('2024-10-27_14-30-30', 'back'),
        createMockFile('2024-10-27_14-31-00', 'front'), // 30s later
        createMockFile('2024-10-27_14-31-00', 'back')
      ]

      // Act
      const result = analyzeClips(files)

      // Assert
      expect(result.hasMultipleClips).toBe(false)
      expect(result.singleClipFiles).toEqual(files)
      expect(result.clips).toHaveLength(1)
      expect(result.clips[0]!.footageCount).toBe(3)
      expect(result.clips[0]!.files).toHaveLength(6)
    })
  })

  describe('Multiple Clips Detection', () => {
    it('should detect two clips separated by 90+ second gap', () => {
      // Arrange - Two clips with 2 minute gap
      const files = [
        // Clip 1
        createMockFile('2024-10-27_14-30-00', 'front'),
        createMockFile('2024-10-27_14-30-00', 'back'),
        // Clip 2 - 2 minutes later
        createMockFile('2024-10-27_14-32-00', 'front'),
        createMockFile('2024-10-27_14-32-00', 'back')
      ]

      // Act
      const result = analyzeClips(files)

      // Assert
      expect(result.hasMultipleClips).toBe(true)
      expect(result.singleClipFiles).toBeUndefined()
      expect(result.clips).toHaveLength(2)
      
      // Clip 1 check
      expect(result.clips[0]!.footageCount).toBe(1)
      expect(result.clips[0]!.files).toHaveLength(2)
      expect(result.clips[0]!.startTime).toEqual(new Date('2024-10-27T14:30:00'))
      expect(result.clips[0]!.endTime).toEqual(new Date('2024-10-27T14:30:00'))
      
      // Clip 2 check
      expect(result.clips[1]!.footageCount).toBe(1)
      expect(result.clips[1]!.files).toHaveLength(2)
      expect(result.clips[1]!.startTime).toEqual(new Date('2024-10-27T14:32:00'))
      expect(result.clips[1]!.endTime).toEqual(new Date('2024-10-27T14:32:00'))
    })

    it('should detect three clips with varying gaps', () => {
      // Arrange
      const files = [
        // Clip 1 - Morning session
        createMockFile('2024-10-27_09-00-00', 'front'),
        createMockFile('2024-10-27_09-00-30', 'front'),
        createMockFile('2024-10-27_09-01-00', 'front'),
        // Clip 2 - Afternoon (5 hour gap)
        createMockFile('2024-10-27_14-00-00', 'front'),
        createMockFile('2024-10-27_14-00-30', 'front'),
        // Clip 3 - Evening (3 hour gap)
        createMockFile('2024-10-27_17-00-00', 'front')
      ]

      // Act
      const result = analyzeClips(files)

      // Assert
      expect(result.hasMultipleClips).toBe(true)
      expect(result.clips).toHaveLength(3)
      
      // Verify clip footages
      expect(result.clips[0]!.footageCount).toBe(3) // Morning: 3 footages
      expect(result.clips[1]!.footageCount).toBe(2) // Afternoon: 2 footages
      expect(result.clips[2]!.footageCount).toBe(1) // Evening: 1 footage
      
      // Verify time ranges
      expect(result.clips[0]!.startTime.getHours()).toBe(9)
      expect(result.clips[1]!.startTime.getHours()).toBe(14)
      expect(result.clips[2]!.startTime.getHours()).toBe(17)
    })

    it('should handle boundary case: exactly 90 seconds gap', () => {
      // Arrange - Gap exactly at threshold
      const files = [
        createMockFile('2024-10-27_14-30-00', 'front'),
        createMockFile('2024-10-27_14-31-30', 'front') // Exactly 90s later
      ]

      // Act
      const result = analyzeClips(files)

      // Assert
      expect(result.hasMultipleClips).toBe(false) // 90s is NOT > 90s, so single clip
      expect(result.clips).toHaveLength(1)
    })

    it('should handle boundary case: 91 seconds gap (just over threshold)', () => {
      // Arrange - Gap just over threshold
      const files = [
        createMockFile('2024-10-27_14-30-00', 'front'),
        createMockFile('2024-10-27_14-31-31', 'front') // 91s later
      ]

      // Act
      const result = analyzeClips(files)

      // Assert
      expect(result.hasMultipleClips).toBe(true) // > 90s, so multiple clips
      expect(result.clips).toHaveLength(2)
    })
  })

  describe('Custom Gap Threshold', () => {
    it('should detect clips with 91 second gap (just over default 90s threshold)', () => {
      // Arrange - 91 second gap (just over default threshold)
      const files = [
        createMockFile('2024-10-27_14-30-00', 'front'),
        createMockFile('2024-10-27_14-31-31', 'front') // 91s later
      ]

      // Act
      const result = analyzeClips(files)

      // Assert - Should detect multiple clips since 91s > 90s threshold
      expect(result.hasMultipleClips).toBe(true)
      expect(result.clips).toHaveLength(2)
    })
  })

  describe('Clip Metadata', () => {
    it('should calculate correct start and end times', () => {
      // Arrange
      const files = [
        createMockFile('2024-10-27_14-30-00', 'front'),
        createMockFile('2024-10-27_14-30-30', 'front'),
        createMockFile('2024-10-27_14-31-00', 'front')
      ]

      // Act
      const result = analyzeClips(files)

      // Assert
      const clip = result.clips[0]!
      expect(clip.startTime).toEqual(new Date('2024-10-27T14:30:00'))
      expect(clip.endTime).toEqual(new Date('2024-10-27T14:31:00'))
    })

    it('should estimate total duration (60 seconds per footage)', () => {
      // Arrange - 3 footages
      const files = [
        createMockFile('2024-10-27_14-30-00', 'front'),
        createMockFile('2024-10-27_14-30-00', 'back'),
        createMockFile('2024-10-27_14-31-00', 'front'),
        createMockFile('2024-10-27_14-31-00', 'back'),
        createMockFile('2024-10-27_14-32-00', 'front'),
        createMockFile('2024-10-27_14-32-00', 'back')
      ]

      // Act
      const result = analyzeClips(files)

      // Assert
      expect(result.clips[0]!.footageCount).toBe(3)
      expect(result.clips[0]!.totalDuration).toBe(180) // 3 * 60 seconds
    })

    it('should generate unique IDs for clips', () => {
      // Arrange
      const files = [
        createMockFile('2024-10-27_14-30-00', 'front'),
        createMockFile('2024-10-27_14-35-00', 'front') // New clip
      ]

      // Act
      const result = analyzeClips(files)

      // Assert
      expect(result.clips).toHaveLength(2)
      expect(result.clips[0]!.id).not.toBe(result.clips[1]!.id)
      expect(result.clips[0]!.id).toMatch(/^clip-\d+$/)
      expect(result.clips[1]!.id).toMatch(/^clip-\d+$/)
    })

    it('should include all files from the same timestamp in a clip', () => {
      // Arrange - Same timestamp, 4 cameras
      const files = [
        createMockFile('2024-10-27_14-30-00', 'front'),
        createMockFile('2024-10-27_14-30-00', 'back'),
        createMockFile('2024-10-27_14-30-00', 'left_repeater'),
        createMockFile('2024-10-27_14-30-00', 'right_repeater')
      ]

      // Act
      const result = analyzeClips(files)

      // Assert
      expect(result.clips[0]!.files).toHaveLength(4)
      expect(result.clips[0]!.footageCount).toBe(1) // 1 footage = 4 files
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty file array', () => {
      // Arrange
      const files: File[] = []

      // Act
      const result = analyzeClips(files)

      // Assert
      expect(result.hasMultipleClips).toBe(false)
      expect(result.singleClipFiles).toEqual([])
      expect(result.clips).toHaveLength(0)
    })

    it('should handle single file', () => {
      // Arrange
      const files = [createMockFile('2024-10-27_14-30-00', 'front')]

      // Act
      const result = analyzeClips(files)

      // Assert
      expect(result.hasMultipleClips).toBe(false)
      expect(result.singleClipFiles).toEqual(files)
      expect(result.clips).toHaveLength(1)
      expect(result.clips[0]!.footageCount).toBe(1)
    })

    it('should include non-video files in single clip scenario', () => {
      // Arrange - Mix of valid video files and non-video files (like event.json)
      const validFile = createMockFile('2024-10-27_14-30-00', 'front')
      const nonVideoFile = new File(['{"reason": "honk"}'], 'event.json', { type: 'application/json' })
      const files = [validFile, nonVideoFile]

      // Act
      const result = analyzeClips(files)

      // Assert - Single clip should include all files via singleClipFiles
      expect(result.hasMultipleClips).toBe(false)
      expect(result.singleClipFiles).toHaveLength(2)
      expect(result.singleClipFiles).toContain(validFile)
      expect(result.singleClipFiles).toContain(nonVideoFile)
    })

    it('should handle unsorted file array', () => {
      // Arrange - Files in random order
      const files = [
        createMockFile('2024-10-27_14-32-00', 'front'), // Latest
        createMockFile('2024-10-27_14-30-00', 'front'), // Earliest
        createMockFile('2024-10-27_14-31-00', 'front')  // Middle
      ]

      // Act
      const result = analyzeClips(files)

      // Assert - Should be sorted by timestamp
      const clip = result.clips[0]!
      expect(clip.startTime).toEqual(new Date('2024-10-27T14:30:00'))
      expect(clip.endTime).toEqual(new Date('2024-10-27T14:32:00'))
    })

    it('should handle files across midnight boundary', () => {
      // Arrange - Files spanning midnight
      const files = [
        createMockFile('2024-10-27_23-59-00', 'front'),
        createMockFile('2024-10-27_23-59-30', 'front'),
        createMockFile('2024-10-28_00-00-00', 'front') // Next day, 30s later
      ]

      // Act
      const result = analyzeClips(files)

      // Assert - Should be single clip (30s gap)
      expect(result.hasMultipleClips).toBe(false)
      expect(result.clips).toHaveLength(1)
      expect(result.clips[0]!.footageCount).toBe(3)
    })

    it('should handle large dataset with many clips', () => {
      // Arrange - 10 clips with 2-minute gaps
      const files: File[] = []
      for (let i = 0; i < 10; i++) {
        const hour = 10 + Math.floor(i * 2 / 60)
        const minute = (i * 2) % 60
        const timestamp = `2024-10-27_${String(hour).padStart(2, '0')}-${String(minute).padStart(2, '0')}-00`
        files.push(createMockFile(timestamp, 'front'))
      }

      // Act
      const result = analyzeClips(files)

      // Assert
      expect(result.hasMultipleClips).toBe(true)
      expect(result.clips.length).toBeGreaterThan(1)
    })
  })

  describe('Console Warnings', () => {
    it('should log warning when multiple clips detected', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'warn')
      const files = [
        createMockFile('2024-10-27_14-30-00', 'front'),
        createMockFile('2024-10-27_14-35-00', 'front') // 5 min gap
      ]

      // Act
      analyzeClips(files)

      // Assert
      expect(consoleSpy).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Multiple clips detected')
      )
    })

    it('should not log warning for single clip', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'warn')
      const files = [
        createMockFile('2024-10-27_14-30-00', 'front'),
        createMockFile('2024-10-27_14-30-30', 'front') // 30s gap
      ]

      // Act
      analyzeClips(files)

      // Assert
      expect(consoleSpy).not.toHaveBeenCalled()
    })
  })

  describe('Real-World Scenarios', () => {
    it('should handle typical commute scenario (morning drive, evening drive)', () => {
      // Arrange - Morning commute and evening commute
      const files = [
        // Morning commute: 8:00-8:30 AM
        ...Array.from({ length: 30 }, (_, i) => 
          createMockFile(`2024-10-27_08-${String(i).padStart(2, '0')}-00`, 'front')
        ),
        // Evening commute: 6:00-6:30 PM (10 hour gap)
        ...Array.from({ length: 30 }, (_, i) => 
          createMockFile(`2024-10-27_18-${String(i).padStart(2, '0')}-00`, 'front')
        )
      ]

      // Act
      const result = analyzeClips(files)

      // Assert
      expect(result.hasMultipleClips).toBe(true)
      expect(result.clips).toHaveLength(2)
      expect(result.clips[0]!.footageCount).toBe(30) // Morning
      expect(result.clips[1]!.footageCount).toBe(30) // Evening
      expect(result.clips[0]!.totalDuration).toBe(1800) // 30 * 60s
      expect(result.clips[1]!.totalDuration).toBe(1800) // 30 * 60s
    })

    it('should handle parking mode recording (short clips with long gaps)', () => {
      // Arrange - Parking mode: brief recordings triggered by motion
      const files = [
        createMockFile('2024-10-27_14-00-00', 'front'),
        createMockFile('2024-10-27_14-30-00', 'front'), // 30 min gap
        createMockFile('2024-10-27_15-15-00', 'front'), // 45 min gap
        createMockFile('2024-10-27_16-00-00', 'front')  // 45 min gap
      ]

      // Act
      const result = analyzeClips(files)

      // Assert
      expect(result.hasMultipleClips).toBe(true)
      expect(result.clips).toHaveLength(4)
      expect(result.clips.every(clip => clip.footageCount === 1)).toBe(true)
    })

    it('should handle continuous recording with SD card changes', () => {
      // Arrange - Continuous drive, but SD card was changed/formatted
      const files = [
        // First SD card
        ...Array.from({ length: 60 }, (_, i) => 
          createMockFile(`2024-10-27_08-${String(Math.floor(i / 2)).padStart(2, '0')}-${i % 2 === 0 ? '00' : '30'}`, 'front')
        ),
        // Second SD card - same day but hours later due to gap
        ...Array.from({ length: 60 }, (_, i) => 
          createMockFile(`2024-10-27_14-${String(Math.floor(i / 2)).padStart(2, '0')}-${i % 2 === 0 ? '00' : '30'}`, 'front')
        )
      ]

      // Act
      const result = analyzeClips(files)

      // Assert
      expect(result.hasMultipleClips).toBe(true)
      expect(result.clips).toHaveLength(2)
    })
  })
})
