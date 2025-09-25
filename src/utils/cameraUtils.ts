// Camera utility functions

import type { CameraPosition } from '../types'

/**
 * Get display name for camera position
 * @param position - Camera position identifier
 * @returns Human-readable camera name
 */
export function getCameraDisplayName(position: CameraPosition | string): string {
  switch (position) {
    case 'front':
      return 'FRONT'
    case 'back':
      return 'REAR'
    case 'left_repeater':
      return 'LEFT'
    case 'right_repeater':
      return 'RIGHT'
    default:
      return position.toUpperCase()
  }
}

/**
 * Format time in seconds to MM:SS format
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format absolute time by adding offset seconds to a base timestamp
 * @param baseDate - Base date/time to start from
 * @param offsetSeconds - Seconds to add to the base time
 * @returns Formatted time string (HH:MM:SS)
 */
export function formatAbsoluteTime(baseDate: Date, offsetSeconds: number): string {
  const absoluteTime = new Date(baseDate.getTime() + offsetSeconds * 1000)
  const hours = absoluteTime.getHours().toString().padStart(2, '0')
  const mins = absoluteTime.getMinutes().toString().padStart(2, '0')
  const secs = absoluteTime.getSeconds().toString().padStart(2, '0')
  return `${hours}:${mins}:${secs}`
}
