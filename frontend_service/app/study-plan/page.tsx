'use client'

import { useState } from 'react'
import { Sparkles, ChevronDown, BookOpen, ListChecks, Target, Clock, RefreshCw, Loader2 } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { useI18n } from '@/components/providers/i18n-provider'
import { apiPost } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DocumentSelector } from '@/components/shared/document-selector'

interface SectionQuiz {
  question_text: string
  options: string[]
  correct_answer: string
  explanation: string
  selectedIndex: number | null
}

interface Section {
  title: string
  text_summary: string
  key_points: string[]
  what_to_do: string[]
  quiz: SectionQuiz[]
}

interface DayPlan {
  day_number: number
  day_title: string
  estimated_time: string
  sections: Section[]
  expanded: boolean
  progress: number
  done: boolean
}

export default function StudyPlanPage() {
  const { t, dir, lang } = useI18n()
  const isRtl = dir === 'rtl'

  const [daysInput, setDaysInput] = useState('')
  const [plan, setPlan] = useState<DayPlan[]>([])
  const [meta, setMeta] = useState<any>(null)
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Map<number, Set<number>>>(new Map())

  const toggleDay = (dayNum: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev)
      if (next.has(dayNum)) next.delete(dayNum)
      else next.add(dayNum)
      return next
    })
  }

  const toggleSection = (dayNum: number, sectionIdx: number) => {
    setExpandedSections((prev) => {
      const next = new Map(prev)
      const daySet = new Set(next.get(dayNum) || [])
      if (daySet.has(sectionIdx)) daySet.delete(sectionIdx)
      else daySet.add(sectionIdx)
      next.set(dayNum, daySet)
      return next
    })
  }

  const isSectionExpanded = (dayNum: number, sectionIdx: number) =>
    expandedSections.get(dayNum)?.has(sectionIdx) ?? false

  const handleGenerate = async () => {
    const n = parseInt(daysInput, 10)
    if (!n || n < 1 || n > 30) return
    if (!selectedDocId) {
      setError('Please select a document first')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const data = await apiPost('study-plan', { document_id: selectedDocId, days: n, language: lang }, 180000)

      const safePlan: DayPlan[] = (data.plan || []).map((day: any) => ({
        day_number: day.day_number ?? day.day,
        day_title: day.day_title ?? day.topic ?? `Day ${day.day_number}`,
        estimated_time: day.estimated_time || '1 hour',
        sections: (day.sections || []).map((sec: any) => ({
          title: sec.title,
          text_summary: sec.text_summary || '',
          key_points: sec.key_points || [],
          what_to_do: sec.what_to_do || [],
          quiz: (sec.quiz || []).map((q: any) => ({
            question_text: q.question_text,
            options: q.options || [],
            correct_answer: q.correct_answer,
            explanation: q.explanation || '',
            selectedIndex: null,
          })),
        })),
        expanded: false,
        progress: 0,
        done: false,
      }))

      setPlan(safePlan)
      setMeta(data.meta || null)
      setExpandedDays(new Set([1]))
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const answerQuiz = (dayIdx: number, sectionIdx: number, qIdx: number, optIdx: number) => {
    setPlan((prev) => {
      const updated = [...prev]
      const day = { ...updated[dayIdx] }
      const sections = [...day.sections]
      const section = { ...sections[sectionIdx] }
      const quiz = [...section.quiz]
      quiz[qIdx] = { ...quiz[qIdx], selectedIndex: optIdx }
      section.quiz = quiz
      sections[sectionIdx] = section
      day.sections = sections

      const allCorrect = sections.every((sec) =>
        sec.quiz.every((q) => q.selectedIndex !== null && q.options[q.selectedIndex] === q.correct_answer)
      )
      const total = sections.reduce((sum, sec) => sum + sec.quiz.length, 0)
      const correct = sections.reduce((sum, sec) =>
        sum + sec.quiz.filter((q) => q.selectedIndex !== null && q.options[q.selectedIndex] === q.correct_answer).length, 0
      )
      day.progress = total > 0 ? Math.round((correct / total) * 100) : 0
      day.done = allCorrect && total > 0
      updated[dayIdx] = day
      return updated
    })
  }

  const totalSections = plan.reduce((sum, d) => sum + d.sections.length, 0)
  const completedDays = plan.filter((d) => d.done).length

  return (
    <AppShell title={t('studyPlan')}>
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4" dir={dir}>

        <div className={isRtl ? 'text-right' : 'text-left'}>
          <h1 className="text-xl font-bold">{t('studyPlanTitle')}</h1>
          <p className="text-sm text-muted-foreground">Organise your learning schedule</p>
        </div>

        <DocumentSelector
          selectedId={selectedDocId}
          onSelect={(id) => setSelectedDocId(id)}
        />

        <div className="rounded-xl border p-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="number"
              value={daysInput}
              onChange={(e) => setDaysInput(e.target.value)}
              placeholder="Days (1-30)"
              className="border p-2 rounded w-full"
            />
            <Button onClick={handleGenerate} disabled={loading || !daysInput}>
              {loading ? 'Generating...' : 'Generate'}
            </Button>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        {plan.length === 0 && !loading && (
          <div className="text-center p-10 border rounded-xl">
            <Sparkles className="mx-auto mb-2" />
            <p>Generate your study plan</p>
          </div>
        )}

        {loading && (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-full" />
            <div className="h-4 bg-gray-300 rounded w-3/4" />
            <div className="h-4 bg-gray-300 rounded w-1/2" />
          </div>
        )}

        {plan.length > 0 && (
          <div className="space-y-4">
            {/* Stats + Regenerate */}
            <div className="flex items-center justify-between">
              <div className="grid grid-cols-3 gap-3 flex-1">
                <div className="p-3 border rounded-xl text-center">
                  <p className="text-2xl font-bold">{plan.length}</p>
                  <p className="text-xs text-muted-foreground">Days</p>
                </div>
                <div className="p-3 border rounded-xl text-center">
                  <p className="text-2xl font-bold">{totalSections}</p>
                  <p className="text-xs text-muted-foreground">Sections</p>
                </div>
                <div className="p-3 border rounded-xl text-center">
                  <p className="text-2xl font-bold">{completedDays}/{plan.length}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
              <div className="ml-3">
                <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading}>
                  <RefreshCw className="w-4 h-4 mr-1" /> Regenerate
                </Button>
              </div>
            </div>

            {meta?.overview && (
              <div className="p-4 border rounded-xl bg-muted/20">
                <p className="text-sm text-muted-foreground">{meta.overview}</p>
              </div>
            )}

            {plan.map((day, dayIdx) => (
              <div key={day.day_number} className="border rounded-xl overflow-hidden">
                {/* Day Header */}
                <button
                  onClick={() => toggleDay(day.day_number)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                      day.done ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'
                    )}>
                      {day.day_number}
                    </div>
                    <div className={isRtl ? 'text-right' : 'text-left'}>
                      <p className="font-semibold text-sm">{isRtl ? `اليوم ${day.day_number}` : `Day ${day.day_number}`}: {day.day_title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{day.estimated_time}</span>
                        <span>•</span>
                        <span>{day.sections.length} sections</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {day.done && <span className="text-xs text-green-600 font-medium">Done</span>}
                    <ChevronDown className={cn('w-4 h-4 transition-transform', expandedDays.has(day.day_number) && 'rotate-180')} />
                  </div>
                </button>

                {/* Day Progress */}
                <div className="px-4 pb-2">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', day.done ? 'bg-green-500' : 'bg-primary')}
                      style={{ width: `${day.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{day.progress}% complete</p>
                </div>

                {/* Day Content */}
                {expandedDays.has(day.day_number) && (
                  <div className="px-4 pb-4 space-y-3">
                    {day.sections.map((section, secIdx) => {
                      const secExpanded = isSectionExpanded(day.day_number, secIdx)
                      return (
                        <div key={secIdx} className="border rounded-lg overflow-hidden">
                          {/* Section Header */}
                          <button
                            onClick={() => toggleSection(day.day_number, secIdx)}
                            className="w-full flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/40 transition-colors text-sm"
                          >
                            <span className="font-medium flex items-center gap-2">
                              <BookOpen className="w-3.5 h-3.5 text-primary" />
                              {section.title}
                            </span>
                            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', secExpanded && 'rotate-180')} />
                          </button>

                          {secExpanded && (
                            <div className="p-3 space-y-4 text-sm">
                              {/* Text Summary (التلخيص الكلامي) */}
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Text Summary</p>
                                <p className="leading-relaxed">{section.text_summary}</p>
                              </div>

                              {/* Key Points (التلخيص النقطي) */}
                              {section.key_points.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Key Points</p>
                                  <ul className="space-y-1">
                                    {section.key_points.map((pt, i) => (
                                      <li key={i} className="flex gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>{pt}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* What To Do */}
                              {section.what_to_do.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                                    <Target className="w-3 h-3" /> What To Do
                                  </p>
                                  <ul className="space-y-1">
                                    {section.what_to_do.map((item, i) => (
                                      <li key={i} className="flex gap-2">
                                        <span className="text-green-600 font-bold shrink-0">{i + 1}.</span>
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Mini Quiz */}
                              {section.quiz.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                                    <ListChecks className="w-3 h-3" /> Mini Quiz ({section.quiz.length} questions)
                                  </p>
                                  <div className="space-y-3">
                                    {section.quiz.map((q, qIdx) => {
                                      const isAnswered = q.selectedIndex !== null
                                      const isCorrect = isAnswered && q.options[q.selectedIndex!] === q.correct_answer
                                      return (
                                        <div key={qIdx} className="border rounded-lg p-3">
                                          <p className="font-medium mb-2 text-sm">{q.question_text}</p>
                                          <div className="space-y-1.5">
                                            {q.options.map((opt, oIdx) => {
                                              const isSelected = q.selectedIndex === oIdx
                                              const isRight = q.correct_answer === opt
                                              return (
                                                <button
                                                  key={oIdx}
                                                  onClick={() => answerQuiz(dayIdx, secIdx, qIdx, oIdx)}
                                                  disabled={isAnswered}
                                                  className={cn(
                                                    'w-full text-left p-2 rounded-lg text-sm border transition-colors',
                                                    !isAnswered && 'hover:border-primary hover:bg-accent',
                                                    isAnswered && isRight && 'bg-green-50 border-green-400 text-green-800',
                                                    isAnswered && isSelected && !isRight && 'bg-red-50 border-red-400 text-red-800',
                                                    !isAnswered && 'border-border',
                                                    isAnswered && !isSelected && !isRight && 'opacity-60'
                                                  )}
                                                >
                                                  {opt}
                                                </button>
                                              )
                                            })}
                                          </div>
                                          {isAnswered && (
                                            <div className={cn(
                                              'mt-2 text-xs p-2 rounded',
                                              isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                            )}>
                                              {isCorrect ? '✅ Correct!' : `❌ Incorrect. Answer: ${q.correct_answer}`}
                                              {q.explanation && <p className="mt-1 text-muted-foreground">{q.explanation}</p>}
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
