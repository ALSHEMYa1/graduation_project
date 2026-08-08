'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Upload,
  FileText,
  Brain,
  CalendarDays,
  MessageSquare,
  User,
  Layers,
  Search,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { API_URL } from '@/lib/config'
import { useI18n } from '@/components/providers/i18n-provider'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface AppSidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function AppSidebar({ collapsed, onToggle, mobileOpen = false, onMobileClose }: AppSidebarProps) {
  const pathname = usePathname()
  const { t, dir } = useI18n()
  const isRtl = dir === 'rtl'
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((u) => setIsAdmin(!!u.is_admin))
      .catch(() => {})
  }, [])

  const navGroups = [
    {
      label: t('navMain'),
      items: [
        { href: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
        { href: '/upload', icon: Upload, label: t('upload') },
        { href: '/summary', icon: FileText, label: t('summary') },
        { href: '/quiz', icon: Brain, label: t('quiz') },
        { href: '/flashcards', icon: Layers, label: t('flashcards') },
      ],
    },
    {
      label: t('navAi'),
      items: [
        { href: '/gap-analysis', icon: Search, label: t('gapAnalysis') },
        { href: '/study-plan', icon: CalendarDays, label: t('studyPlan') },
        { href: '/chat', icon: MessageSquare, label: t('chat') },
      ],
    },
  ]

  // RTL: sidebar on the right side, so collapse points right when open, left when closed
  // LTR: sidebar on the left side, so collapse points left when open, right when closed
  const CollapseIcon = isRtl
    ? collapsed ? ChevronLeft : ChevronRight
    : collapsed ? ChevronRight : ChevronLeft

  const content = (mobile: boolean) => (
    <>
      {/* Logo */}
      <div className="flex items-center h-14 px-4 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0" onClick={() => mobile && onMobileClose?.()}>
          <div className="w-8 h-8 rounded-lg grad-brand flex items-center justify-center shrink-0 shadow-sm">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 20L8 4L12 20" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M5.5 13.5L10.5 13.5" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
              <path d="M13 20L17 4L21 20" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M14.5 13.5L19.5 13.5" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
              <path d="M7.5 7.5Q15 4 16.5 10Q16.5 13.5 12 13.5Q7.5 13.5 7.5 17Q7.5 20 14 20" stroke="white" stroke-width="2.2" fill="none" stroke-linecap="round"/>
            </svg>
          </div>
          <AnimatePresence initial={false}>
            {(!collapsed || mobile) && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col overflow-hidden"
              >
                <span className="font-bold text-lg text-sidebar-foreground tracking-tight leading-tight">ASA</span>
                <span className="text-[9px] text-muted-foreground tracking-widest uppercase leading-tight">{t('tagline')}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            {(!collapsed || mobile) && (
              <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                {group.label}
              </p>
            )}
            {group.items.map(({ href, icon: Icon, label }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              const item = (
                <Link
                  key={href}
                  href={href}
                  onClick={() => mobile && onMobileClose?.()}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group',
                    collapsed && !mobile ? 'justify-center' : '',
                    active
                      ? 'grad-brand text-white font-semibold shadow-sm'
                      : 'text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <AnimatePresence initial={false}>
                    {(!collapsed || mobile) && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm font-medium whitespace-nowrap overflow-hidden"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              )
              if (collapsed && !mobile) {
                return (
                  <Tooltip key={href}>
                    <TooltipTrigger asChild>{item}</TooltipTrigger>
                    <TooltipContent side={isRtl ? 'left' : 'right'}>
                      {label}
                    </TooltipContent>
                  </Tooltip>
                )
              }
              return item
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-sidebar-border space-y-1">
        {isAdmin && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/admin"
                onClick={() => mobile && onMobileClose?.()}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/85 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-150',
                  collapsed && !mobile ? 'justify-center' : ''
                )}
              >
                <Shield className="w-5 h-5 shrink-0" />
                <AnimatePresence initial={false}>
                  {(!collapsed || mobile) && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      Admin
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </TooltipTrigger>
            {collapsed && !mobile && (
              <TooltipContent side={isRtl ? 'left' : 'right'}>
                Admin
              </TooltipContent>
            )}
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/profile"
              onClick={() => mobile && onMobileClose?.()}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/85 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-150',
                collapsed && !mobile ? 'justify-center' : ''
              )}
            >
              <User className="w-5 h-5 shrink-0" />
              <AnimatePresence initial={false}>
                {(!collapsed || mobile) && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                  >
                    {t('profile')}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </TooltipTrigger>
          {collapsed && !mobile && (
            <TooltipContent side={isRtl ? 'left' : 'right'}>
              {t('profile')}
            </TooltipContent>
          )}
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/"
              onClick={() => mobile && onMobileClose?.()}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150',
                collapsed && !mobile ? 'justify-center' : ''
              )}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <AnimatePresence initial={false}>
                {(!collapsed || mobile) && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                  >
                    {t('logout')}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </TooltipTrigger>
          {collapsed && !mobile && (
            <TooltipContent side={isRtl ? 'left' : 'right'}>
              {t('logout')}
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop: inline sidebar */}
      <TooltipProvider delayDuration={0}>
        <motion.aside
          animate={{ width: collapsed ? 64 : 220 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className={cn(
            'relative hidden lg:flex flex-col h-full border-sidebar-border bg-sidebar/80 glass overflow-hidden shrink-0',
            isRtl ? 'border-l' : 'border-r'
          )}
        >
          {content(false)}

          {/* Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn(
              'absolute top-4 w-6 h-6 rounded-full border border-sidebar-border bg-sidebar shadow-sm z-10 text-muted-foreground hover:text-foreground',
              isRtl ? '-left-3' : '-right-3'
            )}
          >
            <CollapseIcon className="w-3 h-3" />
          </Button>
        </motion.aside>
      </TooltipProvider>

      {/* Mobile: overlay drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={isRtl ? { x: 320 } : { x: -320 }}
              animate={{ x: 0 }}
              exit={isRtl ? { x: 320 } : { x: -320 }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
              className={cn(
                'fixed top-0 bottom-0 z-50 w-[280px] max-w-[85vw] flex flex-col bg-sidebar border-sidebar-border shadow-xl lg:hidden',
                isRtl ? 'right-0 border-l' : 'left-0 border-r'
              )}
            >
              {content(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
