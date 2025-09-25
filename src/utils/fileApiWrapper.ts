/**
 * File System Access API wrapper with Drag & Drop fallback
 * Provides a unified interface for directory selection across different browsers
 */

export interface FileSystemWrapper {
  supportsDirectoryPicker: boolean
  selectDirectory(): Promise<FileSystemDirectoryHandle | null>
  handleDragDrop(event: DragEvent): Promise<FileSystemDirectoryHandle | null>
}

class ModernFileSystemWrapper implements FileSystemWrapper {
  public readonly supportsDirectoryPicker: boolean

  constructor() {
    this.supportsDirectoryPicker = typeof window !== 'undefined' && 'showDirectoryPicker' in window
  }

  async selectDirectory(): Promise<FileSystemDirectoryHandle | null> {
    if (!this.supportsDirectoryPicker || !window.showDirectoryPicker) {
      throw new Error('File System Access API not supported')
    }

    try {
      const directoryHandle = await window.showDirectoryPicker({
        mode: 'read'
      })
      return directoryHandle
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return null // User cancelled
      }
      throw error
    }
  }

  async handleDragDrop(event: DragEvent): Promise<FileSystemDirectoryHandle | null> {
    event.preventDefault()
    
    if (!event.dataTransfer) {
      throw new Error('No data transfer available')
    }

    // Check if File System Access API is available for drag & drop
    if (this.supportsDirectoryPicker) {
      // Modern browsers with File System Access API
      const items = Array.from(event.dataTransfer.items)
      
      for (const item of items) {
        if (item.kind === 'file') {
          const handle = await item.getAsFileSystemHandle?.()
          if (handle && handle.kind === 'directory') {
            return handle as FileSystemDirectoryHandle
          }
        }
      }
    }

    // Fallback for browsers without full File System Access API support
    return this.handleLegacyDragDrop(event)
  }

  private async handleLegacyDragDrop(event: DragEvent): Promise<FileSystemDirectoryHandle | null> {
    if (!event.dataTransfer) {
      return null
    }

    const items = Array.from(event.dataTransfer.items)
    const files = Array.from(event.dataTransfer.files)

    // Check if we have directory entries (WebKit)
    for (const item of items) {
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry?.()
        if (entry?.isDirectory) {
          // For legacy support, we'd need to convert WebKit entries to File System Access API format
          // This is complex and has limitations, so we'll throw an informative error
          throw new Error(
            'Drag & drop directory support is limited in this browser. ' +
            'Please use the "Select Directory" button instead.'
          )
        }
      }
    }

    // Check if we have individual files that might be from a Tesla directory
    if (files.length > 0) {
      const videoFiles = files.filter(file => 
        file.type.startsWith('video/') && file.name.toLowerCase().endsWith('.mp4')
      )
      
      if (videoFiles.length > 0) {
        throw new Error(
          'Individual video files detected. Please drop the entire Tesla dashcam directory instead.'
        )
      }
    }

    return null
  }
}

class LegacyFileSystemWrapper implements FileSystemWrapper {
  public readonly supportsDirectoryPicker = false

  async selectDirectory(): Promise<FileSystemDirectoryHandle | null> {
    throw new Error(
      'Directory selection not supported in this browser. ' +
      'Please use a modern browser with File System Access API support (Chrome 86+, Edge 86+).'
    )
  }

  async handleDragDrop(event: DragEvent): Promise<FileSystemDirectoryHandle | null> {
    event.preventDefault()
    throw new Error(
      'Drag & drop directory support requires a modern browser. ' +
      'Please use Chrome 86+ or Edge 86+ for full functionality.'
    )
  }
}

// Utility functions
export function createFileSystemWrapper(): FileSystemWrapper {
  const hasFileSystemAPI = typeof window !== 'undefined' && 'showDirectoryPicker' in window
  
  if (hasFileSystemAPI) {
    return new ModernFileSystemWrapper()
  } else {
    return new LegacyFileSystemWrapper()
  }
}

export function detectBrowserCapabilities() {
  if (typeof window === 'undefined') {
    return {
      supportsFileSystemAPI: false,
      supportsIndexedDB: false,
      supportsDragDrop: false,
      browserName: 'unknown'
    }
  }

  const userAgent = navigator.userAgent.toLowerCase()
  let browserName = 'unknown'
  
  if (userAgent.includes('chrome')) browserName = 'chrome'
  else if (userAgent.includes('firefox')) browserName = 'firefox'
  else if (userAgent.includes('safari')) browserName = 'safari'
  else if (userAgent.includes('edge')) browserName = 'edge'

  return {
    supportsFileSystemAPI: 'showDirectoryPicker' in window,
    supportsIndexedDB: 'indexedDB' in window,
    supportsDragDrop: 'DataTransfer' in window && 'FileReader' in window,
    browserName,
    recommendations: getBrowserRecommendations(browserName)
  }
}

function getBrowserRecommendations(browserName: string): string[] {
  const recommendations: string[] = []
  
  switch (browserName) {
    case 'firefox':
      recommendations.push('For full functionality, consider using Chrome or Edge')
      recommendations.push('Directory drag & drop has limited support in Firefox')
      break
    case 'safari':
      recommendations.push('File System Access API not supported in Safari')
      recommendations.push('Use Chrome or Edge for the best experience')
      break
    case 'chrome':
    case 'edge':
      recommendations.push('Full functionality available!')
      break
    default:
      recommendations.push('For best experience, use Chrome 86+ or Edge 86+')
      recommendations.push('Some features may be limited in your current browser')
  }
  
  return recommendations
}

export default createFileSystemWrapper