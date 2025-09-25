import '@testing-library/jest-dom'
import { beforeEach, vi } from 'vitest'

// Mock URL.createObjectURL and URL.revokeObjectURL
// Mock URL.createObjectURL with simple tracking
let mockUrlCounter = 0

global.URL = {
  createObjectURL: vi.fn((blob: Blob | MediaSource) => {
    // Include filename if available for testing broken/corrupted files
    let filename = ''
    if (blob instanceof File) {
      filename = blob.name
    }
    const url = `blob:mock-url-${mockUrlCounter++}-${filename}.${Math.random().toString(36).substring(7)}`
    return url
  }),
  revokeObjectURL: vi.fn()
} as any

// Mock HTMLVideoElement for JSDOM compatibility
class MockHTMLVideoElement {
  // Video properties
  src = ''
  currentTime = 0
  duration = 60
  paused = true
  muted = true
  playbackRate = 1
  videoWidth = 1920
  videoHeight = 1080
  readyState = 1 // HAVE_METADATA
  nodeType = 1 // Element
  tagName = 'VIDEO'
  preload = 'metadata'
  playsInline = true
  disableRemotePlayback = false
  crossOrigin = null
  controls = false
  
  // Methods
  load = vi.fn()
  play = vi.fn().mockImplementation(() => {
    this.paused = false
    return Promise.resolve()
  })
  pause = vi.fn().mockImplementation(() => {
    this.paused = true
  })
  remove = vi.fn()
  getAttributeNames = vi.fn().mockReturnValue([])
  getAttribute = vi.fn().mockReturnValue(null)
  setAttribute = vi.fn()
  
  // Event system - simplified to avoid infinite loops
  addEventListener = vi.fn((event: string, handler: EventListener) => {
    if (event === 'loadedmetadata') {
      // Check if this video element should trigger an error
      if (this.src.includes('broken') || this.src.includes('corrupted')) {
        // Don't auto-trigger loadedmetadata for broken videos
        return
      }
      // Auto-trigger loadedmetadata for successful cases
      setTimeout(() => handler(new Event('loadedmetadata')), 10)
    }
    if (event === 'error') {
      // Check if this video element should trigger an error
      if (this.src.includes('broken') || this.src.includes('corrupted')) {
        setTimeout(() => handler(new Event('error')), 15)
      }
    }
  })
  removeEventListener = vi.fn()
  
  // Simulate DOM element properties
  parentNode = null
  style = {}
  children = []
  childNodes = []
  firstChild = null
  lastChild = null
  nextSibling = null
  previousSibling = null
  ownerDocument = null
}

// Set up proper prototype chain so instanceof works
if (typeof HTMLVideoElement !== 'undefined') {
  Object.setPrototypeOf(MockHTMLVideoElement.prototype, HTMLVideoElement.prototype)
} else {
  // Create HTMLVideoElement if it doesn't exist
  globalThis.HTMLVideoElement = MockHTMLVideoElement as any
}

const createMockVideoElement = () => {
  return new MockHTMLVideoElement() as any
}// Mock document.createElement for video elements
global.document = {
  createElement: vi.fn((tagName: string) => {
    if (tagName === 'video') {
      return createMockVideoElement()
    }
    
    return {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      remove: vi.fn()
    }
  })
} as any

// Mock HTMLMediaElement constants
global.HTMLMediaElement = {
  HAVE_NOTHING: 0,
  HAVE_METADATA: 1,
  HAVE_CURRENT_DATA: 2,
  HAVE_FUTURE_DATA: 3,
  HAVE_ENOUGH_DATA: 4
} as any

// Mock FileSystemFileHandle
class MockFileSystemFileHandle {
  kind = 'file' as const
  name: string
  
  constructor(name = 'test-file.mp4') {
    this.name = name
  }
  
  async getFile() {
    const isVideo = this.name.includes('.mp4')
    const isCorrupted = this.name.includes('corrupted')
    
    // Create corrupted files with 0 size
    const fileContent = isCorrupted ? [] : ['test']
    
    return new File(fileContent, this.name, { 
      type: isVideo ? 'video/mp4' : 'application/octet-stream',
      lastModified: Date.now()
    })
  }

  async isSameEntry() {
    return false
  }
}

// Mock FileSystemDirectoryHandle  
class MockFileSystemDirectoryHandle {
  kind = 'directory' as const
  name: string
  private customFiles?: string[]
  
  constructor(name = 'test-directory', files?: string[]) {
    this.name = name
    if (files !== undefined) {
      this.customFiles = files
    }
  }
  
