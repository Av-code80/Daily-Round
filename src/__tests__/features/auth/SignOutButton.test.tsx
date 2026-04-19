import { SignOutButton } from '@/features/auth/components/SignOutButton';
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

const signOutUser = vi.fn()
vi.mock('@/features/auth/actions', () => ({
  signOutUser: (...args: unknown[]) => signOutUser(...args),
}))

const setup = () => userEvent.setup({ pointerEventsCheck: 0 })

describe('SignOutButton', () => {
  beforeEach(() => {
    signOutUser.mockReset()
  })

  it('renders the trigger button and no dialog initially', () => {
    render(<SignOutButton />)
    expect(screen.getByRole('button', { name: 'logout' })).toBeInTheDocument()
    expect(screen.queryByText('signOutConfirmTitle')).not.toBeInTheDocument()
  })

  it('opens the confirmation dialog on click', async () => {
    const user = setup()
    render(<SignOutButton />)

    await user.click(screen.getByRole('button', { name: 'logout' }))

    expect(await screen.findByText('signOutConfirmTitle')).toBeInTheDocument()
    expect(screen.getByText('signOutConfirmMessage')).toBeInTheDocument()
  })

  it('does NOT sign out when cancelled', async () => {
    const user = setup()
    render(<SignOutButton />)

    await user.click(screen.getByRole('button', { name: 'logout' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'cancel' }))

    await waitFor(() => {
      expect(screen.queryByText('signOutConfirmTitle')).not.toBeInTheDocument()
    })
    expect(signOutUser).not.toHaveBeenCalled()
  })

  it('calls signOutUser when confirmed', async () => {
    signOutUser.mockResolvedValueOnce(undefined)
    const user = setup()
    render(<SignOutButton />)

    await user.click(screen.getByRole('button', { name: 'logout' }))
    const dialog = await screen.findByRole('dialog')
    const confirm = within(dialog).getAllByRole('button', { name: 'logout' })[0]
    await user.click(confirm)

    await waitFor(() => expect(signOutUser).toHaveBeenCalledTimes(1))
  })
})
