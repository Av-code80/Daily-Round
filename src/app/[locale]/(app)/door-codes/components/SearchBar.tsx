'use client'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function SearchBar() {
  const t = useTranslations('DoorCodes')
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [value, setValue] = useState(searchParams.get('q') ?? '')

  useEffect(() => {
    const timer = setTimeout(() => {
      const search = window.location.search
      const params = new URLSearchParams(search)
      const current = params.get('q') ?? ''
      if (value === current) return
      if (value) params.set('q', value)
      else params.delete('q')
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    }, 300)
    return () => clearTimeout(timer)
  }, [value, router, pathname])

  return (
    <div className='relative'>
      <Search className='pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#1B2838]/60' />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t('searchPlaceholder')}
        className='h-14 pl-12 pr-10 text-base shadow-sm border-[#1B2838]/20 bg-white/80 backdrop-blur focus-visible:border-[#FF6B35] focus-visible:ring-2 focus-visible:ring-[#FF6B35]/25 dark:bg-card'
        aria-label={t('searchPlaceholder')}
      />
      {value && (
        <button
          type='button'
          onClick={() => setValue('')}
          className='absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[#1B2838]/40 hover:bg-[#1B2838]/5 hover:text-[#1B2838]'
          aria-label={t('clearSearch')}
        >
          <X className='h-4 w-4' aria-hidden z-10 />
        </button>
      )}
    </div>
  )
}
