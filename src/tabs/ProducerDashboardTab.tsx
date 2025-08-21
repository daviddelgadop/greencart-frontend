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

const asNum = (v: any, d = 0) => (v == null || v === '' || isNaN(Number(v)) ? d : Number(v))
const fmtEur = (n: number) => `${n.toFixed(2)}€`
const fmtDateTime = (s?: string) => (s ? new Date(s).toLocaleString('fr-FR') : '')
const fmtDate = (s?: string) => (s ? new Date(s).toLocaleDateString('fr-FR') : '')

const VerticalTick: React.FC<{
  x?: number;
  y?: number;
  payload?: { value?: string };
}> = ({ x = 0, y = 0, payload }) => {
  const raw = String(payload?.value ?? '')
  const label = raw.length > 18 ? raw.slice(0, 18) + '…' : raw
  return (
    <g transform={`translate(${x},${y})`}>
      <text dy={4} dx={-4} textAnchor="end" transform="rotate(-35)">{label}</text>
    </g>
  )
}

const firstDayOfThisMonth = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
const lastDayOfThisMonth = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}
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

const hasProducerCol = !DASHBOARD_IS_PRODUCER
const cs = (n: number) => n - (hasProducerCol ? 0 : 1)

function productCountFrom(data: any, s: any) {
  return (
    asNum(s?.products?.count) ||
    asNum(data?.summary?.products?.count) ||
    asNum(data?.rows?.products?.count) ||
    asNum(Array.isArray(data?.products) ? data.products.length : 0) ||
    asNum(Array.isArray(data?.rows?.products) ? data.rows.products.length : 0) ||
    asNum(Array.isArray(data?.rows?.products?.data) ? data.rows.products.data.length : 0)
  )
}

