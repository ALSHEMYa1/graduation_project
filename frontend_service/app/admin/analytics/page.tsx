'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, FileText } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { API_URL } from '@/lib/config'
import { useI18n } from '@/components/providers/i18n-provider'

interface AnalyticsData {
  mau: number
  retention: number
  docs_processed: number
  weekly_growth: { day: string; value: number }[]
  feature_distribution: { name: string; value: number; percentage: number }[]
}

export default function AdminAnalyticsPage() {
  const { t, dir } = useI18n()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token') || ''
    fetch(`${API_URL}/admin/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const metrics = [
    { label: t('adminMonthlyActiveUsers'), value: data?.mau ?? '0', icon: Users },
    { label: t('adminRetentionRate'), value: data ? `${data.retention}%` : '—', icon: TrendingUp },
    { label: t('adminDocsProcessed'), value: data?.docs_processed ?? '0', icon: FileText },
  ]

  const pieData = data?.feature_distribution?.length
    ? data.feature_distribution.map((d) => ({
        name: d.name,
        value: d.value,
        color: ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)'][
          data.feature_distribution.indexOf(d) % 4
        ],
      }))
    : [
        { name: 'No Data', value: 1, color: 'var(--color-border)' },
      ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold">{t('adminAnalyticsTitle')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('adminAnalyticsSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {metrics.map(({ label, value, icon: Icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="p-5 rounded-2xl border border-border bg-card"
          >
            <Icon className="w-5 h-5 text-muted-foreground mb-3" />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 p-5 rounded-2xl border border-border bg-card"
        >
          <h3 className="font-semibold mb-1">{t('adminGrowthTrend')}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t('adminDailyActiveUsers')}</p>

          {loading ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">{t('loading')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data?.weekly_growth ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="p-5 rounded-2xl border border-border bg-card"
        >
          <h3 className="font-semibold mb-1">{t('adminFeatureUsage')}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t('adminDistributionByFeature')}</p>

          <div className="flex justify-center">
            <PieChart width={160} height={160}>
              <Pie
                data={pieData}
                cx={75}
                cy={75}
                innerRadius={45}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </div>

          <div className="mt-3 space-y-1.5">
            {data?.feature_distribution?.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    background: [
                      'var(--color-chart-1)',
                      'var(--color-chart-2)',
                      'var(--color-chart-3)',
                      'var(--color-chart-4)',
                    ][data.feature_distribution.indexOf(item) % 4],
                  }}
                />
                <span className="text-muted-foreground flex-1">{item.name}</span>
                <span className="font-medium">{item.percentage}%</span>
              </div>
            ))}
            {(!data?.feature_distribution || data.feature_distribution.length === 0) && (
              <p className="text-xs text-muted-foreground text-center">{t('empty')}</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
