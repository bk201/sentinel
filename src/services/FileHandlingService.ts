import type { CameraPosition, ValidationError, FileMetadata, ProcessedVideoFile } from '@/types'

export class FileHandlingService {
  private objectURLs = new Set<string>()
  private readonly MAX_CONCURRENT_LOADS = 4
  private readonly VIDEO_METADATA_TIMEOUT = 10000 // 10 seconds

  async processVideoFiles(files: File[]): Promise<ProcessedVideoFile[]> {
    if (files.length === 0) {
      throw new Error('No files provided for processing')
    }

    // Filter for Tesla dashcam video files
    const videoFiles = files.filter(file => this.isVideoFile(file))
    
    if (videoFiles.length === 0) {
      throw new Error('No Tesla dashcam video files found. Please ensure files follow the pattern YYYY-MM-DD_HH-MM-SS-camera.mp4')
    }

    // Process files in batches to avoid overwhelming the browser
    const batches = this.chunkArray(videoFiles, this.MAX_CONCURRENT_LOADS)
    const processedFiles: ProcessedVideoFile[] = []

    for (const batch of batches) {
      const batchPromises = batch.map(file => this.convertToProcessedVideoFile(file))
      const batchResults = await Promise.all(batchPromises)
      processedFiles.push(...batchResults)
    }

    return processedFiles.sort((a, b) => this.sortByCameraPosition(a, b))
  }

  async createVideoURL(file: File): Promise<string> {
    if (!this.isVideoFile(file)) {
      throw new Error('File does not match Tesla dashcam format (YYYY-MM-DD_HH-MM-SS-camera.mp4)')
    }

    // Create a Blob with an explicit MIME type to improve Safari compatibility
    const mimeType = file.type && file.type.startsWith('video/') ? file.type : 'video/mp4'
    const blob = new Blob([file], { type: mimeType })
    const objectURL = URL.createObjectURL(blob)
    this.objectURLs.add(objectURL)

    return objectURL
  }

  async loadVideoMetadata(file: File): Promise<{ duration: number; width: number; height: number }> {
    return new Promise((resolve, reject) => {
  const video = document.createElement('video')
  const mimeType = file.type && file.type.startsWith('video/') ? file.type : 'video/mp4'
  const blob = new Blob([file], { type: mimeType })
  const objectURL = URL.createObjectURL(blob)

      const cleanup = () => {
        URL.revokeObjectURL(objectURL)
        video.remove()
      }

      const timeout = setTimeout(() => {
        cleanup()
        reject(new Error('Video metadata loading timeout'))
      }, this.VIDEO_METADATA_TIMEOUT)

      video.addEventListener('loadedmetadata', () => {
        clearTimeout(timeout)
        
        const metadata = {
          duration: video.duration || 0,
          width: video.videoWidth || 0,
          height: video.videoHeight || 0
        }

        cleanup()
        resolve(metadata)
      })

      video.addEventListener('error', () => {
        clearTimeout(timeout)
        cleanup()
        reject(new Error(`Failed to load video metadata for ${file.name}`))
      })

      video.preload = 'metadata'
      video.muted = true
      video.src = objectURL
    })
  }

  revokeObjectURL(url: string): void {
    if (this.objectURLs.has(url)) {
      URL.revokeObjectURL(url)
      this.objectURLs.delete(url)
    }
  }

  revokeAllObjectURLs(): void {
    for (const url of this.objectURLs) {
      URL.revokeObjectURL(url)
    }
    this.objectURLs.clear()
  }

  getActiveURLCount(): number {
    return this.objectURLs.size
  }

