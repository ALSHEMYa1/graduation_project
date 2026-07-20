'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/components/providers/i18n-provider'
import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { API_URL } from '@/lib/config'

export default function SignupPage() {
  const { t, dir } = useI18n()
  const { theme, setTheme } = useTheme()

  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Signup failed')
      }

      toast.success('Account created successfully')
      window.location.href = '/login'

    } catch (err: any) {
      toast.error(err.message || 'Error creating account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-background" dir={dir}>

      <div className="hidden lg:flex flex-1 items-center justify-center bg-muted/20 border-r border-border relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="relative text-center p-12">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 20L8 4L12 20" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M5.5 13.5L10.5 13.5" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
              <path d="M13 20L17 4L21 20" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M14.5 13.5L19.5 13.5" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
              <path d="M7.5 7.5Q15 4 16.5 10Q16.5 13.5 12 13.5Q7.5 13.5 7.5 17Q7.5 20 14 20" stroke="white" stroke-width="2.2" fill="none" stroke-linecap="round"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-3">ASA</h1>
          <p className="text-muted-foreground text-lg font-semibold tracking-wider">{t('tagline')}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8">

        <div className={`absolute top-4 flex items-center gap-2 ${dir === 'rtl' ? 'left-4' : 'right-4'}`}>
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="relative"
          >
            <Sun className="w-4 h-4" />
            <Moon className="w-4 h-4 absolute" />
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <h2 className="text-2xl font-bold">{t('signup')}</h2>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">

            <div>
              <Label>Full Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-2 top-2"
                >
                  {showPass ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : t('signup')}
            </Button>
          </form>

          <p className="text-sm mt-4 text-muted-foreground">
            Already have account? <Link href="/login" className="text-primary">Login</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}