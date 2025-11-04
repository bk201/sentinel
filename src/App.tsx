import { useState, useEffect } from 'react'
import './App.css'
import AppHeader from './components/AppHeader'
import DropZone from './components/DropZone'
import TeslaClipPlayer from './components/TeslaClipPlayer'
import LibrarySidebar from './components/LibrarySidebar'
import ValidationSpinner from './components/ValidationSpinner'
import Disclaimer from './components/Disclaimer'
import ClipSelector from './components/ClipSelector'
import { TeslaCamService } from './services/TeslaCamService'
import { TeslaCamFootageService } from './services/TeslaCamFootageService'
import { LibraryDetectionService } from './services/LibraryDetectionService'
import { LibraryScannerService } from './services/LibraryScannerService'
import { DebugProvider } from './contexts/DebugContext'
import { I18nProvider } from './i18n'
import { analyzeClips, type DetectedClip } from './utils/clipDetectionUtils'
import type { ProcessedVideoFile } from './types'
import type { TeslaClipEvent } from './types/TeslaCamFootage'
import type { TeslaLibrary, ClipEntry, ClipCategory } from './types/library'

function App() {
  const [videoFiles, setVideoFiles] = useState<ProcessedVideoFile[]>([])
  const [event, setEvent] = useState<TeslaClipEvent | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teslaCamService] = useState(() => new TeslaCamService())
  
  // Clip selection state
  const [detectedClips, setDetectedClips] = useState<DetectedClip[]>([])
  const [isSelectingClip, setIsSelectingClip] = useState(false)

  // Library mode state
  const [libraryMode, setLibraryMode] = useState(false)
  const [library, setLibrary] = useState<TeslaLibrary | null>(null)
  const [activeClip, setActiveClip] = useState<ClipEntry | null>(null)
  const [activeCategory, setActiveCategory] = useState<ClipCategory>('recent')
  const [isLibrarySidebarCollapsed, setIsLibrarySidebarCollapsed] = useState(false)
  const [libraryDetectionService] = useState(() => new LibraryDetectionService())
  const [libraryScannerService] = useState(() => new LibraryScannerService())

  // Cleanup function for video resources
  const cleanupVideoResources = (files: ProcessedVideoFile[]) => {
    console.log(`Cleaning up ${files.length} video resources...`)
    files.forEach(file => {
      // Revoke object URL to free memory
      if (file.objectURL) {
        URL.revokeObjectURL(file.objectURL)
      }
      // Pause and remove video element
      if (file.videoElement) {
        file.videoElement.pause()
        file.videoElement.removeAttribute('src')
        file.videoElement.load() // Forces release of resources
      }
    })
  }

  // Handle browser back button to return to dropzone
  useEffect(() => {
    const handlePopState = () => {
      if (videoFiles.length > 0 || libraryMode) {
        // User clicked back, return to dropzone
        handleReset()
      }
    }

    // Push a state when video files are loaded or in library mode
    if (videoFiles.length > 0 || libraryMode) {
      window.history.pushState({ hasContent: true }, '', '')
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [videoFiles.length, libraryMode])

  // Cleanup video resources on component unmount
  useEffect(() => {
    return () => {
      if (videoFiles.length > 0) {
        console.log('Component unmounting, cleaning up video resources')
        cleanupVideoResources(videoFiles)
      }
    }
  }, [videoFiles])

  const handleDirectorySelected = async (directoryData: FileSystemDirectoryHandle | File[]) => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('handleDirectorySelected called with:', Array.isArray(directoryData) ? 'File[]' : 'FileSystemDirectoryHandle')
      
      // Only use library mode if we have FileSystemDirectoryHandle (not File[])
      if (!Array.isArray(directoryData)) {
        console.log('Using File System Access API, validating directory...')
        // Try to validate as Tesla USB root directory
        const validation = await libraryDetectionService.validateDirectory(directoryData)
        
        console.log('Directory validation result:', validation)
        
        if (validation.isValid && validation.isRootDirectory) {
          // It's a root directory! Scan and enter library mode
          console.log('Tesla USB root detected, scanning library...')
          const scannedLibrary = await libraryScannerService.scanLibrary(directoryData)
          setLibrary(scannedLibrary)
          setLibraryMode(true)
          
          // Set initial active category (first non-empty category)
          const firstCategory: ClipCategory = 
            scannedLibrary.categories.recent.length > 0 ? 'recent' :
            scannedLibrary.categories.saved.length > 0 ? 'saved' : 'sentry'
          setActiveCategory(firstCategory)
          
          // Auto-select first clip in the active category
          const firstClip = scannedLibrary.categories[firstCategory][0]
          if (firstClip) {
            await handleLibraryClipSelect(firstClip)
          }
          
          setIsLoading(false)
          return
        }
        
        // If validation says it's a fallback (video files in directory), continue with normal flow
        console.log('Not a root directory, using fallback mode')
      }
      
      // Normal single-clip flow (existing code)
      let files: File[] = []
      
      if (Array.isArray(directoryData)) {
        // File input fallback - analyze structure for library mode
        console.log('Analyzing file paths for library structure...')
        
        // Check if files have paths indicating RecentClips/SavedClips/SentryClips structure
        const hasLibraryStructure = directoryData.some(file => {
          const path = file.webkitRelativePath || file.name
          return path.includes('RecentClips') || path.includes('SavedClips') || path.includes('SentryClips')
        })
        
        if (hasLibraryStructure) {
          console.log('Library structure detected in file paths, entering library mode...')
          // Enter library mode using file path analysis
          const scannedLibrary = await libraryScannerService.scanLibraryFromFiles(directoryData)
          setLibrary(scannedLibrary)
          setLibraryMode(true)
          
          // Set initial active category
          const { recent: recentClips, saved: savedClips } = scannedLibrary.categories
          const firstCategory: ClipCategory = 
            recentClips.length > 0 ? 'recent' :
            savedClips.length > 0 ? 'saved' : 'sentry'
          setActiveCategory(firstCategory)
          
          // Auto-select first clip
          const firstClip = scannedLibrary.categories[firstCategory][0]
          if (firstClip) {
            await handleLibraryClipSelect(firstClip)
          }
          
          setIsLoading(false)
          return
        }
        
        console.log('No library structure, processing as single clip')
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

  const handleLibraryClipSelect = async (clip: ClipEntry) => {
    setActiveClip(clip)
    setIsLoading(true)
    setError(null)

    try {
      console.log(`Loading clip from library: ${clip.id}`)

      // Clean up old video resources before loading new ones
      if (videoFiles.length > 0) {
        cleanupVideoResources(videoFiles)
      }

      // Get files from the clip
      const files = clip.files

      // Parse event.json if present
      const parsedEvent = await TeslaCamFootageService.parseEventJson(files)
      setEvent(parsedEvent)

      // Filter to only video files (exclude event.json, thumb.png, etc.)
      const clipVideoFiles = files.filter(f => f.name.endsWith('.mp4'))
      
      if (clipVideoFiles.length === 0) {
        throw new Error('No video files found in clip')
      }

      // Process files using TeslaCamService
      const processedFiles = await teslaCamService.processVideoFiles(clipVideoFiles)
      setVideoFiles(processedFiles)
    } catch (err) {
      console.error('Failed to load clip:', err)
      setError(err instanceof Error ? err.message : 'Failed to load clip')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLibraryCategoryChange = (category: ClipCategory) => {
    setActiveCategory(category)
    
    // Auto-select first clip in the new category
    if (library) {
      const firstClip = library.categories[category][0]
      if (firstClip) {
        handleLibraryClipSelect(firstClip)
      } else {
        // Category is empty, clear player
        setVideoFiles([])
        setEvent(undefined)
        setActiveClip(null)
      }
    }
  }

  const handleReset = () => {
    // Clean up video resources before clearing state
    if (videoFiles.length > 0) {
      cleanupVideoResources(videoFiles)
    }
    
    // Clean up thumbnail URLs from library
    if (library) {
      const allClips = [
        ...library.categories.recent,
        ...library.categories.saved,
        ...library.categories.sentry
      ]
      allClips.forEach(clip => {
        if (clip.thumbnailUrl) {
          URL.revokeObjectURL(clip.thumbnailUrl)
        }
      })
    }
    
    setVideoFiles([])
    setEvent(undefined)
    setError(null)
    setLibraryMode(false)
    setLibrary(null)
    setActiveClip(null)
    setActiveCategory('recent')
  }

  return (
    <DebugProvider>
      <div className="app">
        <AppHeader 
          {...((videoFiles.length > 0 || libraryMode) && { onLogoClick: handleReset })}
        />

        <main className={`app-main ${libraryMode ? 'library-mode' : ''}`}>
          {!isLoading && videoFiles.length === 0 && !libraryMode ? (
              <DropZone 
                onDirectorySelected={handleDirectorySelected}
                isLoading={isLoading}
                validationError={error}
                onClearError={() => setError(null)}
              />
          ) : libraryMode && library ? (
            <>
              <LibrarySidebar
                library={library}
                activeCategory={activeCategory}
                activeClipId={activeClip?.id || null}
                onCategoryChange={handleLibraryCategoryChange}
                onClipSelect={handleLibraryClipSelect}
                isCollapsed={isLibrarySidebarCollapsed}
                onToggleCollapse={() => setIsLibrarySidebarCollapsed(!isLibrarySidebarCollapsed)}
              />
              <div className="tesla-clip-player-container">
                {isLoading ? (
                  <ValidationSpinner />
                ) : videoFiles.length > 0 ? (
                  <TeslaClipPlayer 
                    videoFiles={videoFiles}
                    {...(event && { event })}
                    onReset={handleReset}
                  />
                ) : (
                  <div className="no-clip-selected">
                    <p>Select a clip from the sidebar to view</p>
                  </div>
                )}
              </div>
            </>
          ) : videoFiles.length > 0 ? (
            <TeslaClipPlayer 
              videoFiles={videoFiles}
              {...(event && { event })}
              onReset={handleReset}
            />
          ) : null}
        </main>

        {videoFiles.length === 0 && !libraryMode && <Disclaimer />}
        
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

function AppWithProviders() {
  return (
    <I18nProvider>
      <App />
    </I18nProvider>
  )
}

// Enable why-did-you-render tracking for this component
if (import.meta.env.DEV) {
  App.whyDidYouRender = true
  console.log('✅ App component marked for WDYR tracking')
}

export default AppWithProviders
