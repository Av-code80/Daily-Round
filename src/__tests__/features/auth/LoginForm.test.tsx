import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/features/auth/components/LoginForm'

vi.mock('next-intl', () => ({
  useTranslations: () => (key:string) => key,
}))

const loginWithEmail = vi.fn()
vi.mock('@/features/auth/actions', () => ({
  loginWithEmail: (...args: unknown[]) => loginWithEmail(...args),
}))

describe('LoginForm', () => {
  beforeEach(() => {
    loginWithEmail.mockReset()
  })

  it('renders the email field and the submit button', () => {
    render(<LoginForm />)
    expect(screen.getByLabelText('email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'sendMagicLink' })).toBeInTheDocument()
  })

  it('blocks submission and shows an error on an invalid email', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText('email'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: 'sendMagicLink' }))

    expect(await screen.findByTestId('email-input')).toBeInTheDocument()
    expect(loginWithEmail).not.toHaveBeenCalled()
  })

  it('calls the server action with the entered email on valid submit', async () => {
    loginWithEmail.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText('email'), 'driver@example.com')
    await user.click(screen.getByRole('button', { name: 'sendMagicLink' }))

    await waitFor(() => {
      expect(loginWithEmail).toHaveBeenCalledWith('driver@example.com')
    })
  })

  it('shows the generic error banner when the action returns an error', async () => {
    loginWithEmail.mockResolvedValueOnce({ error: 'auth_error' })
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText('email'), 'driver@example.com')
    await user.click(screen.getByRole('button', { name: 'sendMagicLink' }))

    expect(await screen.findByText('magicLinkError')).toBeInTheDocument()
  })
})
