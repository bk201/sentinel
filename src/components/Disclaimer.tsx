import React from 'react'
import { useI18n } from '../i18n'
import './Disclaimer.css'

const Disclaimer: React.FC = () => {
  const { t } = useI18n()
  
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
            {t.disclaimer.createdBy} <a href="https://github.com/bk201">bK201</a> &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Disclaimer