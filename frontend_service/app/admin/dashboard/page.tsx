'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, FileText, Cpu, ScrollText, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { adminApi } from '@/lib/admin-api'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { StatsGridSkeleton, TableSkeleton } from '@/components/shared/page-skeleton'
import { useI18n } from '@/components/providers/i18n-provider'

interface DashboardData {
  total_users: number
  total_documents: number
  total_ai_calls: number
  feature_breakdown: Record<string, number>
  recent_logs: { id: number; level: string; message: string; created_at: string }[]
}

export default function AdminDashboardPage() {
  const { t, dir } = useI18n()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getDashboard().then(setData).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <StatsGridSkeleton count={3} />
        <Skeleton className="h-4 w-32" />
        <TableSkeleton rows={4} cols={3} />
      </div>
    )
  }

  const metrics = [
    { label: t('totalUsers'), value: data?.total_users ?? 0, icon: Users, color: 'text-chart-1 bg-chart-1/10' },
    { label: t('totalDocs'), value: data?.total_documents ?? 0, icon: FileText, color: 'text-chart-2 bg-chart-2/10' },
    { label: t('apiCalls'), value: data?.total_ai_calls ?? 0, icon: Cpu, color: 'text-chart-3 bg-chart-3/10' },
  ]

  const breakdown = data?.feature_breakdown ?? {}

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold">{t('adminDashboardTitle')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('adminDashboardSubtitle')}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {metrics.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="p-5 rounded-2xl border border-border bg-card"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-5 rounded-2xl border border-border bg-card"
        >
          <h3 className="font-semibold mb-3">{t('adminFeatureBreakdown')}</h3>
          {Object.keys(breakdown).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('adminNoUsageData')}</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(breakdown).map(([feature, count]) => (
                <div key={feature} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{feature.replace('_', ' ')}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-2xl border border-border bg-card"
        >
          <h3 className="font-semibold mb-3">{t('adminRecentLogs')}</h3>
          {(!data?.recent_logs || data.recent_logs.length === 0) ? (
            <p className="text-sm text-muted-foreground">{t('adminNoLogs')}</p>
          ) : (
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {data.recent_logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-xs">
                  {log.level === 'error' ? (
                    <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                  ) : log.level === 'success' || log.level === 'summary' || log.level === 'quiz' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  )}
                  <span className="text-muted-foreground font-mono truncate">
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
