import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useI18n } from '../i18n'
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
  const { t } = useI18n()
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Test helper input - used by Playwright to upload files directly in tests
  const testFileInputRef = useRef<HTMLInputElement>(null)
  
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
      setError(err instanceof Error ? err.message : t.dropZone.failedToSelect)
    }
  }, [supportsFSAPI, onDirectorySelected, t.dropZone.failedToSelect])

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
        setError(t.dropZone.dropFolderOnly)
        return
      }

      // Note: Drag & drop with directories requires the File System Access API
      // This is a simplified implementation - full compatibility would require more work
      setError(t.dropZone.dragDropLimited)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.dropZone.failedToProcess)
    }
  }, [t.dropZone.dropFolderOnly, t.dropZone.dragDropLimited, t.dropZone.failedToProcess])

  return (
    <div className={`drop-zone ${className}`}>
      {validationError && (
        <div className="validation-error-banner">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <h3 className="error-title">{t.dropZone.validationError}</h3>
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
            <p>{t.dropZone.processingFolder}</p>
          </div>
        ) : (
          <>
            <div className="drop-icon">📁</div>
            <h3>{t.dropZone.title}</h3>
            <p className="drop-instruction">
              {supportsFSAPI 
                ? t.dropZone.dragAndDrop
                : t.dropZone.clickToSelect
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
              {t.dropZone.selectButton}
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
            {/*
              Test-only hidden input: this does not use webkitdirectory.
              Playwright can set files on this input to simulate selecting
              a real Tesla dashcam directory by uploading the individual
              files inside the directory. It intentionally shares the same
              onChange handler so the app processes the FileList the same way.
            */}
            <input
              ref={testFileInputRef}
              data-testid="test-file-input"
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
        <h4>{t.requirements.title}</h4>
        <ul>
          <li>{t.requirements.folderFormat}</li>
          <li>{t.requirements.example}</li>
          <li>{t.requirements.browserSupport}</li>
        </ul>

        <div className="demo-video">
          <a 
            href="https://youtu.be/IIATsttPHDk"
            target="_blank" 
            rel="noopener noreferrer"
            className="video-link"
          >
            <img 
              src="https://img.youtube.com/vi/IIATsttPHDk/hqdefault.jpg"
              alt="Sentinel Demo - How to use the Tesla Dashcam Viewer"
              className="video-thumbnail"
            />
            <div className="play-button-overlay">▶</div>
          </a>
          <p className="video-description">
            {t.requirements.demoVideoDescription}
          </p>
        </div>
      </div>
    </div>
  )
}

export default DropZone