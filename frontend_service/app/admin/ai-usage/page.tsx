'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Cpu, FileText, Brain, MessageSquare, CalendarDays } from 'lucide-react'
import { API_URL } from '@/lib/config'
import { useI18n } from '@/components/providers/i18n-provider'

interface AIUsageRecord {
  id: number
  user_id: number
  feature: string
  created_at: string
}

export default function AdminAiUsagePage() {
  const { t, dir } = useI18n()
  const isRtl = dir === 'rtl'
  const [usage, setUsage] = useState<AIUsageRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_URL}/admin/ai-usage`, {
          headers: {
            Authorization: `Bearer ${token || ''}`,
          },
        })
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setUsage(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchUsage()
  }, [])

  const featureIcons: Record<string, any> = {
    summary: FileText,
    quiz: Brain,
    study_plan: CalendarDays,
    chat: MessageSquare,
  }

  const counts = usage.reduce<Record<string, number>>((acc, r) => {
    acc[r.feature] = (acc[r.feature] || 0) + 1
    return acc
  }, {})

  const total = usage.length

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold">{t('adminAiUsageTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('adminAiUsageSubtitle')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: t('adminTotalCalls'), value: total, icon: Cpu, color: 'text-chart-1 bg-chart-1/10' },
          { label: t('adminSummaries'), value: counts.summary || 0, icon: FileText, color: 'text-chart-2 bg-chart-2/10' },
          { label: t('adminQuizzes'), value: counts.quiz || 0, icon: Brain, color: 'text-chart-3 bg-chart-3/10' },
          { label: t('adminStudyPlans'), value: counts.study_plan || 0, icon: CalendarDays, color: 'text-chart-4 bg-chart-4/10' },
          { label: t('adminChats'), value: counts.chat || 0, icon: MessageSquare, color: 'text-chart-5 bg-chart-5/10' },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
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

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold">{t('adminUsageLog')}</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">{t('loading')}</div>
        ) : usage.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Cpu className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>{t('empty')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className={`${isRtl ? 'text-right' : 'text-left'} p-4 font-medium`}>{t('adminID')}</th>
                  <th className={`${isRtl ? 'text-right' : 'text-left'} p-4 font-medium`}>User ID</th>
                  <th className={`${isRtl ? 'text-right' : 'text-left'} p-4 font-medium`}>{t('adminFeature')}</th>
                  <th className={`${isRtl ? 'text-right' : 'text-left'} p-4 font-medium`}>{t('adminTimestamp')}</th>
                </tr>
              </thead>
              <tbody>
                {usage.map((r) => {
                  const Icon = featureIcons[r.feature] || Cpu
                  return (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="p-4 font-mono text-xs">{r.id}</td>
                      <td className="p-4">{r.user_id}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          <Icon className="w-3 h-3" />
                          {r.feature}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}