export default function ProducerDashboardTab() {
  const { user } = useAuth()

  const [tab, setTab] = useState<SubTab>('sales')
  const [bucket, setBucket] = useState<Bucket>('day')
  const [geoLevel, setGeoLevel] = useState<'region' | 'department' | 'city'>('region')
  const [viewMode, setViewMode] = useState<ViewMode>('both')
  const [limit, setLimit] = useState<number>(50)

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
      if (tab === 'carts') return `${BASE}/carts/abandoned/deep/?granularity=item&${params}`
      if (tab === 'catalog') return `${BASE}/catalog/deep/?${params}`
      if (tab === 'health') return `${BASE}/products/health/?${params}`
      if (tab === 'impact') return `${BASE}/impact/?bucket=${bucket}&${params}`
      if (tab === 'payments') return `${BASE}/payments/deep/?${params}`
      if (tab === 'cohorts') return `${BASE}/cohorts/monthly/?bucket=${bucket}&${params}`
      if (tab === 'geo') return `${BASE}/geo/deep/?level=${geoLevel}&${params}`
      if (tab === 'reviews') return `${BASE}/evaluations/deep/?kind=all&${params}`
      if (tab === 'category') return `${BASE}/cross/certifications-performance/?${params}`
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
      const rowsForCarts: any[] = Array.isArray(data?.rows) ? data.rows : []
      const isItem = rowsForCarts.length > 0 && !!rowsForCarts[0]?.cart_item_id && !Array.isArray(rowsForCarts[0]?.items)
      let totalSomme = 0
      if (isItem) {
        for (const r of rowsForCarts) {
          const qty = asNum(r.quantity, 0)
          const line = r.line_total != null ? asNum(r.line_total) : null
          const unit = line != null ? null : (r.unit_price != null ? asNum(r.unit_price) : null)
          const sum = line != null ? line : (unit != null ? unit * qty : 0)
          totalSomme += sum
        }
      } else {
        for (const r of rowsForCarts) {
          if (r.amount != null && !isNaN(Number(r.amount))) {
            totalSomme += Number(r.amount)
          } else {
            let tmp = 0
            for (const it of Array.isArray(r.items) ? r.items : []) {
              const b = it.bundle || {}
              const qty = asNum(it.quantity, 0)
              const line = it.line_total != null ? Number(it.line_total) : null
              if (line != null && !isNaN(line)) {
                tmp += line
              } else {
                const unit =
                  (it.unit_price != null && !isNaN(Number(it.unit_price)) ? Number(it.unit_price) : null) ??
                  (b.discounted_price != null && !isNaN(Number(b.discounted_price)) ? Number(b.discounted_price) : null) ??
                  (b.price != null && !isNaN(Number(b.price)) ? Number(b.price) : null) ??
                  (b.original_price != null && !isNaN(Number(b.original_price)) ? Number(b.original_price) : null)
                if (unit != null) tmp += unit * qty
              }
            }
            totalSomme += tmp
          }
        }
      }
      cards.push(
        { icon: <ShoppingCart className="w-4 h-4" />, label: 'Paniers actifs', value: String(asNum(s.active_carts)) },
        { icon: <Users className="w-4 h-4" />, label: 'Articles / panier', value: asNum(s.avg_cart_qty).toFixed(1) },
        { icon: <TrendingUp className="w-4 h-4" />, label: 'Somme paniers', value: fmtEur(totalSomme) },
      )
    } else if (tab === 'catalog') {
      const pCount = productCountFrom(data, s)
      const lowStock = asNum(s?.products?.low_stock) || asNum(data?.summary?.products?.low_stock)
      const b = s.bundles || {}
      cards.push(
        { icon: <Layers className="w-4 h-4" />, label: 'Produits', value: String(pCount) },
        { icon: <HeartPulse className="w-4 h-4" />, label: 'Faible stock', value: String(lowStock) },
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
      const s = data?.summary || {}
      const rows: any[] = Array.isArray(data?.rows) ? data.rows : []
      const uniqueOrders = new Set(rows.map(r => r.order_id)).size
      cards.push(
        { icon: <CreditCard className="w-4 h-4" />, label: 'Cmd', value: String(typeof s.orders === 'number' ? s.orders : uniqueOrders) },
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-full min-w-0">
        {cards.map((c, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 max-w-full min-w-0 overflow-hidden">
            <div className="p-2 rounded-lg bg-pale-yellow text-dark-green">{c.icon}</div>
            <div className="min-w-0">
              <div className="text-xs text-gray-500 truncate">{c.label}</div>
              <div className="text-lg font-semibold truncate">{c.value}</div>
            </div>
          </div>
        ))}
      </div>
    )
  }, [data, tab])

  const Toolbar = (
    <div className="flex flex-col gap-2 min-w-0">
      <div className="flex flex-wrap items-center gap-2 min-w-0">
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

  const chartShell = (key: string, children: React.ReactNode, title: string) => (
    <div className="bg-white rounded-lg p-6 shadow-sm relative z-0 isolate max-w-full min-w-0 overflow-hidden">
      <h4 className="text-sm font-semibold text-dark-green mb-3">{title}</h4>
      <div className="w-full h-[300px] md:h-[360px] min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%" key={rcKey(key)}>
          {children as any}
        </ResponsiveContainer>
      </div>
    </div>
  )

  const salesView = useMemo(() => {
    if (tab !== 'sales') return null
    const series: SeriesPoint[] = Array.isArray(data?.series) ? data.series : []
    const rows: any[] = Array.isArray(data?.rows) ? data.rows : []
    const rSeries = rollSeries(series, bucket)

    const chart = chartShell('sales',
      <LineChart data={rSeries} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="period" interval="preserveStartEnd" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend wrapperStyle={{ overflow: 'hidden' }} />
        <Line yAxisId="left" type="monotone" dataKey="revenue" name="CA (€)" stroke="#14532d" strokeWidth={2} dot={false} />
        <Line yAxisId="right" type="monotone" dataKey="orders" name="Cmd" stroke="#4d7c0f" strokeWidth={2} dot={false} />
        <Line yAxisId="right" type="monotone" dataKey="units" name="Unités" stroke="#0e7490" strokeWidth={2} dot={false} />
      </LineChart>,
      'CA / commandes / unités'
    )

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm max-w-full min-w-0 overflow-hidden">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                {hasProducerCol && <th className="px-4 py-2 text-left">Producteur</th>}
                <th className="px-4 py-2 text-left">Commerce</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Utilisateur</th>
                <th className="px-4 py-2 text-left">Commande</th>
                <th className="px-4 py-2 text-left">Item</th>
                <th className="px-4 py-2 text-left">Contenu</th>
                <th className="px-4 py-2 text-right">CA (€)</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, limit).map((r, i) => (
                <tr key={`${r.order_id}-${r.item_id}-${i}`} className="border-b">
                  {hasProducerCol && <td className="px-4 py-2">{r.producer_name ?? (Array.isArray(r.producer_names) ? r.producer_names.join(', ') : '')}</td>}
                  <td className="px-4 py-2">{r.company_name ?? (Array.isArray(r.company_names) ? r.company_names.join(', ') : '')}</td>
                  <td className="px-4 py-2">{fmtDateTime(r.created_at)}</td>
                  <td className="px-4 py-2">{r.user_name ?? r.customer_name ?? r.user ?? r.user_id ?? '—'}</td>
                  <td className="px-4 py-2">{r.order_id}</td>
                  <td className="px-4 py-2">{r.item_id}</td>
                  <td className="px-4 py-2">{`${r.bundle_title ?? r.label ?? '—'} x ${asNum(r.quantity, 1)}`}</td>
                  <td className="px-4 py-2 text-right">{fmtEur(asNum(r.line_total || r.unit_price))}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={cs(7)}>Aucun résultat</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )

    return <div className="space-y-6 max-w-full min-w-0">{viewMode !== 'table' && chart}{viewMode !== 'chart' && table}</div>
  }, [data, bucket, limit, tab, viewMode])

  const ordersView = useMemo(() => {
    if (tab !== 'orders') return null

    const orders: any[] = Array.isArray(data?.rows) ? data.rows : []

    const keyFn =
      bucket === 'week' ? weekKey :
      bucket === 'month' ? monthKey :
      (s: string) => (s || '').slice(0, 10)

    type Agg = { period: string; revenue: number; orders: number; units: number; _seen: Set<number> }
    const chartMap = orders.reduce((acc: Record<string, Agg>, o: any) => {
      const k = keyFn(o.created_at)
      if (!acc[k]) acc[k] = { period: k, revenue: 0, orders: 0, units: 0, _seen: new Set<number>() }

      const orderRevenue = asNum(o.total_price ?? o.subtotal ?? 0)
      const its = Array.isArray(o.items) ? o.items : []
      const orderUnits = its.reduce((sum: number, it: any) => sum + asNum(it.quantity), 0)

      acc[k].revenue += orderRevenue
      acc[k].units += orderUnits
      if (!acc[k]._seen.has(o.id)) {
        acc[k]._seen.add(o.id)
        acc[k].orders += 1
      }
      return acc
    }, {} as Record<string, Agg>)
    const rSeries = Object.values(chartMap).map(({ _seen, ...rest }) => rest)

    const chart = chartShell(
      'orders',
      <LineChart data={rSeries} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="period" interval="preserveStartEnd" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend wrapperStyle={{ overflow: 'hidden' }} />
        <Line yAxisId="left" type="monotone" dataKey="revenue" name="CA (€)" stroke="#14532d" strokeWidth={2} dot={false} />
        <Line yAxisId="right" type="monotone" dataKey="orders" name="Cmd" stroke="#4d7c0f" strokeWidth={2} dot={false} />
        <Line yAxisId="right" type="monotone" dataKey="units" name="Unités" stroke="#0e7490" strokeWidth={2} dot={false} />
      </LineChart>,
      'Commandes / CA / unités'
    )

    const itemRows = orders.flatMap((o: any) => {
      const its = Array.isArray(o.items) ? o.items : []
      return its.map((it: any) => {
        const producerNames = Array.isArray(it.producer_names) && it.producer_names.length
          ? it.producer_names
          : (Array.isArray(o.producer_names) ? o.producer_names : [])
        const companyNames = Array.isArray(it.company_names) && it.company_names.length
          ? it.company_names
          : (Array.isArray(o.company_names) ? o.company_names : [])
        const bundleTitle =
          it?.bundle_snapshot?.title ??
          it?.bundle_title ??
          o?.bundle_title ??
          it?.label ??
          '—'
        const totalPrice = asNum(it.total_price)
        const unitPrice = typeof it.unit_price === 'number'
          ? it.unit_price
          : (totalPrice / Math.max(1, asNum(it.quantity)))

        return {
          order_id: o.id,
          created_at: o.created_at,
          status: o.status,
          user_name: o.user_name ?? o.customer_name ?? o.user ?? o.user_id ?? '—',
          producer_names: producerNames,
          company_names: companyNames,
          item_id: it.item_id ?? it.id,
          quantity: asNum(it.quantity),
          unit_price: unitPrice,
          total_price: totalPrice,
          bundle_title: bundleTitle,
        }
      })
    })

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm max-w-full min-w-0 overflow-hidden">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                {hasProducerCol && <th className="px-4 py-2 text-left">Producteur</th>}
                <th className="px-4 py-2 text-left">Commerce</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Utilisateur</th>
                <th className="px-4 py-2 text-left">Commande</th>
                <th className="px-4 py-2 text-left">Item</th>
                <th className="px-4 py-2 text-left">Contenu</th>
                <th className="px-4 py-2 text-left">Statut</th>
                <th className="px-4 py-2 text-right">CA (€)</th>
              </tr>
            </thead>
            <tbody>
              {itemRows.slice(0, limit).map((r: any) => (
                <tr key={`${r.order_id}-${r.item_id}`} className="border-b">
                  {hasProducerCol && (
                    <td className="px-4 py-2">
                      {Array.isArray(r.producer_names) ? r.producer_names.join(', ') : ''}
                    </td>
                  )}
                  <td className="px-4 py-2">
                    {Array.isArray(r.company_names) ? r.company_names.join(', ') : ''}
                  </td>
                  <td className="px-4 py-2">{fmtDateTime(r.created_at)}</td>
                  <td className="px-4 py-2">{r.user_name}</td>
                  <td className="px-4 py-2">{r.order_id}</td>
                  <td className="px-4 py-2">{r.item_id}</td>
                  <td className="px-4 py-2">
                    {`${r.bundle_title} x ${asNum(r.quantity, 1)}`}
                  </td>
                  <td className="px-4 py-2">{r.status}</td>
                  <td className="px-4 py-2 text-right">{fmtEur(asNum(r.total_price))}</td>
                </tr>
              ))}
              {itemRows.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-6 text-sm text-gray-500"
                    colSpan={hasProducerCol ? 9 : 8}
                  >
                    Aucun résultat
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )

    return (
      <div className="space-y-6 max-w-full min-w-0">
        {viewMode !== 'table' && chart}
        {viewMode !== 'chart' && table}
      </div>
    )
  }, [data, limit, tab, viewMode, bucket, hasProducerCol])

  const customersView = useMemo(() => {
    if (tab !== 'customers') return null
    const items: any[] = Array.isArray(data?.rows) ? data.rows : []

    const keyFn =
      bucket === 'week' ? weekKey :
      bucket === 'month' ? monthKey :
      (s: string) => (s || '').slice(0, 10)

    const firstSeenByUser: Record<string | number, string> = {}
    for (const r of items) {
      const uid = r.user_id ?? r.user ?? r.user_name
      const dt = r.created_at || ''
      if (!uid || !dt) continue
      if (!firstSeenByUser[uid] || dt < firstSeenByUser[uid]) {
        firstSeenByUser[uid] = dt
      }
    }

    const counts: Record<string, number> = {}
    Object.values(firstSeenByUser).forEach((dt) => {
      const k = keyFn(dt)
      counts[k] = (counts[k] || 0) + 1
    })

    const rSeries = Object.keys(counts)
      .sort()
      .map((k) => ({ period: k, new_customers: counts[k] }))

    const chart = chartShell(
      'customers',
      <BarChart data={rSeries} barCategoryGap="15%" margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="period" interval="preserveStartEnd" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend wrapperStyle={{ overflow: 'hidden' }} />
        <Bar
          dataKey="new_customers"
          name="Nvx clients"
          fill="#14532d"
          isAnimationActive={false}
          maxBarSize={36}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>,
      'Nouveaux clients / période'
    )

    const itemRows = items.map((r) => ({
      created_at: r.created_at,
      user_name: r.user_name ?? r.user ?? r.user_id ?? '—',
      order_id: r.order_id,
      item_id: r.order_item_id ?? r.item_id ?? r.id,
      quantity: asNum(r.quantity),
      amount: asNum(r.amount ?? r.total_price ?? r.subtotal ?? 0),
      status: r.order_status ?? r.status ?? '—',
      producer_names: Array.isArray(r.producer_names) ? r.producer_names : [],
      company_names: Array.isArray(r.company_names) ? r.company_names : [],
    }))

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm max-w-full min-w-0 overflow-hidden">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                {hasProducerCol && <th className="px-4 py-2 text-left">Producteur</th>}
                <th className="px-4 py-2 text-left">Commerce</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Utilisateur</th>
                <th className="px-4 py-2 text-left">Commande</th>
                <th className="px-4 py-2 text-left">Item</th>
                <th className="px-4 py-2 text-left">Qté</th>
                <th className="px-4 py-2 text-left">Statut</th>
                <th className="px-4 py-2 text-right">Montant (€)</th>
              </tr>
            </thead>
            <tbody>
              {itemRows.slice(0, limit).map((r: any) => (
                <tr key={`${r.order_id}-${r.item_id}`} className="border-b">
                  {hasProducerCol && (
                    <td className="px-4 py-2">
                      {Array.isArray(r.producer_names) ? r.producer_names.join(', ') : ''}
                    </td>
                  )}
                  <td className="px-4 py-2">
                    {Array.isArray(r.company_names) ? r.company_names.join(', ') : ''}
                  </td>
                  <td className="px-4 py-2">{fmtDateTime(r.created_at)}</td>
                  <td className="px-4 py-2">{r.user_name}</td>
                  <td className="px-4 py-2">{r.order_id}</td>
                  <td className="px-4 py-2">{r.item_id}</td>
                  <td className="px-4 py-2">{asNum(r.quantity, 0)}</td>
                  <td className="px-4 py-2">{r.status}</td>
                  <td className="px-4 py-2 text-right">{fmtEur(asNum(r.amount))}</td>
                </tr>
              ))}
              {itemRows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={hasProducerCol ? 9 : 8}>
                    Aucun résultat
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )

    return (
      <div className="space-y-6 max-w-full min-w-0">
        {viewMode !== 'table' && chart}
        {viewMode !== 'chart' && table}
      </div>
    )
  }, [data, limit, tab, viewMode, bucket, hasProducerCol])

  const cartsView = useMemo(() => {
    if (tab !== 'carts') return null

    const summary = data?.summary || {}
    const rows: any[] = Array.isArray(data?.rows) ? data.rows : []
    const topAbandoned = Array.isArray(summary?.top_abandoned_products) ? summary.top_abandoned_products : []

    const asNumOrNull = (v: any): number | null =>
      v == null || v === '' || isNaN(Number(v)) ? null : Number(v)

    const isItemGranularity =
      rows.length > 0 && !!rows[0]?.cart_item_id && !Array.isArray(rows[0]?.items)

    type Agg = { qty: number; sum: number }
    const aggMap = new Map<string, Agg>()

    if (rows.length > 0) {
      if (isItemGranularity) {
        for (const r of rows) {
          const b = r.bundle || {}
          const qty = asNum(r.quantity, 0)
          const line = r.line_total != null ? asNum(r.line_total) : null
          const unit = line != null ? null : (r.unit_price != null ? asNum(r.unit_price) : null)
          const sum = line != null ? line : (unit != null ? unit * qty : 0)

          const prodTitle =
            Array.isArray(b.products) && b.products[0]?.title
              ? b.products[0].title
              : b.title || '—'

          const a = aggMap.get(prodTitle) || { qty: 0, sum: 0 }
          a.qty += qty
          a.sum += sum
          aggMap.set(prodTitle, a)
        }
      } else {
        for (const r of rows) {
          for (const it of Array.isArray(r.items) ? r.items : []) {
            const b = it.bundle || {}
            const qty = asNum(it.quantity, 0)

            const line = it.line_total != null ? asNumOrNull(it.line_total) : null
            let sum: number
            if (line != null) {
              sum = line
            } else {
              const unit =
                asNumOrNull(it.unit_price) ??
                asNumOrNull(b.discounted_price) ??
                asNumOrNull(b.price) ??
                asNumOrNull(b.original_price) ??
                0
              sum = unit * qty
            }

            const prodTitle =
              Array.isArray(b.products) && b.products[0]?.title
                ? b.products[0].title
                : b.title || '—'

            const a = aggMap.get(prodTitle) || { qty: 0, sum: 0 }
            a.qty += qty
            a.sum += sum
            aggMap.set(prodTitle, a)
          }
        }
      }
    }

    const chartData =
      aggMap.size > 0
        ? Array.from(aggMap.entries()).map(([label, v]) => ({
            label,
            qty: v.qty,
            sum: v.sum,
          }))
        : topAbandoned.map((p: any) => ({
            label: p.label || p.title,
            qty: asNum(p.count || p.units || p.qty || 0),
            sum: 0,
          }))

    const chartBlock =
      chartData.length > 0
        ? chartShell(
            'carts',
            <BarChart data={chartData} barCategoryGap="20%" margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                interval={0}
                height={120}
                tickMargin={10}
                tick={<VerticalTick /> as any}
                tickFormatter={(v: string) => (v.length > 18 ? v.slice(0, 18) + '…' : v)}
              />
              <YAxis yAxisId="left" label={{ value: 'Quantité', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend wrapperStyle={{ overflow: 'hidden' }} />
              <Bar yAxisId="left" dataKey="qty" name="Qty" fill="#14532d" isAnimationActive={false} maxBarSize={36} />
              <Bar yAxisId="right" dataKey="sum" name="Somme (€)" fill="#4d7c0f" isAnimationActive={false} maxBarSize={36} />
            </BarChart>,
            'Produits abandonnés (Qté / €)'
          )
        : null

    const tableRows = isItemGranularity
      ? rows.map((r: any) => {
          const b = r.bundle || {}
          const producerNames = Array.isArray(b.producer_names) ? b.producer_names : []
          const companyNames = Array.isArray(b.company_names) ? b.company_names : []

          const qty = asNum(r.quantity, 0)
          const unitPrice = r.unit_price != null ? asNum(r.unit_price) : null
          const lineTotal =
            r.line_total != null
              ? asNum(r.line_total)
              : unitPrice != null
              ? unitPrice * qty
              : null

          return {
            cart_item_id: r.cart_item_id,
            producer_names: producerNames,
            company_names: companyNames,
            updated_at: r.updated_at ?? r.created_at,
            user_name: r.user_name ?? r.user ?? r.user_id ?? '—',
            cart_id: r.cart_id,
            content: `${b.title ?? '—'} x ${qty}`,
            qty,
            unit_price: unitPrice,
            sum: lineTotal,
          }
        })
      : rows.map((r: any) => {
          const names = new Set<string>()
          const comps = new Set<string>()
          const contents: string[] = []

          let sum: number | null = asNumOrNull(r.amount)

          if (sum == null) {
            let tmp = 0
            for (const it of Array.isArray(r.items) ? r.items : []) {
              const b = it.bundle || {}
              ;(b.producer_names || []).forEach((n: string) => names.add(n))
              ;(b.company_names || []).forEach((n: string) => comps.add(n))
              contents.push(`${b.title ?? '—'} x ${asNum(it.quantity, 0)}`)

              const line = it.line_total != null ? asNumOrNull(it.line_total) : null
              if (line != null) {
                tmp += line
              } else {
                const unit =
                  asNumOrNull(it.unit_price) ??
                  asNumOrNull(b.discounted_price) ??
                  asNumOrNull(b.price) ??
                  asNumOrNull(b.original_price)
                if (unit != null) tmp += unit * asNum(it.quantity, 0)
              }
            }
            sum = isNaN(tmp) ? null : tmp
          }

          return {
            cart_item_id: null,
            producer_names: Array.from(names),
            company_names: Array.from(comps),
            updated_at: r.updated_at,
            user_name: r.user_name ?? r.user ?? r.user_id ?? '—',
            cart_id: r.cart_id,
            content: contents.join(' · '),
            qty: asNum(r.items_qty),
            sum,
          }
        })

    const baseCols = hasProducerCol ? 9 : 8
    const colSpan = isItemGranularity ? baseCols + 1 : baseCols

    const tableBlock = (
      <div className="bg-white rounded-lg p-6 shadow-sm max-w-full min-w-0 overflow-hidden">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                {hasProducerCol && <th className="px-4 py-2 text-left">Producteur</th>}
                <th className="px-4 py-2 text-left">Commerce</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Utilisateur</th>
                <th className="px-4 py-2 text-left">Panier</th>
                <th className="px-4 py-2 text-left">Item</th>
                <th className="px-4 py-2 text-right">Contenu</th>
                <th className="px-4 py-2 text-right">Qté</th>
                {isItemGranularity && <th className="px-4 py-2 text-right">PU (€)</th>}
                <th className="px-4 py-2 text-right">Somme (€)</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.slice(0, limit).map((r: any, i: number) => (
                <tr
                  key={
                    isItemGranularity
                      ? `${r.cart_id}-${r.cart_item_id ?? i}`
                      : `${r.cart_id ?? 'cart'}-${i}`
                  }
                  className="border-b"
                >
                  {hasProducerCol && (
                    <td className="px-4 py-2">
                      {Array.isArray(r.producer_names) ? r.producer_names.join(', ') : ''}
                    </td>
                  )}
                  <td className="px-4 py-2">
                    {Array.isArray(r.company_names) ? r.company_names.join(', ') : ''}
                  </td>
                  <td className="px-4 py-2">{fmtDateTime(r.updated_at)}</td>
                  <td className="px-4 py-2">{r.user_name}</td>
                  <td className="px-4 py-2">{r.cart_id ?? '—'}</td>
                  <td className="px-4 py-2">{r.cart_item_id ?? '—'}</td>
                  <td className="px-4 py-2 text-right">{r.content}</td>
                  <td className="px-4 py-2 text-right">{asNum(r.qty)}</td>
                  {isItemGranularity && (
                    <td className="px-4 py-2 text-right">
                      {r.unit_price != null ? fmtEur(asNum(r.unit_price)) : '—'}
                    </td>
                  )}
                  <td className="px-4 py-2 text-right">
                    {r.sum != null ? fmtEur(asNum(r.sum)) : '—'}
                  </td>
                </tr>
              ))}
              {tableRows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={colSpan}>
                    Aucun résultat
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )

    return (
      <div className="space-y-6 max-w-full min-w-0">
        {viewMode !== 'table' && chartBlock}
        {viewMode !== 'chart' && tableBlock}
      </div>
    )
  }, [data, limit, tab, viewMode, hasProducerCol])

  const catalogView = useMemo(() => {
    if (tab !== 'catalog') return null
    const products: any[] =
      Array.isArray(data?.products) ? data.products
      : Array.isArray(data?.rows?.products) ? data.rows.products
      : Array.isArray(data?.rows?.products?.data) ? data.rows.products.data
      : []

    const chartData = products.map((p: any) => ({ label: p.title || p.name, sold: asNum(p.sold), stock: asNum(p.stock) }))

    const chart = chartShell('catalog',
      <BarChart data={chartData} barCategoryGap="20%" margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          interval={0}
          height={120}
          tickMargin={10}
          tick={<VerticalTick /> as any}
          tickFormatter={(v: string) => (v.length > 18 ? v.slice(0, 18) + '…' : v)}
        />
        <YAxis label={{ value: 'Quantité', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Legend wrapperStyle={{ overflow: 'hidden' }} />
        <Bar dataKey="sold" name="Vendu" fill="#14532d" isAnimationActive={false} maxBarSize={36} />
        <Bar dataKey="stock" name="Stock" fill="#4d7c0f" isAnimationActive={false} maxBarSize={36} />
      </BarChart>,
      'Ventes & stock par produit'
    )

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm max-w-full min-w-0 overflow-hidden">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                {hasProducerCol && <th className="px-4 py-2 text-left">Producteur</th>}
                <th className="px-4 py-2 text-left">Commerce</th>
                <th className="px-4 py-2 text-left">Catégorie</th>
                <th className="px-4 py-2 text-left">Produit</th>
                <th className="px-4 py-2 text-right">Stock</th>
                <th className="px-4 py-2 text-right">Vendu</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, limit).map((p: any, i: number) => (
                <tr key={p.product_id || i} className="border-b">
                  {hasProducerCol && <td className="px-4 py-2">{Array.isArray(p.producer_names) ? p.producer_names.join(', ') : (p.producer_name ?? '')}</td>}
                  <td className="px-4 py-2">{Array.isArray(p.company_names) ? p.company_names.join(', ') : (p.company_name ?? '')}</td>
                  <td className="px-4 py-2">{typeof p.category === 'object' ? (p.category?.name ?? '') : (p.category ?? '')}</td>
                  <td className="px-4 py-2">{p.title || p.name}</td>
                  <td className="px-4 py-2 text-right">{asNum(p.stock)}</td>
                  <td className="px-4 py-2 text-right">{asNum(p.sold)}</td>
                </tr>
              ))}
              {products.length === 0 && <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={cs(6)}>Aucun résultat</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )

    return <div className="space-y-6 max-w-full min-w-0">{viewMode !== 'table' && chart}{viewMode !== 'chart' && table}</div>
  }, [data, limit, tab, viewMode])

  const healthView = useMemo(() => {
    if (tab !== 'health') return null
    const products =
      Array.isArray(data?.rows?.products) ? data.rows.products
      : Array.isArray(data?.rows?.products?.data) ? data.rows.products.data
      : (Array.isArray(data?.products) ? data.products : [])

    const chartData = products.map((p: any) => ({ label: p.title || p.name, sold: asNum(p.sold), stock: asNum(p.stock) }))

    const chart = chartShell('health',
      <BarChart data={chartData} barCategoryGap="20%" margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          interval={0}
          height={120}
          tickMargin={10}
          tick={<VerticalTick /> as any}
          tickFormatter={(v: string) => (v.length > 18 ? v.slice(0, 18) + '…' : v)}
        />
        <YAxis />
        <Tooltip />
        <Legend wrapperStyle={{ overflow: 'hidden' }} />
        <Bar dataKey="stock" name="Stock" fill="#14532d" isAnimationActive={false} maxBarSize={36} />
        <Bar dataKey="sold" name="Vendu" fill="#4d7c0f" isAnimationActive={false} maxBarSize={36} />
      </BarChart>,
      'Santé du catalogue'
    )

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm max-w-full min-w-0 overflow-hidden">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                {hasProducerCol && <th className="px-4 py-2 text-left">Producteur</th>}
                <th className="px-4 py-2 text-left">Commerce</th>
                <th className="px-4 py-2 text-left">Catégorie</th>
                <th className="px-4 py-2 text-left">Produit</th>
                <th className="px-4 py-2 text-right">Stock</th>
                <th className="px-4 py-2 text-right">Vendu</th>
                <th className="px-4 py-2 text-left">Niveau</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, limit).map((p: any, i: number) => {
                const category =
                  typeof p.category === 'object'
                    ? (p.category?.label ?? p.category?.name ?? p.category?.code ?? '')
                    : (p.category ?? '')
                return (
                  <tr key={p.product_id || p.id || i} className="border-b">
                    {hasProducerCol && (
                      <td className="px-4 py-2">
                        {Array.isArray(p.producer_names) ? p.producer_names.join(', ') : (p.producer_name ?? '')}
                      </td>
                    )}
                    <td className="px-4 py-2">
                      {Array.isArray(p.company_names) ? p.company_names.join(', ') : (p.company_name ?? '')}
                    </td>
                    <td className="px-4 py-2">{category}</td>
                    <td className="px-4 py-2">{p.title}</td>
                    <td className="px-4 py-2 text-right">{asNum(p.stock)}</td>
                    <td className="px-4 py-2 text-right">{asNum(p.sold)}</td>
                    <td className="px-4 py-2">{riskWordFR(p.level)}</td>
                  </tr>
                )
              })}
              {products.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={cs(6)}>Aucun résultat</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )

    return <div className="space-y-6 max-w-full min-w-0">{viewMode !== 'table' && chart}{viewMode !== 'chart' && table}</div>
  }, [data, limit, tab, viewMode])

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
    }, {} as Record<string, { period: string; co2: number; waste: number }>)
    const chartArr = Object.values(chartData)

    const chart = chartShell('impact',
      <BarChart data={chartArr} barCategoryGap="20%" margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="period" interval="preserveStartEnd" />
        <YAxis />
        <Tooltip />
        <Legend wrapperStyle={{ overflow: 'hidden' }} />
        <Bar dataKey="co2" name="CO₂ (kg)" fill="#14532d" isAnimationActive={false} maxBarSize={36} />
        <Bar dataKey="waste" name="Gaspillage (kg)" fill="#4d7c0f" isAnimationActive={false} maxBarSize={36} />
      </BarChart>,
      'Impact (CO₂ / déchets évités)'
    )

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm max-w-full min-w-0 overflow-hidden">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
            <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
              {hasProducerCol && <th className="px-4 py-2 text-left">Producteur</th>}
              <th className="px-4 py-2 text-left">Commerce</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Utilisateur</th>
              <th className="px-4 py-2 text-left">Commande</th>
              <th className="px-4 py-2 text-left">Item</th>
              <th className="px-4 py-2 text-left">Produit</th>
              <th className="px-4 py-2 text-right">CO₂ évité (kg)</th>
              <th className="px-4 py-2 text-right">Gaspillage évité (kg)</th>
              <th className="px-4 py-2 text-right">Économies (€)</th>
            </tr>
            </thead>
            <tbody>
            {rows.slice(0, limit).map((r: any, i: number) => (
              <tr key={`${r.order_id}-${r.item_id}-${i}`} className="border-b">
                {hasProducerCol && <td className="px-4 py-2">{r.producer_name ?? (Array.isArray(r.producer_names) ? r.producer_names.join(', ') : '')}</td>}
                <td className="px-4 py-2">{r.company_name ?? (Array.isArray(r.company_names) ? r.company_names.join(', ') : '')}</td>
                <td className="px-4 py-2">{fmtDateTime(r.created_at)}</td>
                <td className="px-4 py-2">{r.user_name ?? r.customer_name ?? r.user ?? r.user_id ?? '—'}</td>
                <td className="px-4 py-2">{r.order_id}</td>
                <td className="px-4 py-2">{r.item_id}</td>
                <td className="px-4 py-2">{r.bundle_title ?? '—'}</td>
                <td className="px-4 py-2 text-right">{asNum(r.avoided_co2_kg).toFixed(2)}</td>
                <td className="px-4 py-2 text-right">{asNum(r.avoided_waste_kg).toFixed(2)}</td>
                <td className="px-4 py-2 text-right">{fmtEur(asNum(r.savings_eur))}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={cs(9)}>Aucun résultat</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )

    return <div className="space-y-6 max-w-full min-w-0">{viewMode !== 'table' && chart}{viewMode !== 'chart' && table}</div>
  }, [data, limit, tab, viewMode, bucket])

  const paymentsView = useMemo(() => {
    if (tab !== 'payments') return null

    const methods: any[] =
      Array.isArray(data?.by_method) ? data.by_method :
      Array.isArray(data?.rows?.by_method) ? data.rows.by_method : []

    const rows: any[] = Array.isArray(data?.rows) ? data.rows : []

    const asNumber = (v: any) => (v == null || Number.isNaN(Number(v)) ? 0 : Number(v))

    const chartData = methods.map(m => ({
      pm: m.method || 'inconnu',
      success_rate: asNumber(m.success_rate) * 100,
      aov: m.count ? (asNumber(m.revenue) / asNumber(m.count)) : 0,
    }))

    const chart = chartShell(
      'payments',
      <BarChart data={chartData} barCategoryGap="20%" margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="pm" />
        <YAxis />
        <Tooltip />
        <Legend wrapperStyle={{ overflow: 'hidden' }} />
        <Bar dataKey="success_rate" name="Succès (%)" fill="#14532d" isAnimationActive={false} maxBarSize={36} />
        <Bar dataKey="aov" name="AOV (€)" fill="#4d7c0f" isAnimationActive={false} maxBarSize={36} />
      </BarChart>,
      'Paiements (taux de succès / AOV)'
    )

    const orderRows: any[] = rows

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm max-w-full min-w-0 overflow-hidden">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                {hasProducerCol && <th className="px-4 py-2 text-left">Producteur</th>}
                <th className="px-4 py-2 text-left">Commerce</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Utilisateur</th>
                <th className="px-4 py-2 text-left">Cmd</th>
                <th className="px-4 py-2 text-left">Item</th>
                <th className="px-4 py-2 text-left">Méthode</th>
                <th className="px-4 py-2 text-right">Montant (€)</th>
              </tr>
            </thead>
            <tbody>
              {orderRows.slice(0, limit).map((r: any, i: number) => (
                <tr key={`${r.order_id}-${r.order_item_id ?? r.item_id ?? '0'}-${i}`} className="border-b">
                  {hasProducerCol && (
                    <td className="px-4 py-2">
                      {Array.isArray(r.producer_names) ? r.producer_names.join(', ') : (r.producer_name ?? '')}
                    </td>
                  )}
                  <td className="px-4 py-2">
                    {Array.isArray(r.company_names) ? r.company_names.join(', ') : (r.company_name ?? '')}
                  </td>
                  <td className="px-4 py-2">{fmtDateTime(r.created_at)}</td>
                  <td className="px-4 py-2">{r.user_name ?? r.customer_name ?? r.user ?? r.user_id ?? '—'}</td>
                  <td className="px-4 py-2">{r.order_id}</td>
                  <td className="px-4 py-2">{r.order_item_id ?? r.item_id ?? '—'}</td>
                  <td className="px-4 py-2">{r.method ?? r.payment_method ?? '—'}</td>
                  <td className="px-4 py-2 text-right">{fmtEur(asNumber(r.amount ?? r.total_price ?? 0))}</td>
                </tr>
              ))}
              {orderRows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={hasProducerCol ? 8 : 7}>Aucun résultat</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )

    return (
      <div className="space-y-6 max-w-full min-w-0">
        {viewMode !== 'table' && chart}
        {viewMode !== 'chart' && table}
      </div>
    )
  }, [data, limit, tab, viewMode])


  const cohortsView = useMemo(() => {
    if (tab !== 'cohorts') return null
    const items: any[] = Array.isArray(data?.rows_company) ? data.rows_company : (Array.isArray(data?.rows) ? data.rows : [])

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm max-w-full min-w-0 overflow-hidden">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                {hasProducerCol && <th className="px-4 py-2 text-left">Producteur</th>}
                <th className="px-4 py-2 text-left">Commerce</th>
                <th className="px-4 py-2 text-left">Cohorte</th>
                <th className="px-4 py-2 text-left">Offsets</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, limit).map((r: any, i: number) => (
                <tr key={`${r.company_id ?? r.user_id ?? i}`} className="border-b">
                  {hasProducerCol && <td className="px-4 py-2">{r.producer_name ?? '—'}</td>}
                  <td className="px-4 py-2">{r.company_name ?? '—'}</td>
                  <td className="px-4 py-2">{r.cohort_month}</td>
                  <td className="px-4 py-2">
                    {(r.periods || []).map((p: any) => `+${p.offset}: ${p.orders} cmd / ${fmtEur(asNum(p.revenue))}`).join(' · ')}
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={cs(4)}>Aucun résultat</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )
    return <div className="space-y-6 max-w-full min-w-0">{table}</div>
  }, [data, limit, tab])




  const geoView = useMemo(() => {
    if (tab !== 'geo') return null
    const byZone = Array.isArray(data?.by_zone) ? data.by_zone : []
    const items = Array.isArray(data?.rows) ? data.rows : []
    const chartData = byZone.map((z: any) => ({
      zone: z.zone_desc || z.zone,
      revenue: asNum(z.revenue),
      orders: asNum(z.orders)
    }))

    const chart = chartShell('geo',
      <BarChart data={chartData} barCategoryGap="20%" margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="zone" label={{ value: 'Zone', position: 'insideBottom', offset: -5 }} />
        <YAxis label={{ value: 'Valeur', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Legend wrapperStyle={{ overflow: 'hidden' }} />
        <Bar dataKey="revenue" name="CA (€)" fill="#14532d" isAnimationActive={false} maxBarSize={36} />
        <Bar dataKey="orders" name="Cmd" fill="#4d7c0f" isAnimationActive={false} maxBarSize={36} />
      </BarChart>,
      'CA par zone'
    )

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm max-w-full min-w-0 overflow-hidden">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
            <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
              {hasProducerCol && <th className="px-4 py-2 text-left">Producteur</th>}
              <th className="px-4 py-2 text-left">Commerce</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Utilisateur</th>
              <th className="px-4 py-2 text-left">Commande</th>
              <th className="px-4 py-2 text-left">Item</th>
              <th className="px-4 py-2 text-left">Zone</th>
              <th className="px-4 py-2 text-right">Montant (€)</th>
            </tr>
            </thead>
            <tbody>
            {items.slice(0, limit).map((r: any, i: number) => (
              <tr key={`${r.order_id}-${r.order_item_id}-${i}`} className="border-b">
                {hasProducerCol && <td className="px-4 py-2">{r.producer_name ?? (Array.isArray(r.producer_names) ? r.producer_names.join(', ') : '')}</td>}
                <td className="px-4 py-2">{r.company_name ?? (Array.isArray(r.company_names) ? r.company_names.join(', ') : '')}</td>
                <td className="px-4 py-2">{fmtDateTime(r.created_at)}</td>
                <td className="px-4 py-2">{r.user_name}</td>
                <td className="px-4 py-2">{r.order_id}</td>
                <td className="px-4 py-2">{r.order_item_id ?? '—'}</td>
                <td className="px-4 py-2">{r.zone_desc ?? r.zone}</td>
                <td className="px-4 py-2 text-right">{fmtEur(asNum(r.revenue_share ?? r.line_total ?? 0))}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={cs(6)}>Aucun résultat</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )

    return <div className="space-y-6 max-w-full min-w-0">{viewMode !== 'table' && chart}{viewMode !== 'chart' && table}</div>
  }, [data, limit, tab, viewMode, geoLevel])



  const reviewsView = useMemo(() => {
    if (tab !== 'reviews') return null
    const rows: any[] = Array.isArray(data?.rows) ? data.rows : []
    const distI = data?.summary?.distribution_items || {}
    const distO = data?.summary?.distribution_orders || {}

    const toBars = (d: Record<string, number>) => Object.keys(d).sort().map(k => ({ rating: k, count: asNum(d[k]) }))

    const chart = (
      <div className="bg-white rounded-lg p-6 shadow-sm relative z-0 max-w-full min-w-0 overflow-hidden">
        <h4 className="text-sm font-semibold text-dark-green mb-3">Répartition des notes</h4>
        <div className="space-y-6">
          <div className="w-full h-[260px] min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%" key={rcKey('reviews-items')}>
              <BarChart data={toBars(distI)} barCategoryGap="20%" margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip />
                <Legend wrapperStyle={{ overflow: 'hidden' }} />
                <Bar dataKey="count" name="Articles" fill="#14532d" isAnimationActive={false} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full h-[260px] min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%" key={rcKey('reviews-orders')}>
              <BarChart data={toBars(distO)} barCategoryGap="20%" margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip />
                <Legend wrapperStyle={{ overflow: 'hidden' }} />
                <Bar dataKey="count" name="Commandes" fill="#4d7c0f" isAnimationActive={false} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    )

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm max-w-full min-w-0 overflow-hidden">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
            <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
              {hasProducerCol && <th className="px-4 py-2 text-left">Producteur</th>}
              <th className="px-4 py-2 text-left">Commerce</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Commande</th>
              <th className="px-4 py-2 text-left">Item</th>
              <th className="px-4 py-2 text-left">Bundle / Titre</th>
              <th className="px-4 py-2 text-left">Note</th>
            </tr>
            </thead>
            <tbody>
            {rows.slice(0, limit).map((r: any, i: number) => (
              <tr key={`${r.type}-${r.order_id ?? '0'}-${r.item_id ?? '0'}-${i}`} className="border-b">
                {hasProducerCol && <td className="px-4 py-2">{r.producer_name ?? (Array.isArray(r.producer_names) ? r.producer_names.join(', ') : '')}</td>}
                <td className="px-4 py-2">{r.company_name ?? (Array.isArray(r.company_names) ? r.company_names.join(', ') : '')}</td>
                <td className="px-4 py-2">{fmtDateTime(r.rated_at ?? r.created_at)}</td>
                <td className="px-4 py-2">{r.type}</td>
                <td className="px-4 py-2">{r.order_id ?? '—'}</td>
                <td className="px-4 py-2">{r.item_id ?? '—'}</td>
                <td className="px-4 py-2">{r.bundle_title ?? r.title ?? '—'}</td>
                <td className="px-4 py-2">{r.rating ?? r.customer_rating ?? '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={cs(8)}>Aucun résultat</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )

    return <div className="space-y-6 max-w-full min-w-0">{viewMode !== 'table' && chart}{viewMode !== 'chart' && table}</div>
  }, [data, limit, tab, viewMode, bucket])

  return (
    <div className="space-y-6 isolate">
      <div className="flex flex-wrap gap-2 sticky top-0 z-30 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b py-2">
        <div className="flex gap-2">
          <button onClick={() => setTab('sales')} className={`px-3 py-1 rounded-full border ${tab === 'sales' ? 'bg-dark-green text-white' : 'bg-white'}`}>Ventes</button>
          <button onClick={() => setTab('orders')} className={`px-3 py-1 rounded-full border ${tab === 'orders' ? 'bg-dark-green text-white' : 'bg-white'}`}>Commandes</button>
          <button onClick={() => setTab('customers')} className={`px-3 py-1 rounded-full border ${tab === 'customers' ? 'bg-dark-green text-white' : 'bg-white'}`}>Utilisateurs</button>
          <button onClick={() => setTab('carts')} className={`px-3 py-1 rounded-full border ${tab === 'carts' ? 'bg-dark-green text-white' : 'bg-white'}`}>Paniers</button>
          <button onClick={() => setTab('catalog')} className={`px-3 py-1 rounded-full border ${tab === 'catalog' ? 'bg-dark-green text-white' : 'bg-white'}`}>Catalogue</button>
          <button onClick={() => setTab('health')} className={`px-3 py-1 rounded-full border ${tab === 'health' ? 'bg-dark-green text-white' : 'bg-white'}`}>Santé</button>
          <button onClick={() => setTab('impact')} className={`px-3 py-1 rounded-full border ${tab === 'impact' ? 'bg-dark-green text-white' : 'bg-white'}`}>Impact</button>
        </div>

        <div className="flex gap-2 w-full">
          <button onClick={() => setTab('payments')} className={`px-3 py-1 rounded-full border ${tab === 'payments' ? 'bg-dark-green text-white' : 'bg-white'}`}>Paiements</button>
          <button onClick={() => setTab('cohorts')} className={`px-3 py-1 rounded-full border ${tab === 'cohorts' ? 'bg-dark-green text-white' : 'bg-white'}`}>Cohortes</button>
          <button onClick={() => setTab('geo')} className={`px-3 py-1 rounded-full border ${tab === 'geo' ? 'bg-dark-green text-white' : 'bg-white'}`}>Géo</button>
          <button onClick={() => setTab('reviews')} className={`px-3 py-1 rounded-full border ${tab === 'reviews' ? 'bg-dark-green text-white' : 'bg-white'}`}>Évaluations</button>
        </div>
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
