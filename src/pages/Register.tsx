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
  avatar?: string
  public_display_name: string
  main_address: string
  street_number: string
  description_utilisateur: string
  years_of_experience?: number
  is_staff: boolean
}

interface AuthState {
  user: User | null
  isLoading: boolean
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({ user: null, isLoading: true })

  const setUser = (user: User | null) => setAuthState(prev => ({ ...prev, user }))

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('access')
      if (!token) {
        setAuthState({ user: null, isLoading: false })
        return
      }
      try {
        const user = await http.get<User>('/api/me/', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setAuthState({ user, isLoading: false })
      } catch {
        logout()
      }
    }
    fetchUser()
  }, [])

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }))
    try {
      const tokenResp = await http.post<{ access: string; refresh: string }>(
        '/api/auth/token/',
        { email, password }
      )

      localStorage.setItem('access', tokenResp.access)
      localStorage.setItem('refresh', tokenResp.refresh)

      const user = await http.get<User>('/api/me/', {
        headers: { Authorization: `Bearer ${tokenResp.access}` },
      })
      localStorage.setItem('user', JSON.stringify(user))

      const guestKey = getOrCreateGuestKey()
      try {
        await http.post(
          '/api/cart/merge/',
          {},
          {
            headers: {
              Authorization: `Bearer ${tokenResp.access}`,
              'X-Session-Key': guestKey,
            },
          }
        )
      } catch {}

      setAuthState({ user, isLoading: false })
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
    const res = await http.post(
      '/api/auth/register/',
      { first_name, last_name, email, password, type, date_of_birth, public_display_name }
    )
    if (!res) {
      setAuthState(prev => ({ ...prev, isLoading: false }))
      throw new Error('Registration failed')
    }
    await login(email, password)
  }

  const logout = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('user')

    const newKey = rotateGuestKey()
    window.dispatchEvent(new CustomEvent('cart:reset', { detail: { reason: 'logout', sessionKey: newKey } }))

    setAuthState({ user: null, isLoading: false })
  }

  const contextValue: AuthContextType = {
    user: authState.user,
    isAuthenticated: authState.user !== null,
    isLoading: authState.isLoading,
    login,
    register,
    logout,
    setUser,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider')
  return context
}