  async extractVideoMetadata(file: File): Promise<{
    duration: number
    resolution: { width: number; height: number }
    fps: number
    codec: string
    bitrate: number
    fileSize: number
    createdAt: Date
    cameraPosition: CameraPosition
    isValid: boolean
    errors: ValidationError[]
  }> {
    try {
      const metadata = await this.loadVideoMetadata(file)
      const cameraPosition = this.extractCameraPosition(file.name)
      
      // Get codec information - use type detection first and fallback to actual method
      let codec: string
      try {
        codec = this.extractCodecFromType(file.type)
      } catch {
        codec = await this.getVideoCodec(file)
      }
      
      // Validate codec compatibility
      const errors: ValidationError[] = []
      if (this.isUnsupportedCodec(codec)) {
        errors.push({
          code: 'UNSUPPORTED_CODEC',
          message: `Codec '${codec}' may not be supported in all browsers`,
          severity: 'warning'
        })
      }
      
      return {
        duration: metadata.duration,
        resolution: {
          width: metadata.width,
          height: metadata.height
        },
        fps: 30, // Default fps
        codec,
        bitrate: 0, // Would need more sophisticated detection
        fileSize: file.size,
        createdAt: new Date(file.lastModified),
        cameraPosition,
        isValid: true,
        errors
      }
    } catch (error) {
      return {
        duration: 0,
        resolution: { width: 0, height: 0 },
        fps: 0,
        codec: 'unknown',
        bitrate: 0,
        fileSize: file.size,
        createdAt: new Date(file.lastModified),
        cameraPosition: this.extractCameraPosition(file.name),
        isValid: false,
        errors: [{
          code: 'METADATA_EXTRACTION_FAILED',
          message: `Failed to extract metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        }]
      }
    }
  }

  async validateVideoFile(file: File): Promise<boolean> {
    if (!this.isVideoFile(file)) {
      return false
    }

    try {
      const metadata = await this.loadVideoMetadata(file)
      
      // Basic validation checks
      if (metadata.duration <= 0) return false
      if (metadata.width <= 0 || metadata.height <= 0) return false
      
      return true
    } catch {
      return false
    }
  }

  getVideoFileInfo(file: File): {
    name: string
    size: number
    type: string
    lastModified: Date
    isValid: boolean
  } {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified),
      isValid: this.isVideoFile(file)
    }
  }

  private isVideoFile(file: File): boolean {
    // Tesla dashcam filename pattern: YYYY-MM-DD_HH-MM-SS-camera.mp4
    // Examples: 2024-09-26_14-30-45-front.mp4, 2024-09-26_14-30-45-left_repeater.mp4
    
    const filename = file.name.toLowerCase()
    
    // Must be MP4 file
    if (!filename.endsWith('.mp4')) {
      return false
    }

    // Check Tesla dashcam timestamp pattern: YYYY-MM-DD_HH-MM-SS-
    const teslaCamPattern = /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}-/
    return teslaCamPattern.test(filename)
  }

  private async convertToProcessedVideoFile(file: File): Promise<ProcessedVideoFile> {
    const startTime = performance.now()
    
    try {
      const metadata = await this.extractVideoMetadata(file)
      const videoElement = await this.loadVideoElement(file)
      const objectURL = await this.createVideoURL(file)
      
      const processingTime = performance.now() - startTime
      
      return {
        originalFile: file,
        metadata,
        videoElement,
        objectURL,
        cameraPosition: metadata.cameraPosition,
        processingTime,
        isReady: true
      }
    } catch (error) {
      const processingTime = performance.now() - startTime
      const cameraPosition = this.extractCameraPosition(file.name)
      
      // Create minimal metadata for failed files
      const failedMetadata: FileMetadata = {
        duration: 0,
        resolution: { width: 0, height: 0 },
        fps: 0,
        codec: 'unknown',
        bitrate: 0,
        fileSize: file.size,
        createdAt: new Date(file.lastModified),
        cameraPosition,
        isValid: false,
        errors: [{
          code: 'PROCESSING_FAILED',
          message: `Failed to process video file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        }]
      }
      
      return {
        originalFile: file,
        metadata: failedMetadata,
        videoElement: document.createElement('video'), // Empty video element for failed processing
        objectURL: '',
        cameraPosition,
        processingTime,
        isReady: false
      }
    }
  }

