'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Sparkles, Trash2, MessageSquare, FileText, Loader2 } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { useI18n } from '@/components/providers/i18n-provider'
import { apiPost } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DocumentSelector } from '@/components/shared/document-selector'
import { toast } from 'sonner'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatHistoryEntry {
  role: string
  content: string
}

export default function ChatPage() {
  const { t, dir, lang } = useI18n()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const isRtl = dir === 'rtl'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const buildHistory = (msgs: Message[]): ChatHistoryEntry[] =>
    msgs.map((m) => ({ role: m.role, content: m.content }))

  const sendMessage = async () => {
    if (!input.trim() || typing) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((p) => [...p, userMsg])
    const currentInput = input
    setInput('')
    setTyping(true)

    try {
      const data = await apiPost('chat', {
        message: currentInput,
        document_id: selectedDocId,
        conversation_history: buildHistory(messages),
        language: lang,
      }, 120000)

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || "No response from server",
        timestamp: new Date(),
      }

      setMessages((p) => [...p, aiMsg])
    } catch (error: any) {
      toast.error(error.message || 'Chat request failed')
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.message || "Could not connect to server"}`,
        timestamp: new Date(),
      }
      setMessages((p) => [...p, errorMsg])
    } finally {
      setTyping(false)
    }

  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <AppShell title={t('chat')}>
      <div className="flex flex-col h-[calc(100vh-3.5rem)]" dir={dir}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-sm">{t('chatTitle')}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                𝓐𝓢𝓐 AI — {selectedDocId ? 'Document linked' : 'General chat'}
              </p>
            </div>
          </div>

          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-destructive"
              onClick={() => setMessages([])}
            >
              <Trash2 className="w-4 h-4" />
              {t('clearChat')}
            </Button>
          )}
        </div>

        {/* Document selector */}
        <div className="px-6 py-3 border-b border-border bg-muted/20">
          <div className="max-w-3xl mx-auto flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <DocumentSelector
                selectedId={selectedDocId}
                onSelect={(id: number) => setSelectedDocId(id)}
              />
            </div>
            {selectedDocId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDocId(null)}
                className="text-xs"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">

          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <p className="font-semibold text-lg">{t('noMessages')}</p>
              <p className="text-muted-foreground text-sm max-w-xs">
                {selectedDocId
                  ? 'Ask questions about your document — the AI will use it as context'
                  : t('noMessagesDesc')}
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'flex gap-3 max-w-3xl',
                msg.role === 'user'
                  ? isRtl ? 'flex-row' : 'flex-row-reverse ml-auto'
                  : 'flex-row mr-auto'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
                msg.role === 'user'
                  ? 'bg-secondary text-secondary-foreground'
                  : 'bg-primary text-primary-foreground'
              )}>
                {msg.role === 'user' ? 'U' : <Sparkles className="w-4 h-4" />}
              </div>

              <div className="space-y-1">
                <div className={cn(
                  'px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-lg',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-card border border-border text-foreground rounded-tl-sm'
                )}>
                  {msg.content}
                </div>

                <p className="text-xs text-muted-foreground">
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </motion.div>
          ))}

          {typing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 max-w-3xl"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-card border border-border">
                <span className="text-xs text-muted-foreground">AI is typing...</span>
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 pb-4 pt-2 border-t border-border">
          <div className="max-w-3xl mx-auto flex items-end gap-2 rounded-2xl border border-input bg-background px-4 py-3 focus-within:border-primary transition-colors">

            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={selectedDocId ? 'Ask about your document...' : t('chatPlaceholder')}
              className="flex-1 resize-none bg-transparent text-sm outline-none"
              style={{ direction: dir }}
            />

            <Button
              size="icon"
              onClick={sendMessage}
              disabled={!input.trim() || typing}
              className="w-8 h-8"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>

          </div>
        </div>

      </div>
    </AppShell>
  )
}
