import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { translations, type Language, type Translations, interpolate } from './translations'

interface I18nContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
  interpolate: typeof interpolate
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

const LANGUAGE_STORAGE_KEY = 'sentinel-language'

// Detect browser language
function detectBrowserLanguage(): Language {
  const browserLang = navigator.language || (navigator as any).userLanguage
  
  // Check for Japanese
  if (browserLang.startsWith('ja')) {
    return 'ja'
  }
  
  // Check for Chinese variants
  if (browserLang.startsWith('zh')) {
    // Traditional Chinese variants
    if (browserLang.includes('TW') || browserLang.includes('HK') || browserLang.includes('MO')) {
      return 'zh-TW'
    }
    // Simplified Chinese
    if (browserLang.includes('CN') || browserLang.includes('SG')) {
      return 'zh-CN'
    }
    return 'en'
  }
  
  return 'en'
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Try to load from localStorage first
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (stored === 'en' || stored === 'zh-TW' || stored === 'zh-CN' || stored === 'ja') {
      return stored
    }
    // Otherwise detect from browser
    return detectBrowserLanguage()
  })

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
    // Update HTML lang attribute for accessibility
    document.documentElement.lang = lang
  }, [])

  // Set initial HTML lang attribute
  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const value: I18nContextValue = {
    language,
    setLanguage,
    t: translations[language],
    interpolate
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}