  async revokeVideoURL(url: string): Promise<void> {
    if (this.objectURLs.has(url)) {
      URL.revokeObjectURL(url)
      this.objectURLs.delete(url)
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  private extractCameraPosition(filename: string): CameraPosition {
    const name = filename.toLowerCase()
    
    // Tesla dashcam naming convention: timestamp-camera.mp4
    if (name.includes('-front')) return 'front'
    if (name.includes('-left_repeater')) return 'left_repeater'
    if (name.includes('-right_repeater')) return 'right_repeater'
    if (name.includes('-back')) return 'back'
    
    // Fallback patterns
    if (name.includes('front')) return 'front'
    if (name.includes('left')) return 'left_repeater'
    if (name.includes('right')) return 'right_repeater'
    if (name.includes('back') || name.includes('rear')) return 'back'
    
    // Default to front if unknown
    return 'front'
  }

  private extractCodecFromType(mimeType: string): string {
    // Extract codec from MIME type or provide defaults
    if (mimeType.includes('h264')) return 'h264'
    if (mimeType.includes('h265') || mimeType.includes('hevc')) return 'h265'
    if (mimeType.includes('vp8')) return 'vp8'
    if (mimeType.includes('vp9')) return 'vp9'
    if (mimeType.includes('av1')) return 'av1'
    
    // Default based on container
    if (mimeType.includes('mp4')) return 'h264'
    if (mimeType.includes('webm')) return 'vp8'
    if (mimeType.includes('ogg')) return 'theora'
    
    return 'unknown'
  }

  private async getVideoCodec(file: File): Promise<string> {
    return new Promise((resolve) => {
  const video = document.createElement('video')
  const mimeType = file.type && file.type.startsWith('video/') ? file.type : 'video/mp4'
  const blob = new Blob([file], { type: mimeType })
  const objectURL = URL.createObjectURL(blob)

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(objectURL)
        
        // Try to extract codec info from video tracks
        try {
          const videoWithTracks = video as any
          if (videoWithTracks.videoTracks && videoWithTracks.videoTracks.length > 0) {
            const track = videoWithTracks.videoTracks[0]
            if (track.getSettings) {
              const settings = track.getSettings()
              resolve(settings.codec || this.extractCodecFromType(file.type))
              return
            }
          }
        } catch (e) {
          // Ignore errors and fallback
        }
        
        // Fallback to MIME type
        resolve(this.extractCodecFromType(file.type))
      }

      video.onerror = () => {
        URL.revokeObjectURL(objectURL)
        resolve(this.extractCodecFromType(file.type))
      }

      video.src = objectURL
      video.load()
    })
  }

  private isUnsupportedCodec(codec: string): boolean {
    const unsupportedCodecs = ['prores', 'dnxhd', 'av1'] // Example unsupported codecs
    return unsupportedCodecs.includes(codec.toLowerCase())
  }

  private async loadVideoElement(file: File): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
  const video = document.createElement('video')
  const mimeType = file.type && file.type.startsWith('video/') ? file.type : 'video/mp4'
  const blob = new Blob([file], { type: mimeType })
  const objectURL = URL.createObjectURL(blob)

      video.onloadedmetadata = () => {
        resolve(video)
      }

      video.onerror = () => {
        URL.revokeObjectURL(objectURL)
        reject(new Error(`Failed to load video: ${file.name}`))
      }

      video.src = objectURL
      video.load()
    })
  }

  private sortByCameraPosition(a: ProcessedVideoFile, b: ProcessedVideoFile): number {
    const cameraOrder: Record<CameraPosition, number> = {
      'front': 0,
      'back': 1,
      'left_repeater': 2,
      'right_repeater': 3
    }

    const aOrder = cameraOrder[a.cameraPosition] ?? 999
    const bOrder = cameraOrder[b.cameraPosition] ?? 999
    
    if (aOrder !== bOrder) {
      return aOrder - bOrder
    }
    
    // Same camera position, sort by filename
    return a.originalFile.name.localeCompare(b.originalFile.name)
  }
}