'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Trophy, RefreshCw, XCircle, ArrowRight, Check, Loader2 } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { useI18n } from '@/components/providers/i18n-provider'
import { apiPost } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DocumentSelector } from '@/components/shared/document-selector'

interface Question {
  question_text: string
  options: string[]
  correct_answer: string
  explanation: string
}

type QuizState = 'idle' | 'loading' | 'active' | 'done' | 'error'

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function QuizPage() {
  const { t, dir, lang } = useI18n()
  const isRtl = dir === 'rtl'

  const [state, setState] = useState<QuizState>('idle')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [score, setScore] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null)
  const [numQuestions, setNumQuestions] = useState(10)
  const [error, setError] = useState<string | null>(null)

  const startQuiz = async () => {
    if (!selectedDocId) {
      setError("Please select a document first")
      setState("error")
      return
    }
    const count = numQuestions || 5

    try {
      setState("loading")
      setError(null)

      const data = await apiPost('quiz', { document_id: selectedDocId, num_questions: count, language: lang }, 120000)

      const rawQuestions = data.questions || []
      if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
        throw new Error("لم يتم إنشاء أسئلة كافية، حاول مرة أخرى")
      }

      const shuffled = rawQuestions.map((q: Question) => ({
        ...q,
        options: shuffleArray(q.options),
      }))
      setQuestions(shuffled)

      setState("active")
      setCurrentQ(0)
      setSelected(null)
      setConfirmed(false)
      setScore(0)
      setResults([])

    } catch (err: any) {
      setError(err.message || "Something went wrong")
      setState("error")
    }
  }

  const handleSelect = (idx: number) => {
    if (confirmed) return
    setSelected(idx)
  }

  const handleConfirm = () => {
    if (selected === null || !questions.length) return

    setConfirmed(true)
    const q = questions[currentQ]
    const isCorrect = q?.options[selected] === q?.correct_answer

    if (isCorrect) setScore((s) => s + 1)
    setResults((r) => [...r, isCorrect])
  }

  const handleNext = () => {
    if (currentQ + 1 >= questions.length) {
      setState('done')
      return
    }
    setCurrentQ((q) => q + 1)
    setSelected(null)
    setConfirmed(false)
  }

  const pct = questions.length
    ? Math.round((score / questions.length) * 100)
    : 0

  return (
    <AppShell title={t('quiz')}>
      <div className="p-6 max-w-2xl mx-auto" dir={dir}>
        <AnimatePresence mode="wait">

          {state === 'idle' && (
            <motion.div key="idle" className="space-y-6">
              <h1 className="text-2xl font-bold">{t('quizTitle')}</h1>

              <DocumentSelector
                selectedId={selectedDocId}
                onSelect={(id) => setSelectedDocId(id)}
              />

              <div className="p-8 border rounded-2xl text-center space-y-4">
                <Brain className="mx-auto text-primary w-10 h-10" />

                <div className="flex items-center justify-center gap-2">
                  <label className="text-sm text-muted-foreground">{t('question')}s:</label>
                  <input
                    type="number"
                    min={0}
                    max={999}
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 text-center border rounded-lg p-2 text-sm"
                  />
                </div>

                <Button onClick={startQuiz} className="gap-2">
                  {t('startQuiz')} <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {state === 'loading' && (
            <div className="text-center space-y-4">
              <RefreshCw className="animate-spin mx-auto" />
              <p>{t('generating')}</p>
            </div>
          )}

          {state === 'error' && (
            <div className="text-center space-y-4 text-red-500">
              <XCircle className="mx-auto" />
              <p>{error}</p>
              <Button onClick={() => setState('idle')}>
                {t('tryAgain')}
              </Button>
            </div>
          )}

          {state === 'active' && questions.length > 0 && (
            <motion.div key="quiz" className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {t('question')} {currentQ + 1} {t('of')} {questions.length}
                </p>
                <Button variant="ghost" size="sm" onClick={startQuiz}>
                  <RefreshCw className="w-4 h-4 mr-1" /> Regenerate
                </Button>
              </div>

              <div className="p-6 border rounded-xl text-lg">
                {questions[currentQ]?.question_text}
              </div>

              <div className="space-y-3">
                {questions[currentQ]?.options?.map((opt, i) => {
                  const isCorrect = questions[currentQ]?.correct_answer === opt
                  const isSelected = selected === i
                  const showResult = confirmed
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelect(i)}
                      className={cn(
                        'w-full p-3 border rounded-xl text-left transition-all',
                        isSelected && !showResult && 'border-primary bg-primary/5 ring-2 ring-primary',
                        showResult && isCorrect && 'bg-green-100 border-green-400 text-green-900',
                        showResult && isSelected && !isCorrect && 'bg-red-100 border-red-400 text-red-900',
                        !showResult && !isSelected && 'hover:border-primary/50 hover:bg-accent',
                        showResult && !isSelected && !isCorrect && 'opacity-60',
                      )}
                    >
                      <span className="inline-flex items-center gap-2">
                        {showResult && isCorrect && <Check className="w-4 h-4 text-green-600" />}
                        {opt}
                      </span>
                    </button>
                  )
                })}
              </div>

              {!confirmed ? (
                <div className="flex justify-center">
                  <Button
                    onClick={handleConfirm}
                    disabled={selected === null}
                    className="gap-2"
                  >
                    <Check className="w-4 h-4" /> Confirm Answer
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions[currentQ]?.explanation && (
                    <div className="p-4 bg-muted rounded-xl text-sm">
                      <p className="font-medium mb-1">Explanation:</p>
                      <p className="text-muted-foreground">{questions[currentQ]?.explanation}</p>
                    </div>
                  )}
                  <div className="flex justify-center">
                    <Button onClick={handleNext} className="gap-2">
                      {currentQ + 1 >= questions.length ? t('submitQuiz') : t('nextQuestion')}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {state === 'done' && (
            <div className="text-center space-y-6">
              <Trophy className="mx-auto text-yellow-500 w-16 h-16" />
              <h2 className="text-3xl font-bold">{pct}%</h2>
              <p className="text-lg text-muted-foreground">
                {score} / {questions.length} {t('correct')}
              </p>
              <Button onClick={() => setState('idle')} className="gap-2">
                {t('tryAgain')} <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          )}

        </AnimatePresence>
      </div>
    </AppShell>
  )
}
