import React, { useEffect, useState } from 'react'
import { TrendingUp, Package, Users, BarChart3 } from 'lucide-react'
import { http } from '../lib/api'

type Dashboard = {
  metrics: {
    sales: { current: string; previous?: string; change_pct?: number }
    bundles_sold: { current: number; previous?: number; change_pct?: number }
    new_customers: { current: number; previous?: number; change_pct?: number }
    waste_kg: { current: string; previous?: string; change_pct?: number }
  }
  recent: Array<{
    type: 'order'
    order_id: number
    order_code: string
    amount: string
    items: number
    customer_name: string
    created_at: string
  }>
}

export default function OverviewTab() {
  const [data, setData] = useState<Dashboard | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const d = await http.get<Dashboard>('/api/producer/dashboard/')
        if (mounted) setData(d)
      } catch {
        // Fallback 
        if (mounted) {
          setData({
            metrics: {
              sales: { current: '0.00', change_pct: 0 },
              bundles_sold: { current: 0, change_pct: 0 },
              new_customers: { current: 0, change_pct: 0 },
              waste_kg: { current: '0.00' }
            },
            recent: []
          })
        }
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const sales = data?.metrics?.sales?.current ?? '0.00'
  const salesPct = Math.round((data?.metrics?.sales?.change_pct ?? 0) * 10) / 10
  const bundles = data?.metrics?.bundles_sold?.current ?? 0
  const bundlesPct = Math.round((data?.metrics?.bundles_sold?.change_pct ?? 0) * 10) / 10
  const clients = data?.metrics?.new_customers?.current ?? 0
  const clientsPct = Math.round((data?.metrics?.new_customers?.change_pct ?? 0) * 10) / 10
  const waste = data?.metrics?.waste_kg?.current ?? '0.00'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card
          title="Ventes du mois"
          value={`${sales}€`}
          icon={<TrendingUp className="w-6 h-6 text-pale-yellow" />}
          badge={`${salesPct >= 0 ? '+' : ''}${salesPct}% vs mois dernier`}
        />
        <Card
          title="Produits vendus"
          value={bundles}
          icon={<Package className="w-6 h-6 text-white" />}
          badge={`${bundlesPct >= 0 ? '+' : ''}${bundlesPct}% vs mois dernier`}
          color="orange"
        />
        <Card
          title="Nouveaux clients"
          value={clients}
          icon={<Users className="w-6 h-6 text-pale-yellow" />}
          badge={`${clientsPct >= 0 ? '+' : ''}${clientsPct}% vs mois dernier`}
          color="brown"
        />
        <Card
          title="Gaspillage évité"
          value={`${waste}kg`}
          icon={<BarChart3 className="w-6 h-6 text-pale-yellow" />}
          badge="Impact positif"
        />
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-dark-green mb-4">Activité récente</h3>
        <div className="space-y-3">
          {(data?.recent ?? []).map((r: Dashboard['recent'][number]) => (
            <div key={r.order_id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <p className="text-gray-700">
                Nouvelle commande {r.order_code} – {parseFloat(r.amount).toFixed(2)}€
                {r.customer_name ? ` · ${r.customer_name}` : ''}
              </p>
              <span className="text-gray-500 text-sm ml-auto">
                {new Date(r.created_at).toLocaleString('fr-FR')}
              </span>
            </div>
          ))}
          {(!data?.recent || data.recent.length === 0) && (
            <p className="text-gray-500 text-sm">Aucune activité récente.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function Card({
  title,
  value,
  icon,
  badge,
  color = 'green'
}: {
  title: string
  value: React.ReactNode
  icon: React.ReactNode
  badge: string
  color?: 'green' | 'orange' | 'brown'
}) {
  const colors: Record<string, string> = {
    green: 'bg-dark-green',
    orange: 'bg-orange-beige',
    brown: 'bg-medium-brown'
  }
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-2xl font-bold text-dark-green">{value}</p>
        </div>
        <div className={`${colors[color]} rounded-full p-3`}>{icon}</div>
      </div>
      <p className="text-green-600 text-sm mt-2">{badge}</p>
    </div>
  )
}
