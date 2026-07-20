'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { translations, type Language, type TranslationKey } from '@/lib/i18n/translations'

interface I18nContextType {
  lang: Language
  dir: 'ltr' | 'rtl'
  t: (key: TranslationKey) => string
  setLang: (lang: Language) => void
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en')

  useEffect(() => {
    const saved = localStorage.getItem('ssa-lang') as Language | null
    if (saved === 'ar' || saved === 'en') {
      applyLang(saved)
      setLangState(saved)
    } else {
      const browserLang = navigator.language.toLowerCase()
      const detected: Language = browserLang.startsWith('ar') ? 'ar' : 'en'
      applyLang(detected)
      setLangState(detected)
    }
  }, [])

  function applyLang(l: Language) {
    const dir = l === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = l
    document.documentElement.dir = dir
    if (l === 'ar') {
      document.documentElement.classList.add('arabic')
      document.body.style.fontFamily = "var(--font-noto-arabic), var(--font-inter), sans-serif"
    } else {
      document.documentElement.classList.remove('arabic')
      document.body.style.fontFamily = "var(--font-inter), sans-serif"
    }
  }

  const setLang = (l: Language) => {
    localStorage.setItem('ssa-lang', l)
    applyLang(l)
    setLangState(l)
  }

  const t = (key: TranslationKey): string => {
    return (translations[lang] as Record<string, string>)[key] ?? (translations.en as Record<string, string>)[key] ?? key
  }

  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  return (
    <I18nContext.Provider value={{ lang, dir, t, setLang }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
