/**
 * Utility for detecting multiple recording clips in a directory based on timestamp gaps
 */

export interface DetectedClip {
  id: string
  startTime: Date
  endTime: Date
  files: File[]
  footageCount: number
  totalDuration: number // estimated total seconds based on footage count
}

interface FileWithTimestamp {
  file: File
  timestamp: Date
  timestampString: string
}

const CLIP_GAP_THRESHOLD_SECONDS = 90 // Gap of 90+ seconds indicates a new clip

/**
 * Parse timestamp from Tesla dashcam filename
 * Format: YYYY-MM-DD_HH-MM-SS-camera.mp4
 */
function parseTimestampFromFilename(filename: string): Date | null {
  const timestampMatch = filename.match(/^(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})/)
  
  if (!timestampMatch || timestampMatch.length < 7) {
    return null
  }

  const [, year, month, day, hour, minute, second] = timestampMatch
  
  // Ensure all components are defined
  if (!year || !month || !day || !hour || !minute || !second) {
    return null
  }
  
  try {
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1, // Month is 0-indexed
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    )
    
    // Validate the date is valid
    if (isNaN(date.getTime())) {
      return null
    }
    
    return date
  } catch {
    return null
  }
}

/**
 * Extract unique timestamps from files (group by timestamp, ignoring camera suffix)
 */
function extractUniqueTimestamps(files: File[]): FileWithTimestamp[] {
  const filesWithTimestamps: FileWithTimestamp[] = []
  const seenTimestamps = new Set<string>()

  for (const file of files) {
    const timestamp = parseTimestampFromFilename(file.name)
    if (!timestamp) {
      console.warn(`Could not parse timestamp from filename: ${file.name}`)
      continue
    }

    // Use ISO string as unique identifier
    const timestampString = timestamp.toISOString()
    
    // Only add one file per timestamp (we'll group all cameras later)
    if (!seenTimestamps.has(timestampString)) {
      filesWithTimestamps.push({
        file,
        timestamp,
        timestampString
      })
      seenTimestamps.add(timestampString)
    }
  }

  // Sort by timestamp
  return filesWithTimestamps.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

/**
 * Detect clips in a collection of Tesla dashcam files
 * Returns an array of clips, where each clip contains files that are temporally close together
 */
export function detectClipsInFiles(files: File[]): DetectedClip[] {
  if (files.length === 0) {
    return []
  }

  // Get unique timestamps (one per footage, regardless of camera count)
  const uniqueTimestamps = extractUniqueTimestamps(files)
  
  if (uniqueTimestamps.length === 0) {
    console.warn('No valid timestamps found in files')
    return []
  }

  // Group timestamps into clips based on gaps
  const clips: DetectedClip[] = []
  
  if (uniqueTimestamps.length === 0) {
    return clips
  }
  
  let currentClipTimestamps: FileWithTimestamp[] = [uniqueTimestamps[0]!]
  
  for (let i = 1; i < uniqueTimestamps.length; i++) {
    const prev = uniqueTimestamps[i - 1]!
    const current = uniqueTimestamps[i]!
    
    const gapSeconds = (current.timestamp.getTime() - prev.timestamp.getTime()) / 1000
    
    if (gapSeconds > CLIP_GAP_THRESHOLD_SECONDS) {
      // Gap detected - finalize current clip and start new one
      clips.push(createClipFromTimestamps(currentClipTimestamps, files))
      currentClipTimestamps = [current]
    } else {
      // Continue current clip
      currentClipTimestamps.push(current)
    }
  }
  
  // Add the last clip
  if (currentClipTimestamps.length > 0) {
    clips.push(createClipFromTimestamps(currentClipTimestamps, files))
  }

  return clips
}

/**
 * Create a clip object from a group of timestamps
 */
function createClipFromTimestamps(timestamps: FileWithTimestamp[], allFiles: File[]): DetectedClip {
  if (timestamps.length === 0) {
    throw new Error('Cannot create clip from empty timestamps array')
  }
  
  const startTime = timestamps[0]!.timestamp
  const endTime = timestamps[timestamps.length - 1]!.timestamp
  
  // Get all files that belong to this clip (all cameras for each timestamp)
  const clipTimestampStrings = new Set(timestamps.map(t => t.timestampString))
  const clipFiles = allFiles.filter(file => {
    const timestamp = parseTimestampFromFilename(file.name)
    return timestamp && clipTimestampStrings.has(timestamp.toISOString())
  })
  
  // Estimate duration (assume ~60 seconds per footage)
  const footageCount = timestamps.length
  const estimatedDuration = footageCount * 60
  
  // Create unique ID based on start timestamp
  const id = `clip-${startTime.getTime()}`
  
  return {
    id,
    startTime,
    endTime,
    files: clipFiles,
    footageCount,
    totalDuration: estimatedDuration
  }
}

/**
 * Check if a directory contains multiple clips and return detection results
 */
export function analyzeClips(files: File[]): {
  hasMultipleClips: boolean
  clips: DetectedClip[]
  singleClipFiles?: File[]
} {
  const clips = detectClipsInFiles(files)
  
  if (clips.length === 0) {
    return {
      hasMultipleClips: false,
      clips: [],
      singleClipFiles: files
    }
  }
  
  if (clips.length === 1) {
    // For single clip, include ALL files (including non-video files like event.json)
    return {
      hasMultipleClips: false,
      clips,
      singleClipFiles: files // Use all files, not just the clip's filtered files
    }
  }
  
  // Log warning when multiple clips detected
  console.warn(`⚠️ Multiple clips detected in directory: ${clips.length} clips found`)
  clips.forEach((clip, index) => {
    const startStr = clip.startTime.toLocaleString()
    const endStr = clip.endTime.toLocaleTimeString()
    console.info(`  Clip ${index + 1}: ${startStr} - ${endStr} (${clip.footageCount} footages)`)
  })
  
  return {
    hasMultipleClips: true,
    clips,
  }
}
