'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, FileText, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminApi } from '@/lib/admin-api'
import { toast } from 'sonner'
import { useI18n } from '@/components/providers/i18n-provider'

interface Document {
  id: number
  filename: string
  upload_time: string
  owner_id: number
  owner_email: string | null
}

export default function AdminDocumentsPage() {
  const { t, dir } = useI18n()
  const isRtl = dir === 'rtl'
  const [docs, setDocs] = useState<Document[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchDocs = () => {
    setLoading(true)
    adminApi.getDocuments().then(setDocs).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchDocs() }, [])

  const deleteDoc = async (doc: Document) => {
    if (!confirm(`Delete "${doc.filename}"? This cannot be undone.`)) return
    try {
      await adminApi.deleteDocument(doc.id)
      toast.success(t('delete'))
      fetchDocs()
    } catch { toast.error(t('error')) }
  }

  const filtered = docs.filter((d) =>
    d.filename.toLowerCase().includes(search.toLowerCase())
  )

  const totalPdf = docs.filter((d) => d.filename.endsWith('.pdf')).length
  const totalDocx = docs.filter((d) => d.filename.endsWith('.docx')).length

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir={dir}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('adminDocumentsTitle')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminDocumentsSubtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t('adminTotalDocuments'), value: docs.length },
          { label: 'PDFs', value: totalPdf },
          { label: 'DOCX', value: totalDocx },
        ].map((item) => (
          <div
            key={item.label}
            className="p-4 rounded-xl border border-border bg-card text-center"
          >
            <p className="text-2xl font-bold">{item.value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
        <Input
          placeholder={t('adminSearchDocuments')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={isRtl ? 'pr-9' : 'pl-9'}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'} text-xs font-semibold text-muted-foreground`}>{t('adminID')}</th>
              <th className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'} text-xs font-semibold text-muted-foreground`}>{t('adminFilename')}</th>
              <th className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'} text-xs font-semibold text-muted-foreground`}>{t('adminOwner')}</th>
              <th className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'} text-xs font-semibold text-muted-foreground`}>{t('adminUploaded')}</th>
              <th className={`px-4 py-3 ${isRtl ? 'text-left' : 'text-right'} text-xs font-semibold text-muted-foreground`}>{t('adminActions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">{t('loading')}</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                      <FileText className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <p className="font-medium">{t('adminNoDocuments')}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('adminNoDocumentsDesc')}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((doc) => (
                <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-3 font-mono text-xs">{doc.id}</td>
                  <td className="px-4 py-3">{doc.filename}</td>
                  <td className="px-4 py-3 text-muted-foreground">{doc.owner_email || `User #${doc.owner_id}`}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(doc.upload_time).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteDoc(doc)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </motion.div>
    </div>
  )
}
