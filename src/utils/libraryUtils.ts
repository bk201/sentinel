/**
 * Utility functions for working with library clips
 */

import type { ClipEntry, ClipDayGroup } from '@/types/library'

/**
 * Group clips by day for display with separators
 */
export function groupClipsByDay(clips: ClipEntry[]): ClipDayGroup[] {
  const groups = new Map<string, ClipEntry[]>()

  for (const clip of clips) {
    // Create date string for grouping using local date (YYYY-MM-DD)
    const year = clip.timestamp.getFullYear()
    const month = String(clip.timestamp.getMonth() + 1).padStart(2, '0')
    const day = String(clip.timestamp.getDate()).padStart(2, '0')
    const dateKey = `${year}-${month}-${day}`
    
    if (!groups.has(dateKey)) {
      groups.set(dateKey, [])
    }
    groups.get(dateKey)!.push(clip)
  }

  // Convert to array and sort by date (newest first)
  const dayGroups: ClipDayGroup[] = []
  
  for (const [dateKey, clipsList] of groups.entries()) {
    const date = new Date(dateKey + 'T00:00:00')
    const dateString = formatDateForDisplay(date)
    
    // Sort clips within the day (newest first)
    const sortedClips = clipsList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    
    dayGroups.push({
      date,
      dateString,
      clips: sortedClips,
    })
  }

  // Sort by date (newest first)
  return dayGroups.sort((a, b) => b.date.getTime() - a.date.getTime())
}

/**
 * Format date for display (e.g., "October 27, 2025")
 */
export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format clip timestamp with weekday (e.g., "Monday, Oct 27, 2025 8:42 AM")
 * Uses user's locale for internationalization
 */
export function formatClipTimestamp(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: undefined, // Use locale's default 12/24 hour format
  })
}

/**
 * Format duration in seconds to human-readable format (e.g., "2m 15s" or "1h 5m 30s")
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`
  }

  if (minutes === 0) {
    return `${remainingSeconds}s`
  }

  if (remainingSeconds === 0) {
    return `${minutes}m 0s`
  }

  return `${minutes}m ${remainingSeconds}s`
}
