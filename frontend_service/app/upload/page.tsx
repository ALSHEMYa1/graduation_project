'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, RefreshCw, Trash2, FileIcon, Eye, Type } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { useI18n } from '@/components/providers/i18n-provider'
import { API_URL } from '@/lib/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface UploadedFile {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  errorMsg?: string
}

interface ServerFile {
  id: number
  filename: string
  upload_time: string
}

export default function UploadPage() {
  const { t, dir } = useI18n()
  const isRtl = dir === 'rtl'
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [existingFiles, setExistingFiles] = useState<ServerFile[]>([])
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())
  const [textContent, setTextContent] = useState('')
  const [textTitle, setTextTitle] = useState('')
  const [savingText, setSavingText] = useState(false)

  const saveText = async () => {
    const trimmed = textContent.trim()
    if (!trimmed) { toast.error('Please enter some text'); return }
    const title = textTitle.trim() || 'Untitled Text'
    const token = localStorage.getItem('token')
    if (!token) { toast.error('Login required'); return }
    setSavingText(true)
    try {
      const res = await fetch(`${API_URL}/upload/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content: trimmed }),
      })
      if (!res.ok) throw new Error('Upload failed')
      toast.success(`"${title}" saved`)
      setTextContent('')
      setTextTitle('')
      fetchFiles()
    } catch {
      toast.error('Failed to save text')
    } finally {
      setSavingText(false)
    }
  }

  const fetchFiles = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const res = await fetch(`${API_URL}/files`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      setExistingFiles(await res.json())
    } catch { } finally {
      setLoadingFiles(false)
    }
  }, [])

  useEffect(() => { fetchFiles() }, [fetchFiles])

  const deleteFile = async (fileId: number) => {
    const token = localStorage.getItem('token')
    if (!token) return
    setDeletingIds((p) => new Set(p).add(fileId))
    try {
      const res = await fetch(`${API_URL}/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Delete failed')
      setExistingFiles((p) => p.filter((f) => f.id !== fileId))
      toast.success('File deleted')
    } catch {
      toast.error('Failed to delete file')
    } finally {
      setDeletingIds((p) => { const next = new Set(p); next.delete(fileId); return next })
    }
  }

  const updateFile = (id: string, updates: Partial<UploadedFile>) =>
    setFiles((p) => p.map((f) => (f.id === id ? { ...f, ...updates } : f)))

  const doUpload = useCallback(async (fileItem: UploadedFile) => {
    const token = localStorage.getItem('token')
    if (!token) {
      updateFile(fileItem.id, { status: 'error', errorMsg: 'Login required' })
      toast.error('Login required')
      return
    }
    updateFile(fileItem.id, { status: 'uploading' })
    try {
      const formData = new FormData()
      formData.append('file', fileItem.file)
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        let errMsg = 'Upload failed'
        try {
          const errData = await res.json()
          if (errData?.detail) {
            errMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail)
          }
        } catch {}
        throw new Error(errMsg)
      }
      await res.json()
      updateFile(fileItem.id, { status: 'done' })
      toast.success(`"${fileItem.file.name}" uploaded`)
      fetchFiles()
    } catch (err: any) {
      updateFile(fileItem.id, { status: 'error', errorMsg: err.message })
      toast.error(`${fileItem.file.name}: ${err.message || 'Upload failed'}`)
    }
  }, [fetchFiles])

  const onDrop = useCallback((accepted: File[]) => {
    const newFiles: UploadedFile[] = accepted.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file: f,
      status: 'pending',
    }))
    setFiles((p) => [...p, ...newFiles])
    newFiles.forEach((nf) => doUpload(nf))
  }, [doUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/gif': ['.gif'],
      'image/bmp': ['.bmp'],
      'image/tiff': ['.tiff', '.tif'],
    },
    maxSize: 50 * 1024 * 1024,
  })

  const statusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <FileText className="w-4 h-4 text-muted-foreground" />
      case 'uploading': return <Loader2 className="w-4 h-4 text-primary animate-spin" />
      case 'done': return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return null
    }
  }

  return (
    <AppShell title={t('upload')}>
      <div className="p-6 max-w-3xl mx-auto space-y-6" dir={dir}>

        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all',
            isDragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50'
          )}
        >
          <input {...getInputProps()} />
          <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium">{isDragActive ? t('dropzoneActive') : t('dropzone')}</p>
          <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX up to 50MB</p>
        </div>

        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <p className="text-sm font-medium text-muted-foreground">
                {files.filter((f) => f.status === 'done').length}/{files.length} uploaded
              </p>

              {files.map((f) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className={cn(
                    'flex items-center gap-3 p-3 border rounded-xl transition-colors',
                    f.status === 'done' && 'border-green-200 bg-green-50/30',
                    f.status === 'error' && 'border-red-200 bg-red-50/30',
                  )}
                >
                  {statusIcon(f.status)}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate font-medium">{f.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(f.file.size / 1024 / 1024).toFixed(1)} MB
                      {f.status === 'error' && f.errorMsg && ` — ${f.errorMsg}`}
                    </p>
                  </div>

                  {f.status === 'error' && (
                    <Button variant="ghost" size="sm" onClick={() => doUpload(f)} className="text-xs gap-1">
                      <RefreshCw className="w-3 h-3" /> Retry
                    </Button>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Paste Text Section */}
        <div className="border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Type className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-medium text-sm">{t('pasteText')}</h3>
          </div>
          <Input
            placeholder={t('textNamePlaceholder')}
            value={textTitle}
            onChange={(e) => setTextTitle(e.target.value)}
            className="w-full"
          />
          <Textarea
            placeholder={t('pasteTextPlaceholder')}
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            rows={6}
            className="w-full resize-none"
          />
          <div className="flex justify-end">
            <Button onClick={saveText} disabled={savingText || !textContent.trim()} className="gap-2">
              {savingText ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {t('saveText')}
            </Button>
          </div>
        </div>

        {/* Existing Files */}
        <div>
          <h2 className="text-lg font-semibold mb-3">{t('uploadTitle')}</h2>
          {loadingFiles ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : existingFiles.length === 0 ? (
            <div className="p-10 border border-dashed rounded-xl text-center">
              <Upload className="mx-auto mb-3 text-muted-foreground/50 w-8 h-8" />
              <p className="text-sm text-muted-foreground">{t('empty')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {existingFiles.map((ef) => (
                <div
                  key={ef.id}
                  className="flex items-center gap-3 p-3 border rounded-xl"
                >
                  <FileIcon className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate font-medium">{ef.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ef.upload_time).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      const token = localStorage.getItem('token')
                      if (!token) return
                      try {
                        const res = await fetch(`${API_URL}/files/${ef.id}/download`, {
                          headers: { Authorization: `Bearer ${token}` },
                        })
                        if (!res.ok) throw new Error()
                        const blob = await res.blob()
                        const url = URL.createObjectURL(blob)
                        window.open(url, '_blank')
                        setTimeout(() => URL.revokeObjectURL(url), 60000)
                      } catch {
                        toast.error('Failed to preview file')
                      }
                    }}
                    className="text-xs gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Preview
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteFile(ef.id)}
                    disabled={deletingIds.has(ef.id)}
                    className="text-xs gap-1 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    {deletingIds.has(ef.id) ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                    {t('delete')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AppShell>
  )
}
