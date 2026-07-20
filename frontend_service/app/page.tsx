'use client'

import Link from 'next/link'
import { ArrowRight, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/components/providers/i18n-provider'
import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { useTheme } from 'next-themes'

export default function LandingPage() {
  const { t, dir } = useI18n()
  const { theme, setTheme } = useTheme()
  const isRtl = dir === 'rtl'

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      {/* Navbar */}
      <nav className="border-b border-border bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center shrink-0 shadow-sm">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 20L8 4L12 20" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M5.5 13.5L10.5 13.5" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
                <path d="M13 20L17 4L21 20" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M14.5 13.5L19.5 13.5" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
                <path d="M7.5 7.5Q15 4 16.5 10Q16.5 13.5 12 13.5Q7.5 13.5 7.5 17Q7.5 20 14 20" stroke="white" stroke-width="2.2" fill="none" stroke-linecap="round"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base leading-tight">ASA</span>
              <span className="text-[8px] text-muted-foreground tracking-widest uppercase leading-tight">{t('tagline')}</span>
            </div>
          </div>

          {/* Nav actions */}
          <div className={`flex items-center gap-1 sm:gap-2 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-8 h-8"
              aria-label="Toggle theme"
            >
              <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                {t('login')}
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">{t('getStarted')}</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — centred vertically in remaining space */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-20">
        <div className="w-full max-w-xl text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-balance leading-tight mb-4">
            {t('heroTitle')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground text-pretty mb-8 leading-relaxed">
            {t('heroSubtitle')}
          </p>
          <div className={`flex flex-wrap items-center justify-center gap-3 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
            <Link href="/signup">
              <Button size="lg" className={`gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {t('getStarted')}
                <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                {t('login')}
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 px-4 sm:px-6">
        <div className={`max-w-4xl mx-auto flex items-center justify-between gap-4 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} 𝓐𝓢𝓐
          </p>
          <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
            <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {t('login')}
            </Link>
            <Link href="/signup" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {t('signup')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
