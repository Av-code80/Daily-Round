'use client'
import { ArrowLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

type BackButtonProps = {
  label?: string
  fallbackHref?: string
}
export default function BackButton({
  label,
  fallbackHref = '/',
}: BackButtonProps) {
  const t = useTranslations('Common')
  const router = useRouter()

  const handleClick = () => {
    if (window.history.length > 1) router.back()
    else router.push(fallbackHref)
  }

  return (
    <button
      type='button'
      onClick={handleClick}
      aria-label={label ?? t('back')}
      className='group inline-flex h-10 items-center gap-1.5 rounded-full border border-[#1B2838]/10 bg-white/80 px-3 text-sm font-medium text-[#1B2838] shadow-sm backdrop-blur transition-all hover:border-[#FF6B35]/40 hover:text-[#FF6B35] dark:bg-card dark:text-foreground'
    >
      <ArrowLeft className='h-4 w-4 transition-transform group-hover:-translate-x-0.5' aria-hidden />
      <span>{label ?? t('back')}</span>
    </button>
  )
}
