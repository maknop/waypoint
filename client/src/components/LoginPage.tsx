import { useEffect, useState } from 'react'
import { Compass } from 'lucide-react'
import { api, type AuthUser, type Providers } from '../api'

interface LoginPageProps {
  onAuthed: (user: AuthUser) => void
}

export function LoginPage({ onAuthed }: LoginPageProps) {
  const [providers, setProviders] = useState<Providers | null>(null)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(
    () => new URLSearchParams(window.location.search).get('authError'),
  )
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.providers().then(setProviders).catch(() => setProviders({ local: true, oidc: false }))

    const params = new URLSearchParams(window.location.search)
    if (params.has('authError')) {
      params.delete('authError')
      const rest = params.toString()
      window.history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : ''))
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const user = mode === 'login' ? await api.login(email, password) : await api.register(email, password)
      onAuthed(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white">
            <Compass size={20} />
          </span>
          <h1 className="text-lg font-bold text-stone-900">Waypoint</h1>
          <p className="text-xs text-stone-400">Your travel favorites, mapped</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500">Password</label>
            <input
              type="password"
              required
              minLength={mode === 'register' ? 8 : undefined}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 disabled:opacity-60"
          >
            {mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
          className="mt-3 w-full text-center text-xs text-stone-500 hover:text-stone-700"
        >
          {mode === 'login' ? "Don't have an account? Create one" : 'Already have an account? Log in'}
        </button>

        {providers?.oidc && (
          <>
            <div className="my-4 flex items-center gap-2 text-xs text-stone-400">
              <div className="h-px flex-1 bg-stone-200" />
              or
              <div className="h-px flex-1 bg-stone-200" />
            </div>
            <a
              href="/api/auth/oidc/start"
              className="flex w-full items-center justify-center rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Continue with {providers.oidc.name}
            </a>
          </>
        )}
      </div>
    </div>
  )
}
