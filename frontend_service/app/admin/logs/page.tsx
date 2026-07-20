'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, ScrollText, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { adminApi } from '@/lib/admin-api'
import { useI18n } from '@/components/providers/i18n-provider'

type LogLevel = 'info' | 'success' | 'error' | 'all'

interface Log {
  id: number
  user_id: number | null
  level: string
  message: string
  created_at: string
}

export default function AdminLogsPage() {
  const { t, dir } = useI18n()
  const isRtl = dir === 'rtl'
  const [logs, setLogs] = useState<Log[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<LogLevel>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getLogs().then(setLogs).catch(console.error).finally(() => setLoading(false))
  }, [])

  const logIcon = (level: string) => {
    if (level === 'error') return { icon: AlertCircle, color: 'text-destructive' }
    if (['summary', 'quiz', 'study_plan', 'chat', 'progress', 'success'].includes(level))
      return { icon: CheckCircle2, color: 'text-green-500' }
    return { icon: Info, color: 'text-blue-500' }
  }

  const filtered = logs.filter((log) => {
    const matchSearch = log.message.toLowerCase().includes(search.toLowerCase()) ||
      log.level.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || log.level === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold">{t('adminLogsTitle')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('adminLogsSubtitle')}
        </p>
      </div>

      <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <div className="relative flex-1 max-w-sm">
          <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
          <Input
            placeholder={t('adminSearchLogs')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={isRtl ? 'pr-9' : 'pl-9'}
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          {(['all', 'info', 'success', 'error'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium capitalize transition-all',
                filter === level
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/20">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs font-mono text-muted-foreground">
            {t('adminLiveFeed')}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">{t('loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <ScrollText className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-medium">{t('adminNoLogsYet')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('adminNoLogsDesc')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
            {filtered.map((log) => {
              const { icon: Icon, color } = logIcon(log.level)
              return (
                <div key={log.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/30">
                  <Icon className={cn('w-4 h-4 shrink-0 mt-0.5', color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                      <span className={cn(
                        'text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded',
                        log.level === 'error' ? 'bg-destructive/10 text-destructive' :
                        ['summary','quiz','study_plan','chat','progress','success'].includes(log.level)
                          ? 'bg-green-500/10 text-green-600'
                          : 'bg-blue-500/10 text-blue-600'
                      )}>
                        {log.level}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-foreground/80 break-words">
                      {log.message}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
