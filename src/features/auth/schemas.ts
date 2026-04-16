import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1).email(),
})

export type LoginFormValues = z.infer<typeof loginSchema>