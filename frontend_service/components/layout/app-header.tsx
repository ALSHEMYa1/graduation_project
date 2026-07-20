'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Moon, Sun, Bell } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/components/providers/i18n-provider'
import { cn } from '@/lib/utils'
import { LanguageSwitcher } from '@/components/layout/language-switcher'

interface AppHeaderProps {
  title?: string
  showBack?: boolean
}

export function AppHeader({ title, showBack = true }: AppHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { t, dir } = useI18n()
  const { theme, setTheme } = useTheme()
  const isRtl = dir === 'rtl'

  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs = segments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
    href: '/' + segments.slice(0, i + 1).join('/'),
  }))

  const BackIcon = isRtl ? ChevronRight : ChevronLeft

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center gap-3 px-4 border-b border-border bg-background/80 backdrop-blur-md">
      {showBack && segments.length > 0 && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0 w-8 h-8"
          aria-label={t('back')}
        >
          <BackIcon className="w-4 h-4" />
        </Button>
      )}

      {/* Breadcrumbs */}
      <nav aria-label="breadcrumb" className="flex items-center gap-1 flex-1 min-w-0">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground text-sm transition-colors shrink-0">
          {t('dashboard')}
        </Link>
        {breadcrumbs.slice(1).map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1">
            <span className="text-muted-foreground text-sm">/</span>
            <Link
              href={crumb.href}
              className={cn(
                'text-sm transition-colors truncate',
                i === breadcrumbs.length - 2
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {crumb.label}
            </Link>
          </span>
        ))}
        {title && breadcrumbs.length === 0 && (
          <span className="text-sm font-medium text-foreground">{title}</span>
        )}
      </nav>

      <div className="flex items-center gap-1">
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
        <Button variant="ghost" size="icon" className="w-8 h-8 relative" aria-label="Notifications">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
        </Button>
      </div>
    </header>
  )
}
