'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Brain, AlertTriangle, CheckCircle2, Info, RotateCcw, TrendingUp, ArrowLeft, ArrowRight, Loader2, BarChart3, X, Eye } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { useI18n } from '@/components/providers/i18n-provider'
import { API_URL } from '@/lib/config'
import { apiPost } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ServerFile {
  id: number
  filename: string
}

interface Question {
  question_text: string
  options: string[]
  topic: string
  difficulty: string
  correct_answer?: string
  explanation?: string
}

export default function GapAnalysisPage() {
  const { t, dir, lang } = useI18n()
  const isRtl = dir === 'rtl'

  const [step, setStep] = useState<'select' | 'quiz' | 'results'>('select')
  const [files, setFiles] = useState<ServerFile[]>([])
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<{ question_index: number; selected: string }[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [total, setTotal] = useState(0)
  const [redTopics, setRedTopics] = useState<string[]>([])
  const [yellowTopics, setYellowTopics] = useState<string[]>([])
  const [greenTopics, setGreenTopics] = useState<string[]>([])
  const [focusPlan, setFocusPlan] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [viewSession, setViewSession] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetch(`${API_URL}/files`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setFiles)
      .catch(() => {})
    fetch(`${API_URL}/gap-analysis/history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setHistory)
      .catch(() => {})
  }, [])

  const startAnalysis = async () => {
    if (!selectedFileId) return
    setLoading(true)
    setStep('quiz')
    setCurrentQ(0)
    setAnswers([])
    setSelectedOption(null)
    setConfirmed(false)
    try {
      const data = await apiPost('gap-analysis/start', { document_id: selectedFileId, language: lang }, 120000)
      setQuestions(data.questions || [])
      setAllQuestions(data.all_questions || [])
      if (!data.questions || data.questions.length === 0) {
        toast.error('Could not generate analysis questions')
        setStep('select')
      }
    } catch {
      toast.error('Analysis failed. Try again with a shorter document.')
      setStep('select')
    } finally {
      setLoading(false)
    }
  }

  const selectAnswer = (opt: string) => {
    if (confirmed) return
    setSelectedOption(opt)
  }

  const confirmAnswer = () => {
    if (!selectedOption) return
    setConfirmed(true)
  }

  const nextQuestion = () => {
    const q = questions[currentQ]
    const fullQ = allQuestions.find(aq => aq.question_text === q.question_text)
    const isCorrect = selectedOption === fullQ?.correct_answer

    setAnswers(prev => [...prev, { question_index: currentQ, selected: selectedOption || '' }])

    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1)
      setSelectedOption(null)
      setConfirmed(false)
    } else {
      submitAnalysis()
    }
  }

  const submitAnalysis = async () => {
    setLoading(true)
    const allAnswers = [...answers]
    if (selectedOption) {
      const q = questions[currentQ]
      allAnswers.push({ question_index: currentQ, selected: selectedOption })
    }
    try {
      const data = await apiPost('gap-analysis/submit', { questions: allQuestions, answers: allAnswers, language: lang })
      setScore(data.score_percent)
      setCorrect(data.correct)
      setTotal(data.total)
      setRedTopics(data.red_topics || [])
      setYellowTopics(data.yellow_topics || [])
      setGreenTopics(data.green_topics || [])
      setFocusPlan(data.focus_plan || '')
      setHistory(data.history || [])
      setStep('results')
    } catch {
      toast.error('Failed to submit analysis')
    } finally {
      setLoading(false)
    }
  }

  const resetAll = () => {
    setStep('select')
    setQuestions([])
    setAllQuestions([])
    setCurrentQ(0)
    setAnswers([])
    setSelectedOption(null)
    setConfirmed(false)
  }

  const viewSessionDetail = async (id: number) => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_URL}/gap-analysis/session/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setViewSession(data)
      }
    } catch {}
  }

  const closeSessionDetail = () => setViewSession(null)

  const difficultyColor = (d: string) => {
    switch (d) {
      case 'easy': return 'text-green-500 bg-green-500/10'
      case 'medium': return 'text-yellow-500 bg-yellow-500/10'
      case 'hard': return 'text-red-500 bg-red-500/10'
      default: return 'text-muted-foreground bg-muted'
    }
  }

  return (
    <AppShell title={t('gapAnalysis')}>
      <div className="p-6 max-w-4xl mx-auto space-y-6" dir={dir}>

        {step === 'select' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Search className="w-6 h-6 text-primary" />
                {t('gapAnalysis')}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">{t('gapAnalysisDesc')}</p>
            </div>

            {files.length === 0 ? (
              <div className="p-12 border border-dashed rounded-2xl text-center">
                <Brain className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium">{t('selectDocumentFirst')}</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {files.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFileId(f.id)}
                    className={cn(
                      'flex items-center gap-3 p-4 border rounded-xl text-left transition-all',
                      selectedFileId === f.id
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'hover:border-primary/50'
                    )}
                  >
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                      selectedFileId === f.id ? 'border-primary' : 'border-muted-foreground'
                    )}>
                      {selectedFileId === f.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{f.filename}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {history.length > 0 && (
              <div className="p-5 border rounded-2xl bg-card">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  {t('history')}
                </h3>
                <div className="space-y-2">
                  {history.map((h: any) => (
                    <button key={h.id} onClick={() => viewSessionDetail(h.id)} className="w-full flex items-center justify-between text-sm py-2 px-2 border-b border-border last:border-0 hover:bg-muted/50 rounded-lg transition-colors">
                      <span className="text-muted-foreground text-xs">{h.date}</span>
                      <span className="flex items-center gap-2">
                        <span className={cn('font-semibold', h.score >= 80 ? 'text-green-500' : h.score >= 50 ? 'text-yellow-500' : 'text-red-500')}>
                          {h.correct}/{h.total} ({h.score}%)
                        </span>
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={startAnalysis} disabled={!selectedFileId || loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Brain className="w-4 h-4 mr-2" />}
              {loading ? t('analyzing') : t('startAnalysis')}
            </Button>
          </motion.div>
        )}

        {step === 'quiz' && loading && questions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">{t('analyzing')}</p>
          </div>
        )}

        {step === 'quiz' && questions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                {t('gapAnalysis')}
              </h1>
              <span className="text-sm text-muted-foreground">
                {t('question')} {currentQ + 1} {t('of')} {questions.length}
              </span>
            </div>

            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${((answers.length) / questions.length) * 100}%` }} />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQ}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 border rounded-2xl bg-card"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', difficultyColor(questions[currentQ]?.difficulty || ''))}>
                    {questions[currentQ]?.difficulty === 'easy' ? t('easy') : questions[currentQ]?.difficulty === 'medium' ? t('medium') : t('hard')}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {questions[currentQ]?.topic}
                  </span>
                </div>

                <p className="text-base font-medium mb-4">{questions[currentQ]?.question_text}</p>

                <div className="space-y-2">
                  {questions[currentQ]?.options.map((opt, oi) => {
                    const fullQ = allQuestions.find(aq => aq.question_text === questions[currentQ]?.question_text)
                    const isCorrectOpt = confirmed && opt === fullQ?.correct_answer
                    const isWrongOpt = confirmed && selectedOption === opt && opt !== fullQ?.correct_answer
                    return (
                      <button
                        key={oi}
                        onClick={() => selectAnswer(opt)}
                        disabled={confirmed}
                        className={cn(
                          'w-full text-left p-3 rounded-xl border text-sm transition-all',
                          selectedOption === opt && !confirmed && 'border-primary bg-primary/5 ring-2 ring-primary/20',
                          isCorrectOpt && 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
                          isWrongOpt && 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
                          !selectedOption && 'hover:border-primary/50',
                          confirmed && selectedOption !== opt && !isCorrectOpt && 'opacity-60'
                        )}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>

                {confirmed && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      {allQuestions.find(aq => aq.question_text === questions[currentQ]?.question_text)?.explanation}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between">
              {!confirmed ? (
                <Button onClick={confirmAnswer} disabled={!selectedOption} className="ml-auto">
                  Confirm Answer
                </Button>
              ) : (
                <Button onClick={nextQuestion} className="ml-auto">
                  {currentQ < questions.length - 1 ? (
                    <>{t('nextQuestion')} {isRtl ? <ArrowLeft className="w-4 h-4 mr-1" /> : <ArrowRight className="w-4 h-4 ml-1" />}</>
                  ) : (
                    'See Results'
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {step === 'results' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-primary" />
                {t('yourResults')}
              </h1>
              <Button variant="outline" size="sm" onClick={resetAll} className="gap-1">
                <RotateCcw className="w-3 h-3" />
                {t('retake')}
              </Button>
            </div>

            <div className="p-8 border rounded-2xl bg-card text-center">
              <div className={cn(
                'w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold border-4',
                score >= 80 ? 'border-green-500 text-green-500' : score >= 50 ? 'border-yellow-500 text-yellow-500' : 'border-red-500 text-red-500'
              )}>
                {score}%
              </div>
              <p className="text-lg font-bold">{correct}/{total} {t('correctAnswers')}</p>
            </div>

            <div className="grid gap-3">
              {redTopics.length > 0 && (
                <div className="p-4 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 rounded-2xl">
                  <h3 className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" /> {t('redZone')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {redTopics.map((t, i) => (
                      <span key={i} className="px-2.5 py-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg text-xs font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {yellowTopics.length > 0 && (
                <div className="p-4 border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/30 rounded-2xl">
                  <h3 className="font-semibold text-yellow-600 dark:text-yellow-400 flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4" /> {t('yellowZone')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {yellowTopics.map((t, i) => (
                      <span key={i} className="px-2.5 py-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 rounded-lg text-xs font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {greenTopics.length > 0 && (
                <div className="p-4 border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 rounded-2xl">
                  <h3 className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4" /> {t('greenZone')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {greenTopics.map((t, i) => (
                      <span key={i} className="px-2.5 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-lg text-xs font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {focusPlan && (
              <div className="p-5 border rounded-2xl bg-card">
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  {t('focusOn')}
                </h3>
                <p className="text-sm text-muted-foreground">{focusPlan}</p>
              </div>
            )}

            {history.length > 0 && (
              <div className="p-5 border rounded-2xl bg-card">
                <h3 className="font-semibold mb-3">{t('history')}</h3>
                <div className="space-y-2">
                  {history.map((h: any) => (
                    <button key={h.id} onClick={() => viewSessionDetail(h.id)} className="w-full flex items-center justify-between text-sm py-2 px-2 border-b border-border last:border-0 hover:bg-muted/50 rounded-lg transition-colors">
                      <span className="text-muted-foreground text-xs">{h.date}</span>
                      <span className="flex items-center gap-2">
                        <span className={cn('font-semibold', h.score >= 80 ? 'text-green-500' : h.score >= 50 ? 'text-yellow-500' : 'text-red-500')}>
                          {h.correct}/{h.total} ({h.score}%)
                        </span>
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

      </div>

      {viewSession && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={closeSessionDetail}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="font-bold text-lg">{t('yourResults')} — {viewSession.date}</h2>
              <Button variant="ghost" size="sm" onClick={closeSessionDetail}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
                <div className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-4 shrink-0',
                  viewSession.score_percent >= 80 ? 'border-green-500 text-green-500' : viewSession.score_percent >= 50 ? 'border-yellow-500 text-yellow-500' : 'border-red-500 text-red-500'
                )}>
                  {viewSession.score_percent}%
                </div>
                <div>
                  <p className="font-semibold">{viewSession.correct}/{viewSession.total} {t('correctAnswers')}</p>
                  <p className="text-xs text-muted-foreground">{viewSession.date}</p>
                </div>
              </div>

              {viewSession.questions_data?.map((q: any, i: number) => (
                <div key={i} className="p-4 border rounded-xl space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', difficultyColor(q.difficulty))}>
                      {q.difficulty === 'easy' ? t('easy') : q.difficulty === 'medium' ? t('medium') : t('hard')}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{q.topic}</span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium ml-auto', q.is_correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                      {q.is_correct ? t('correct') : t('incorrect')}
                    </span>
                  </div>
                  <p className="font-medium text-sm">{i + 1}. {q.question_text}</p>
                  <div className="space-y-1">
                    {q.options?.map((opt: string, oi: number) => (
                      <div key={oi} className={cn(
                        'p-2 rounded-lg text-xs border',
                        opt === q.correct_answer && 'border-green-400 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300',
                        opt === q.user_answer && opt !== q.correct_answer && 'border-red-400 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300',
                        opt !== q.correct_answer && opt !== q.user_answer && 'border-transparent text-muted-foreground'
                      )}>
                        {opt}
                        {opt === q.correct_answer && <span className="ml-2 text-green-600 dark:text-green-400 text-[10px]">✓ {t('correct')}</span>}
                        {opt === q.user_answer && opt !== q.correct_answer && <span className="ml-2 text-red-600 dark:text-red-400 text-[10px]">✗ {t('incorrect')}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AppShell>
  )
}
