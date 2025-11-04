import { describe, it, expect } from 'vitest'
import {
  groupClipsByDay,
  formatDateForDisplay,
  formatClipTimestamp,
  formatDuration
} from '../../src/utils/libraryUtils'
import type { ClipEntry } from '../../src/types/library'

describe('libraryUtils', () => {
  describe('formatDuration', () => {
    it('should format seconds only', () => {
      expect(formatDuration(45)).toBe('45s')
    })

    it('should format minutes and seconds', () => {
      expect(formatDuration(125)).toBe('2m 5s')
    })

    it('should format hours, minutes, and seconds', () => {
      expect(formatDuration(3665)).toBe('1h 1m 5s')
    })

    it('should handle zero seconds', () => {
      expect(formatDuration(0)).toBe('0s')
    })

    it('should handle exact minutes', () => {
      expect(formatDuration(120)).toBe('2m 0s')
    })

    it('should handle exact hours', () => {
      expect(formatDuration(3600)).toBe('1h 0m 0s')
    })

    it('should handle large durations', () => {
      expect(formatDuration(7325)).toBe('2h 2m 5s')
    })
  })

  describe('formatDateForDisplay', () => {
    it('should format a date correctly', () => {
      const date = new Date('2025-10-27')
      expect(formatDateForDisplay(date)).toBe('October 27, 2025')
    })

    it('should handle single digit dates', () => {
      const date = new Date('2025-01-05')
      expect(formatDateForDisplay(date)).toBe('January 5, 2025')
    })

    it('should handle end of year', () => {
      const date = new Date('2025-12-31')
      expect(formatDateForDisplay(date)).toBe('December 31, 2025')
    })

    it('should handle start of year', () => {
      const date = new Date('2025-01-01')
      expect(formatDateForDisplay(date)).toBe('January 1, 2025')
    })
  })

  describe('formatClipTimestamp', () => {
    it('should format timestamp with weekday', () => {
      // October 27, 2025 is a Monday
      const date = new Date('2025-10-27T14:30:00')
      const result = formatClipTimestamp(date)
      expect(result).toContain('Mon')
      expect(result).toContain('Oct 27, 2025')
      expect(result).toMatch(/2:30/)
    })

    it('should handle AM time', () => {
      const date = new Date('2025-10-27T09:15:00')
      const result = formatClipTimestamp(date)
      expect(result).toContain('Mon')
      expect(result).toMatch(/9:15/)
      expect(result).toContain('AM')
    })

    it('should handle PM time', () => {
      const date = new Date('2025-10-27T15:45:00')
      const result = formatClipTimestamp(date)
      expect(result).toContain('Mon')
      expect(result).toMatch(/3:45/)
      expect(result).toContain('PM')
    })

    it('should handle midnight', () => {
      const date = new Date('2025-10-27T00:00:00')
      const result = formatClipTimestamp(date)
      expect(result).toContain('Mon')
      expect(result).toMatch(/12:00/)
      expect(result).toContain('AM')
    })

    it('should handle noon', () => {
      const date = new Date('2025-10-27T12:00:00')
      const result = formatClipTimestamp(date)
      expect(result).toContain('Mon')
      expect(result).toMatch(/12:00/)
      expect(result).toContain('PM')
    })
  })

  describe('groupClipsByDay', () => {
    const createMockClip = (timestamp: string, id: string): ClipEntry => ({
      id,
      category: 'recent',
      timestamp: new Date(timestamp),
      duration: 60,
      files: [],
      cameras: ['front'],
      hasEvent: false
    })

    it('should group clips by day', () => {
      const clips: ClipEntry[] = [
        createMockClip('2025-10-27T14:30:00', 'clip1'),
        createMockClip('2025-10-27T09:15:00', 'clip2'),
        createMockClip('2025-10-26T16:00:00', 'clip3')
      ]

      const groups = groupClipsByDay(clips)

      expect(groups).toHaveLength(2)
      expect(groups[0]?.dateString).toBe('October 27, 2025')
      expect(groups[0]?.clips).toHaveLength(2)
      expect(groups[1]?.dateString).toBe('October 26, 2025')
      expect(groups[1]?.clips).toHaveLength(1)
    })

    it('should sort clips newest first within each day', () => {
      const clips: ClipEntry[] = [
        createMockClip('2025-10-27T09:15:00', 'clip1'),
        createMockClip('2025-10-27T14:30:00', 'clip2'),
        createMockClip('2025-10-27T11:00:00', 'clip3')
      ]

      const groups = groupClipsByDay(clips)

      expect(groups).toHaveLength(1)
      expect(groups[0]?.clips[0]?.id).toBe('clip2') // 14:30
      expect(groups[0]?.clips[1]?.id).toBe('clip3') // 11:00
      expect(groups[0]?.clips[2]?.id).toBe('clip1') // 09:15
    })

    it('should sort days newest first', () => {
      const clips: ClipEntry[] = [
        createMockClip('2025-10-25T10:00:00', 'clip1'),
        createMockClip('2025-10-27T10:00:00', 'clip2'),
        createMockClip('2025-10-26T10:00:00', 'clip3')
      ]

      const groups = groupClipsByDay(clips)

      expect(groups).toHaveLength(3)
      expect(groups[0]?.dateString).toBe('October 27, 2025')
      expect(groups[1]?.dateString).toBe('October 26, 2025')
      expect(groups[2]?.dateString).toBe('October 25, 2025')
    })

    it('should handle empty clips array', () => {
      const groups = groupClipsByDay([])
      expect(groups).toHaveLength(0)
    })

    it('should handle single clip', () => {
      const clips: ClipEntry[] = [
        createMockClip('2025-10-27T14:30:00', 'clip1')
      ]

      const groups = groupClipsByDay(clips)

      expect(groups).toHaveLength(1)
      expect(groups[0]?.clips).toHaveLength(1)
      expect(groups[0]?.clips[0]?.id).toBe('clip1')
    })

    it('should handle clips spanning midnight', () => {
      const clips: ClipEntry[] = [
        createMockClip('2025-10-27T23:59:00', 'clip1'),
        createMockClip('2025-10-28T00:01:00', 'clip2')
      ]

      const groups = groupClipsByDay(clips)

      expect(groups).toHaveLength(2)
      expect(groups[0]?.dateString).toBe('October 28, 2025')
      expect(groups[1]?.dateString).toBe('October 27, 2025')
    })

    it('should handle same timestamp clips', () => {
      const clips: ClipEntry[] = [
        createMockClip('2025-10-27T14:30:00', 'clip1'),
        createMockClip('2025-10-27T14:30:00', 'clip2')
      ]

      const groups = groupClipsByDay(clips)

      expect(groups).toHaveLength(1)
      expect(groups[0]?.clips).toHaveLength(2)
    })

    it('should group clips across different months', () => {
      const clips: ClipEntry[] = [
        createMockClip('2025-10-31T23:00:00', 'clip1'),
        createMockClip('2025-11-01T01:00:00', 'clip2')
      ]

      const groups = groupClipsByDay(clips)

      expect(groups).toHaveLength(2)
      expect(groups[0]?.dateString).toBe('November 1, 2025')
      expect(groups[1]?.dateString).toBe('October 31, 2025')
    })

    it('should group clips across different years', () => {
      const clips: ClipEntry[] = [
        createMockClip('2024-12-31T23:00:00', 'clip1'),
        createMockClip('2025-01-01T01:00:00', 'clip2')
      ]

      const groups = groupClipsByDay(clips)

      expect(groups).toHaveLength(2)
      expect(groups[0]?.dateString).toBe('January 1, 2025')
      expect(groups[1]?.dateString).toBe('December 31, 2024')
    })
  })
})
