// Video Player Session Data Model
// Manages synchronized multi-camera video playback state

// Import types we need
import type { FileMetadata, CameraPosition } from './TeslaCamDirectory'

export interface ProcessedVideoFile {
  originalFile: File
  metadata: FileMetadata
  videoElement: HTMLVideoElement
  objectURL: string
  cameraPosition: CameraPosition
  processingTime: number
  isReady: boolean
}