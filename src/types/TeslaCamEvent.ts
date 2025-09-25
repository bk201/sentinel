// Tesla Dashcam Event Data Model
// Represents grouped video files by timestamp (event-based playback)

import type { CameraPosition, ProcessedVideoFile } from './TeslaCamDirectory'

// A single Tesla dashcam event (same timestamp across cameras)
export interface TeslaCamEvent {
  // Event identification
  timestamp: string // YYYY-MM-DD_HH-MM-SS format from filename
  eventDate: Date    // Parsed timestamp as Date object
  duration: number   // Duration of the event in seconds
  
  // Video files for this event
  videoFiles: Map<CameraPosition, ProcessedVideoFile>
  availableCameras: CameraPosition[]
  
  // Event metadata
  totalSize: number  // Combined size of all videos in this event
  isComplete: boolean // Whether all expected camera angles are present
  processingTime: number // Time taken to process this event
}

// Collection of Tesla dashcam events from a directory
export interface TeslaCamEventSeries {
  // Series identification
  sessionId: string
  directoryName: string
  recordingDate: Date // Date extracted from first event
  
  // Events in chronological order
  events: TeslaCamEvent[]
  currentEventIndex: number
  
  // Series metadata
  totalDuration: number    // Sum of all event durations
  totalEvents: number      // Number of events in series
  totalSize: number        // Combined size of all events
  
  // Playback state
  isPlaying: boolean
  autoAdvance: boolean     // Whether to auto-advance to next event
  loop: boolean           // Whether to loop back to first event after last
}

// Event transition settings
export interface EventTransitionSettings {
  autoAdvance: boolean     // Automatically play next event when current ends
  transitionDelay: number  // Delay in ms between events (default: 500ms)
  seamlessTransition: boolean // Whether to preload next event for smooth transition
  showEventIndicator: boolean // Show current event number in UI
  loop: boolean           // Loop back to first event after playing all
}

// Event navigation controls
export interface EventNavigationState {
  canGoPrevious: boolean
  canGoNext: boolean
  currentEvent: number
  totalEvents: number
  eventProgress: number    // Current event progress (0-1)
  seriesProgress: number   // Overall series progress (0-1)
}

// Event processing result
export interface EventProcessingResult {
  success: boolean
  eventSeries: TeslaCamEventSeries | null
  errors: string[]
  warnings: string[]
  processingTime: number
}