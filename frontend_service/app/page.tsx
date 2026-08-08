'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Moon,
  Sun,
  Sparkles,
  FileText,
  ListChecks,
  CalendarDays,
  MessageSquare,
  Upload,
  TrendingUp,
  GraduationCap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/components/providers/i18n-provider'
import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { useTheme } from 'next-themes'

function Logo({ tagline }: { tagline: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl grad-brand text-white flex items-center justify-center shadow-sm">
        <GraduationCap className="w-5 h-5" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-extrabold text-lg tracking-tight">ASA</span>
        <span className="text-[10px] text-muted-foreground tracking-wide mt-0.5">{tagline}</span>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const { t, dir } = useI18n()
  const { theme, setTheme } = useTheme()
  const isRtl = dir === 'rtl'
  const arrow = isRtl ? 'rotate-180' : ''

  const features = [
    { icon: FileText, title: t('feature1Title'), desc: t('feature1Desc') },
    { icon: ListChecks, title: t('feature2Title'), desc: t('feature2Desc') },
    { icon: CalendarDays, title: t('feature3Title'), desc: t('feature3Desc') },
    { icon: MessageSquare, title: t('feature4Title'), desc: t('feature4Desc') },
  ]

  const steps = [
    { icon: Upload, title: t('step1Title'), desc: t('step1Desc') },
    { icon: Sparkles, title: t('step2Title'), desc: t('step2Desc') },
    { icon: TrendingUp, title: t('step3Title'), desc: t('step3Desc') },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col relative" dir={dir}>
      {/* Whisper tint behind hero */}
      <div
        className="absolute inset-x-0 top-0 h-[520px] pointer-events-none"
        style={{
          background:
            'radial-gradient(700px 320px at 50% -10%, oklch(0.93 0.03 277 / 0.5), transparent 70%)',
        }}
      />

      {/* Navbar */}
      <nav className="relative border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" aria-label="ASA Home">
            <Logo tagline={t('tagline')} />
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              {t('navFeatures')}
            </a>
            <a href="#how" className="hover:text-foreground transition-colors">
              {t('navHow')}
            </a>
          </div>

          <div className={`flex items-center gap-1 sm:gap-2 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
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
            <Link href="/login">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                {t('login')}
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">{t('getStarted')}</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 sm:py-24">
        <div className="w-full max-w-2xl text-center animate-fadeUp">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground mb-6">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            {t('badge')}
          </span>

          <h1 className="text-3xl sm:text-5xl font-black text-balance leading-tight mb-5">
            {t('heroTitleA')}{' '}
            <span className="text-gradient">{t('heroTitleB')}</span>
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground text-pretty mb-9 leading-relaxed max-w-lg mx-auto">
            {t('heroSubtitle')}
          </p>

          <div className={`flex flex-wrap items-center justify-center gap-3 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
            <Link href="/signup">
              <Button size="lg" className={`gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {t('getStarted')}
                <ArrowRight className={`w-4 h-4 ${arrow}`} />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline">
                {t('learnMore')}
              </Button>
            </a>
          </div>
        </div>

        {/* Product mockup */}
        <div className="relative w-full max-w-3xl mt-14 sm:mt-16 animate-fadeUp" style={{ animationDelay: '120ms' }}>
          <div
            className="absolute -inset-x-6 -top-8 -bottom-8 blur-3xl pointer-events-none"
            style={{
              background:
                'radial-gradient(600px 300px at 50% 40%, oklch(0.88 0.05 277 / 0.5), transparent 70%)',
            }}
          />
          <div className="relative rounded-2xl border border-border bg-card shadow-2xl shadow-black/10 overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-muted/40">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
              <span className="ms-auto text-[10px] text-muted-foreground" dir="ltr">
                asa.study/dashboard
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 p-5 sm:p-6">
              <div className="space-y-4">
                <div className="rounded-xl border border-border p-4 bg-muted/30">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-7 h-7 rounded-lg grad-brand text-white flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-semibold">{t('summary')}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2 rounded-full bg-muted-foreground/15" />
                    <div className="h-2 rounded-full bg-muted-foreground/15 w-5/6" />
                    <div className="h-2 rounded-full bg-muted-foreground/15 w-2/3" />
                    <div className="h-2 rounded-full bg-muted-foreground/15 w-4/5" />
                  </div>
                </div>

                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold">{t('studyPlan')}</span>
                    <span className="text-[10px] text-muted-foreground">75%</span>
                  </div>
                  <div className="space-y-3">
                    <div className="h-1.5 rounded-full bg-muted-foreground/15">
                      <div className="h-full w-4/5 rounded-full grad-brand" />
                    </div>
                    <div className="h-1.5 rounded-full bg-muted-foreground/15">
                      <div className="h-full w-1/2 rounded-full grad-brand" />
                    </div>
                    <div className="h-1.5 rounded-full bg-muted-foreground/15">
                      <div className="h-full w-2/3 rounded-full grad-brand" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border p-4 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold">{t('quiz')}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 font-semibold">
                    3/10
                  </span>
                </div>
                <div className="space-y-2 flex-1">
                  <div className="h-2 rounded-full bg-muted-foreground/15 w-full" />
                  <div className="h-2 rounded-full bg-muted-foreground/15 w-2/3 mb-3" />
                  <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
                    <span className="w-4 h-4 rounded-full border border-muted-foreground/40 flex items-center justify-center text-[9px]">A</span>
                    <span className="h-1.5 rounded-full bg-muted-foreground/20 flex-1" />
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-2 text-xs text-indigo-700 dark:text-indigo-300">
                    <span className="w-4 h-4 rounded-full grad-brand text-white flex items-center justify-center text-[9px] font-bold">B</span>
                    <span className="h-1.5 rounded-full bg-indigo-300/60 dark:bg-indigo-400/40 flex-1" />
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
                    <span className="w-4 h-4 rounded-full border border-muted-foreground/40 flex items-center justify-center text-[9px]">C</span>
                    <span className="h-1.5 rounded-full bg-muted-foreground/20 flex-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features */}
      <section id="features" className="relative px-4 sm:px-6 py-20 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">{t('featuresTitle')}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="card-hover rounded-2xl border border-border bg-card p-6"
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative px-4 sm:px-6 py-20 sm:py-24 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">{t('howTitle')}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {steps.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="relative text-center">
                <div className="relative mx-auto w-14 h-14 rounded-2xl grad-brand text-white flex items-center justify-center shadow-sm mb-4">
                  <Icon className="w-6 h-6" />
                  <span className="absolute -top-1.5 -end-1.5 w-6 h-6 rounded-full bg-card border border-border text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-bold mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[260px] mx-auto">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo tagline={t('tagline')} />
          <p className="text-xs text-muted-foreground order-first sm:order-none">
            &copy; {new Date().getFullYear()} ASA
          </p>
          <div className={`flex items-center gap-5 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
            <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {t('login')}
            </Link>
            <Link href="/signup" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {t('signup')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
