'use client'

import { useState } from 'react'
import { AppSidebar } from './app-sidebar'
import { AppHeader } from './app-header'
import { AiChatButton } from '@/components/chat/ai-chat-button'
import { useI18n } from '@/components/providers/i18n-provider'

interface AppShellProps {
  children: React.ReactNode
  title?: string
}

export function AppShell({ children, title }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { dir } = useI18n()
  const isRtl = dir === 'rtl'

  return (
    <div className={`flex h-screen overflow-hidden bg-background ${isRtl ? 'flex-row-reverse' : 'flex-row'}`} dir="ltr">
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((p) => !p)}
      />

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden" dir={dir}>
        <AppHeader title={title} />
        <main className="flex-1 overflow-y-auto">
          <div className="page-enter">
            {children}
          </div>
        </main>
      </div>

      <AiChatButton />
    </div>
  )
}
