'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Save, Globe, Key, Shield, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { adminApi } from '@/lib/admin-api'
import { toast } from 'sonner'
import { useI18n } from '@/components/providers/i18n-provider'

const defaultFields = [
  { key: 'app_name', label: 'App Name', placeholder: '𝓐𝓢𝓐', type: 'text', section: 'general' },
  { key: 'support_email', label: 'Support Email', placeholder: 'support@ssa.app', type: 'email', section: 'general' },
  { key: 'max_file_size', label: 'Max File Size (MB)', placeholder: '50', type: 'number', section: 'general' },
  { key: 'openai_api_key', label: 'OpenAI API Key', placeholder: 'sk-...', type: 'password', section: 'ai' },
  { key: 'max_tokens', label: 'Max Tokens per Request', placeholder: '4096', type: 'number', section: 'ai' },
  { key: 'rate_limit', label: 'Rate Limit (req/min)', placeholder: '60', type: 'number', section: 'ai' },
  { key: 'session_timeout', label: 'Session Timeout (minutes)', placeholder: '60', type: 'number', section: 'security' },
  { key: 'max_login_attempts', label: 'Max Login Attempts', placeholder: '5', type: 'number', section: 'security' },
  { key: 'admin_email', label: 'Admin Email', placeholder: 'admin@ssa.app', type: 'email', section: 'notifications' },
  { key: 'alert_threshold', label: 'Alert Threshold (errors/hour)', placeholder: '10', type: 'number', section: 'notifications' },
]

const sections = [
  { key: 'general', icon: Globe, title: 'General' },
  { key: 'ai', icon: Key, title: 'AI Configuration' },
  { key: 'security', icon: Shield, title: 'Security' },
  { key: 'notifications', icon: Bell, title: 'Notifications' },
]

export default function AdminSettingsPage() {
  const { t, dir } = useI18n()
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getSettings().then((data) => {
      setValues(data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminApi.updateSettings(values)
      toast.success(t('adminSaveChanges'))
    } catch {
      toast.error(t('error'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        {t('loading')}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6" dir={dir}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('adminSettingsTitle')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminSettingsSubtitle')}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {t('adminSaveChanges')}
        </Button>
      </div>

      {sections.map(({ key, icon: Icon, title }, si) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: si * 0.07 }}
          className="p-6 rounded-2xl border border-border bg-card space-y-4"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <h3 className="font-semibold">{title}</h3>
          </div>

          <div className="grid gap-4">
            {defaultFields
              .filter((f) => f.section === key)
              .map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label>{field.label}</Label>
                  <Input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={values[field.key] || ''}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                  />
                </div>
              ))}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
