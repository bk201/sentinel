import React, { useState, useRef, useEffect } from 'react'
import { useI18n } from '../i18n'
import type { Language } from '../i18n/translations'
import './LanguageSwitcher.css'

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const languageShortNames: Record<Language, string> = {
    'en': 'EN',
    'zh-TW': '繁',
    'zh-CN': '简',
    'ja': 'JA'
  }

  const languageFullNames: Record<Language, string> = {
    'en': 'English',
    'zh-TW': '繁體中文',
    'zh-CN': '简体中文',
    'ja': '日本語'
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    setIsOpen(false)
  }

  return (
    <div className="language-switcher" ref={dropdownRef}>
      <button
        className="language-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        {languageShortNames[language]}
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="currentColor"
          className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
        >
          <path d="M6 9L1 4h10z" />
        </svg>
      </button>
      {isOpen && (
        <div className="language-dropdown">
          {Object.entries(languageFullNames).map(([lang, name]) => (
            <button
              key={lang}
              className={`language-option ${language === lang ? 'active' : ''}`}
              onClick={() => handleLanguageChange(lang as Language)}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default LanguageSwitcher
