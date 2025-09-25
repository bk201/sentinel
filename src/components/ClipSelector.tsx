import { useState, useEffect, useRef } from 'react'
import type { DetectedClip } from '../utils/clipDetectionUtils'
import { formatTime } from '../utils/cameraUtils'
import './ClipSelector.css'

interface ClipSelectorProps {
  clips: DetectedClip[]
  onSelectClip: (clip: DetectedClip) => void
  onCancel: () => void
}

const ClipSelector: React.FC<ClipSelectorProps> = ({ clips, onSelectClip, onCancel }) => {
  const [selectedClipId, setSelectedClipId] = useState<string>(clips[clips.length - 1]?.id || '')
  const selectedCardRef = useRef<HTMLDivElement>(null)

  // Scroll to the selected (latest) clip when modal opens
  useEffect(() => {
    if (selectedCardRef.current) {
      selectedCardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  }, []) // Empty dependency array - only run on mount

  const handleConfirm = () => {
    const selectedClip = clips.find(clip => clip.id === selectedClipId)
    if (selectedClip) {
      onSelectClip(selectedClip)
    }
  }

  const formatDateTime = (date: Date): string => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  const formatTimeRange = (start: Date, end: Date): string => {
    const startStr = formatDateTime(start)
    const endTime = end.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    return `${startStr} - ${endTime}`
  }

  return (
    <div className="clip-selector-overlay" onClick={onCancel}>
      <div className="clip-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="clip-selector-header">
          <h2>Multiple Clips Detected</h2>
          <p>Found {clips.length} recording sessions in this folder. Select one to view:</p>
        </div>

        <div className="clip-selector-list">
          {clips.map((clip, index) => {
            const isLatest = index === clips.length - 1
            const isSelected = clip.id === selectedClipId

            return (
              <div
                key={clip.id}
                ref={isSelected ? selectedCardRef : null}
                className={`clip-card ${isSelected ? 'selected' : ''} ${isLatest ? 'latest' : ''}`}
                onClick={() => setSelectedClipId(clip.id)}
              >
                <div className="clip-card-header">
                  <div className="clip-title">
                    Clip {index + 1}
                    {isLatest && <span className="latest-badge">Latest</span>}
                  </div>
                </div>
                
                <div className="clip-time-info">
                  <div className="clip-time-range">
                    {formatTimeRange(clip.startTime, clip.endTime)}
                  </div>
                  <div className="clip-duration">
                    ~{formatTime(clip.totalDuration)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="clip-selector-actions">
          <button className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-confirm" onClick={handleConfirm} disabled={!selectedClipId}>
            Load Selected Clip
          </button>
        </div>
      </div>
    </div>
  )
}

export default ClipSelector
