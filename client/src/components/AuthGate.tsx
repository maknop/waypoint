import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Compass } from 'lucide-react'
import { api, setUnauthorizedHandler, type AuthUser } from '../api'
import { LoginPage } from './LoginPage'

type AuthState = { status: 'loading' } | { status: 'authed'; user: AuthUser } | { status: 'anon' }

interface AuthGateProps {
  children: (user: AuthUser) => ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  const refresh = useCallback(() => {
    api.me()
      .then((user) => setState({ status: 'authed', user }))
      .catch(() => setState({ status: 'anon' }))
  }, [])

  useEffect(() => { refresh() }, [refresh])
  useEffect(() => { setUnauthorizedHandler(() => setState({ status: 'anon' })) }, [])

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <Compass size={28} className="animate-pulse text-stone-300" />
      </div>
    )
  }

  if (state.status === 'anon') {
    return <LoginPage onAuthed={(user) => setState({ status: 'authed', user })} />
  }

  return <>{children(state.user)}</>
}
