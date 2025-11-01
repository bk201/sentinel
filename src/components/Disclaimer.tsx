import React from 'react'
import { useI18n } from '../i18n'
import './Disclaimer.css'

const Disclaimer: React.FC = () => {
  const { t } = useI18n()
  const revision = __APP_REVISION__
  
  // Extract short hash (first 7 characters) for display
  const displayHash = revision.length >= 7 ? revision.substring(0, 7) : revision
  const fullHash = revision
  
  // Check if revision is a commit hash (hex string)
  const isCommitHash = /^[0-9a-f]{7,}$/.test(revision)
  const revisionDisplay = isCommitHash ? (
    <a 
      href={`https://github.com/bk201/sentinel/commit/${fullHash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="revision-link"
      title={`Commit: ${fullHash}`}
    >
      {displayHash}
    </a>
  ) : (
    <span className="revision-text">{revision}</span>
  )
  
  return (
    <footer className="disclaimer">
      <div className="disclaimer-content">

        <div className="disclaimer-details">
          <div className="disclaimer-section">
            <h5>{t.disclaimer.featuresTitle}</h5>
            <ul>
              <li>{t.disclaimer.multiCamera}</li>
              <li>{t.disclaimer.gridView}</li>
              <li>{t.disclaimer.eventInfo}</li>
            </ul>
          </div>
          <div className="disclaimer-section">
            <h5>{t.disclaimer.title}</h5>
            <ul>
              <li>{t.disclaimer.privacyFirst}</li>
            </ul>
          </div>
          <div className="disclaimer-section">
            <h5>{t.disclaimer.browserRequirementsTitle}</h5>
            <ul>
              <li>{t.disclaimer.modernBrowser}</li>
              <li>{t.disclaimer.supportedBrowsers}</li>
            </ul>
          </div>
        </div>
        
        <div className="disclaimer-footer">
          <p>
            {t.disclaimer.notAffiliated}
          </p>
          <p className="disclaimer-version">
            {t.disclaimer.createdBy} <a href="https://github.com/bk201">bK201</a> &copy; {new Date().getFullYear()} · {revisionDisplay}
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Disclaimer