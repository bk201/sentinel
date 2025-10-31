import React from 'react'
import { useI18n } from '../i18n'
import './ValidationSpinner.css'

interface ValidationSpinnerProps {
  message?: string
  progress?: number
  className?: string
}

const ValidationSpinner: React.FC<ValidationSpinnerProps> = ({ 
  message, 
  progress,
  className = '' 
}) => {
  const { t } = useI18n()
  const displayMessage = message || t.validation.validating
  
  return (
    <div className={`validation-spinner ${className}`}>
      <div className="spinner-container">
        <div className="spinner" />
        <div className="spinner-glow" />
      </div>
      
      <div className="spinner-content">
        <h3 className="spinner-message">{displayMessage}</h3>
        
        {progress !== undefined && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
            <span className="progress-text">{Math.round(progress)}%</span>
          </div>
        )}
        
        <p className="spinner-description">
          {t.validation.analyzing}
        </p>
      </div>
    </div>
  )
}

export default ValidationSpinner