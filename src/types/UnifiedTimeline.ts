// Unified Timeline Types
// Combines multiple Tesla dashcam footages into a single continuous timeline

import type { TeslaCamFootage, TeslaClip } from './TeslaCamFootage'

// Boundary between footages in the unified timeline
export interface FootageBoundary {
  footageIndex: number
  startTime: number       // Global time when this footage starts
  endTime: number         // Global time when this footage ends
  duration: number        // Duration of this footage
  timestamp: string       // Footage timestamp for display
}

// Unified timeline data structure
export interface UnifiedTimeline {
  footages: TeslaCamFootage[]
  totalDuration: number           // Total duration across all footages
  footageBoundaries: FootageBoundary[] // Timeline positions for each footage
  clipId: string
  clip: TeslaClip                 // Reference to the original clip (includes event data)
}
