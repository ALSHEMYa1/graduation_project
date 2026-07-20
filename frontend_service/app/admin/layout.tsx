'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LayoutDashboard, Users, FileText, Cpu, BarChart2, ScrollText, Settings, Shield, Menu, X, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { useI18n } from '@/components/providers/i18n-provider'
import { LanguageSwitcher } from '@/components/layout/language-switcher'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { t, dir } = useI18n()
  const isRtl = dir === 'rtl'

  const adminNav = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { href: '/admin/users', icon: Users, label: t('users') },
    { href: '/admin/documents', icon: FileText, label: t('documents') },
    { href: '/admin/ai-usage', icon: Cpu, label: t('aiUsage') },
    { href: '/admin/analytics', icon: BarChart2, label: t('analytics') },
    { href: '/admin/logs', icon: ScrollText, label: t('logs') },
    { href: '/admin/settings', icon: Settings, label: t('settings') },
  ]

  const sidebar = (
    <aside className={`w-56 shrink-0 ${isRtl ? 'border-l' : 'border-r'} border-border bg-sidebar flex flex-col h-full`}>
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-sidebar-border">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center shrink-0 shadow-sm">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 20L8 4L12 20" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5.5 13.5L10.5 13.5" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M13 20L17 4L21 20" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M14.5 13.5L19.5 13.5" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M7.5 7.5Q15 4 16.5 10Q16.5 13.5 12 13.5Q7.5 13.5 7.5 17Q7.5 20 14 20" stroke="white" stroke-width="2.2" fill="none" stroke-linecap="round"/>
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm text-sidebar-foreground leading-tight">ASA</span>
          <span className="text-[8px] text-muted-foreground tracking-widest uppercase leading-tight">{t('adminPanel')}</span>
        </div>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-1">
        {adminNav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span dir={dir}>{label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <Link
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          {t('adminExitAdmin')}
        </Link>
      </div>
    </aside>
  )

  return (
    <div className={`min-h-screen flex bg-background ${isRtl ? 'flex-row-reverse' : ''}`} dir="ltr">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">{sidebar}</div>

      {/* Mobile sidebar overlay */}
      {isMobile && mobileOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className={`relative w-56 ${isRtl ? '' : ''}`}>{sidebar}</div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0" dir={dir}>
        <header className="h-14 border-b border-border flex items-center gap-3 px-4 md:px-6 bg-background/80 backdrop-blur-md sticky top-0 z-20">
          {isMobile && (
            <button onClick={() => setMobileOpen(true)} className="p-1 rounded-md hover:bg-muted">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium border border-destructive/20">
              {t('adminPanel')}
            </span>
          </div>
          <LanguageSwitcher />
        </header>
        <main className="flex-1 overflow-y-auto page-enter">
          {children}
        </main>
      </div>
    </div>
  )
}
