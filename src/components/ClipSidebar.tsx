import { useMemo, useState } from 'react'
import type { TeslaCamFootage, TeslaClipEvent } from '../types/TeslaCamFootage'
import { getCameraDisplayName } from '../utils/cameraUtils'
import './ClipSidebar.css'

interface ClipSidebarProps {
  isOpen: boolean
  onToggle: () => void
  currentFootage: TeslaCamFootage | undefined
  currentFootageIndex: number
  totalFootages: number
  totalDuration: number
  formatTime: (seconds: number) => string
  event?: TeslaClipEvent
  onJumpToEvent?: () => void
  clipStartTime?: Date
}

const ClipSidebar: React.FC<ClipSidebarProps> = ({
  isOpen,
  onToggle,
  currentFootage,
  currentFootageIndex,
  totalFootages,
  totalDuration,
  formatTime,
  event,
  onJumpToEvent,
  clipStartTime
}) => {
  const [isVideoFilesExpanded, setIsVideoFilesExpanded] = useState(false)
  
  const allCameraPositions = useMemo(() => ['front', 'back', 'left_repeater', 'right_repeater'] as const, [])
  
  const cameraStatusText = useMemo(() => {
    if (currentFootage?.isComplete) {
      return ''
    }

    const missingFeeds = allCameraPositions.filter(pos => 
      !currentFootage?.availableCameras.includes(pos)
    ).map(getCameraDisplayName).join(', ')

    return 'Missing camera feeds: ' + missingFeeds

  }, [currentFootage, allCameraPositions])

  const clipEndTime = useMemo(() => {
    if (!clipStartTime) return null
    return new Date(clipStartTime.getTime() + totalDuration * 1000)
  }, [clipStartTime, totalDuration])

  const clipStartTimeFormatted = useMemo(() => {
    if (!clipStartTime) return ''
    return clipStartTime.toLocaleString()
  }, [clipStartTime])

  const clipEndTimeFormatted = useMemo(() => {
    if (!clipEndTime) return ''
    return clipEndTime.toLocaleString()
  }, [clipEndTime])

  return (
    <div className={`sidebar ${!isOpen ? 'closed' : ''}`}>
      <div className="sidebar-header">
        <h3>CLIP DETAILS</h3>
        <button 
          className="toggle-btn" 
          onClick={onToggle}
          title={isOpen ? "Close Details" : "Show Details"}
        >
          ⓘ
        </button>
      </div>

      {isOpen && (
        <>
          <hr className="sidebar-divider" />
          <div className="clip-details">
            {/* Clip Information */}
            {clipStartTime && (
              <div className="clip-info-section">
                <div className="section-title">Clip Information</div>
                <div className="detail-row">
                  <strong>Clip Start:</strong> {clipStartTimeFormatted}
                </div>
                <div className="detail-row">
                  <strong>Clip End:</strong> {clipEndTimeFormatted}
                </div>
                <div className="detail-row">
                  <strong>Total Duration:</strong> {formatTime(totalDuration)}
                </div>
              </div>
            )}

            {/* Footage Information */}
            <div className="footage-info-section">
              <div className="section-title">Current Footage</div>
              <div className="detail-row">
                <strong>Footage:</strong> {currentFootageIndex + 1} of {totalFootages}
              </div>
              <div className="detail-row">
                <strong>Date & Time:</strong> {currentFootage?.timestamp.replace('_', ' ')}
              </div>
              <div className="detail-row">
                <strong>Duration:</strong> {formatTime(currentFootage?.duration || 0)}
              </div>
              {currentFootage && !currentFootage.isComplete && (
                <div className="detail-row warning">
                  <strong>⚠️ Warning:</strong> {cameraStatusText}
                </div>
              )}

              {/* Video Files - Nested in Footage Section */}
              {currentFootage && currentFootage.videoFiles.size > 0 && (
                <div className="video-files-subsection">
                  <div 
                    className="video-files-toggle"
                    onClick={() => setIsVideoFilesExpanded(!isVideoFilesExpanded)}
                    title="Click to expand/collapse video files"
                  >
                    <span className="toggle-label">
                      {isVideoFilesExpanded ? '▼' : '▶'} Video Files ({currentFootage.videoFiles.size})
                    </span>
                  </div>
                  {isVideoFilesExpanded && (
                    <div className="video-files-list">
                      {Array.from(currentFootage.videoFiles.entries()).map(([camera, videoFile]) => (
                        <div key={camera} className="file-row">
                          <div className="camera-badge">{getCameraDisplayName(camera)}</div>
                          <div className="file-info">
                            <div className="file-name" title={videoFile.originalFile.name}>
                              {videoFile.originalFile.name}
                            </div>
                            <div className="file-size">
                              {(videoFile.originalFile.size / (1024 * 1024)).toFixed(1)} MB
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Event Information Section */}
            {event && (
              <div className="event-section">
                <div className="section-title">Event Information</div>
                <div className="detail-row">
                  <strong>Time:</strong> {new Date(event.timestamp).toLocaleString()}
                </div>
                <div className="detail-row">
                  <strong>Reason:</strong>{' '}
                  <span 
                    className="event-reason-link"
                    onClick={onJumpToEvent}
                    title="Click to jump to event time"
                  >
                    {event.reason.replace(/_/g, ' ')}
                  </span>
                </div>
                {event.city && (
                  <div className="detail-row">
                    <strong>City:</strong> {event.city}
                  </div>
                )}
                
                {/* OpenStreetMap */}
                {event.est_lat && event.est_lon && (
                  <>
                    <div className="detail-row">
                      <strong>Location:</strong>
                    </div>
                    <div className="map-container">
                      <iframe
                        className="osm-map"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(event.est_lon) - 0.01},${parseFloat(event.est_lat) - 0.01},${parseFloat(event.est_lon) + 0.01},${parseFloat(event.est_lat) + 0.01}&layer=mapnik&zoom=20&marker=${event.est_lat},${event.est_lon}`}
                        title="Event Location Map"
                      />
                      <div className="coordinates">
                         {parseFloat(event.est_lat).toFixed(4)}, {parseFloat(event.est_lon).toFixed(4)}
                      </div>
                      <div className="map-links">
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${event.est_lat}&mlon=${event.est_lon}&zoom=15`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="map-link"
                        >
                          View on OpenStreetMap →
                        </a>
                        <a
                          href={`https://www.google.com/maps?q=${event.est_lat},${event.est_lon}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="map-link"
                        >
                          View on Google Maps →
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default ClipSidebar
