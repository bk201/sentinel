import { useState, useEffect } from 'react'
import './App.css'
import AppHeader from './components/AppHeader'
import DropZone from './components/DropZone'
import TeslaClipPlayer from './components/TeslaClipPlayer'
import ValidationSpinner from './components/ValidationSpinner'
import Disclaimer from './components/Disclaimer'
import ClipSelector from './components/ClipSelector'
import { TeslaCamService } from './services/TeslaCamService'
import { TeslaCamFootageService } from './services/TeslaCamFootageService'
import { DebugProvider } from './contexts/DebugContext'
import { analyzeClips, type DetectedClip } from './utils/clipDetectionUtils'
import type { ProcessedVideoFile } from './types'
import type { TeslaClipEvent } from './types/TeslaCamFootage'

function App() {
  const [videoFiles, setVideoFiles] = useState<ProcessedVideoFile[]>([])
  const [event, setEvent] = useState<TeslaClipEvent | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teslaCamService] = useState(() => new TeslaCamService())
  
  // Clip selection state
  const [detectedClips, setDetectedClips] = useState<DetectedClip[]>([])
  const [isSelectingClip, setIsSelectingClip] = useState(false)

  // Handle browser back button to return to dropzone
  useEffect(() => {
    const handlePopState = () => {
      if (videoFiles.length > 0) {
        // User clicked back, return to dropzone
        handleReset()
      }
    }

    // Push a state when video files are loaded
    if (videoFiles.length > 0) {
      window.history.pushState({ hasVideos: true }, '', '')
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [videoFiles.length])

  const handleDirectorySelected = async (directoryData: FileSystemDirectoryHandle | File[]) => {
    setIsLoading(true)
    setError(null)
    
    try {
      let files: File[] = []
      
      if (Array.isArray(directoryData)) {
        // File input fallback - files already available
        // Filter to only include files in the root directory (not subdirectories)
        files = directoryData.filter(file => {
          const relativePath = file.webkitRelativePath || ''
          if (!relativePath) {
            // No relative path means it's a direct file
            return true
          }
          // Count path separators - if there's only one, it means directoryName/fileName (root level)
          // If there are more, it means directoryName/subdirectory/fileName (should be excluded)
          const pathParts = relativePath.split('/')
          return pathParts.length === 2 // directoryName/fileName
        })
      } else {
        // File System Access API - need to iterate through directory
        // This API only iterates direct children by default (non-recursive)
        try {
          // @ts-ignore - FileSystemDirectoryHandle values() method
          for await (const handle of directoryData.values()) {
            if (handle.kind === 'file') {
              const file = await handle.getFile()
              files.push(file)
            }
          }
        } catch (iterationError) {
          console.warn('Directory iteration failed:', iterationError)
          throw new Error('Directory access not supported in this browser')
        }
      }
      
      for (const file of files) {
        console.debug(`File: ${file.name}, Size: ${file.size}, Type: ${file.type}, Relative Path: ${file.webkitRelativePath}`)
      }
      
      // Detect multiple clips in directory
      const clipAnalysis = analyzeClips(files)
      
      if (clipAnalysis.hasMultipleClips) {
        // Multiple clips detected - show selection modal
        console.log(`Detected ${clipAnalysis.clips.length} clips, showing selector...`)
        setDetectedClips(clipAnalysis.clips)
        setIsSelectingClip(true)
        setIsLoading(false)
        return
      }
      
      // Single clip or no clips - process normally
      const filesToProcess = clipAnalysis.singleClipFiles || files
      
      // Parse event.json if present using service
      const parsedEvent = await TeslaCamFootageService.parseEventJson(filesToProcess)
      setEvent(parsedEvent)
      if (parsedEvent) {
        console.log('Parsed event.json:', parsedEvent)
      }
      
      // Process files using TeslaCamService
      const processedFiles = await teslaCamService.processVideoFiles(filesToProcess)
      setVideoFiles(processedFiles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process directory')
      console.error('Directory processing error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClipSelected = async (selectedClip: DetectedClip) => {
    setIsSelectingClip(false)
    setIsLoading(true)
    setError(null)
    
    try {
      console.log(`Loading selected clip: ${selectedClip.id} with ${selectedClip.footageCount} footages`)
      
      // Parse event.json if present using service
      const parsedEvent = await TeslaCamFootageService.parseEventJson(selectedClip.files)
      setEvent(parsedEvent)
      if (parsedEvent) {
        console.log('Parsed event.json:', parsedEvent)
      }
      
      // Process files using TeslaCamService
      const processedFiles = await teslaCamService.processVideoFiles(selectedClip.files)
      setVideoFiles(processedFiles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process selected clip')
      console.error('Clip processing error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClipSelectionCancel = () => {
    setIsSelectingClip(false)
    setDetectedClips([])
  }

  const handleReset = () => {
    setVideoFiles([])
    setEvent(undefined)
    setError(null)
  }

  return (
    <DebugProvider>
      <div className="app">
        <AppHeader 
          {...(videoFiles.length > 0 && { onLogoClick: handleReset })}
        />

        <main className="app-main">
          {!isLoading && videoFiles.length === 0 ? (
              <DropZone 
                onDirectorySelected={handleDirectorySelected}
                isLoading={isLoading}
                validationError={error}
                onClearError={() => setError(null)}
              />
          ) : isLoading ? (
            <ValidationSpinner />
          ) : (
            <TeslaClipPlayer 
              videoFiles={videoFiles}
              {...(event && { event })}
              onReset={handleReset}
            />
          )}
        </main>

        {videoFiles.length === 0 && <Disclaimer />}
        
        {/* Clip Selection Modal */}
        {isSelectingClip && detectedClips.length > 0 && (
          <ClipSelector
            clips={detectedClips}
            onSelectClip={handleClipSelected}
            onCancel={handleClipSelectionCancel}
          />
        )}
      </div>
    </DebugProvider>
  )
}

// Enable why-did-you-render tracking for this component
if (import.meta.env.DEV) {
  App.whyDidYouRender = true
  console.log('✅ App component marked for WDYR tracking')
}

export default App
