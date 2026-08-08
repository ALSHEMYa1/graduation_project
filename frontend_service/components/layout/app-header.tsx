'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Moon, Sun, Bell, Menu, Search } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/components/providers/i18n-provider'
import { API_URL } from '@/lib/config'
import { getToken } from '@/lib/auth'
import { LanguageSwitcher } from '@/components/layout/language-switcher'
import type { TranslationKey } from '@/lib/i18n/translations'

interface AppHeaderProps {
  title?: string
  showBack?: boolean
  onMenuToggle?: () => void
}

const SEG_LABEL_KEYS: Record<string, TranslationKey> = {
  dashboard: 'dashboard',
  upload: 'upload',
  summary: 'summary',
  quiz: 'quiz',
  flashcards: 'flashcards',
  'study-plan': 'studyPlan',
  'gap-analysis': 'gapAnalysis',
  chat: 'chat',
  profile: 'profile',
  admin: 'adminPanel',
  documents: 'documents',
  'ai-usage': 'aiUsage',
  analytics: 'analytics',
  logs: 'logs',
  settings: 'settings',
}

function humanize(seg: string) {
  return seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ')
}

export function AppHeader({ title, showBack = true, onMenuToggle }: AppHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { t, dir } = useI18n()
  const { theme, setTheme } = useTheme()
  const isRtl = dir === 'rtl'
  const canGoBack = showBack && pathname.split('/').filter(Boolean).length > 0

  const [initial, setInitial] = useState('A')

  useEffect(() => {
    const token = getToken()
    if (!token) return
    fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => {
        if (u?.full_name) setInitial(u.full_name.trim().charAt(0).toUpperCase())
        else if (u?.email) setInitial(u.email.trim().charAt(0).toUpperCase())
      })
      .catch(() => {})
  }, [])

  const segments = pathname.split('/').filter(Boolean)
  const last = segments[segments.length - 1] ?? 'dashboard'
  const pageTitle = title ?? (SEG_LABEL_KEYS[last] ? t(SEG_LABEL_KEYS[last]) : humanize(last))
  const pageLabel =
    segments.length > 1
      ? SEG_LABEL_KEYS[segments[0]]
        ? t(SEG_LABEL_KEYS[segments[0]])
        : humanize(segments[0])
      : t('navMain')

  const BackIcon = isRtl ? ChevronRight : ChevronLeft

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center gap-2 px-3 sm:px-4 lg:px-6 border-b border-border bg-background/70 glass">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuToggle}
        className="shrink-0 w-10 h-10 rounded-xl lg:hidden text-muted-foreground hover:text-foreground"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {canGoBack && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0 w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground"
          aria-label={t('back')}
        >
          <BackIcon className="w-5 h-5" />
        </Button>
      )}

      {/* Page title */}
      <div className="hidden md:flex flex-col min-w-0">
        <p className="text-[11px] text-muted-foreground leading-none">{pageLabel}</p>
        <p className="font-bold text-foreground leading-tight truncate">{pageTitle}</p>
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden sm:block">
        <input
          type="search"
          placeholder={t('searchPlaceholder')}
          className="w-56 lg:w-72 xl:w-80 h-10 rounded-xl bg-muted/60 ps-4 pe-10 text-sm outline-none transition focus:bg-background focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/70"
        />
        <Search className="absolute end-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <LanguageSwitcher />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground"
          aria-label="Toggle theme"
        >
          <Sun className="w-5 h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute w-5 h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground relative"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 end-2.5 w-2 h-2 rounded-full bg-rose-500" />
        </Button>

        <Link
          href="/profile"
          className="w-10 h-10 rounded-xl grad-brand text-white font-black text-lg flex items-center justify-center shadow-sm shrink-0"
          aria-label="Profile"
        >
          {initial}
        </Link>
      </div>
    </header>
  )
}
