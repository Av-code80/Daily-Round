'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useShallow } from 'zustand/react/shallow'
import { doorCodeSchema, type DoorCodeFormValues } from '../schemas'
import { useDoorCodeDraftStore } from '../stores/draft'

const defaults: DoorCodeFormValues = {
  address: '',
  city: '',
  code: '',
  postal_code: '',
  arrondissement: '',
  floor: '',
  instructions: '',
  parking_hint: '',
}

export function useDoorCodeDraft() {
  const { setDraft, clearDraft } = useDoorCodeDraftStore(
    useShallow((s) => ({ setDraft: s.setDraft, clearDraft: s.clearDraft })),
  )

  const form = useForm<DoorCodeFormValues>({
    resolver: zodResolver(doorCodeSchema),
    defaultValues: defaults,
    mode: 'onChange',
  })

  // Restore draft once on mount (client only)
  useEffect(() => {
    const stored = useDoorCodeDraftStore.getState().draft
    if (Object.keys(stored).length) form.reset({ ...defaults, ...stored })
  }, [form])

  // Form → store on every change
  useEffect(() => {
    const unsubscribe = form.subscribe({
      formState: { values: true },
      callback: ({ values }) => setDraft(values),
    })
    return () => unsubscribe()
  }, [form, setDraft])

  // Warn on tab close if user has unsaved input
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [form])

  function onSuccess() {
    clearDraft()
    form.reset(defaults)
  }

  return { form, onSuccess }
}