  async *entries(): AsyncIterableIterator<[string, FileSystemHandle]> {
    if (this.customFiles) {
      // Use custom files from constructor
      const mockFiles: Array<[string, MockFileSystemFileHandle]> = this.customFiles.map(fileName => [
        fileName,
        new MockFileSystemFileHandle(fileName)
      ])
      
      for (const [name, handle] of mockFiles) {
        yield [name, handle as FileSystemHandle]
      }
    } else {
      // Default Tesla dashcam directory structure
      const mockFiles: Array<[string, MockFileSystemFileHandle]> = [
        ['2024-03-15_10-30-45-front.mp4', new MockFileSystemFileHandle('2024-03-15_10-30-45-front.mp4')],
        ['2024-03-15_10-30-45-back.mp4', new MockFileSystemFileHandle('2024-03-15_10-30-45-back.mp4')],
        ['2024-03-15_10-30-45-left_repeater.mp4', new MockFileSystemFileHandle('2024-03-15_10-30-45-left_repeater.mp4')],
        ['2024-03-15_10-30-45-right_repeater.mp4', new MockFileSystemFileHandle('2024-03-15_10-30-45-right_repeater.mp4')]
      ]
      
      for (const [name, handle] of mockFiles) {
        yield [name, handle as FileSystemHandle]
      }
    }
  }
  
  async values() {
    const entries = []
    for await (const [, handle] of this.entries()) {
      entries.push(handle)
    }
    return entries[Symbol.iterator]()
  }
  
  async keys() {
    const keys = []
    for await (const [name] of this.entries()) {
      keys.push(name)
    }
    return keys[Symbol.iterator]()
  }
  
  async getDirectoryHandle(name: string) {
    return new MockFileSystemDirectoryHandle(name)
  }
  
  async getFileHandle(name: string) {
    return new MockFileSystemFileHandle(name)
  }

  async isSameEntry() {
    return false
  }
}

// Mock Web APIs that might not be available in jsdom
beforeEach(() => {
  // Mock File System Access API
  if (!('showDirectoryPicker' in window)) {
    Object.defineProperty(window, 'showDirectoryPicker', {
      writable: true,
      value: vi.fn(),
    })
  }

  // Mock FileSystemDirectoryHandle
  if (!('FileSystemDirectoryHandle' in window)) {
    Object.defineProperty(window, 'FileSystemDirectoryHandle', {
      writable: true,
      value: MockFileSystemDirectoryHandle,
    })
  }

  // Mock FileSystemFileHandle
  if (!('FileSystemFileHandle' in window)) {
    Object.defineProperty(window, 'FileSystemFileHandle', {
      writable: true,
      value: MockFileSystemFileHandle,
    })
  }

  // Mock IndexedDB if not available
  if (!('indexedDB' in window)) {
    Object.defineProperty(window, 'indexedDB', {
      writable: true,
      value: {
        open: vi.fn(),
        deleteDatabase: vi.fn(),
        databases: vi.fn(),
      },
    })
  }

  // Mock ServiceWorker
  if (!('serviceWorker' in navigator)) {
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      value: {
        register: vi.fn(),
        ready: Promise.resolve(),
        controller: null,
      },
    })
  }
})

// Enhanced File mock with text() method
const OriginalFile = globalThis.File

class MockFile extends OriginalFile {
  private content: BlobPart[]

  constructor(fileBits: BlobPart[], fileName: string, options?: FilePropertyBag) {
    super(fileBits, fileName, options)
    this.content = fileBits
  }

  override async text(): Promise<string> {
    return this.content.join('')
  }
}

// Replace global File
globalThis.File = MockFile as any

// Export mock utilities for test files
export const createMockVideoFile = (filename: string) => {
  return new File(['mock video content'], filename, {
    type: 'video/mp4',
    lastModified: Date.now()
  })
}

export const createMockDirectoryHandle = (nameOrFiles: string | string[]) => {
  if (Array.isArray(nameOrFiles)) {
    // Create a directory with custom files
    const directoryName = '2024-03-15_10-30-45'
    return new MockFileSystemDirectoryHandle(directoryName, nameOrFiles)
  }
  return new MockFileSystemDirectoryHandle(nameOrFiles)
}

export const createMockFileHandle = (name: string) => {
  return new MockFileSystemFileHandle(name)
}

// Re-export mock classes for direct use
export { MockFileSystemDirectoryHandle, MockFileSystemFileHandle }