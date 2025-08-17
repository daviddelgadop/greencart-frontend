import React, { useEffect, useMemo, useState } from 'react'
import {
  User,
  Package,
  Heart,
  Settings,
  Leaf,
  MapPin,
  CreditCard
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
  ProfileTab,
  AddressTab,
  OrdersTab,
  FavoritesTab,
  ImpactTab,
  PaymentTab,
  SettingsTab
} from '../tabs'
import PasswordConfirmModal from '../components/PasswordConfirmModal'
import { Routes, Route, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

type TabId =
  | 'profile'
  | 'address'
  | 'payment'
  | 'orders'
  | 'favorites'
  | 'impact'
  | 'settings'

function isJwtExpired(token: string | null): boolean {
  if (!token) return true
  try {
    const base64 = token.split('.')[1]
    if (!base64) return true
    const json = JSON.parse(atob(base64.replace(/-/g, '+').replace(/_/g, '/')))
    if (!json || typeof json.exp !== 'number') return true
    const nowSeconds = Math.floor(Date.now() / 1000)
    return json.exp <= nowSeconds
  } catch {
    return true
  }
}

export default function Account() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const sessionExpired = useMemo(() => isJwtExpired(localStorage.getItem('access')), [])

  useEffect(() => {
    const mustBlock = !user || sessionExpired
    if (mustBlock) {
      toast.custom((t) => (
        <div className="bg-yellow-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-4 border-l-4 border-yellow-500">
          <span className="text-yellow-700 font-medium">
            Veuillez vous connecter pour continuer.
          </span>
          <button
            onClick={() => {
              toast.dismiss(t.id)
              navigate('/login', { replace: true, state: { from: location.pathname + location.search } })
            }}
            className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
          >
            Se connecter
          </button>
        </div>
      ), { duration: Infinity, position: 'top-center' })
    }
  }, [user, sessionExpired, navigate, location.pathname, location.search])

  if (!user || sessionExpired) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [password, setPassword] = useState('')

  const tabs: { id: TabId; name: string; icon: any }[] = [
    { id: 'profile', name: 'Mon profil', icon: User },
    { id: 'address', name: 'Mon address', icon: MapPin },
    { id: 'payment', name: 'Mon méthode de paiment', icon: CreditCard },
    { id: 'orders', name: 'Mes commandes', icon: Package },
    { id: 'favorites', name: 'Mes favoris', icon: Heart },
    { id: 'impact', name: 'Mon impact', icon: Leaf },
    { id: 'settings', name: 'Paramètres', icon: Settings }
  ]

  const lastSegment = location.pathname.split('/').filter(Boolean).pop()
  const currentTab: TabId = tabs.some(t => t.id === lastSegment) ? (lastSegment as TabId) : 'profile'
  const currentTabDef = tabs.find(t => t.id === currentTab)!
  const CurrentIcon = currentTabDef.icon

  return (
    <div className="min-h-screen bg-pale-yellow/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <section className="mb-8">
          <div className="rounded-3xl bg-white/90 backdrop-blur px-6 py-7 md:px-8 md:py-9 shadow-sm ring-1 ring-black/5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-dark-green tracking-tight flex items-center gap-4">
                  <User className="w-8 h-8" />
                  Mon compte
                </h1>
                <p className="mt-2 text-gray-600">
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar */}
          <aside className="w-full lg:w-1/4">
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6">
              <nav className="space-y-2">
                {tabs.map(tab => (
                  <NavLink
                    key={tab.id}
                    to={`/account/${tab.id}`}
                    end
                    className={({ isActive }) =>
                      `w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        isActive
                          ? 'bg-dark-green text-pale-yellow'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`
                    }
                  >
                    <tab.icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main */}
          <main className="w-full lg:flex-1">
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6 space-y-6">

              <Routes>
                <Route index element={<Navigate to="profile" replace />} />
                <Route
                  path="profile"
                  element={
                    <ProfileTab
                      onShowPasswordConfirm={() => setShowPasswordConfirm(true)}
                      password={password}
                      onPasswordValidated={() => setPassword('')}
                      active={currentTab === 'profile'}
                    />
                  }
                />
                <Route path="address" element={<AddressTab />} />
                <Route path="payment" element={<PaymentTab />} />
                <Route path="orders" element={<OrdersTab />} />
                <Route path="favorites" element={<FavoritesTab />} />
                <Route path="impact" element={<ImpactTab />} />
                <Route path="settings" element={<SettingsTab />} />
                <Route path="*" element={<Navigate to="profile" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>

      <PasswordConfirmModal
        visible={showPasswordConfirm}
        onClose={() => setShowPasswordConfirm(false)}
        onConfirm={(pwd) => {
          setShowPasswordConfirm(false)
          setPassword(pwd)
        }}
      />
    </div>
  )
}
