'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Check, MoreHorizontal, Trash2 } from 'lucide-react'
import { deleteStop, markStopDelivered } from '../../actions'

type Props = {
  stopId: string
  isCompleted: boolean
}

export function StopCardActions({ stopId, isCompleted }: Props) {
  const t = useTranslations('Tournee.stops')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (isCompleted) return null

  function handleDeliver() {
    startTransition(async () => {
      const result = await markStopDelivered(stopId)
      if (result.ok) router.refresh()
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteStop(stopId)
      if (result.ok) {
        setConfirmOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <div className='mt-3 flex items-center justify-between'>
      <button
        type='button'
        onClick={handleDeliver}
        disabled={pending}
        className='inline-flex h-12 items-center gap-2 rounded-xl bg-[#FF6B35] px-5 font-semibold text-white active:bg-[#e5602e] disabled:opacity-50'
      >
        <Check className='h-4 w-4' aria-hidden />
        {t('deliver')}
      </button>

      <div className='relative'>
        <button
          type='button'
          aria-label='Menu'
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className='flex h-12 w-12 items-center justify-center rounded-xl text-foreground/60 hover:bg-foreground/5'
        >
          <MoreHorizontal className='h-5 w-5' aria-hidden />
        </button>
        {menuOpen && (
          <div
            role='menu'
            className='absolute right-0 top-12 z-20 w-44 overflow-hidden rounded-xl border border-foreground/10 bg-background shadow-lg'
            onMouseLeave={() => setMenuOpen(false)}
          >
            <button
              type='button'
              role='menuitem'
              onClick={() => {
                setMenuOpen(false)
                setConfirmOpen(true)
              }}
              className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50'
            >
              <Trash2 className='h-4 w-4' aria-hidden />
              {t('menu.delete')}
            </button>
          </div>
        )}
      </div>
      {confirmOpen && (
        <DeleteConfirmationDialog
          handleDelete={handleDelete}
          pending={pending}
          setConfirmOpen={setConfirmOpen}
        />
      )}
    </div>
  )
}

export function DeleteConfirmationDialog({
  handleDelete,
  pending,
  setConfirmOpen,
}: {
  handleDelete: () => void
  pending: boolean
  setConfirmOpen: (open: boolean) => void
}) {
  const t = useTranslations('Tournee.stops')
  return (
    <>
      <div
        role='dialog'
        aria-modal='true'
        className='fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center'
      >
        <div className='w-full max-w-md space-y-4 rounded-t-2xl bg-background p-6 sm:rounded-2xl'>
          <h2 className='text-lg font-bold'>{t('delete.confirmTitle')}</h2>
          <p className='text-sm text-foreground/60'>
            {t('delete.confirmMessage')}
          </p>
          <div className='flex gap-3'>
            <button
              type='button'
              onClick={() => setConfirmOpen(false)}
              disabled={pending}
              className='h-12 flex-1 rounded-xl border border-foreground/15 font-medium'
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={handleDelete}
              disabled={pending}
              className='h-12 flex-1 rounded-xl bg-red-600 font-semibold text-white disabled:opacity-50'
            >
              {pending ? t('delete.deleting') : t('menu.delete')}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
