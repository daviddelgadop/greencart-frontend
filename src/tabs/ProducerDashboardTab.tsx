import React, { useEffect, useMemo, useRef, useState } from 'react'
import { http } from '../lib/api'
import {
  TrendingUp, Receipt, Users, ShoppingCart, Layers, HeartPulse, Leaf,
  BarChart3, CreditCard, CalendarRange, MapPin, Star,
  Table as TableIcon, LineChart as LineChartIcon, Layout as BothIcon,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from 'recharts'

type SubTab =
  | 'sales' | 'orders' | 'customers' | 'carts' | 'catalog'
  | 'health' | 'impact' | 'category' | 'payments' | 'cohorts' | 'geo' | 'reviews'

type Bucket = 'day' | 'week' | 'month'
type ViewMode = 'table' | 'chart' | 'both'

const DASHBOARD_IS_PRODUCER = import.meta.env.VITE_DASHBOARD_PRODUCER === 'true'
const BASE = DASHBOARD_IS_PRODUCER ? '/api/producer/analytics' : '/api/admin/analytics'

// helpers
const asNum = (v: any, d = 0) => (v == null || v === '' || isNaN(Number(v)) ? d : Number(v))
const fmtEur = (n: number) => `${n.toFixed(2)}€`
const fmtDateTime = (s?: string) => (s ? new Date(s).toLocaleString('fr-FR') : '')
const fmtDate = (s?: string) => (s ? new Date(s).toLocaleDateString('fr-FR') : '')

const firstDayOfThisMonth = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
const lastDayOfThisMonth = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}
// Local-safe ISO (YYYY-MM-DD)
const toISO = (d: Date) =>
  [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')

const weekKey = (s: string) => {
  const d = new Date(s)
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = tmp.getUTCDay() || 7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}
const monthKey = (s: string) => {
  const d = new Date(s)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

type SeriesPoint = { period: string; date?: string; revenue?: number; orders?: number; units?: number }
function rollSeries(series: SeriesPoint[], bucket: Bucket): SeriesPoint[] {
  if (!Array.isArray(series)) return []
  if (bucket === 'day') return series.map(p => ({ ...p, period: p.date || p.period }))
  const group = new Map<string, { revenue: number; orders: number; units: number }>()
  const keyFn = bucket === 'week' ? weekKey : monthKey
  for (const p of series) {
    const key = keyFn(p.date || p.period)
    const g = group.get(key) || { revenue: 0, orders: 0, units: 0 }
    g.revenue += asNum(p.revenue)
    g.orders += asNum(p.orders)
    g.units += asNum(p.units)
    group.set(key, g)
  }
  return Array.from(group.entries()).map(([period, v]) => ({ period, revenue: v.revenue, orders: v.orders, units: v.units }))
}

function riskWordFR(level?: string | null) {
  if (!level) return '—'
  const l = String(level).toUpperCase()
  if (l === 'OK' || l === 'LOW') return 'Correct'
  if (l === 'YELLOW' || l === 'MEDIUM') return 'Faible'
  if (l === 'RED' || l === 'HIGH' || l === 'CRITIQUE') return 'Critique'
  return '—'
}

export default function ProducerDashboardTab() {
  const { user } = useAuth()

  // routing state
  const [tab, setTab] = useState<SubTab>('sales')
  const [bucket, setBucket] = useState<Bucket>('day')
  const [geoLevel, setGeoLevel] = useState<'region' | 'department' | 'city'>('region')
  const [viewMode, setViewMode] = useState<ViewMode>('both')
  const [limit, setLimit] = useState<number>(50)

  // date range: default current month
  const [dateFrom, setDateFrom] = useState<string>(toISO(firstDayOfThisMonth()))
  const [dateTo, setDateTo] = useState<string>(toISO(lastDayOfThisMonth()))

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const firstLoad = useRef(true)
  const rcKey = (k: string) => `${k}-${bucket}-${dateFrom}-${dateTo}-${geoLevel}`

  const clampRange = (from: string, to: string) => {
    if (!from || !to) return { from, to }
    const f = new Date(from)
    const t = new Date(to)
    if (f > t) return { from: to, to }
    return { from, to }
  }

  const params = useMemo(() => {
    const q = new URLSearchParams()
    if (dateFrom) q.set('date_from', dateFrom)
    if (dateTo) q.set('date_to', dateTo)
    return q.toString()
  }, [dateFrom, dateTo])

  const fetchData = useMemo(() => {
    const urlFor = () => {
      if (tab === 'sales') return `${BASE}/sales/timeseries/?bucket=${bucket}&${params}`
      if (tab === 'orders') return `${BASE}/orders/deep/?bucket=${bucket}&${params}`
      if (tab === 'customers') return `${BASE}/customers/deep/?bucket=${bucket}&${params}`
      if (tab === 'carts') return `${BASE}/carts/abandoned/deep/?${params}`
      if (tab === 'catalog') return `${BASE}/catalog/deep/?${params}`
      if (tab === 'health') return `${BASE}/products/health/?${params}`
      if (tab === 'impact') return `${BASE}/impact/?bucket=${bucket}&${params}`
      if (tab === 'category') return `${BASE}/cross/certifications-performance/?${params}`
      if (tab === 'payments') return `${BASE}/cross/payments-aov-ratings-geo/?${params}`
      if (tab === 'cohorts') return `${BASE}/cohorts/monthly/?bucket=${bucket}&${params}`
      if (tab === 'geo') return `${BASE}/geo/deep/?level=${geoLevel}&${params}`
      if (tab === 'reviews') return `${BASE}/evaluations/deep/?kind=all&bucket=${bucket}&${params}`
      return ''
    }
    return async () => {
      const url = urlFor()
      if (!url) return
      setLoading(true)
      setError(null)
      try {
        const res = await http.get<any>(url)
        setData(res)
      } catch {
        setError('Erreur lors du chargement.')
        setData(null)
      } finally {
        setLoading(false)
      }
    }
  }, [tab, bucket, geoLevel, params])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false
      fetchData()
    }
  }, []) // eslint-disable-line

  // ========== HEADER ==========
  const SummaryCards = useMemo(() => {
    const s = data?.summary || {}
    const cards: Array<{ icon: React.ReactNode; label: string; value: string }> = []

    if (tab === 'sales') {
      cards.push(
        { icon: <TrendingUp className="w-4 h-4" />, label: 'CA', value: fmtEur(asNum(s.revenue)) },
        { icon: <Receipt className="w-4 h-4" />, label: 'Cmd', value: String(asNum(s.orders)) },
        { icon: <BarChart3 className="w-4 h-4" />, label: 'AOV', value: fmtEur(asNum(s.avg_order_value)) },
      )
    } else if (tab === 'orders') {
      cards.push(
        { icon: <Receipt className="w-4 h-4" />, label: 'Cmd', value: String(asNum(s.orders)) },
        { icon: <TrendingUp className="w-4 h-4" />, label: 'CA', value: fmtEur(asNum(s.revenue)) },
        { icon: <Leaf className="w-4 h-4" />, label: 'Livrées', value: String(asNum(s.by_status?.delivered)) },
      )
    } else if (tab === 'carts') {
      cards.push(
        { icon: <ShoppingCart className="w-4 h-4" />, label: 'Paniers actifs', value: String(asNum(s.active_carts)) },
        { icon: <Users className="w-4 h-4" />, label: 'Articles / panier', value: asNum(s.avg_cart_qty).toFixed(1) },
      )
    } else if (tab === 'catalog') {
      const p = s.products || {}
      const b = s.bundles || {}
      cards.push(
        { icon: <Layers className="w-4 h-4" />, label: 'Produits', value: String(asNum(p.count)) },
        { icon: <HeartPulse className="w-4 h-4" />, label: 'Faible stock', value: String(asNum(p.low_stock)) },
        { icon: <Leaf className="w-4 h-4" />, label: 'Bundles', value: String(asNum(b.count)) },
      )
    } else if (tab === 'health') {
      const p = s.products || {}
      cards.push(
        { icon: <Layers className="w-4 h-4" />, label: 'Produits', value: String(asNum(p.count)) },
        { icon: <HeartPulse className="w-4 h-4" />, label: 'Faible stock', value: String(asNum(p.low_stock)) },
      )
    } else if (tab === 'impact') {
      cards.push(
        { icon: <Leaf className="w-4 h-4" />, label: 'CO₂ évité (kg)', value: asNum(s.avoided_co2_kg).toFixed(2) },
        { icon: <Leaf className="w-4 h-4" />, label: 'Gaspillage évité (kg)', value: asNum(s.avoided_waste_kg).toFixed(2) },
        { icon: <TrendingUp className="w-4 h-4" />, label: 'Économies (€)', value: fmtEur(asNum(s.savings_eur)) },
      )
    } else if (tab === 'payments') {
      cards.push(
        { icon: <CreditCard className="w-4 h-4" />, label: 'Cmd', value: String(asNum(s.orders)) },
        { icon: <TrendingUp className="w-4 h-4" />, label: 'CA', value: fmtEur(asNum(s.revenue)) },
      )
    } else if (tab === 'cohorts') {
      cards.push(
        { icon: <Users className="w-4 h-4" />, label: 'Cohortes', value: String(asNum(s.cohorts)) },
        { icon: <Users className="w-4 h-4" />, label: 'Clients', value: String(asNum(s.customers)) },
        { icon: <TrendingUp className="w-4 h-4" />, label: 'CA', value: fmtEur(asNum(s.revenue)) },
      )
    } else if (tab === 'geo') {
      cards.push(
        { icon: <MapPin className="w-4 h-4" />, label: 'Zones', value: String(asNum(s.zones)) },
        { icon: <Receipt className="w-4 h-4" />, label: 'Cmd', value: String(asNum(s.orders)) },
        { icon: <TrendingUp className="w-4 h-4" />, label: 'CA', value: fmtEur(asNum(s.revenue)) },
      )
    } else if (tab === 'reviews') {
      cards.push(
        { icon: <Star className="w-4 h-4" />, label: 'Moy. note (article)', value: (asNum(s.avg_item_rating)).toFixed(2) || '0.00' },
        { icon: <Star className="w-4 h-4" />, label: 'Moy. note (commande)', value: (asNum(s.avg_order_rating)).toFixed(2) || '0.00' },
      )
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {cards.map((c, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pale-yellow text-dark-green">{c.icon}</div>
            <div>
              <div className="text-xs text-gray-500">{c.label}</div>
              <div className="text-lg font-semibold">{c.value}</div>
            </div>
          </div>
        ))}
      </div>
    )
  }, [data, tab])

  // ========== TOOLBAR (reordenado) ==========
  const Toolbar = (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setViewMode('table')} className={`px-3 py-1 rounded-lg border ${viewMode === 'table' ? 'bg-dark-green text-white' : 'bg-white'}`} title="Table only">
          <TableIcon className="w-4 h-4" />
        </button>
        <button onClick={() => setViewMode('chart')} className={`px-3 py-1 rounded-lg border ${viewMode === 'chart' ? 'bg-dark-green text-white' : 'bg-white'}`} title="Chart only">
          <LineChartIcon className="w-4 h-4" />
        </button>
        <button onClick={() => setViewMode('both')} className={`px-3 py-1 rounded-lg border ${viewMode === 'both' ? 'bg-dark-green text-white' : 'bg-white'}`} title="Both">
          <BothIcon className="w-4 h-4" />
        </button>

        <div className="ml-2 flex items-center gap-2">
          <span className="text-xs text-gray-600">Granularité</span>
          <select className="border rounded-lg px-2 py-1 text-sm" value={bucket} onChange={e => setBucket(e.target.value as Bucket)}>
            <option value="day">Jour</option>
            <option value="week">Semaine</option>
            <option value="month">Mois</option>
          </select>
        </div>

        {tab === 'geo' && (
          <div className="ml-2 flex items-center gap-2">
            <span className="text-xs text-gray-600">Niveau</span>
            <select className="border rounded-lg px-2 py-1 text-sm" value={geoLevel} onChange={e => setGeoLevel(e.target.value as any)}>
              <option value="region">Région</option>
              <option value="department">Département</option>
              <option value="city">Ville</option>
            </select>
          </div>
        )}
      </div>

      {/* Rango de fechas debajo */}
      <div className="flex items-center gap-2">
        <CalendarRange className="w-4 h-4 text-gray-600" />
        <input
          type="date"
          className="border rounded-lg px-2 py-1 text-sm"
          value={dateFrom}
          onChange={e => {
            const { from, to } = clampRange(e.target.value, dateTo)
            setDateFrom(from); setDateTo(to)
          }}
        />
        <span className="text-xs text-gray-600">→</span>
        <input
          type="date"
          className="border rounded-lg px-2 py-1 text-sm"
          value={dateTo}
          onChange={e => {
            const { from, to } = clampRange(dateFrom, e.target.value)
            setDateFrom(from); setDateTo(to)
          }}
        />
      </div>
    </div>
  )

  // ========== VIEWS ==========

  // SALES
  const salesView = useMemo(() => {
    if (tab !== 'sales') return null
    const series: SeriesPoint[] = Array.isArray(data?.series) ? data.series : []
    const rows: any[] = Array.isArray(data?.rows) ? data.rows : []
    const rSeries = rollSeries(series, bucket)

    const chart = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h4 className="text-sm font-semibold text-dark-green mb-3">CA / commandes / unités</h4>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%" key={rcKey('sales')}>
            <LineChart data={rSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="revenue" name="CA (€)" stroke="#14532d" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="orders" name="Cmd" stroke="#4d7c0f" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="units" name="Unités" stroke="#0e7490" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    )

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="overflow-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                <th className="px-4 py-2 text-left">Commande</th>
                <th className="px-4 py-2 text-left">Item</th>
                <th className="px-4 py-2 text-left">Contenu</th>
                <th className="px-4 py-2 text-right">Ligne (€)</th>
                <th className="px-4 py-2 text-left">Créée</th>
                <th className="px-4 py-2 text-left">Producteur</th>
                <th className="px-4 py-2 text-left">Commerce</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, limit).map((r, i) => (
                <tr key={`${r.order_id}-${r.item_id}-${i}`} className="border-b">
                  <td className="px-4 py-2">{r.order_id}</td>
                  <td className="px-4 py-2">{r.item_id}</td>
                  <td className="px-4 py-2">{`${r.bundle_title ?? r.label ?? '—'} x ${asNum(r.quantity, 1)}`}</td>
                  <td className="px-4 py-2 text-right">{fmtEur(asNum(r.line_total || r.unit_price))}</td>
                  <td className="px-4 py-2">{fmtDateTime(r.created_at)}</td>
                  <td className="px-4 py-2">{r.producer_name ?? (Array.isArray(r.producer_names) ? r.producer_names.join(', ') : '')}</td>
                  <td className="px-4 py-2">{r.company_name ?? (Array.isArray(r.company_names) ? r.company_names.join(', ') : '')}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={7}>Aucun résultat</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )

    return <div className="space-y-6">{viewMode !== 'table' && chart}{viewMode !== 'chart' && table}</div>
  }, [data, bucket, limit, tab, viewMode])

  // ORDERS
  const ordersView = useMemo(() => {
    if (tab !== 'orders') return null
    const rows: any[] = Array.isArray(data?.rows) ? data.rows : []

    const keyFn = bucket === 'week' ? weekKey : bucket === 'month' ? monthKey : (s: string) => s.slice(0, 10)
    const chartData = rows.reduce((acc: Record<string, { period: string; revenue: number; orders: number }>, r: any) => {
      const k = keyFn(r.created_at)
      acc[k] = acc[k] || { period: k, revenue: 0, orders: 0 }
      acc[k].revenue += asNum(r.total_price)
      acc[k].orders += 1
      return acc
    }, {})
    const chartArr = Object.values(chartData)

    const chart = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h4 className="text-sm font-semibold text-dark-green mb-3">Commandes et CA</h4>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%" key={rcKey('orders')}>
            <BarChart data={chartArr} barCategoryGap="15%">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" name="Cmd" fill="#14532d" isAnimationActive={false} maxBarSize={36} />
              <Bar dataKey="revenue" name="CA (€)" fill="#4d7c0f" isAnimationActive={false} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="overflow-auto">
          <table className="w-full table-auto">
            <thead>
            <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
              <th className="px-4 py-2 text-left">Utilisateur</th>
              <th className="px-4 py-2 text-left">Commande</th>
              <th className="px-4 py-2 text-right">Total</th>
              <th className="px-4 py-2 text-left">Statut</th>
              <th className="px-4 py-2 text-left">Créée</th>
              <th className="px-4 py-2 text-left">Producteur</th>
              <th className="px-4 py-2 text-left">Commerce</th>
            </tr>
            </thead>
            <tbody>
            {rows.slice(0, limit).map((r, i) => (
              <tr key={r.id ?? i} className="border-b">
                <td className="px-4 py-2">{r.user_name ?? r.customer_name ?? r.user ?? r.user_id ?? '—'}</td>
                <td className="px-4 py-2">{r.id}</td>
                <td className="px-4 py-2 text-right">{fmtEur(asNum(r.total_price))}</td>
                <td className="px-4 py-2">{r.status}</td>
                <td className="px-4 py-2">{fmtDateTime(r.created_at)}</td>
                <td className="px-4 py-2">{Array.isArray(r.producer_names) ? r.producer_names.join(', ') : ''}</td>
                <td className="px-4 py-2">{Array.isArray(r.company_names) ? r.company_names.join(', ') : ''}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={7}>Aucun résultat</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )

    return <div className="space-y-6">{viewMode !== 'table' && chart}{viewMode !== 'chart' && table}</div>
  }, [data, limit, tab, viewMode, bucket])

  // CUSTOMERS
  const customersView = useMemo(() => {
    if (tab !== 'customers') return null
    const items: any[] = Array.isArray(data?.rows) ? data.rows : []

    const keyFn = bucket === 'week' ? weekKey : bucket === 'month' ? monthKey : (s: string) => (s || '').slice(0, 10)
    const chartData = items.reduce((acc: Record<string, { period: string; revenue: number; orders: number }>, r: any) => {
      const k = keyFn(r.first_order || new Date().toISOString())
      acc[k] = acc[k] || { period: k, revenue: 0, orders: 0 }
      acc[k].revenue += asNum(r.revenue ?? r.spent)
      acc[k].orders += asNum(r.orders)
      return acc
    }, {})
    const chartArr = Object.values(chartData)

    const chart = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h4 className="text-sm font-semibold text-dark-green mb-3">Nouveaux clients (CA / commandes)</h4>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%" key={rcKey('customers')}>
            <BarChart data={chartArr} barCategoryGap="15%">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" name="Cmd" fill="#14532d" isAnimationActive={false} maxBarSize={36} />
              <Bar dataKey="revenue" name="CA (€)" fill="#4d7c0f" isAnimationActive={false} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="overflow-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                <th className="px-4 py-2 text-left">Utilisateur</th>
                <th className="px-4 py-2 text-left">Cohorte</th>
                <th className="px-4 py-2 text-left">1ère commande</th>
                <th className="px-4 py-2 text-right">Cmd</th>
                <th className="px-4 py-2 text-right">CA</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, limit).map((r: any, i: number) => (
                <tr key={r.user_id || i} className="border-b">
                  <td className="px-4 py-2">{r.user_name ?? r.user ?? r.user_id ?? '—'}</td>
                  <td className="px-4 py-2">{r.cohort_month ?? ''}</td>
                  <td className="px-4 py-2">{fmtDate(r.first_order)}</td>
                  <td className="px-4 py-2 text-right">{asNum(r.orders).toFixed(0)}</td>
                  <td className="px-4 py-2 text-right">{fmtEur(asNum(r.revenue ?? r.spent))}</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={5}>Aucun résultat</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )

    return <div className="space-y-6">{viewMode !== 'table' && chart}{viewMode !== 'chart' && table}</div>
  }, [data, limit, tab, viewMode, bucket])

  // CARTS
  const cartsView = useMemo(() => {
    if (tab !== 'carts') return null
    const summary = data?.summary || {}
    const items: any[] = Array.isArray(data?.rows) ? data.rows : []
    const topAbandoned = Array.isArray(summary?.top_abandoned_products) ? summary.top_abandoned_products : []

    const chartData = topAbandoned.map((p: any) => ({ label: p.label || p.title, value: asNum(p.count || p.units || p.qty || 0) }))

    const chartBlock = chartData.length ? (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h4 className="text-sm font-semibold text-dark-green mb-3">Produits abandonnés</h4>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%" key={rcKey('carts')}>
            <BarChart data={chartData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={false} label={{ value: 'Produit', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Quantité', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Qty" fill="#14532d" isAnimationActive={false} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    ) : null

    const tableBlock = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="overflow-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                <th className="px-4 py-2 text-left">Panier</th>
                <th className="px-4 py-2 text-left">Utilisateur</th>
                <th className="px-4 py-2 text-left">Maj</th>
                <th className="px-4 py-2 text-right">Qté</th>
                <th className="px-4 py-2 text-left">Producteur</th>
                <th className="px-4 py-2 text-left">Commerce</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, limit).map((r: any, i: number) => {
                const names = new Set<string>()
                const comps = new Set<string>()
                for (const it of (r.items || [])) {
                  const b = it.bundle || {}
                  ;(b.producer_names || []).forEach((n: string) => names.add(n))
                  ;(b.company_names || []).forEach((n: string) => comps.add(n))
                }
                return (
                  <tr key={r.cart_id || i} className="border-b">
                    <td className="px-4 py-2">{r.cart_id}</td>
                    <td className="px-4 py-2">{r.user_name ?? r.user ?? r.user_id ?? '—'}</td>
                    <td className="px-4 py-2">{fmtDateTime(r.updated_at)}</td>
                    <td className="px-4 py-2 text-right">{asNum(r.items_qty)}</td>
                    <td className="px-4 py-2">{Array.from(names).join(', ')}</td>
                    <td className="px-4 py-2">{Array.from(comps).join(', ')}</td>
                  </tr>
                )
              })}
              {items.length === 0 && <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={6}>Aucun résultat</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )

    return <div className="space-y-6">{viewMode !== 'table' && chartBlock}{viewMode !== 'chart' && tableBlock}</div>
  }, [data, limit, tab, viewMode])

  // CATALOG
  const catalogView = useMemo(() => {
    if (tab !== 'catalog') return null
    const products: any[] =
      Array.isArray(data?.products) ? data.products
      : Array.isArray(data?.rows?.products) ? data.rows.products
      : Array.isArray(data?.rows?.products?.data) ? data.rows.products.data
      : []

    const chartData = products.map((p: any) => ({ label: p.title || p.name, sold: asNum(p.sold), stock: asNum(p.stock) }))

    const chart = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h4 className="text-sm font-semibold text-dark-green mb-3">Ventes & stock par produit</h4>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%" key={rcKey('catalog')}>
            <BarChart data={chartData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={false} label={{ value: 'Produit', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Quantité', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="sold" name="Vendu" fill="#14532d" isAnimationActive={false} maxBarSize={36} />
              <Bar dataKey="stock" name="Stock" fill="#4d7c0f" isAnimationActive={false} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="overflow-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                <th className="px-4 py-2 text-left">Produit</th>
                <th className="px-4 py-2 text-right">Stock</th>
                <th className="px-4 py-2 text-right">Vendu</th>
                <th className="px-4 py-2 text-left">Catégorie</th>
                <th className="px-4 py-2 text-left">Producteur</th>
                <th className="px-4 py-2 text-left">Commerce</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, limit).map((p: any, i: number) => (
                <tr key={p.product_id || i} className="border-b">
                  <td className="px-4 py-2">{p.title || p.name}</td>
                  <td className="px-4 py-2 text-right">{asNum(p.stock)}</td>
                  <td className="px-4 py-2 text-right">{asNum(p.sold)}</td>
                  <td className="px-4 py-2">{typeof p.category === 'object' ? (p.category?.name ?? '') : (p.category ?? '')}</td>
                  <td className="px-4 py-2">{Array.isArray(p.producer_names) ? p.producer_names.join(', ') : (p.producer_name ?? '')}</td>
                  <td className="px-4 py-2">{Array.isArray(p.company_names) ? p.company_names.join(', ') : (p.company_name ?? '')}</td>
                </tr>
              ))}
              {products.length === 0 && <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={6}>Aucun résultat</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )

    return <div className="space-y-6">{viewMode !== 'table' && chart}{viewMode !== 'chart' && table}</div>
  }, [data, limit, tab, viewMode])

  // HEALTH
  const healthView = useMemo(() => {
    if (tab !== 'health') return null
    const products =
      Array.isArray(data?.rows?.products) ? data.rows.products
      : Array.isArray(data?.rows?.products?.data) ? data.rows.products.data
      : (Array.isArray(data?.products) ? data.products : [])

    const chartData = products.map((p: any) => ({ label: p.title || p.name, sold: asNum(p.sold), stock: asNum(p.stock) }))

    const chart = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h4 className="text-sm font-semibold text-dark-green mb-3">Santé du catalogue</h4>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%" key={rcKey('health')}>
            <BarChart data={chartData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={false} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="stock" name="Stock" fill="#14532d" isAnimationActive={false} maxBarSize={36} />
              <Bar dataKey="sold" name="Vendu" fill="#4d7c0f" isAnimationActive={false} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="overflow-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                <th className="px-4 py-2 text-left">Produit</th>
                <th className="px-4 py-2 text-right">Stock</th>
                <th className="px-4 py-2 text-right">Vendu</th>
                <th className="px-4 py-2 text-left">Niveau</th>
                <th className="px-4 py-2 text-left">Producteur</th>
                <th className="px-4 py-2 text-left">Commerce</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, limit).map((p: any, i: number) => (
                <tr key={p.product_id || i} className="border-b">
                  <td className="px-4 py-2">{p.title}</td>
                  <td className="px-4 py-2 text-right">{asNum(p.stock)}</td>
                  <td className="px-4 py-2 text-right">{asNum(p.sold)}</td>
                  <td className="px-4 py-2">{riskWordFR(p.level)}</td>
                  <td className="px-4 py-2">{Array.isArray(p.producer_names) ? p.producer_names.join(', ') : (p.producer_name ?? '')}</td>
                  <td className="px-4 py-2">{Array.isArray(p.company_names) ? p.company_names.join(', ') : (p.company_name ?? '')}</td>
                </tr>
              ))}
              {products.length === 0 && <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={6}>Aucun résultat</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )

    return <div className="space-y-6">{viewMode !== 'table' && chart}{viewMode !== 'chart' && table}</div>
  }, [data, limit, tab, viewMode])

  // IMPACT  (AJUSTE PARA NO DESBORDAR ANCHO)
  const impactView = useMemo(() => {
    if (tab !== 'impact') return null
    const rows: any[] = Array.isArray(data?.rows) ? data.rows : []

    const keyFn = bucket === 'week' ? weekKey : bucket === 'month' ? monthKey : (s: string) => s.slice(0, 10)
    const chartData = rows.reduce((acc: Record<string, { period: string; co2: number; waste: number }>, r: any) => {
      const k = keyFn(r.created_at)
      const a = acc[k] || { period: k, co2: 0, waste: 0 }
      a.co2 += asNum(r.avoided_co2_kg)
      a.waste += asNum(r.avoided_waste_kg)
      acc[k] = a
      return acc
    }, {})
    const chartArr = Object.values(chartData)

    const chart = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h4 className="text-sm font-semibold text-dark-green mb-3">Impact (CO₂ / déchets évités)</h4>
        <div className="w-full max-w-full overflow-hidden" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%" key={rcKey('impact')}>
            <BarChart data={chartArr} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" interval="preserveStartEnd" />
              <YAxis />
              <Tooltip />
              <Legend wrapperStyle={{ overflow: 'hidden' }} />
              <Bar dataKey="co2" name="CO₂ (kg)" fill="#14532d" isAnimationActive={false} maxBarSize={36} />
              <Bar dataKey="waste" name="Gaspillage (kg)" fill="#4d7c0f" isAnimationActive={false} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
            <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
              <th className="px-4 py-2 text-left">Commande</th>
              <th className="px-4 py-2 text-left">Item</th>
              <th className="px-4 py-2 text-left">Bundle</th>
              <th className="px-4 py-2 text-left">Créée</th>
              <th className="px-4 py-2 text-right">CO₂ évité (kg)</th>
              <th className="px-4 py-2 text-right">Gaspillage évité (kg)</th>
              <th className="px-4 py-2 text-right">Économies (€)</th>
              <th className="px-4 py-2 text-left">Producteur</th>
              <th className="px-4 py-2 text-left">Commerce</th>
            </tr>
            </thead>
            <tbody>
            {rows.slice(0, limit).map((r: any, i: number) => (
              <tr key={`${r.order_id}-${r.item_id}-${i}`} className="border-b">
                <td className="px-4 py-2">{r.order_id}</td>
                <td className="px-4 py-2">{r.item_id}</td>
                <td className="px-4 py-2">{r.bundle_title ?? '—'}</td>
                <td className="px-4 py-2">{fmtDateTime(r.created_at)}</td>
                <td className="px-4 py-2 text-right">{asNum(r.avoided_co2_kg).toFixed(2)}</td>
                <td className="px-4 py-2 text-right">{asNum(r.avoided_waste_kg).toFixed(2)}</td>
                <td className="px-4 py-2 text-right">{fmtEur(asNum(r.savings_eur))}</td>
                <td className="px-4 py-2">{r.producer_name ?? (Array.isArray(r.producer_names) ? r.producer_names.join(', ') : '')}</td>
                <td className="px-4 py-2">{r.company_name ?? (Array.isArray(r.company_names) ? r.company_names.join(', ') : '')}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={9}>Aucun résultat</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )

    return <div className="space-y-6">{viewMode !== 'table' && chart}{viewMode !== 'chart' && table}</div>
  }, [data, limit, tab, viewMode, bucket])

  // PAYMENTS
  const paymentsView = useMemo(() => {
    if (tab !== 'payments') return null
    const rows: any[] = Array.isArray(data?.rows) ? data.rows : []

    const chartData = rows.map(r => ({ pm: r.payment_method || r.method || 'inconnu', success_rate: asNum(r.success_rate) * 100, aov: asNum(r.aov) }))
    const chart = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h4 className="text-sm font-semibold text-dark-green mb-3">Paiements (taux de succès / AOV)</h4>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%" key={rcKey('payments')}>
            <BarChart data={chartData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="pm" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="success_rate" name="Succès (%)" fill="#14532d" isAnimationActive={false} maxBarSize={36} />
              <Bar dataKey="aov" name="AOV (€)" fill="#4d7c0f" isAnimationActive={false} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )

    // Mantengo "order_rows" porque el endpoint cross lo expone así
    const orderRows: any[] = Array.isArray(data?.order_rows) ? data.order_rows : []

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="overflow-auto">
          <table className="w-full table-auto">
            <thead>
            <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
              <th className="px-4 py-2 text-left">Commande</th>
              <th className="px-4 py-2 text-left">Item</th>
              <th className="px-4 py-2 text-left">Méthode</th>
              <th className="px-4 py-2 text-right">Montant (€)</th>
              <th className="px-4 py-2 text-left">Producteur</th>
              <th className="px-4 py-2 text-left">Commerce</th>
            </tr>
            </thead>
            <tbody>
            {orderRows.slice(0, limit).map((r: any, i: number) => (
              <tr key={`${r.order_id}-${r.item_id ?? '0'}-${i}`} className="border-b">
                <td className="px-4 py-2">{r.order_id}</td>
                <td className="px-4 py-2">{r.item_id ?? '—'}</td>
                <td className="px-4 py-2">{r.payment_method ?? r.method ?? '—'}</td>
                <td className="px-4 py-2 text-right">{fmtEur(asNum(r.amount ?? r.total_price))}</td>
                <td className="px-4 py-2">{Array.isArray(r.producer_names) ? r.producer_names.join(', ') : (r.producer_name ?? '')}</td>
                <td className="px-4 py-2">{Array.isArray(r.company_names) ? r.company_names.join(', ') : (r.company_name ?? '')}</td>
              </tr>
            ))}
            {orderRows.length === 0 &&
              <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={6}>Aucun résultat</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )

    return <div className="space-y-6">{viewMode !== 'table' && chart}{viewMode !== 'chart' && table}</div>
  }, [data, limit, tab, viewMode])

  // COHORTS
  const cohortsView = useMemo(() => {
    if (tab !== 'cohorts') return null
    const items: any[] = Array.isArray(data?.rows_company) ? data.rows_company : (Array.isArray(data?.rows) ? data.rows : [])

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="overflow-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                <th className="px-4 py-2 text-left">Cohorte</th>
                <th className="px-4 py-2 text-left">Commerce</th>
                <th className="px-4 py-2 text-left">Producteur</th>
                <th className="px-4 py-2 text-left">Offsets</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, limit).map((r: any, i: number) => (
                <tr key={`${r.company_id ?? r.user_id ?? i}`} className="border-b">
                  <td className="px-4 py-2">{r.cohort_month}</td>
                  <td className="px-4 py-2">{r.company_name ?? '—'}</td>
                  <td className="px-4 py-2">{r.producer_name ?? '—'}</td>
                  <td className="px-4 py-2">
                    {(r.periods || []).map((p: any) => `+${p.offset}: ${p.orders} cmd / ${fmtEur(asNum(p.revenue))}`).join(' · ')}
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={4}>Aucun résultat</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )
    return <div className="space-y-6">{table}</div>
  }, [data, limit, tab])

  // GEO  (CAMBIO: columna "Produit" → monto por ítem)
  const geoView = useMemo(() => {
    if (tab !== 'geo') return null
    const byZone = Array.isArray(data?.by_zone) ? data.by_zone : []
    const items = Array.isArray(data?.rows) ? data.rows : []
    const chartData = byZone.map((z: any) => ({
      zone: z.zone_desc || z.zone,
      revenue: asNum(z.revenue),
      orders: asNum(z.orders)
    }))

    const chart = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h4 className="text-sm font-semibold text-dark-green mb-3">CA par zone</h4>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%" key={rcKey('geo')}>
            <BarChart data={chartData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="zone" label={{ value: 'Zone', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Valeur', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" name="CA (€)" fill="#14532d" isAnimationActive={false} maxBarSize={36} />
              <Bar dataKey="orders" name="Cmd" fill="#4d7c0f" isAnimationActive={false} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="overflow-auto">
          <table className="w-full table-auto">
            <thead>
            <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
              <th className="px-4 py-2 text-left">Commande</th>
              <th className="px-4 py-2 text-left">Créée</th>
              <th className="px-4 py-2 text-left">Zone</th>
              <th className="px-4 py-2 text-right">Montant (€)</th>{/* ← antes: Produit */}
              <th className="px-4 py-2 text-left">Producteur</th>
              <th className="px-4 py-2 text-left">Commerce</th>
            </tr>
            </thead>
            <tbody>
            {items.slice(0, limit).map((r: any, i: number) => (
              <tr key={`${r.order_id}-${r.order_item_id}-${i}`} className="border-b">
                <td className="px-4 py-2">{r.order_id}</td>
                <td className="px-4 py-2">{fmtDateTime(r.created_at)}</td>
                <td className="px-4 py-2">{r.zone_desc ?? r.zone}</td>
                <td className="px-4 py-2 text-right">{fmtEur(asNum(r.revenue_share ?? r.line_total ?? 0))}</td>
                <td className="px-4 py-2">{r.producer_name ?? (Array.isArray(r.producer_names) ? r.producer_names.join(', ') : '')}</td>
                <td className="px-4 py-2">{r.company_name ?? (Array.isArray(r.company_names) ? r.company_names.join(', ') : '')}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={6}>Aucun résultat</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )

    return <div className="space-y-6">{viewMode !== 'table' && chart}{viewMode !== 'chart' && table}</div>
  }, [data, limit, tab, viewMode, geoLevel])

  // REVIEWS
  const reviewsView = useMemo(() => {
    if (tab !== 'reviews') return null
    const rows: any[] = Array.isArray(data?.rows) ? data.rows : []
    const distI = data?.summary?.distribution_items || {}
    const distO = data?.summary?.distribution_orders || {}

    const toBars = (d: Record<string, number>) => Object.keys(d).sort().map(k => ({ rating: k, count: asNum(d[k]) }))

    const chart = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h4 className="text-sm font-semibold text-dark-green mb-3">Répartition des notes</h4>
        <div className="space-y-6">
          <div className="w-full" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%" key={rcKey('reviews-items')}>
              <BarChart data={toBars(distI)} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Articles" fill="#14532d" isAnimationActive={false} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%" key={rcKey('reviews-orders')}>
              <BarChart data={toBars(distO)} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Commandes" fill="#4d7c0f" isAnimationActive={false} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    )

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="overflow-auto">
          <table className="w-full table-auto">
            <thead>
            <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Commande</th>
              <th className="px-4 py-2 text-left">Item</th>
              <th className="px-4 py-2 text-left">Bundle / Titre</th>
              <th className="px-4 py-2 text-left">Note</th>
              <th className="px-4 py-2 text-left">Producteur</th>
              <th className="px-4 py-2 text-left">Commerce</th>
              <th className="px-4 py-2 text-left">Date</th>
            </tr>
            </thead>
            <tbody>
            {rows.slice(0, limit).map((r: any, i: number) => (
              <tr key={`${r.type}-${r.order_id ?? '0'}-${r.item_id ?? '0'}-${i}`} className="border-b">
                <td className="px-4 py-2">{r.type}</td>
                <td className="px-4 py-2">{r.order_id ?? '—'}</td>
                <td className="px-4 py-2">{r.item_id ?? '—'}</td>
                <td className="px-4 py-2">{r.bundle_title ?? r.title ?? '—'}</td>
                <td className="px-4 py-2">{r.rating ?? r.customer_rating ?? '—'}</td>
                <td className="px-4 py-2">{r.producer_name ?? (Array.isArray(r.producer_names) ? r.producer_names.join(', ') : '')}</td>
                <td className="px-4 py-2">{r.company_name ?? (Array.isArray(r.company_names) ? r.company_names.join(', ') : '')}</td>
                <td className="px-4 py-2">{fmtDateTime(r.rated_at ?? r.created_at)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={8}>Aucun résultat</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )

    return <div className="space-y-6">{viewMode !== 'table' && chart}{viewMode !== 'chart' && table}</div>
  }, [data, limit, tab, viewMode, bucket])

  // ===== MAIN RENDER =====
  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setTab('sales')} className={`px-3 py-1 rounded-full border ${tab === 'sales' ? 'bg-dark-green text-white' : 'bg-white'}`}>Ventes</button>
        <button onClick={() => setTab('orders')} className={`px-3 py-1 rounded-full border ${tab === 'orders' ? 'bg-dark-green text-white' : 'bg-white'}`}>Commandes</button>
        <button onClick={() => setTab('customers')} className={`px-3 py-1 rounded-full border ${tab === 'customers' ? 'bg-dark-green text-white' : 'bg-white'}`}>Utilisateurs</button>
        <button onClick={() => setTab('carts')} className={`px-3 py-1 rounded-full border ${tab === 'carts' ? 'bg-dark-green text-white' : 'bg-white'}`}>Paniers</button>
        <button onClick={() => setTab('catalog')} className={`px-3 py-1 rounded-full border ${tab === 'catalog' ? 'bg-dark-green text-white' : 'bg-white'}`}>Catalogue</button>
        <button onClick={() => setTab('health')} className={`px-3 py-1 rounded-full border ${tab === 'health' ? 'bg-dark-green text-white' : 'bg-white'}`}>Santé</button>
        <button onClick={() => setTab('impact')} className={`px-3 py-1 rounded-full border ${tab === 'impact' ? 'bg-dark-green text-white' : 'bg-white'}`}>Impact</button>
        <button onClick={() => setTab('payments')} className={`px-3 py-1 rounded-full border ${tab === 'payments' ? 'bg-dark-green text-white' : 'bg-white'}`}>Paiements</button>
        <button onClick={() => setTab('cohorts')} className={`px-3 py-1 rounded-full border ${tab === 'cohorts' ? 'bg-dark-green text-white' : 'bg-white'}`}>Cohortes</button>
        <button onClick={() => setTab('geo')} className={`px-3 py-1 rounded-full border ${tab === 'geo' ? 'bg-dark-green text-white' : 'bg-white'}`}>Géo</button>
        <button onClick={() => setTab('reviews')} className={`px-3 py-1 rounded-full border ${tab === 'reviews' ? 'bg-dark-green text-white' : 'bg-white'}`}>Évaluations</button>
      </div>

      {Toolbar}

      {loading && <div className="text-center text-sm text-gray-600">Chargement…</div>}
      {error && <div className="text-center text-sm text-red-600">{error}</div>}

      {!loading && !error && (
        <>
          {SummaryCards}
          {salesView}
          {ordersView}
          {customersView}
          {cartsView}
          {catalogView}
          {healthView}
          {impactView}
          {paymentsView}
          {cohortsView}
          {geoView}
          {reviewsView}
        </>
      )}
    </div>
  )
}
