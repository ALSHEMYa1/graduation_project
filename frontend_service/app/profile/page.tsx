'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Camera, Check, User } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { useI18n } from '@/components/providers/i18n-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { API_URL } from '@/lib/config'

export default function ProfilePage() {
  const { t, lang, dir } = useI18n()
  const { theme, setTheme } = useTheme()

  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    name: '',
    email: '',
    bio: '',
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    api.getMe(token)
      .then((data: any) => {
        setForm({
          name: data?.name || '',
          email: data?.email || '',
          bio: '',
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch(`${API_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          bio: form.bio,
        }),
      })

      if (res.ok) {
        setSaved(true)
        toast.success(t('saveChanges'))
        setTimeout(() => {
          setSaved(false)
          setEditing(false)
        }, 1200)
      } else {
        toast.error('Failed to save profile')
      }
    } catch {
      toast.error('Server error')
    }
  }

  if (loading) {
    return (
      <AppShell title={t('profile')}>
        <div className="p-6 text-center text-muted-foreground">
          Loading profile...
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title={t('profile')}>
      <div className="p-6 max-w-2xl mx-auto space-y-6" dir={dir}>
        <div>
          <h1 className="text-2xl font-bold">{t('profileTitle')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your account settings
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl border border-border bg-card space-y-6"
        >
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-border">
                <User className="w-10 h-10 text-primary" />
              </div>
              <button className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-lg">{form.name}</p>
              <p className="text-sm text-muted-foreground">{form.email}</p>
            </div>

            {!editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                {t('editProfile')}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  {t('cancel')}
                </Button>
                <Button size="sm" onClick={handleSave}>
                  {saved ? <Check className="w-4 h-4" /> : null}
                  {t('saveChanges')}
                </Button>
              </div>
            )}
          </div>

          {editing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 pt-4 border-t border-border"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t('fullName')}</Label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    dir={dir}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>{t('email')}</Label>
                  <Input
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Bio</Label>
                <textarea
                  value={form.bio}
                  onChange={(e) =>
                    setForm({ ...form, bio: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  dir={dir}
                />
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AppShell>
  )
}