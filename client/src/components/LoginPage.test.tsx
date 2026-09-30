import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { LoginPage } from './LoginPage'
import { api } from '../api'

vi.mock('../api', () => ({
  api: {
    providers: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
  },
}))

const mockedApi = vi.mocked(api)

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedApi.providers.mockResolvedValue({ local: true, oidc: false })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders email and password fields', () => {
    render(<LoginPage onAuthed={vi.fn()} />)
    expect(screen.getByLabelText('Email')).toBeDefined()
    expect(screen.getByLabelText('Password')).toBeDefined()
  })

  it('does not show an SSO button when OIDC is disabled', async () => {
    render(<LoginPage onAuthed={vi.fn()} />)
    await waitFor(() => expect(mockedApi.providers).toHaveBeenCalled())
    expect(screen.queryByText(/continue with/i)).toBeNull()
  })

  it('shows an SSO button with the provider name when OIDC is enabled', async () => {
    mockedApi.providers.mockResolvedValue({ local: true, oidc: { name: 'Keycloak' } })
    render(<LoginPage onAuthed={vi.fn()} />)
    expect(await screen.findByText('Continue with Keycloak')).toBeDefined()
  })

  it('logs in and reports the authenticated user', async () => {
    const user = { id: 1, email: 'alice@example.com', display_name: null }
    mockedApi.login.mockResolvedValue(user)
    const onAuthed = vi.fn()

    render(<LoginPage onAuthed={onAuthed} />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alice@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'correcthorse' } })
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))

    await waitFor(() => expect(onAuthed).toHaveBeenCalledWith(user))
    expect(mockedApi.login).toHaveBeenCalledWith('alice@example.com', 'correcthorse')
  })

  it('shows an error message when login fails', async () => {
    mockedApi.login.mockRejectedValue(new Error('Invalid email or password'))

    render(<LoginPage onAuthed={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alice@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByText('Invalid email or password')).toBeDefined()
  })
})
