'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/components/providers/i18n-provider'

export default function NotFound() {
  const { t, dir } = useI18n()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4" dir={dir}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <div className="relative mb-8">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="text-[8rem] font-bold text-muted/40 leading-none select-none"
          >
            404
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-3xl">𝓐</span>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-3">{t('notFound')}</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">{t('notFoundDesc')}</p>

        <Link href="/">
          <Button size="lg" className="gap-2">
            <Home className="w-4 h-4" />
            {t('goHome')}
          </Button>
        </Link>
      </motion.div>
    </div>
  )
}
