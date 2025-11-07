import React from 'react'
import { useI18n } from '../i18n'
import { helpTranslations } from '../i18n/help-translations'
import './Help.css'

interface HelpProps {
  onClose: () => void
}

const Help: React.FC<HelpProps> = ({ onClose }) => {
  const { language } = useI18n()
  // Language is guaranteed to be one of the supported languages from i18n context
  // helpTranslations has all the same keys as the main translations
  const t = helpTranslations[language] || helpTranslations.en
  
  const baseUrl = import.meta.env.BASE_URL

  return (
    <div className="help-page">
      <div className="help-container">
        <header className="help-header">
          <h1>{t.title}</h1>
          <button className="help-close" onClick={onClose} aria-label="Close help">
            ✕
          </button>
        </header>
        <section className="help-section">
          <h2>{t.overview.title}</h2>
          <p>{t.overview.text}</p>
        </section>

        <section className="help-section">
          <h2>{t.features.title}</h2>
          
          <div className="help-features">
            <div className="help-feature">
              <img 
                src={`${baseUrl}help/player-grid.png`}
                alt={t.features.player}
                onClick={() => window.open(`${baseUrl}help/player-grid.png`, '_blank')}
                onError={(e) => {
                  // Fallback to placeholder if image doesn't exist
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"%3E%3Crect fill="%23333" width="320" height="180"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="sans-serif" font-size="16"%3EPlayer Screenshot%3C/text%3E%3C/svg%3E'
                }}
              />
              <h3>{t.features.player}</h3>
              <p>{t.features.playerText}</p>
            </div>

            <div className="help-feature">
              <img 
                src={`${baseUrl}help/library.png`}
                alt={t.features.library}
                onClick={() => window.open(`${baseUrl}help/library.png`, '_blank')}
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"%3E%3Crect fill="%23333" width="320" height="180"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="sans-serif" font-size="16"%3ELibrary Screenshot%3C/text%3E%3C/svg%3E'
                }}
              />
              <h3>{t.features.library}</h3>
              <p>{t.features.libraryText}</p>
            </div>

            <div className="help-feature">
              <img 
                src={`${baseUrl}help/event-jump.png`}
                alt={t.features.eventJump}
                onClick={() => window.open(`${baseUrl}help/event-jump.png`, '_blank')}
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"%3E%3Crect fill="%23333" width="320" height="180"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="sans-serif" font-size="16"%3EEvent Jump Screenshot%3C/text%3E%3C/svg%3E'
                }}
              />
              <h3>{t.features.eventJump}</h3>
              <p>{t.features.eventJumpText}</p>
            </div>

            <div className="help-feature">
              <img 
                src={`${baseUrl}help/event-map.png`}
                alt={t.features.eventMap}
                onClick={() => window.open(`${baseUrl}help/event-map.png`, '_blank')}
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"%3E%3Crect fill="%23333" width="320" height="180"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="sans-serif" font-size="16"%3EEvent Map Screenshot%3C/text%3E%3C/svg%3E'
                }}
              />
              <h3>{t.features.eventMap}</h3>
              <p>{t.features.eventMapText}</p>
            </div>
          </div>
        </section>

        <section className="help-section">
          <h2>{t.usage.title}</h2>
          <ol className="help-usage-list">
            <li>{t.usage.step1}</li>
            <li>
              {t.usage.step2}
              <figure className="help-usage-figure">
                <img 
                  src={`${baseUrl}help/teslacam-folder.png`}
                  alt="TeslaCam folder"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"%3E%3Crect fill="%23333" width="400" height="240"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="sans-serif" font-size="16"%3ETeslaCam Folder%3C/text%3E%3C/svg%3E'
                  }}
                />
              </figure>
            </li>
            <li>
              {t.usage.step3}
              <figure className="help-usage-figure">
                <img 
                  src={`${baseUrl}help/select-folder.png`}
                  alt="Select folder button"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"%3E%3Crect fill="%23333" width="400" height="240"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="sans-serif" font-size="16"%3ESelect Folder Button%3C/text%3E%3C/svg%3E'
                  }}
                />
              </figure>
            </li>
            <li>{t.usage.step4}</li>
          </ol>
        </section>

        <section className="help-section">
          <h2>{t.issues.title}</h2>
          <ul className="help-troubleshooting-list">
            <li>
              <strong>⚠️ {t.issues.safariTitle}:</strong> {t.issues.safari}
            </li>
          </ul>
        </section>

        <section className="help-section">
          <h2>{t.links.title}</h2>
          <ul className="help-links">
            <li>
              <a href="https://github.com/bk201/sentinel" target="_blank" rel="noopener noreferrer">
                📦 {t.links.repository}
              </a>
            </li>
            <li>
              <a href="https://github.com/bk201/sentinel/issues" target="_blank" rel="noopener noreferrer">
                🐛 {t.links.issues}
              </a>
            </li>
            <li>
              <a href="https://github.com/bk201/sentinel/discussions" target="_blank" rel="noopener noreferrer">
                💬 {t.links.discussions}
              </a>
            </li>
          </ul>
        </section>

        <footer className="help-footer">
          <button className="help-back-button" onClick={onClose}>
            ← {t.back}
          </button>
          <a 
            className="help-report-button" 
            href="https://github.com/bk201/sentinel/issues/new" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            🐛 {t.report}
          </a>
        </footer>
      </div>
    </div>
  )
}

export default Help
