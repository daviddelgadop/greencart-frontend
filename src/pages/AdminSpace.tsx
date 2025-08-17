import React from 'react'
import { NavLink, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Newspaper, Leaf } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import BlogAdminTab from '../tabs/BlogAdminTab'

type TabId = 'blog'

const tabs: { id: TabId; name: string; icon: any }[] = [
  { id: 'blog', name: 'Blog', icon: Newspaper },
]

export default function AdminSpace() {
  const { user } = useAuth()
  const location = useLocation()
  const last = location.pathname.split('/').filter(Boolean).pop()
  const current: TabId = (tabs.find(t => t.id === last)?.id || 'blog') as TabId
  const currentTitle = tabs.find(t => t.id === current)?.name || ''

  return (
    <div className="min-h-screen bg-pale-yellow/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <section className="mb-8">
          <div className="rounded-3xl bg-white/90 backdrop-blur px-6 py-7 md:px-8 md:py-9 shadow-sm ring-1 ring-black/5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-dark-green tracking-tight flex items-center gap-4">
                  <Leaf className="w-8 h-8" />
                  Espace Administrateur
                </h1>
                <p className="mt-2 text-gray-600"></p>
              </div>
              {user?.public_display_name && (
                <div className="text-dark-green/80">
                  <span className="inline-flex items-center rounded-full bg-dark-green/10 px-3 py-1 font-medium">
                    {user.public_display_name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar */}
          <aside className="w-full lg:w-1/4">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <nav className="space-y-2">
                {tabs.map(tab => (
                  <NavLink
                    key={tab.id}
                    to={`/admin/${tab.id}`}
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

          {/* Content */}
          <main className="w-full lg:flex-1">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-dark-green mb-6">{currentTitle}</h2>
              <Routes>
                <Route index element={<Navigate to="blog" replace />} />
                <Route path="blog" element={<BlogAdminTab />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
