'use client'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginWithEmail } from '../actions'
import { loginSchema, type LoginFormValues } from '../schemas'

export function LoginForm() {
  const t = useTranslations('Auth')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginFormValues) => {
    setError(null)
    startTransition(async () => {
      const result = await loginWithEmail(data.email)
      if (result?.error) {
        setError(t('magicLinkError'))
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-blue-100 text-sm font-medium">
          {t('email')}
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={t('emailPlaceholder')}
          disabled={isPending}
          {...register('email')}
          className="h-14 text-gray-500 border-black/20 placeholder:text-white/30 text-base focus-visible:border-[#FF6B35]/70 focus-visible:ring-[#FF6B35]/20 transition-colors"
        />
        {errors.email && (
          <p className="text-red-400 text-sm flex items-center gap-1">
            <span>⚠</span> {t('invalidEmail')}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
          <p className="text-red-400 text-sm text-center">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-14 text-base font-semibold bg-gradient-to-r from-[#FF6B35] to-orange-400 hover:from-orange-400 hover:to-[#FF6B35] text-white border-0 shadow-lg shadow-orange-500/25 transition-all duration-300 rounded-xl"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            {t('sending')}
          </span>
        ) : (
          t('sendMagicLink')
        )}
      </Button>
    </form>
  )
}