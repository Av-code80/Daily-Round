'use client'
import { Home, Map, Bell, User, TruckElectric } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const items = [
  { href: '/', icon: Home, key: 'tournees' },
  { href: '/map', icon: Map, key: 'map' },
  { href: '/incidents', icon: Bell, key: 'incidents' },
] as const

export function SideNav() {
  const t = useTranslations('Navigation')
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className='fixed left-0 top-0 h-full w-14 bg-[#0F1722] border-r border-white/5 z-40 flex flex-col items-center py-4'
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label='Navigation'
      >
        <Link
          href='/'
          className='w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF8355] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#FF6B35]/25'
        >
          <TruckElectric />
        </Link>

        <div className='w-8 h-px bg-white/10 my-4' />
        <nav className='flex flex-col gap-1'>
          {items.map(({ href, icon: Icon, key }) => {
            const active = isActive(href)
            return (
              <Tooltip key={href}>
                <TooltipTrigger asChild>
                  <Link
                    href={href}
                    className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
                      active
                        ? 'bg-[#FF6B35]/15 text-[#FF6B35]'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {active && (
                      <span className='absolute -left-[10px] top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#FF6B35] rounded-r-full' />
                    )}
                    <Icon className='w-5 h-5' aria-hidden />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side='right' sideOffset={8}>
                  {t(key)}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </nav>
        <div className='flex-1' />
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href='/profile'
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isActive('/profile')
                  ? 'bg-[#FF6B35]/15 text-[#FF6B35] ring-2 ring-[#FF6B35]/50'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <User className='w-4 h-4' aria-hidden />
            </Link>
          </TooltipTrigger>
          <TooltipContent side='right' sideOffset={8}>
            {t('profile')}
          </TooltipContent>
        </Tooltip>
      </aside>
    </TooltipProvider>
  )
}
