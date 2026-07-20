'use client'

import { useEffect, useState } from 'react'
import { FileText, ChevronDown, CheckCircle2, Upload } from 'lucide-react'
import Link from 'next/link'
import { useI18n } from '@/components/providers/i18n-provider'
import { API_URL } from '@/lib/config'
import { cn } from '@/lib/utils'

interface Document {
  id: number
  filename: string
  filepath?: string
}

interface DocumentSelectorProps {
  selectedId: number | null
  onSelect: (id: number) => void
}

export function DocumentSelector({ selectedId, onSelect }: DocumentSelectorProps) {
  const { t, dir } = useI18n()
  const isRtl = dir === 'rtl'
  const [open, setOpen] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])

  // 🔥 Fetch real files from backend
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await fetch(`${API_URL}/files`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
        })

        if (!res.ok) return

        const data = await res.json()
        setDocuments(data)
      } catch (err) {
        console.log('Error loading documents:', err)
      }
    }

    fetchDocs()
  }, [])

  const selected = documents.find((d) => d.id === selectedId)

  return (
    <div className="relative" dir={dir}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((p) => !p)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card',
          'hover:border-primary/50 transition-colors text-sm',
          isRtl ? 'flex-row-reverse' : ''
        )}
      >
        <FileText className="w-4 h-4 text-primary shrink-0" />

        <span
          className={cn(
            'flex-1 truncate',
            isRtl ? 'text-right' : 'text-left',
            !selected && 'text-muted-foreground'
          )}
        >
          {selected ? selected.filename : t('selectDocument')}
        </span>

        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground shrink-0 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full mt-1 w-full rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden">
          {documents.length === 0 ? (
            <div className={cn('p-4 text-center', isRtl ? 'text-right' : 'text-left')}>
              <p className="text-sm font-medium">{t('noDocuments')}</p>

              <Link href="/upload" className="inline-block mt-3">
                <span className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  {t('uploadFirst')}
                </span>
              </Link>
            </div>
          ) : (
            <ul className="py-1 max-h-52 overflow-y-auto">
              {documents.map((doc) => {
                const isSelected = doc.id === selectedId

                return (
                  <li key={doc.id}>
                      <button
                        onClick={() => {
                          onSelect(doc.id)
                          setOpen(false)
                        }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                        'hover:bg-accent hover:text-accent-foreground',
                        isSelected && 'bg-primary/5 text-primary',
                        isRtl ? 'flex-row-reverse text-right' : 'text-left'
                      )}
                    >
                      <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />

                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{doc.filename}</p>
                      </div>

                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-primary" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
