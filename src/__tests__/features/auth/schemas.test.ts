import { loginSchema } from '@/features/auth/schemas'
import { describe, it, expect } from 'vitest'

describe('loginSchema', () => {
  const correctLoginData = {
    email: 'usergmail@gmail.com',
  }
  const incorrectLoginData = { email: 'usergmail&gmail.com' }

  it('Should validate a valid email', () => {
    expect(loginSchema.safeParse(correctLoginData).success).toBe(true)
  })

  it('Should not pass validation for a malformed email', () => {
    expect(loginSchema.safeParse(incorrectLoginData).success).toBe(false)
  })

  it('Should rejects an empty string', () => {
    expect(loginSchema.safeParse({ email: '' }).success).toBe(false)
  })

  it('rejects a missing field', () => {
    expect(loginSchema.safeParse({}).success).toBe(false)
  })
})
