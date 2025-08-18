import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { http } from '../lib/api'

interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  type: 'customer' | 'producer'
  date_of_birth: string
  phone: string
  avatar?: string | null
  avatar_url?: string | null
  public_display_name: string
  main_address: string
  street_number: string
  description_utilisateur: string
  years_of_experience?: number
  is_staff: boolean
  updated_at?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  avatar_version: number
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (
    first_name: string,
    last_name: string,
    email: string,
    password: string,
    type: 'customer' | 'producer',
    date_of_birth: string,
    public_display_name: string
  ) => Promise<void>
  logout: () => void
  setUser: (user: User | null) => void
  refreshUser: () => Promise<void>
  avatarVersion: number
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function getOrCreateGuestKey(): string {
  let key = localStorage.getItem('cart_session_key')
  if (!key) {
    key = crypto.randomUUID()
    localStorage.setItem('cart_session_key', key)
  }
  return key
}

function rotateGuestKey(): string {
  const key = crypto.randomUUID()
  localStorage.setItem('cart_session_key', key)
  return key
}

function normalizeUser(u: User | null): User | null {
  if (!u) return u
  const avatar = (u.avatar_url ?? u.avatar) ?? null
  return { ...u, avatar, avatar_url: avatar }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    avatar_version: 0,
  })

  const writeLocalUser = (u: User | null) => {
    if (u) {
      localStorage.setItem('user', JSON.stringify(u))
    } else {
      localStorage.removeItem('user')
    }
  }

  const setUser = (user: User | null) => {
    const normalized = normalizeUser(user)
    setAuthState(prev => ({
      ...prev,
      user: normalized,
      avatar_version: normalized ? Date.now() : prev.avatar_version,
    }))
    writeLocalUser(normalized)
    window.dispatchEvent(new CustomEvent('auth:user-updated', { detail: { user: normalized } }))
  }

  const refreshUser = async () => {
    const token = localStorage.getItem('access')
    if (!token) {
      setAuthState({ user: null, isLoading: false, avatar_version: 0 })
      return
    }
    try {
      const user = await http.get<User>('/api/me/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const normalized = normalizeUser(user)
      setAuthState(prev => ({
        ...prev,
        user: normalized,
        isLoading: false,
        avatar_version: Date.now(),
      }))
      writeLocalUser(normalized)
    } catch {
      logout()
    }
  }

  useEffect(() => {
    const init = async () => {
      await refreshUser()
    }
    void init()
  }, [])

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }))
    try {
      const data = await http.post<{ access: string; refresh: string }>('/api/auth/token/', {
        email,
        password,
      })

      localStorage.setItem('access', data.access)
      localStorage.setItem('refresh', data.refresh)

      const user = await http.get<User>('/api/me/', {
        headers: { Authorization: `Bearer ${data.access}` }
      })

      const normalized = normalizeUser(user)
      writeLocalUser(normalized)

      const guestKey = getOrCreateGuestKey()
      try {
        await http.post(
          '/api/cart/merge/',
          {},
          {
            headers: {
              Authorization: `Bearer ${data.access}`,
              'X-Session-Key': guestKey,
            },
          }
        )
      } catch {}

      setAuthState({ user: normalized, isLoading: false, avatar_version: Date.now() })
    } catch (e) {
      logout()
      throw e
    }
  }

  const register = async (
    first_name: string,
    last_name: string,
    email: string,
    password: string,
    type: 'customer' | 'producer',
    date_of_birth: string,
    public_display_name: string
  ) => {
    setAuthState(prev => ({ ...prev, isLoading: true }))
    await http.post('/api/auth/register/', {
      first_name,
      last_name,
      email,
      password,
      type,
      date_of_birth,
      public_display_name,
    })
    await login(email, password)
  }

  const logout = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('user')

    const newKey = rotateGuestKey()
    window.dispatchEvent(new CustomEvent('cart:reset', { detail: { reason: 'logout', sessionKey: newKey } }))

    setAuthState({ user: null, isLoading: false, avatar_version: 0 })
  }

  const contextValue: AuthContextType = {
    user: authState.user,
    isAuthenticated: authState.user !== null,
    isLoading: authState.isLoading,
    login,
    register,
    logout,
    setUser,
    refreshUser,
    avatarVersion: authState.avatar_version,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
