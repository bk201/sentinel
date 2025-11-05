import { useMemo } from 'react'
import './LibrarySidebar.css'
import ClipListItem from './ClipListItem'
import type { TeslaLibrary, ClipEntry, ClipCategory } from '../types/library'
import { groupClipsByDay } from '../utils/libraryUtils'

interface LibrarySidebarProps {
  library: TeslaLibrary
  activeCategory: ClipCategory
  activeClipId: string | null
  onCategoryChange: (category: ClipCategory) => void
  onClipSelect: (clip: ClipEntry) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export default function LibrarySidebar({
  library,
  activeCategory,
  activeClipId,
  onCategoryChange,
  onClipSelect,
  isCollapsed = false,
  onToggleCollapse,
}: LibrarySidebarProps) {
  // Get clips for active category
  const clips = library.categories[activeCategory]

  // Group clips by day for better organization
  const groupedClips = useMemo(() => {
    return groupClipsByDay(clips)
  }, [clips])

  // Calculate counts for each category
  const counts = {
    recent: library.categories.recent.length,
    saved: library.categories.saved.length,
    sentry: library.categories.sentry.length,
  }

  const categories: { key: ClipCategory; label: string }[] = [
    { key: 'recent', label: 'Recent' },
    { key: 'saved', label: 'Saved' },
    { key: 'sentry', label: 'Sentry' },
  ]

  // Filter categories: if only one has clips, show only that one
  const visibleCategories = useMemo(() => {
    const categoriesWithClips = categories.filter(({ key }) => counts[key] > 0)
    return categoriesWithClips.length === 1 ? categoriesWithClips : categories
  }, [counts])

  return (
    <aside className={`library-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div 
        className="library-sidebar-header"
        onClick={onToggleCollapse}
        role="button"
        tabIndex={0}
        aria-label={isCollapsed ? "Expand library sidebar" : "Collapse library sidebar"}
        title={isCollapsed ? "Show All Clips" : "Hide All Clips"}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggleCollapse?.()
          }
        }}
      >
        {!isCollapsed ? (
          <>
            <h2>All Clips</h2>
            <button
              className="library-sidebar-toggle"
              aria-hidden="true"
              tabIndex={-1}
            >
              ≪
            </button>
          </>
        ) : (
          <button
            className="library-sidebar-toggle collapsed-icon"
            aria-hidden="true"
            tabIndex={-1}
          >
            ≫
          </button>
        )}
      </div>

      {!isCollapsed && (
        <>
          {/* Tab Navigation */}
          <nav className="library-tabs" role="tablist" aria-label="Clip categories">
            {visibleCategories.map(({ key, label }) => {
              const count = counts[key]
              const isActive = activeCategory === key
              const isDisabled = count === 0

              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`${key}-clips`}
                  aria-label={`${label} clips (${count})`}
                  disabled={isDisabled}
                  className={`library-tab ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                  onClick={() => !isDisabled && onCategoryChange(key)}
                >
                  <span className="library-tab-label">{label}</span>
                  <span className="library-tab-count">
                    {count}
                  </span>
                </button>
              )
            })}
          </nav>

      {/* Clip List */}
      <div
        className="library-clip-list"
        role="tabpanel"
        id={`${activeCategory}-clips`}
        aria-label={`${activeCategory} clips list`}
      >
        {clips.length === 0 ? (
          <div className="library-empty-state">
            <div className="library-empty-icon">📁</div>
            <p className="library-empty-title">No clips found</p>
            <p className="library-empty-text">
              Clips in the {activeCategory} category will appear here
            </p>
          </div>
        ) : (
          <>
            {groupedClips.map((dayGroup) => (
              <div key={dayGroup.dateString} className="library-day-group">
                <div className="library-day-separator">
                  <span className="library-day-label">
                    {dayGroup.dateString}
                  </span>
                </div>
                <div className="library-day-clips">
                  {dayGroup.clips.map((clip) => (
                    <ClipListItem
                      key={clip.id}
                      clip={clip}
                      isActive={clip.id === activeClipId}
                      onClick={onClipSelect}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
        </>
      )}
    </aside>
  )
}
