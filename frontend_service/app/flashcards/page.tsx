'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, RefreshCw, ChevronLeft, ChevronRight, Shuffle, RotateCcw, Loader2 } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { useI18n } from '@/components/providers/i18n-provider'
import { apiPost } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DocumentSelector } from '@/components/shared/document-selector'

interface Flashcard {
  front: string
  back: string
  topic: string
}

type FlashcardsState = 'idle' | 'loading' | 'active' | 'error'

export default function FlashcardsPage() {
  const { t, dir, lang } = useI18n()
  const isRtl = dir === 'rtl'

  const [state, setState] = useState<FlashcardsState>('idle')
  const [cards, setCards] = useState<Flashcard[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null)
  const [numCards, setNumCards] = useState(20)
  const [error, setError] = useState<string | null>(null)
  const [shuffled, setShuffled] = useState<number[]>([])

  const generateCards = async () => {
    if (!selectedDocId) {
      setError('Please select a document first')
      setState('error')
      return
    }

    try {
      setState('loading')
      setError(null)

      const data = await apiPost('flashcards', { document_id: selectedDocId, num_cards: numCards, language: lang }, 120000)
      const rawCards: Flashcard[] = data.flashcards || []
      if (rawCards.length === 0) throw new Error('No flashcards returned')

      setCards(rawCards)
      const indices = rawCards.map((_, i) => i)
      setShuffled(indices)
      setCurrentIdx(0)
      setFlipped(false)
      setState('active')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setState('error')
    }
  }

  const next = () => {
    if (currentIdx < cards.length - 1) {
      setCurrentIdx((i) => i + 1)
      setFlipped(false)
    }
  }

  const prev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1)
      setFlipped(false)
    }
  }

  const shuffleCards = () => {
    const indices = cards.map((_, i) => i)
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }
    setShuffled(indices)
    setCurrentIdx(0)
    setFlipped(false)
  }

  const resetCards = () => {
    const indices = cards.map((_, i) => i)
    setShuffled(indices)
    setCurrentIdx(0)
    setFlipped(false)
  }

  const displayIdx = shuffled[currentIdx] ?? 0
  const currentCard = cards[displayIdx]
  const pct = cards.length ? Math.round(((currentIdx + 1) / cards.length) * 100) : 0

  return (
    <AppShell title={t('flashcards')}>
      <div className="p-6 max-w-2xl mx-auto" dir={dir}>
        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <motion.div key="idle" className="space-y-6">
              <h1 className="text-2xl font-bold">{t('flashcardsTitle')}</h1>
              <DocumentSelector
                selectedId={selectedDocId}
                onSelect={(id) => setSelectedDocId(id)}
              />
              <div className="p-8 border rounded-2xl text-center space-y-4">
                <Brain className="mx-auto text-primary w-10 h-10" />
                <div className="flex items-center justify-center gap-2">
                  <label className="text-sm text-muted-foreground">Cards:</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={numCards}
                    onChange={(e) => setNumCards(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center border rounded-lg p-2 text-sm"
                  />
                </div>
                <Button onClick={generateCards} className="gap-2">
                  {t('generate')} <Brain className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {state === 'loading' && (
            <div className="text-center space-y-4 py-20">
              <RefreshCw className="animate-spin mx-auto w-8 h-8 text-primary" />
              <p className="text-muted-foreground">{t('generating')}</p>
            </div>
          )}

          {state === 'error' && (
            <div className="text-center space-y-4 text-red-500 py-20">
              <p>{error}</p>
              <Button onClick={() => setState('idle')}>{t('tryAgain')}</Button>
            </div>
          )}

          {state === 'active' && currentCard && (
            <motion.div key="active" className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {currentIdx + 1} / {cards.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={shuffleCards}>
                    <Shuffle className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={resetCards}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="w-full bg-muted rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>

              <div
                onClick={() => setFlipped(!flipped)}
                className="cursor-pointer"
              >
                <motion.div
                  key={currentIdx + (flipped ? '-flipped' : '')}
                  initial={{ opacity: 0, rotateY: -15 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  className={cn(
                    'min-h-[280px] p-8 rounded-2xl border-2 flex flex-col items-center justify-center text-center',
                    flipped
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:border-primary/50'
                  )}
                >
                  {!flipped ? (
                    <>
                      <span className="text-xs text-muted-foreground mb-3">{currentCard.topic}</span>
                      <p className="text-xl font-semibold">{currentCard.front}</p>
                      <p className="text-xs text-muted-foreground mt-6">{t('tapToReveal')}</p>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-primary font-medium mb-3">{t('answer')}</span>
                      <p className="text-lg">{currentCard.back}</p>
                      <p className="text-xs text-muted-foreground mt-6">{t('tapToHide')}</p>
                    </>
                  )}
                </motion.div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prev}
                  disabled={currentIdx === 0}
                >
                  {isRtl ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </Button>

                <span className="text-sm text-muted-foreground">
                  {currentIdx + 1} / {cards.length}
                </span>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={next}
                  disabled={currentIdx >= cards.length - 1}
                >
                  {isRtl ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </Button>
              </div>

              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={generateCards}
                >
                  <RefreshCw className="w-4 h-4 mr-1" /> {t('regenerate')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  )
}
