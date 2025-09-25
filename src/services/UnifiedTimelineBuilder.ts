// Unified Timeline Builder
// Converts a Tesla dashcam clip into a unified continuous timeline

import type { TeslaClip } from '../types/TeslaCamFootage'
import type { UnifiedTimeline, FootageBoundary } from '../types/UnifiedTimeline'

export class UnifiedTimelineBuilder {
  /**
   * Build a unified timeline from a Tesla clip
   */
  static buildFromClip(clip: TeslaClip): UnifiedTimeline {
    const footages = clip.footages
    const footageBoundaries: FootageBoundary[] = []
    let totalDuration = 0

    // Calculate boundaries for each footage
    for (let i = 0; i < footages.length; i++) {
      const footage = footages[i]
      if (!footage) continue
      
      const startTime = totalDuration
      const endTime = startTime + footage.duration
      
      footageBoundaries.push({
        footageIndex: i,
        startTime,
        endTime,
        duration: footage.duration,
        timestamp: footage.timestamp
      })
      
      totalDuration = endTime
    }

    return {
      footages,
      totalDuration,
      footageBoundaries,
      clipId: clip.clipId,
      clip // Add reference to original clip
    }
  }

  /**
   * Convert global time to footage-specific position
   */
  static globalToLocal(timeline: UnifiedTimeline, globalTime: number): {
    footageIndex: number
    localTime: number
    footageStartTime: number
  } {
    // Clamp global time to valid range
    const clampedTime = Math.max(0, Math.min(globalTime, timeline.totalDuration))
    
    // Find which footage this time falls into
    for (let i = 0; i < timeline.footageBoundaries.length; i++) {
      const boundary = timeline.footageBoundaries[i]
      if (boundary && clampedTime >= boundary.startTime && clampedTime < boundary.endTime) {
        const result = {
          footageIndex: i,
          localTime: clampedTime - boundary.startTime,
          footageStartTime: boundary.startTime
        }
        console.debug(`GlobalToLocal: ${globalTime} -> Footage ${i}, Local ${result.localTime}`)
        return result
      }
    }
    
    // Handle the exact end time case - assign to the last footage
    if (clampedTime === timeline.totalDuration && timeline.footageBoundaries.length > 0) {
      const lastBoundary = timeline.footageBoundaries[timeline.footageBoundaries.length - 1]
      if (lastBoundary) {
        const result = {
          footageIndex: timeline.footageBoundaries.length - 1,
          localTime: lastBoundary.duration,
          footageStartTime: lastBoundary.startTime
        }
        console.log(`GlobalToLocal (end): ${globalTime} -> Footage ${result.footageIndex}, Local ${result.localTime}`)
        return result
      }
    }
    
    // Fallback to last footage if somehow we didn't find a match
    const lastBoundary = timeline.footageBoundaries[timeline.footageBoundaries.length - 1]
    if (lastBoundary) {
      return {
        footageIndex: timeline.footageBoundaries.length - 1,
        localTime: lastBoundary.duration,
        footageStartTime: lastBoundary.startTime
      }
    }
    
    // Ultimate fallback
    return {
      footageIndex: 0,
      localTime: 0,
      footageStartTime: 0
    }
  }

  /**
   * Convert local footage time to global timeline position
   */
  static localToGlobal(timeline: UnifiedTimeline, footageIndex: number, localTime: number): number {
    if (footageIndex < 0 || footageIndex >= timeline.footageBoundaries.length) {
      return 0
    }
    
    const boundary = timeline.footageBoundaries[footageIndex]
    if (!boundary) {
      return 0
    }
    
    const clampedLocalTime = Math.max(0, Math.min(localTime, boundary.duration))
    return boundary.startTime + clampedLocalTime
  }
}