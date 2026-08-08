'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/components/providers/i18n-provider'
import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { toast } from 'sonner'
import { API_URL } from '@/lib/config'

export default function ForgotPasswordPage() {
  const { t, dir } = useI18n()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok && res.status !== 404) throw new Error('Request failed')

      setSent(true)
      toast.success('Check your email for your new password')
    } catch {
      setSent(true)
      toast.success('If the email exists, a new password has been sent')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center app-bg px-4" dir={dir}>
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
          {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {t('back')}
        </Link>

        {!sent ? (
          <>
            <div className="mb-8">
              <div className="w-12 h-12 rounded-2xl grad-brand flex items-center justify-center mb-4 shadow-sm">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold">{t('forgotPassword')}</h2>
              <p className="text-muted-foreground text-sm mt-1">
                {t('checkEmail')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>{t('email')}</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full grad-brand text-white glow-btn hover:opacity-90" disabled={loading}>
                {loading ? t('loading') : t('sendResetLink')}
              </Button>
            </form>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold">{t('checkEmail')}</h3>
            <Link href="/login">
              <Button variant="outline" className="w-full grad-brand text-white border-0 glow-btn hover:opacity-90 mt-6">
                {t('login')}
              </Button>
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
