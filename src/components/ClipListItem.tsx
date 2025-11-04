import './ClipListItem.css'
import type { ClipEntry } from '../types/library'
import { formatDuration, formatClipTimestamp } from '../utils/libraryUtils'

interface ClipListItemProps {
  clip: ClipEntry
  isActive: boolean
  onClick: (clip: ClipEntry) => void
}

export default function ClipListItem({ clip, isActive, onClick }: ClipListItemProps) {
  const handleClick = () => {
    onClick(clip)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick(clip)
    }
  }

  const clipTimestamp = formatClipTimestamp(clip.timestamp)

  return (
    <div
      className={`clip-list-item ${isActive ? 'active' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Clip from ${clipTimestamp}`}
      aria-pressed={isActive}
    >
      <div className="clip-thumbnail">
        {clip.thumbnailUrl ? (
          <img src={clip.thumbnailUrl} alt="Clip thumbnail" />
        ) : (
          <div className="clip-thumbnail-placeholder">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        )}
      </div>

      <div className="clip-info">
        <div className="clip-timestamp">
          {clipTimestamp}
        </div>
        <div className="clip-meta">
          <span className="clip-duration">{formatDuration(clip.duration)}</span>
          {clip.hasEvent && (
            <span className="clip-event-badge" title="Has event data">
              📋
            </span>
          )}
        </div>
      </div>

    </div>
  )
}
