import React, { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

interface DebugContextType {
  debugMode: boolean
  setDebugMode: (value: boolean) => void
  traceMode: boolean
  setTraceMode: (value: boolean) => void
  trace: (...args: any[]) => void
}

const DebugContext = createContext<DebugContextType | undefined>(undefined)

declare global {
  interface Window {
    __SENTINEL_setDebug?: (value: boolean) => void
    __SENTINEL_getDebug?: () => boolean
    __SENTINEL_setTrace?: (value: boolean) => void
    __SENTINEL_getTrace?: () => boolean
  }
}

export const DebugProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [debugMode, setDebugMode] = useState(import.meta.env.DEV)
  const [traceMode, setTraceMode] = useState(false)

  // trace() function: logs messages only when traceMode is enabled
  const trace = (...args: any[]) => {
    if (traceMode) {
      console.log('[TRACE]', ...args)
    }
  }

  // Usage: window.__SENTINEL_setDebug(true) or window.__SENTINEL_getDebug()
  useEffect(() => {
    if (!import.meta.env.DEV) return

    window.__SENTINEL_setDebug = setDebugMode
    window.__SENTINEL_getDebug = () => debugMode
    window.__SENTINEL_setTrace = setTraceMode
    window.__SENTINEL_getTrace = () => traceMode

    return () => {
      try {
        // cleanup in case of hot-reload / route unmount
        delete window.__SENTINEL_setDebug
        delete window.__SENTINEL_getDebug
        delete window.__SENTINEL_setTrace
        delete window.__SENTINEL_getTrace
      } catch (e) {
        /* ignore */
      }
    }
  }, [debugMode, traceMode])

  return (
    <DebugContext.Provider value={{ debugMode, setDebugMode, traceMode, setTraceMode, trace }}>
      {children}
    </DebugContext.Provider>
  )
}

export const useDebugMode = () => {
  const context = useContext(DebugContext)
  if (context === undefined) {
    throw new Error('useDebugMode must be used within a DebugProvider')
  }
  return context
}
