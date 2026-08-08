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
import { cn } from '@/lib/utils'

const GOAL_HOURS = 20

const weeklyHours = [2, 3, 1, 4, 2, 5, 3]

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35 },
  }),
}

export default function DashboardPage() {
  const { t, lang } = useI18n()

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
        const statsRes = await fetch(`${API_URL}/users/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (statsRes.ok) {
          const data = await statsRes.json()
          setStatsData({
            files: data.files ?? 0,
            quizzes: data.quizzes ?? 0,
            hours: data.study_hours ?? 0,
            avgScore: data.avg_score ?? '—',
          })
        }
      } catch (err) {
        console.log(err)
      }
    }

    fetchData()
  }, [])

  const dayLabels = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' }).format(
      new Date(2026, 0, 4 + i)
    )
  )

  const maxIdx = weeklyHours.indexOf(Math.max(...weeklyHours))
  const pct = Math.min(100, Math.round((statsData.hours / GOAL_HOURS) * 100))
  const ringC = 2 * Math.PI * 52
  const ringOffset = ringC * (1 - pct / 100)

  const stats = [
    {
      label: t('filesUploaded'),
      value: statsData.files,
      trend: `+2 ${t('thisWeek')}`,
      icon: File,
      chip: 'bg-violet-100 dark:bg-violet-500/20 text-violet-500',
    },
    {
      label: t('quizzesTaken'),
      value: statsData.quizzes,
      trend: `84% ${t('avg')}`,
      icon: Brain,
      chip: 'bg-sky-100 dark:bg-sky-500/20 text-sky-500',
    },
    {
      label: t('studyHours'),
      value: `${statsData.hours}h`,
      trend: `${GOAL_HOURS}h ${t('goalProgress')}`,
      icon: Clock,
      chip: 'bg-amber-100 dark:bg-amber-500/20 text-amber-500',
    },
    {
      label: t('avgScore'),
      value: statsData.avgScore,
      trend: `↑ ${t('trendUp')}`,
      icon: TrendingUp,
      chip: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500',
    },
  ]

  const quickTools = [
    {
      href: '/upload',
      icon: Upload,
      title: t('uploadFile'),
      desc: t('uploadDesc'),
      gradient: 'bg-gradient-to-br from-violet-500 to-indigo-600',
      shadow: 'shadow-violet-500/25',
      bar: 'w-1/3 group-hover:w-2/3',
    },
    {
      href: '/quiz',
      icon: Brain,
      title: t('generateQuiz'),
      desc: t('quizDesc'),
      gradient: 'bg-gradient-to-br from-sky-500 to-cyan-500',
      shadow: 'shadow-sky-500/25',
      bar: 'w-1/2 group-hover:w-3/4',
    },
    {
      href: '/study-plan',
      icon: CalendarDays,
      title: t('createPlan'),
      desc: t('planDesc'),
      gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/25',
      bar: 'w-2/3 group-hover:w-full',
    },
    {
      href: '/chat',
      icon: MessageSquare,
      title: t('startChat'),
      desc: t('chatDesc'),
      gradient: 'bg-gradient-to-br from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/25',
      bar: 'w-1/4 group-hover:w-1/2',
    },
  ]

  return (
    <AppShell title={t('dashboard')}>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl grad-brand text-white p-6 sm:p-8 card-hover">
          <div className="absolute inset-0 bg-grid opacity-40" />
          <div className="absolute -top-10 -start-10 w-52 h-52 rounded-full bg-white/20 blur-2xl animate-blob" />
          <div className="absolute -bottom-16 end-10 w-64 h-64 rounded-full bg-sky-300/30 blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <p className="text-sm text-white/80">{t('hello')} 👋</p>
              <h1 className="text-2xl sm:text-3xl font-black mt-1">{t('heroCta')}</h1>
              <p className="text-white/80 mt-2 text-sm sm:text-base max-w-md">{t('heroSub')}</p>
              <div className="flex flex-wrap gap-3 mt-5">
                <Link href="/upload" className="px-5 py-2.5 rounded-xl bg-white text-indigo-600 font-bold glow-btn">
                  📄 {t('uploadNew')}
                </Link>
                <Link href="/quiz" className="px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 transition font-bold">
                  ⚡ {t('makeQuiz')}
                </Link>
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-center bg-white/15 rounded-2xl px-6 py-5 glass">
              <div className="relative">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="10" />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="white"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={ringC}
                    strokeDashoffset={ringOffset}
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black">{pct}%</span>
                  <span className="text-[10px] text-white/70">{t('progressLabel')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, trend, icon: Icon, chip }, i) => (
            <motion.div
              key={label}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="card-hover p-5 rounded-2xl bg-card border border-border shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl sm:text-3xl font-black text-gradient">{value}</span>
                <span className={cn('w-11 h-11 rounded-xl flex items-center justify-center', chip)}>
                  <Icon className="w-5 h-5" />
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{label}</p>
              <span className="text-[11px] font-bold text-emerald-500 mt-1 inline-block">{trend}</span>
            </motion.div>
          ))}
        </section>

        {/* Chart + Recent */}
        <section className="grid lg:grid-cols-3 gap-4">
          <motion.div
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="lg:col-span-2 card-hover p-5 rounded-2xl bg-card border border-border shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold">{t('studyActivity')}</h3>
                <p className="text-xs text-muted-foreground">{t('studyActivitySub')}</p>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                +18% {t('thisWeek')}
              </span>
            </div>
            <div className="flex items-end gap-2 sm:gap-3 h-40">
              {weeklyHours.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition">
                    {h}h
                  </span>
                  <div
                    className={cn(
                      'w-full max-w-[36px] rounded-lg bar-grow',
                      i === maxIdx ? 'grad-brand shadow-lg shadow-indigo-500/30' : 'bg-slate-100 dark:bg-white/5'
                    )}
                    style={{ height: `${h * 14}px`, animationDelay: `${i * 0.05}s` }}
                  />
                  <span className="text-[10px] text-muted-foreground">{dayLabels[i]}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full grad-brand" />
                {t('studyHours')}
              </span>
            </div>
          </motion.div>

          <motion.div
            custom={5}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="card-hover p-5 rounded-2xl bg-card border border-border shadow-sm"
          >
            <h3 className="font-extrabold mb-4">{t('recentActivity')}</h3>
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-500/20 text-violet-500 flex items-center justify-center mb-3">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold">{t('noActivity')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('noActivityDesc')}</p>
            </div>
          </motion.div>
        </section>

        {/* Quick tools */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold">{t('quickTools')}</h3>
            <Link href="/upload" className="text-sm font-bold text-primary hover:text-primary/80 transition">
              {t('viewAll')} →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickTools.map(({ href, icon: Icon, title, desc, gradient, shadow, bar }, i) => (
              <motion.div key={href} custom={i} variants={fadeUp} initial="hidden" animate="visible">
                <Link
                  href={href}
                  className={cn(
                    'card-hover group rounded-2xl text-white p-5 shadow-lg block',
                    gradient,
                    shadow
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold">{title}</span>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-white/70 text-xs mt-1">{desc}</p>
                  <div className="mt-4 h-1.5 rounded-full bg-white/25 overflow-hidden">
                    <div className={cn('h-full rounded-full bg-white transition-all duration-500', bar)} />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
