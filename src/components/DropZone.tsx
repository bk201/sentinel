import React, { useState, useCallback, useRef, useEffect } from 'react'
import './DropZone.css'

interface DropZoneProps {
  onDirectorySelected: (directoryHandle: FileSystemDirectoryHandle | File[]) => void
  isLoading: boolean
  validationError?: string | null
  onClearError?: () => void
  className?: string
}

const DropZone: React.FC<DropZoneProps> = ({ 
  onDirectorySelected, 
  isLoading,
  validationError,
  onClearError,
  className = '' 
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const supportsFSAPI = typeof window !== 'undefined' && 'showDirectoryPicker' in window

  // Listen for the global dev-only event dispatched by the AppHeader "Load Test Files" button
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const handler = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent).detail
        const files: File[] | undefined = detail?.files
        if (files && files.length > 0) {
          onDirectorySelected(files)
        }
      } catch (e) {
        // ignore
      }
    }

    window.addEventListener('teslacam:load-test-files', handler as EventListener)
    return () => window.removeEventListener('teslacam:load-test-files', handler as EventListener)
  }, [onDirectorySelected])

  const handleDirectorySelect = useCallback(async () => {
    try {
      setError(null)
      
      if (supportsFSAPI && window.showDirectoryPicker) {
        // Use File System Access API for modern browsers
        const directoryHandle = await window.showDirectoryPicker()
        onDirectorySelected(directoryHandle)
      } else {
        // Fallback: use hidden file input for older browsers
        if (fileInputRef.current) {
          fileInputRef.current.click()
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return // User cancelled
      }
      setError(err instanceof Error ? err.message : 'Failed to select folder')
    }
  }, [supportsFSAPI, onDirectorySelected])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      // Convert FileList to array
      const fileArray = Array.from(files)
      onDirectorySelected(fileArray)
    }
    // Reset input so same directory can be selected again
    if (e.target) {
      e.target.value = ''
    }
  }, [onDirectorySelected])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    try {
      const items = Array.from(e.dataTransfer.items)
      const directoryItem = items.find(item => 
        item.kind === 'file' && item.webkitGetAsEntry()?.isDirectory
      )

      if (!directoryItem) {
        setError('Please drop a Tesla dashcam folder')
        return
      }

      // Note: Drag & drop with directories requires the File System Access API
      // This is a simplified implementation - full compatibility would require more work
      setError('Drag & drop folder support is limited. Please use the "Select Folder" button.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process dropped folder')
    }
  }, [])

  return (
    <div className={`drop-zone ${className}`}>
      {validationError && (
        <div className="validation-error-banner">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <h3 className="error-title">Validation Error</h3>
            <p className="error-message">{validationError}</p>
          </div>
          {onClearError && (
            <button 
              className="error-dismiss"
              onClick={onClearError}
              aria-label="Dismiss error"
            >
              ✕
            </button>
          )}
        </div>
      )}
      
      <div 
        className={`drop-area ${dragActive ? 'active' : ''} ${isLoading ? 'loading' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={!isLoading ? handleDirectorySelect : undefined}
        style={{ cursor: !isLoading ? 'pointer' : 'default' }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (!isLoading && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            handleDirectorySelect()
          }
        }}
      >
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Processing folder...</p>
          </div>
        ) : (
          <>
            <div className="drop-icon">📁</div>
            <h3>Select Tesla Dashcam Folder</h3>
            <p className="drop-instruction">
              {supportsFSAPI 
                ? 'Drop your Tesla dashcam folder here or click to browse'
                : 'Click to browse and select a Tesla dashcam folder'
              }
            </p>
            <button 
              className="select-button"
              onClick={(e) => {
                e.stopPropagation() // Prevent triggering the area click
                handleDirectorySelect()
              }}
              disabled={isLoading}
            >
              Select Folder
            </button>

            {/* Hidden file input for browsers without File System Access API */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
              {...({ webkitdirectory: '', directory: '' } as any)}
              multiple
            />
            
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="requirements">
        <h4>Requirements:</h4>
        <ul>
          <li>Tesla dashcam folder with timestamp format (YYYY-MM-DD_HH-MM-SS)</li>
          <li>For example, the "2025-10-20_19-52-58" folder in the "SentryClips" folder</li>
          <li>Works in all modern browsers (Chrome, Firefox, Safari, Edge)</li>
        </ul>
      </div>
    </div>
  )
}

export default DropZone