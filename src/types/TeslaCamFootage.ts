// Tesla Dashcam Footage Data Model
// Represents individual 1-minute video files grouped by timestamp

import type { CameraPosition, ProcessedVideoFile } from './TeslaCamDirectory'

// Tesla dashcam event metadata from event.json (optional)
export interface TeslaClipEvent {
  timestamp: string      // ISO format: "2025-09-27T23:10:29"
  city: string          // City name (may be empty)
  est_lat: string       // Estimated latitude
  est_lon: string       // Estimated longitude
  reason: string        // Event reason (e.g., "user_interaction_dashcam_multifunction_selected")
  camera: string        // Camera identifier
}

// A single footage (1-minute video file from cameras at same timestamp)
export interface TeslaCamFootage {
  // Footage identification
  timestamp: string // YYYY-MM-DD_HH-MM-SS format from filename
  footageDate: Date    // Parsed timestamp as Date object
  duration: number   // Duration of the footage in seconds
  
  // Video files for this footage (multiple camera angles)
  videoFiles: Map<CameraPosition, ProcessedVideoFile>
  availableCameras: CameraPosition[]
  longestDurationCamera: CameraPosition | null
  
  // Footage metadata
  totalSize: number  // Combined size of all videos in this footage
  isComplete: boolean // Whether all expected camera angles are present
  processingTime: number // Time taken to process this footage
}

// Collection of footage files (a TeslaClip contains multiple footages)
export interface TeslaClip {
  // Clip identification
  clipId: string
  directoryName: string
  recordingDate: Date // Date extracted from first footage
  
  // Footages in chronological order (1-minute recordings)
  footages: TeslaCamFootage[]
  currentFootageIndex: number
  
  // Clip metadata
  totalDuration: number    // Sum of all footage durations
  totalFootages: number      // Number of footages in clip
  totalSize: number        // Combined size of all footages
  
  // Event metadata (optional)
  event?: TeslaClipEvent    // Event information from event.json if present
  
  // Playback state
  isPlaying: boolean
  autoAdvance: boolean     // Whether to auto-advance to next footage
  loop: boolean           // Whether to loop back to first footage after last
}

// Footage transition settings
export interface FootageTransitionSettings {
  autoAdvance: boolean     // Automatically play next footage when current ends
  transitionDelay: number  // Delay in ms between footages (default: 500ms)
  seamlessTransition: boolean // Whether to preload next footage for smooth transition
  showFootageIndicator: boolean // Show current footage number in UI
  loop: boolean           // Loop back to first footage after playing all
}

// Footage navigation controls
export interface FootageNavigationState {
  canGoPrevious: boolean
  canGoNext: boolean
  currentFootage: number
  totalFootages: number
  footageProgress: number    // Current footage progress (0-1)
  clipProgress: number   // Overall clip progress (0-1)
}

// Footage processing result
export interface FootageProcessingResult {
  success: boolean
  clip: TeslaClip | null
  errors: string[]
  warnings: string[]
  processingTime: number
}
