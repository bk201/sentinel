import { useState, useEffect, useRef, useMemo } from 'react'
import type { CameraPosition, ProcessedVideoFile } from '../types'
import type { UnifiedTimeline } from '../types/UnifiedTimeline'
import type { TeslaClipEvent } from '../types/TeslaCamFootage'
import { TeslaCamFootageService } from '../services/TeslaCamFootageService'
import { UnifiedTimelineBuilder } from '../services/UnifiedTimelineBuilder'
import { useDebugMode } from '../contexts/DebugContext'
import { getCameraDisplayName, formatTime, formatAbsoluteTime } from '../utils/cameraUtils'
import ClipSidebar from './ClipSidebar'
import './TeslaClipPlayer.css'
import './CameraLayout.css'
import './VideoControls.css'

interface TeslaClipPlayerProps {
  videoFiles: ProcessedVideoFile[]
  event?: TeslaClipEvent
  onReset: () => void
}

const TeslaClipPlayer: React.FC<TeslaClipPlayerProps> = ({ videoFiles, event, onReset }) => {
  const { trace, debugMode, setTraceMode } = useDebugMode()

  // Core state
  const [timeline, setTimeline] = useState<UnifiedTimeline | null>(null)
  const [currentFootageId, setCurrentFootageId] = useState<number>(0)

  const [isProcessing, setIsProcessing] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  
  // Focus-and-Strips layout state
  const [focusedCamera, setFocusedCamera] = useState<CameraPosition | null>(null)
  
  // Video play state: set of camera positions that are ready/can be played
  const [videoCanPlayed, setVideoCanPlayed] = useState<Set<string>>(new Set())
  const [isAtEndOfClip, setIsAtEndOfClip] = useState<boolean>(false)

  // Video player refs 
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map())
  const videoEndedFlags = useRef<Map<string, boolean>>(new Map())
  const switchingFootage = useRef<boolean>(false)
  const videoTimeRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const wasPlayingBeforeSeek = useRef<boolean>(false)

  // Controls state
  const [isPlaying, setIsPlaying] = useState(true)
  const [isSeeking, setIsSeeking] = useState(false)
  const [playbackRate, setPlaybackRate] = useState<number>(1)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Control refs
  const displayTimeRef = useRef<HTMLSpanElement>(null)
  const seekRef = useRef<HTMLInputElement>(null)

  // Constants
  const allCameraPositions = useMemo(() => ['front', 'back', 'left_repeater', 'right_repeater'] as const, [])
  const playbackRateOptions = [
    { value: 0.25, label: '0.25×' },
    { value: 0.5, label: '0.5×' },
    { value: 0.75, label: '0.75×' },
    { value: 1, label: 'Normal' },
    { value: 2, label: '2×' },
    { value: 4, label: '4×' },
    { value: 8, label: '8×' }
  ]

  // Initialize timeline
  useEffect(() => {
    setTraceMode(false)

    const initializeTimeline = async () => {
      setIsProcessing(true)
      try {
        const footageService = new TeslaCamFootageService()
        const result = await footageService.processVideoFilesIntoFootages(videoFiles, 'TeslaCam', event)
        
        if (result.success && result.clip) {
          const unifiedTimeline = UnifiedTimelineBuilder.buildFromClip(result.clip)
          setTimeline(unifiedTimeline)
        }
      } catch (error) {
        console.error('Failed to initialize unified timeline:', error)
      } finally {
        setIsProcessing(false)
      }
    }

    if (videoFiles.length > 0) {
      initializeTimeline()
    }

  }, [videoFiles, setTraceMode, event])

  // Calculate event marker position if event exists
  // MUST be before any conditional returns (Rules of Hooks)
  const eventMarkerPosition = useMemo(() => {
    if (!timeline || !timeline.clip.event || !timeline.clip.event.timestamp) return null
    
    try {
      const eventTime = new Date(timeline.clip.event.timestamp)
      const firstFootageTime = timeline.footages[0]?.footageDate
      
      if (!firstFootageTime) return null
      
      // Calculate how many seconds from the start of the clip the event occurs
      const secondsFromStart = (eventTime.getTime() - firstFootageTime.getTime()) / 1000

      // console.log("secondsFromStart for event:", secondsFromStart)
      // console.log('timeline totalDuration:', timeline.totalDuration)
      // Ensure the event is within the timeline bounds
      if (secondsFromStart < 0 || secondsFromStart > timeline.totalDuration) {
        return null
      }

      // console.log("Event marker position calculated:", {  secondsFromStart, percentage: (secondsFromStart / timeline.totalDuration) * 100 })
      
      return {
        seconds: secondsFromStart,
        percentage: (secondsFromStart / timeline.totalDuration) * 100
      }
    } catch (error) {
      console.error('Failed to calculate event position:', error)
      return null
    }
  }, [timeline])

  useEffect(() => {
    if (timeline) {
      allCameraPositions.forEach(pos => {
        const ref = videoRefs.current.get(pos)
        if (ref) {
          ref.pause()
          ref.src = timeline.footages[0]?.videoFiles.get(pos as CameraPosition)?.objectURL || ''
          if (typeof ref.load === 'function') {
            ref.load()
          }   
        }
      })
      // Auto-play on load
      // setIsPlaying(true)
    }
  }, [timeline, allCameraPositions])

  // Update time display and seek bar on video timeupdate
  useEffect(() => {
    console.log(`Current Footage ID changed to: ${currentFootageId}`)
    const currentFootage = timeline?.footages[currentFootageId]
    if (!timeline || !currentFootage) return

    // use the camera with longest duration in the footage to update seekbar time
    // footage videos comes with different durations
    const videoRef = videoRefs.current.get(currentFootage.longestDurationCamera as string)
    if (!videoRef) return

    function update() {
      if (switchingFootage.current) {
        trace('Skip update during footage switch')
        switchingFootage.current = false
        return
      }

      const local = videoRef?.currentTime || 0
      const global = (timeline?.footageBoundaries[currentFootageId]?.startTime || 0 ) + local
      if (seekRef.current) {
        seekRef.current.valueAsNumber = global
        if (timeline) {
          const percentage = timeline?.totalDuration > 0 ? (global / timeline.totalDuration) * 100 : 0
          seekRef.current.style.setProperty('--progress-percent', `${percentage}%`)
        }
      }
      if (displayTimeRef.current && timeline && timeline.footages[0]) {
        displayTimeRef.current.textContent = formatAbsoluteTime(timeline.footages[0].footageDate, global)
      }
      
      // Update video-time display for each camera with absolute time
      if (timeline && timeline.footages[0]) {
        const absoluteTime = formatAbsoluteTime(timeline.footages[0].footageDate, global)
        videoTimeRefs.current.forEach((timeDiv) => {
          if (timeDiv) {
            timeDiv.textContent = absoluteTime
          }
        })
      }
    }

    if (videoRef) {
      trace(`Addng up event listeners for Footage ID: ${currentFootageId}`)
      videoRef.addEventListener('timeupdate', update)
    }

    return () => {
      trace(`Cleaning up event listeners for Footage ID: ${currentFootageId}`)
      if (videoRef) {
        videoRef.removeEventListener('timeupdate', update)
      }
    }
  }, [currentFootageId, trace, timeline])

  useEffect(() => { console.log('Player mounted'); return () => console.log('Player unmounted') }, [])

  // Dev helper: press space to clear console
  useEffect(() => {
    if (!import.meta.env.DEV) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault()
        console.clear()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    // Resume playing if it was playing before seek
    if (!isSeeking && isPlaying) {
      const currentFootage = timeline?.footages[currentFootageId]
      if (currentFootage) {
        currentFootage.availableCameras.forEach((pos) => {
          const videoRef = videoRefs.current.get(pos)
          if (videoRef && !videoRef.ended && videoCanPlayed.has(pos) && videoRef.paused) {
            trace(`UseEffect: Resuming play for camera ${pos}`)
            videoRef.play().catch(() => {})
          }
        })
      }
    }
  }, [isSeeking, currentFootageId, trace, timeline, isPlaying, videoCanPlayed])

  function seekTo (globalTime: number) {
    console.debug(`>>>> seekTo: ${globalTime}`)
    if (!timeline) return

    setIsAtEndOfClip(false)

    const position = UnifiedTimelineBuilder.globalToLocal(timeline, globalTime)
    allCameraPositions.forEach((pos) => {
      const videoRef = videoRefs.current.get(pos)
      if (videoRef) {
        const targetFootage = timeline.footages[position.footageIndex]

        // load new footage if needed
        if (currentFootageId !== position.footageIndex) {
          setCurrentFootageId(position.footageIndex)
          setVideoCanPlayed(new Set())
          const cameraFile = targetFootage?.videoFiles.get(pos as CameraPosition)
          if (cameraFile) {
            videoRef.src = cameraFile.objectURL
            videoRef.load()
          } else {
            console.warn(`No video file for camera ${pos} in footage index ${position.footageIndex}, remove video src`)
            videoRef.src = ''
          }
        }

        try {
          videoRef.playbackRate = playbackRate
        } catch (error) {
          console.error(`Failed to set playback rate for ${pos}:`, error)
        }
        videoRef.currentTime = position.localTime
      }
    })
    if (displayTimeRef.current && timeline && timeline.footages[0]) {
      displayTimeRef.current.textContent = formatAbsoluteTime(timeline.footages[0].footageDate, globalTime)
    }
  }

  function handleSeekChange(e: React.ChangeEvent<HTMLInputElement>) {
    const globalTime = parseFloat(e.target.value)
    trace('>>>> handleSeekChange:', globalTime)
    seekTo(globalTime)
    trace('<<<< handleSeekChange done')
  }

  // user mouse down on the seek bar
  function handleSeekStart() {
    trace('>>>> handleSeekStart')

    // Mark that we're seeking to prevent play/pause icon change
    setIsSeeking(true)
    
    if (isPlaying) {
      const currentFootage = timeline?.footages[currentFootageId]
      if (currentFootage) {
        currentFootage.availableCameras.forEach((pos) => {
          const videoRef = videoRefs.current.get(pos)
          if (videoRef) {
            // console.log(`Pausing video for camera ${pos} due to seek start`)
            videoRef.pause()
          }
        })
      }
    }
  }

  function handleSeekEnd() {
    trace('>>>> handleSeekEnd')
    // Mark that seeking is done
    setIsSeeking(false)
  }

  function handleForward(seconds: number) {
    let currentGlobal = 0
    if (seekRef.current) {
      currentGlobal = seekRef.current.valueAsNumber
      seekTo(Math.min(timeline!.totalDuration, currentGlobal + seconds))
    }
  }

  function handleRewind(seconds: number) {
    let currentGlobal = 0
    if (seekRef.current) {
      currentGlobal = seekRef.current.valueAsNumber
      seekTo(Math.max(0, currentGlobal - seconds))
    } 
  }

  function handleJumpToFootageEnd() {
    let endTime = timeline?.footageBoundaries[currentFootageId]?.endTime || 0
    if (endTime >= 3) {endTime = endTime - 3}
    console.debug('Seeking to near footage end time:', endTime)
    seekTo(endTime)
  }

  function handleJumpToEvent() {
    if (eventMarkerPosition) {
      const beforeEvent = Math.max(0, eventMarkerPosition.seconds - 5)
      console.log('Jumping to event at:',  beforeEvent)
      seekTo(beforeEvent)
    }
  }

  function handlePlayPause() {
    trace('>>>> handlePlayPause')
    const currentFootage = timeline?.footages[currentFootageId]
    if (!timeline || !currentFootage) return

    // Toggle play state
    const shouldPlay = !isPlaying
    setIsPlaying(shouldPlay)

    // Check if we're stopped at the end of the timeline
    // If yes, replay from the first footage
    if (isAtEndOfClip && shouldPlay) {
      console.log('Restarting from the first footage')
      setCurrentFootageId(0)
      setIsAtEndOfClip(false)
      videoEndedFlags.current.clear()
      switchingFootage.current = true

      allCameraPositions.forEach(pos => {
        const el = videoRefs.current.get(pos)
        if (el) {
          el.src = timeline.footages[0]?.videoFiles.get(pos as CameraPosition)?.objectURL || ''
          el.currentTime = 0
          el.load()
          try {
            el.playbackRate = playbackRate
          } catch (error) {
            console.error(`Failed to set playback rate for ${pos}:`, error)
          }
          // el.play().catch(() => {})
        }
      })

      // Update seekbar and display time
      if (seekRef.current) {
        seekRef.current.valueAsNumber = 0
        seekRef.current.style.setProperty('--progress-percent', '0%')
      }
      if (displayTimeRef.current && timeline.footages[0]) {
        displayTimeRef.current.textContent = formatAbsoluteTime(timeline.footages[0].footageDate, 0)
      }

      return
    }

    currentFootage.availableCameras.forEach((pos) => {
      const videoRef = videoRefs.current.get(pos)
      if (videoRef) {
        trace(`${pos} videoRef.paused: ${videoRef.paused}, videoRef.ended: ${videoRef.ended}`)
        if (shouldPlay && !videoRef.ended) {
          videoRef.play().catch(() => {})
        } else {
          videoRef.pause()
        }
      }
    })
  }

  function handlePlaybackRateChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const rate = parseFloat(e.target.value)
    console.log(`Changing playback rate to: ${rate}x`)
    setPlaybackRate(parseFloat(e.target.value))
    allCameraPositions.forEach((pos) => {
      const videoRef = videoRefs.current.get(pos)
      try {
        if (videoRef) {
          videoRef.playbackRate = rate
        } 
      } catch (error) {
        console.error(`Failed to set playback rate ${rate} for ${pos}:`, error)
      }
    })
  }

  // Handle camera click for Focus-and-Strips layout
  function handleCameraClick(camera: CameraPosition) {
    if (focusedCamera === camera) {
      // Clicking the focused camera returns to grid view
      setFocusedCamera(null)
    } else {
      // Clicking any camera (or a different camera) focuses it
      setFocusedCamera(camera)
    }
  }

  // Helper to get camera order for consistent strip ordering
  const getCameraOrder = (camera: CameraPosition): number => {
    const orderMap: Record<CameraPosition, number> = {
      front: 1,
      back: 2,
      left_repeater: 3,
      right_repeater: 4
    }
    return orderMap[camera]
  }

  function advanceIfAllCamerasEnded () {
    if (!timeline || !currentFootage) return

    if (!currentFootage.availableCameras.every(pos => videoEndedFlags.current.get(pos))) {
      return
    }

    console.debug('All camera videos ended for current footage.')

    setVideoCanPlayed(new Set())
    // Advance to next footage if available
    if (currentFootageId + 1 < timeline.footages.length) {
      setCurrentFootageId(currentFootageId + 1)
      // Reset ended flags for next footage
      videoEndedFlags.current.clear()

      switchingFootage.current = true
      allCameraPositions.forEach(pos => {
        const el = videoRefs.current.get(pos)
        if (el) {
          el.src = timeline.footages[currentFootageId + 1]?.videoFiles.get(pos as CameraPosition)?.objectURL || ''
          el.currentTime = 0
          el.load()
          try {
            el.playbackRate = playbackRate
          } catch (error) {
            console.error(`Failed to set playback rate for ${pos}:`, error)
          }
          el.play().catch(() => {})
        }
      })
    } else {
      console.log('Reached end of timeline.')
      setIsPlaying(false)
      videoEndedFlags.current.clear()
      setIsAtEndOfClip(true)
    }
  }

  // Loading state
  if (isProcessing) {
    return (
      <div className="video-player loading">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Processing Tesla dashcam footages...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (!timeline) {
    return (
      <div className="video-player error">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <p>No Tesla dashcam footages found</p>
          <button onClick={onReset}>Try Again</button>
        </div>
      </div>
    )
  }

  const currentFootage = timeline.footages[currentFootageId]
  const totalFootages = timeline.footages.length

  return (
    <div className="viewer-app">
      {/* Sidebar */}
      <ClipSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        currentFootage={currentFootage}
        currentFootageIndex={currentFootageId}
        totalFootages={totalFootages}
        totalDuration={timeline.totalDuration}
        formatTime={formatTime}
        {...(timeline.clip.event && { event: timeline.clip.event })}
        onJumpToEvent={handleJumpToEvent}
        {...(timeline.footages[0]?.footageDate && { clipStartTime: timeline.footages[0].footageDate })}
      />

      {/* Main Content */}
      <div className={`main-content ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
        {/* Camera Layout */}
        <div className="camera-layout">
          <div className={`video-grid ${focusedCamera ? 'focus-mode' : ''}`}>
            {/* minimized placeholder for the current maximized video in focus mode */}
            {focusedCamera && (
            <div
              className="video-feed minimized active"
              style={{ "order": getCameraOrder(focusedCamera) }}
              onClick={() => setFocusedCamera(null)}
            >
              <div className="video-label">{getCameraDisplayName(focusedCamera)}</div>
              <div className="video-placeholder"></div>
            </div>
            )}

            {allCameraPositions.map((cameraPosition) => {
              const isActive = focusedCamera === cameraPosition
              const isMinimized = focusedCamera && !isActive
              const style = { order: 0 }
              let className = `video-feed video-feed-${cameraPosition}`
              if (focusedCamera) {
                if (isActive) {
                  className += ' maximized'
                } else {
                  className += ' minimized'
                  style.order = getCameraOrder(cameraPosition)
                }
              }
              
              return (
                <div
                  key={cameraPosition} 
                  className={className}
                  style={isActive ? {} : style}
                  onClick={() => handleCameraClick(cameraPosition)}
                >
                  <div className="video-label">
                    {getCameraDisplayName(cameraPosition)}
                  </div>
                  
                  <video
                    ref={(el) => {
                      if (el) {
                        videoRefs.current.set(cameraPosition, el)
                      } else {
                        videoRefs.current.delete(cameraPosition)
                      }
                    }}
                    onSeeked={() => {
                      const ref = videoRefs.current.get(cameraPosition)

                      // seek to a time that is at or beyond the video duration **might not** trigger onEnded event
                      // mark the video as ended in that case
                      if (ref && ref.ended) {
                        console.debug(`Marked video as ended for camera: ${cameraPosition} after seeked`)
                        videoEndedFlags.current.set(cameraPosition, true)
                      }

                      advanceIfAllCamerasEnded()
                    }}
                    onCanPlay={() => {
                      trace(`Video can play for camera: ${cameraPosition}`)
                      if (!isPlaying) return

                      const ref = videoRefs.current.get(cameraPosition)
                      if (ref && !videoCanPlayed.has(cameraPosition)) {
                        setVideoCanPlayed(prev => {
                          const newSet = new Set(prev)
                          newSet.add(cameraPosition)
                          return newSet
                        })
                      }
                    }}
                    controls={false}
                    onEnded={() => {
                      trace(`Video ended for camera: ${cameraPosition}`)
                      videoEndedFlags.current.set(cameraPosition, true)
                      advanceIfAllCamerasEnded()
                    }}
                  />
                  {!isMinimized && (
                    <div 
                      className="video-time"
                      ref={(el) => {
                        if (el) {
                          videoTimeRefs.current.set(cameraPosition, el)
                        } else {
                          videoTimeRefs.current.delete(cameraPosition)
                        }
                      }}
                    >
                      {timeline?.footages[0] ? formatAbsoluteTime(timeline.footages[0].footageDate, 0) : '00:00:00'}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Video Controls */}
        <div className="control-panel">
          {/* Timeline Area */}
          <div className="timeline-area">
            <div
              ref={timelineRef}
              className="timeline-container"
            >
              {/* Range Input */}
              <input
                ref={seekRef}
                type="range"
                className="timeline-range"
                min={0}
                max={timeline.totalDuration}
                defaultValue={0}
                step={0.01}
                onChange={handleSeekChange}
                onMouseDown={handleSeekStart}
                onMouseUp={handleSeekEnd}
              />
              <div className="footage-markers-container">
                {timeline.footageBoundaries.map((boundary, idx) => {
                  const percent = timeline.totalDuration > 0 ? (boundary.startTime / timeline.totalDuration) * 100 : 0
                  return (
                    <div
                      key={idx}
                      className={`footage-marker marker-default ${idx === currentFootageId ? 'active' : ''}`}
                      style={{ left: `${percent}%` }}
                      title={`Footage ${idx + 1}: ${boundary.timestamp.replace('_', ' ')}`}
                    />
                  )
                })}
                
                {/* Event Marker */}
                {eventMarkerPosition && (
                  <div
                    className="event-marker"
                    style={{ left: `${eventMarkerPosition.percentage}%` }}
                    title={`Event: ${timeline.clip.event?.reason.replace(/_/g, ' ')}`}
                  />
                )}
              </div>

            </div>
            
            <div className="time-labels">
              <span ref={displayTimeRef}>
                {timeline.footages[0] ? formatAbsoluteTime(timeline.footages[0].footageDate, 0) : '00:00:00'}
              </span>
              <span>
                {timeline.footages[0] ? formatAbsoluteTime(timeline.footages[0].footageDate, timeline.totalDuration) : '00:00:00'}
              </span>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="main-controls">
            <div className="playback-controls-center">
              {/* Jump to Event Button */}
              {eventMarkerPosition && (
                <>
                  <button 
                    className="jump-to-event-btn"
                    title="Jump to Event" 
                    onClick={handleJumpToEvent}
                  >
                    ⚠️ Event
                  </button>
                  <span style={{ margin: '0 10px', color: '#444' }}>|</span>
                </>
              )}
              
              <button 
                title="Rewind 5s" 
                onClick={() => handleRewind(5)}
              >
                ↺ 5s
              </button>
              
              <button 
                className="play-pause-btn"
                onClick={handlePlayPause}
                title={isAtEndOfClip ? "Replay from start" : ((isPlaying || (isSeeking && wasPlayingBeforeSeek.current)) ? "Pause" : "Play")}
              >
                {isAtEndOfClip ? '↻' : ((isPlaying || (isSeeking && wasPlayingBeforeSeek.current)) ? '⏸' : '▶')}
              </button>
              
              <button 
                title="Forward 5s" 
                onClick={() => handleForward(5)} 
              >
                ↻ 5s
              </button>

              <span style={{ margin: '0 10px', color: '#444' }}>|</span>
              
              <select
                value={playbackRate}
                onChange={handlePlaybackRateChange}
                style={{ marginLeft: '15px', fontSize: '14px' }}
              >
                {playbackRateOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.value}x
                  </option>
                ))}
              </select>
            </div>

            {/* Right-side buttons */}
            <div className="right-controls">
              {debugMode && (
                <button 
                  className="debug-jump-btn"
                  onClick={handleJumpToFootageEnd}
                  title="Jump to 3s before footage end (Debug)"
                >
                  🐛 Jump to Footage End -3s
                </button>
              )}

              <button 
                className="close-clip-btn"
                onClick={onReset}
                title="Close Clip"
              >
                ✕ Close Clip
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeslaClipPlayer
