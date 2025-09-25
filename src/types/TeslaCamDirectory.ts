// TeslaCam Directory Data Model
// Represents a Tesla dashcam recording session directory

export interface TeslaCamDirectory {
  name: string
  path: string
  timestamp: Date
  cameraCount: number
  totalSize: number
}

export interface ValidationError {
  code: string
  message: string
  severity: 'error' | 'warning' | 'info'
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

export type CameraPosition = 'front' | 'back' | 'left_repeater' | 'right_repeater'

export interface VideoResolution {
  width: number
  height: number
}

export interface VideoFile {
  name: string
  path: string
  size: number
  lastModified: Date
  cameraPosition: CameraPosition
  duration: number
  resolution: VideoResolution
  fps: number
  codec: string
}

export interface FileMetadata {
  duration: number
  resolution: VideoResolution
  fps: number
  codec: string
  bitrate: number
  fileSize: number
  createdAt: Date
  cameraPosition: CameraPosition
  isValid: boolean
  errors: ValidationError[]
}

export interface ProcessedVideoFile {
  originalFile: File
  metadata: FileMetadata
  videoElement: HTMLVideoElement
  objectURL: string
  cameraPosition: CameraPosition
  processingTime: number
  isReady: boolean
}