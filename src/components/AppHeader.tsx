import React from 'react'
import { useDebugMode } from '../contexts/DebugContext'
import testSamplePaths from '../config/test-sample-paths'
import './AppHeader.css'

interface AppHeaderProps {
  onLogoClick?: () => void
}

const AppHeader: React.FC<AppHeaderProps> = ({ onLogoClick }) => {
  const isDevelopment = import.meta.env.DEV
  const { debugMode, setDebugMode } = useDebugMode()

  return (
    <header className="app-header compact">
      <div className="header-content">
        <h1 
          className="header-title"
          onClick={onLogoClick}
          style={{ cursor: onLogoClick ? 'pointer' : 'default' }}
          title={onLogoClick ? 'Back to Home' : undefined}
        >
          Sentinel
        </h1>
      </div>
      <a 
        href="https://github.com/bk201/sentinel" 
        target="_blank" 
        rel="noopener noreferrer"
        className="github-link"
        title="View on GitHub"
        aria-label="View source code on GitHub"
      >
        <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>
      </a>
      {isDevelopment && (
        <>
          <button
            className="load-test-btn"
            onClick={async () => {
              try {
                const files: File[] = await Promise.all(testSamplePaths.map(async (p) => {
                  const res = await fetch(p)
                  if (!res.ok) throw new Error(`Failed to fetch ${p} (status ${res.status})`)
                  const blob = await res.blob()
                  const name = p.split('/').pop() || 'sample'
                  return new File([blob], name, { type: blob.type || 'application/octet-stream' })
                }))

                // Dispatch a global event so the DropZone or other components can pick up the files
                window.dispatchEvent(new CustomEvent('teslacam:load-test-files', { detail: { files } }))
              } catch (err) {
                // eslint-disable-next-line no-console
                console.error('Failed to load test files', err)
                // swallow error — this is a dev convenience
              }
            }}
            title="Load test files from public/output"
            aria-label="Load test files"
          >
            Load Test Files
          </button>

          <button
            className="debug-toggle-btn"
            onClick={() => setDebugMode(!debugMode)}
            title={debugMode ? "Hide debug controls" : "Show debug controls"}
            aria-label={debugMode ? "Hide debug controls" : "Show debug controls"}
          >

          {debugMode ? 'Debug ON' : 'Debug OFF️'}
        </button>
        </>
      )}
    </header>
  )
}

export default AppHeader