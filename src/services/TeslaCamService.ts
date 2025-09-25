// Sentinel Application Main Service Layer
// Orchestrates the core Tesla dashcam directory validation and video playback functionality

import { FileHandlingService } from './FileHandlingService'
import type { 
  ProcessedVideoFile
} from '@/types'

export class TeslaCamService {
  private fileHandler = new FileHandlingService()

  async processVideoFiles(files: File[]): Promise<ProcessedVideoFile[]> {
    return this.fileHandler.processVideoFiles(files)
  }

  async cleanupResources(): Promise<void> {
    // Clean up file handler resources
    this.fileHandler.revokeAllObjectURLs()
    
    // This is a global cleanup for the service instance
  }

  get fileHandling() {
    return this.fileHandler
  }
}

// Default export for easy consumption
export default TeslaCamService