'use client'

import { useI18n } from '@/components/providers/i18n-provider'
import { Button } from '@/components/ui/button'

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n()

  return (
    <div className="flex items-center rounded-lg border border-border p-0.5 gap-0.5">
      <Button
        variant={lang === 'en' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setLang('en')}
        className="h-6 px-2 text-xs rounded-md"
      >
        EN
      </Button>
      <Button
        variant={lang === 'ar' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setLang('ar')}
        className="h-6 px-2 text-xs rounded-md"
      >
        AR
      </Button>
    </div>
  )
}
