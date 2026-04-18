'use client'
import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { signOutUser } from '../actions'

export function SignOutButton() {
  const t = useTranslations('Auth')
  const tc = useTranslations('Common')
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleConfirm = () => {
/**
 * Signs out the user and updates the session state.
 * Starts a transition to wait for the sign out to complete.
 */
    startTransition(async () => {
      await signOutUser()
    })
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {t('logout')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('signOutConfirmTitle')}</DialogTitle>
            <DialogDescription>{t('signOutConfirmMessage')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              {tc('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending ? '...' : t('logout')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
