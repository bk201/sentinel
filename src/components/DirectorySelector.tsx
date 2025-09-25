import { useState, useCallback } from 'react'
// import { DirectoryValidationService } from '../services/DirectoryValidationService'
// import { FileHandlingService } from '../services/FileHandlingService'
import type { ProcessedVideoFile } from '../types'
import './DirectorySelector.css'

interface DirectorySelectorProps {
  onDirectorySelected: (files: ProcessedVideoFile[]) => void
  isLoading: boolean
}

const DirectorySelector: React.FC<DirectorySelectorProps> = ({ 
  onDirectorySelected, 
  isLoading 
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supportsFSAPI] = useState(
    typeof window !== 'undefined' && 'showDirectoryPicker' in window
  )

  // For now, create mock data for demonstration
  const createMockProcessedFiles = (): ProcessedVideoFile[] => {
    const mockFiles: ProcessedVideoFile[] = []
    const cameras = ['front', 'back', 'left_repeater', 'right_repeater'] as const
    
    cameras.forEach((camera, index) => {
      // Create mock file
      const mockFile = new File([''], `2024-03-15_10-30-45-${camera}.mp4`, { type: 'video/mp4' })
      
      // Create mock video element
      const mockVideoElement = document.createElement('video')
      mockVideoElement.src = `blob:mock-${camera}-${Date.now()}`
      
      mockFiles.push({
        originalFile: mockFile,
        metadata: {
          duration: 60 + index * 10, // Different durations for demo
          resolution: { width: 1920, height: 1080 },
          fps: 30,
          codec: 'h264',
          bitrate: 5000000,
          fileSize: 50000000 + index * 10000000,
          createdAt: new Date(),
          cameraPosition: camera,
          isValid: true,
          errors: []
        },
        videoElement: mockVideoElement,
        objectURL: mockVideoElement.src,
        cameraPosition: camera,
        processingTime: 100 + index * 50,
        isReady: true
      })
    })
    
    return mockFiles
  }

  const processDirectory = useCallback(async () => {
    try {
      setError(null)
      
      // Create mock processed files for demonstration
      const mockProcessedFiles = createMockProcessedFiles()
      onDirectorySelected(mockProcessedFiles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process directory')
    }
  }, [onDirectorySelected])

  const handleDirectorySelect = async () => {
    if (!supportsFSAPI) {
      // For demo purposes, just show mock data
      await processDirectory()
      return
    }

    try {
      // For now, just show mock data regardless of API support
      await processDirectory()
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      setError(err instanceof Error ? err.message : 'Failed to select directory')
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    // For demo, just process mock files
    await processDirectory()
  }

  return (
    <div className="directory-selector">
      <div className="selector-content">
        <h2>Select Tesla Dashcam Directory</h2>
        <p className="instruction">
          Choose a directory containing your Tesla dashcam recordings.
          Your videos will be processed entirely in your browser for privacy.
        </p>

        <div 
          className={`drop-zone ${dragActive ? 'active' : ''} ${isLoading ? 'loading' : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Processing videos...</p>
            </div>
          ) : (
            <>
              <div className="drop-icon">📁</div>
              <p className="drop-text">
                {supportsFSAPI 
                  ? 'Drop your Tesla dashcam directory here or click to browse'
                  : 'Click to browse for your Tesla dashcam directory'
                }
              </p>
              <button 
                className="select-button"
                onClick={handleDirectorySelect}
                disabled={isLoading}
              >
                {supportsFSAPI ? 'Select Directory' : 'Load Demo Videos'}
              </button>
            </>
          )}
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <div className="requirements">
          <h3>Demo Mode:</h3>
          <ul>
            <li>Click "Load Demo Videos" to see the multi-camera interface</li>
            <li>Full Tesla dashcam directory processing coming soon</li>
            <li>All video processing happens locally in your browser</li>
            <li>Your privacy is protected - no uploads to servers</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default DirectorySelector