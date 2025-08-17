// src/ProducerDashboard.tsx
import React from 'react'
import { NavLink, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import {
  Building2,
  ShoppingBag,
  Award,
  BarChart3,
  Users,
  TrendingUp,
  Apple,
  Leaf,
  CreditCard,
  LayoutDashboard, // icon for the new Dashboard tab
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
  ProducerOverviewTab,
  ProducerBundlesTab,
  ProducerOrdersTab,
  ProducerAnalyticsTab,
  CompaniesTab,
  CertificationsTab,
  ProductsTab,
  ProductBundlesTab,
} from '../tabs'
import ProducerDashboardTab from '../tabs/ProducerDashboardTab' // new

type TabId =
  | 'overview'
  | 'companies'
  | 'certifications'
  | 'products'
  | 'bundles'
  | 'prodproducts'
  | 'orders'
  | 'dashboard'   // new
  | 'analytics'

const tabs: { id: TabId; name: string; icon: any }[] = [
  { id: 'overview',       name: "Vue d'ensemble",             icon: BarChart3 },
  { id: 'companies',      name: 'Mes commerces',              icon: Building2 },
  { id: 'certifications', name: 'Mes certifications',         icon: Award },
  { id: 'products',       name: 'Mes produits',               icon: Apple },
  { id: 'bundles',        name: 'Mes lots',                   icon: ShoppingBag },
  { id: 'orders',         name: 'Commandes',                  icon: Users },
  // new top-level tab for dashboards (keeps existing "analytics" intact)
  { id: 'dashboard',      name: 'Dashboard',                  icon: LayoutDashboard },
  { id: 'analytics',      name: 'Analyses et prévisions',     icon: TrendingUp },
]

export default function ProducerDashboard() {
  const { user } = useAuth()
  const location = useLocation()

  const last = location.pathname.split('/').filter(Boolean).pop()
  const current: TabId = (tabs.find(t => t.id === last)?.id || 'overview') as TabId
  const currentTitle = tabs.find(t => t.id === current)?.name || ''

  return (
    <div className="min-h-screen bg-pale-yellow/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <section className="mb-8">
          <div className="rounded-3xl bg-white/90 backdrop-blur px-6 py-7 md:px-8 md:py-9 shadow-sm ring-1 ring-black/5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-dark-green tracking-tight flex items-center gap-4">
                  <Leaf className="w-8 h-8" />
                  Espace Producteur
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

        {/* Main layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar */}
          <aside className="w-full lg:w-1/4">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <nav className="space-y-2">
                {tabs.map(tab => (
                  <NavLink
                    key={tab.id}
                    to={`/producer/${tab.id}`}
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
                <Route index element={<Navigate to="overview" replace />} />
                <Route path="overview" element={<ProducerOverviewTab />} />
                <Route path="companies" element={<CompaniesTab />} />
                <Route path="certifications" element={<CertificationsTab />} />
                <Route path="products" element={<ProductsTab />} />
                <Route path="bundles" element={<ProductBundlesTab />} />
                {/* <Route path="prodproducts" element={<ProducerBundlesTab />} /> */}
                <Route path="orders" element={<ProducerOrdersTab />} />

                {/* new: dashboards live here as sub-tabs inside one page */}
                <Route path="dashboard" element={<ProducerDashboardTab />} />

                {/* existing analytics remains untouched */}
                <Route path="analytics" element={<ProducerAnalyticsTab />} />

                <Route path="*" element={<Navigate to="overview" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
