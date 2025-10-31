import React from 'react'
import { useI18n } from '../i18n'
import './ErrorMessage.css'

interface ErrorMessageProps {
  title?: string
  message: string
  details?: string[]
  onRetry?: () => void
  onReset?: () => void
  className?: string
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  title,
  message, 
  details,
  onRetry,
  onReset,
  className = ''
}) => {
  const { t } = useI18n()
  const displayTitle = title || t.errors.validationError
  
  return (
    <div className={`error-message-container ${className}`}>
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <h3 className="error-title">{displayTitle}</h3>
        <p className="error-message">{message}</p>
        
        {details && details.length > 0 && (
          <div className="error-details">
            <h4>Details:</h4>
            <ul>
              {details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="error-actions">
          {onRetry && (
            <button 
              className="retry-button"
              onClick={onRetry}
            >
              {t.errors.tryAgain}
            </button>
          )}
          {onReset && (
            <button 
              className="reset-button"
              onClick={onReset}
            >
              {t.errors.selectDifferentFolder}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ErrorMessage