// File System Access API types
declare global {
  interface Window {
    showDirectoryPicker?: (options?: {
      mode?: 'read' | 'readwrite'
      id?: string
      startIn?: FileSystemHandle | string
    }) => Promise<FileSystemDirectoryHandle>
  }

  interface DataTransferItem {
    getAsFileSystemHandle?: () => Promise<FileSystemHandle>
  }

  interface FileSystemHandle {
    kind: 'file' | 'directory'
    name: string
  }
}

// Ensure this is treated as a module
export {}