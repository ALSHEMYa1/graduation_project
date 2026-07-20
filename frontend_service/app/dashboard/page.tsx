'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Upload,
  Brain,
  CalendarDays,
  MessageSquare,
  TrendingUp,
  File,
  Clock,
} from 'lucide-react'

import { AppShell } from '@/components/layout/app-shell'
import { useI18n } from '@/components/providers/i18n-provider'
import { API_URL } from '@/lib/config'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { cn } from '@/lib/utils'

const chartData = [
  { day: 'Mon', sessions: 0 },
  { day: 'Tue', sessions: 0 },
  { day: 'Wed', sessions: 0 },
  { day: 'Thu', sessions: 0 },
  { day: 'Fri', sessions: 0 },
  { day: 'Sat', sessions: 0 },
  { day: 'Sun', sessions: 0 },
]

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35 },
  }),
}

export default function DashboardPage() {
  const { t } = useI18n()

  const [user, setUser] = useState(null)
  const [statsData, setStatsData] = useState({
    files: 0,
    quizzes: 0,
    hours: 0,
    avgScore: '—',
  })

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token')
      if (!token) return

      try {
        const [userRes, statsRes] = await Promise.all([
          fetch(`${API_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/users/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        if (userRes.ok) {
          const userData = await userRes.json()
          setUser(userData)
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStatsData({
            files: statsData.files ?? 0,
            quizzes: statsData.quizzes ?? 0,
            hours: statsData.study_hours ?? 0,
            avgScore: statsData.avg_score ?? '—',
          })
        }
      } catch (err) {
        console.log(err)
      }
    }

    fetchData()
  }, [])

  const stats = [
    {
      label: t('filesUploaded'),
      value: statsData.files,
      icon: File,
      color: 'text-chart-1 bg-chart-1/10',
    },
    {
      label: t('quizzesTaken'),
      value: statsData.quizzes,
      icon: Brain,
      color: 'text-chart-2 bg-chart-2/10',
    },
    {
      label: t('studyHours'),
      value: `${statsData.hours}h`,
      icon: Clock,
      color: 'text-chart-3 bg-chart-3/10',
    },
    {
      label: t('avgScore'),
      value: statsData.avgScore,
      icon: TrendingUp,
      color: 'text-chart-4 bg-chart-4/10',
    },
  ]

  const quickActions = [
    {
      href: '/upload',
      icon: Upload,
      label: t('uploadFile'),
      desc: 'PDF, DOCX up to 50MB',
      color: 'bg-chart-1/10 text-chart-1 hover:bg-chart-1/20',
    },
    {
      href: '/quiz',
      icon: Brain,
      label: t('generateQuiz'),
      desc: 'Test your knowledge',
      color: 'bg-chart-2/10 text-chart-2 hover:bg-chart-2/20',
    },
    {
      href: '/study-plan',
      icon: CalendarDays,
      label: t('createPlan'),
      desc: 'Build a weekly plan',
      color: 'bg-chart-3/10 text-chart-3 hover:bg-chart-3/20',
    },
    {
      href: '/chat',
      icon: MessageSquare,
      label: t('startChat'),
      desc: 'Ask AI anything',
      color: 'bg-chart-4/10 text-chart-4 hover:bg-chart-4/20',
    },
  ]

  return (
    <AppShell title={t('dashboard')}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color }, i) => (
            <motion.div
              key={label}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="p-5 rounded-2xl border border-border bg-card"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <motion.div
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="lg:col-span-2 p-5 rounded-2xl border border-border bg-card"
          >
            <h3 className="font-semibold mb-4">Study Activity</h3>

            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  stroke="var(--color-primary)"
                  fill="var(--color-primary)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <div className="p-5 rounded-2xl border border-border bg-card">
            <h3 className="font-semibold mb-4">{t('recentActivity')}</h3>

            <div className="flex flex-col items-center justify-center h-36 text-center">
              <Clock className="w-6 h-6 text-muted-foreground mb-2" />
              <p className="text-sm">{t('noActivity')}</p>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((a) => (
            <Link key={a.href} href={a.href}>
              <div className={cn('p-4 rounded-xl border flex gap-3', a.color)}>
                <a.icon className="w-5 h-5" />
                <div>
                  <p className="font-semibold text-sm">{a.label}</p>
                  <p className="text-xs opacity-70">{a.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  )
}