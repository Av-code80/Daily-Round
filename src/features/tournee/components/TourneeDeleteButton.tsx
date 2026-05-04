'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Loader2, Trash2 } from 'lucide-react'

import { deleteTournee } from '../actions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function TourneeDeleteButton({ tourneeId }: { tourneeId: string }) {
  const t = useTranslations('Tournee')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const mutation = useMutation({
    mutationFn: () => deleteTournee(tourneeId),
    onSuccess: (r) => {
      if (r.ok) router.push('/')
    },
  })

  return (
    <>
      <button
        type='button'
        onClick={() => setOpen(true)}
        className='inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-destructive hover:bg-destructive/10'
      >
        <Trash2 className='h-4 w-4' aria-hidden />
        {t('detail.delete')}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>{t('detail.deleteConfirmTitle')}</DialogTitle>
          <DialogDescription>
            {t('detail.deleteConfirmMessage')}
          </DialogDescription>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant='destructive'
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' aria-hidden />
                  {t('detail.deleting')}
                </>
              ) : (
                tCommon('delete')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
