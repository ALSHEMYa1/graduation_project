'use client'

import { useState } from 'react'
import { Copy, RefreshCw, CheckCircle2, FileText, ChevronDown, Network, Loader2 } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { useI18n } from '@/components/providers/i18n-provider'
import { apiPost } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { DocumentSelector } from '@/components/shared/document-selector'
import MindMapView from '@/components/shared/mind-map'

type DetailedSection = {
  title: string
  content: string
  key_ideas: string[]
}

type SummaryData = {
  key_points: string[]
  full_summary: string
  detailed_sections: DetailedSection[]
}

type Tab = 'key' | 'full' | 'sections' | 'mindmap'

export default function SummaryPage() {
  const { t, dir, lang } = useI18n()

  const [selectedDocId, setSelectedDocId] = useState<number | null>(null)
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [mindMap, setMindMap] = useState<any>(null)

  const [loading, setLoading] = useState(false)
  const [mindMapLoading, setMindMapLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<Tab>('key')
  const [copied, setCopied] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set())

  const fetchSummary = async () => {
    if (!selectedDocId) {
      setError('Please select a document first')
      return
    }
    try {
      setLoading(true)
      setError(null)
      setMindMap(null)
      const [summaryData, mindMapData] = await Promise.all([
        apiPost('summary', { document_id: selectedDocId, language: lang, detail_level: 'very-detailed' }, 120000),
        apiPost('mind-map', { document_id: selectedDocId, language: lang }, 120000).catch(() => null),
      ])
      setSummary(summaryData?.summary || summaryData)
      if (mindMapData) setMindMap(mindMapData)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const fetchMindMap = async () => {
    if (!selectedDocId) return
    setMindMapLoading(true)
    try {
      const data = await apiPost('mind-map', { document_id: selectedDocId, language: lang }, 120000)
      setMindMap(data)
    } catch {
      toast.error('Mind map generation failed')
    } finally {
      setMindMapLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!summary) return
    let text = ''
    if (activeTab === 'key') text = summary.key_points.join('\n')
    else if (activeTab === 'full') text = summary.full_summary
    else text = summary.detailed_sections.map(s => `${s.title}\n${s.content}\n${s.key_ideas.map(k => `• ${k}`).join('\n')}`).join('\n\n')
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success(t('copied'))
    setTimeout(() => setCopied(false), 2000)
  }

  const regenerate = () => {
    fetchSummary()
  }

  const toggleSection = (i: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const onTabChange = (tab: Tab) => {
    setActiveTab(tab)
    if (tab === 'mindmap' && !mindMap && !mindMapLoading) {
      fetchMindMap()
    }
  }

  return (
    <AppShell title={t('summary')}>
      <div className="p-6 max-w-4xl mx-auto space-y-6" dir={dir}>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{t('summaryTitle')}</h1>
            <p className="text-muted-foreground text-sm">
              AI-generated document summary
            </p>
          </div>
          <div className="flex gap-2">
            {activeTab !== 'mindmap' && (
              <Button onClick={handleCopy} variant="outline" size="sm">
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                Copy
              </Button>
            )}
            <Button onClick={regenerate} size="sm">
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </Button>
          </div>
        </div>

        <DocumentSelector
          selectedId={selectedDocId}
          onSelect={(id: number) => setSelectedDocId(id)}
        />

        <Button onClick={fetchSummary} disabled={!selectedDocId || loading}>
          {loading ? 'Generating...' : 'Generate Summary'}
        </Button>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {summary && (
          <div className="flex gap-4 border-b pb-2 overflow-x-auto">
            {(['key', 'full', 'sections', 'mindmap'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={cn(
                  'text-sm pb-1 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap',
                  activeTab === tab
                    ? 'border-primary font-semibold text-primary'
                    : 'border-transparent text-muted-foreground'
                )}
              >
                {tab === 'mindmap' && <Network className="w-3.5 h-3.5" />}
                {tab === 'key' ? 'Key Points' : tab === 'full' ? 'Full Summary' : tab === 'sections' ? 'Sections' : 'Mind Map'}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-full" />
            <div className="h-4 bg-gray-300 rounded w-3/4" />
            <div className="h-4 bg-gray-300 rounded w-1/2" />
            <div className="h-4 bg-gray-300 rounded w-full" />
            <div className="h-4 bg-gray-300 rounded w-2/3" />
          </div>
        )}

        {!loading && summary && activeTab === 'key' && (
          <div className="p-6 border rounded-xl space-y-3">
            <h3 className="font-semibold text-lg">Key Points ({summary.key_points.length})</h3>
            {(summary.key_points || []).map((p, i) => (
              <p key={i} className="flex gap-2">
                <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                <span>{p}</span>
              </p>
            ))}
          </div>
        )}

        {!loading && summary && activeTab === 'full' && (
          <div className="p-6 border rounded-xl">
            <p className="leading-relaxed whitespace-pre-line text-sm">{summary.full_summary}</p>
          </div>
        )}

        {!loading && summary && activeTab === 'sections' && summary.detailed_sections && (
          <div className="space-y-3">
            {(summary.detailed_sections || []).map((section, i) => (
              <div key={i} className="border rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection(i)}
                  className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <span className="font-semibold">{section.title}</span>
                  <ChevronDown className={cn('w-4 h-4 transition-transform', expandedSections.has(i) && 'rotate-180')} />
                </button>
                {expandedSections.has(i) && (
                  <div className="p-4 space-y-3">
                    <p className="text-sm leading-relaxed">{section.content}</p>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Key Ideas</p>
                      {section.key_ideas.map((idea, j) => (
                        <p key={j} className="text-sm flex gap-2">
                          <span className="text-primary">•</span>
                          <span>{idea}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && activeTab === 'mindmap' && (
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="space-y-3 text-center">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">Generating mind map...</p>
                </div>
              </div>
            ) : mindMap ? (
              <MindMapView data={mindMap} />
            ) : (
              <div className="text-center py-12 border rounded-xl">
                <Network className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Generate a summary first</p>
              </div>
            )}
          </div>
        )}

        {!summary && !loading && (
          <div className="p-10 border border-dashed rounded-xl text-center">
            <FileText className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">{t('noSummary')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('noSummaryDesc')}</p>
          </div>
        )}

      </div>
    </AppShell>
  )
}
