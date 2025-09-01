import React, { useEffect, useMemo, useRef, useState } from 'react'
import { http } from '../lib/api'
import {
  TrendingUp, Receipt, Users, ShoppingCart, Layers, HeartPulse, Leaf,
  BarChart3, CreditCard, CalendarRange, MapPin, Star, PieChart, 
  Table as TableIcon, LineChart as LineChartIcon, Layout as BothIcon,
  Download
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  Label, ScatterChart, Scatter
} from 'recharts'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import FranceRegionsMap from '../components/FranceRegionsMap'


type AngleTickProps = {
  x?: number
  y?: number
  payload?: { value?: string }
  angle: number
  maxChars?: number
  fontSize?: number
  fill?: string
}



type SubTab =
  | 'sales' | 'orders' | 'customers' | 'carts' | 'catalog'
  | 'health' | 'impact' | 'category' | 'payments' | 'cohorts' | 'geo' | 'reviews'

type Bucket = 'day' | 'week' | 'month'
type ViewMode = 'table' | 'chart' | 'both'

const DASHBOARD_IS_ADMIN = import.meta.env.VITE_DASHBOARD_ADMIN === 'true'
const BASE = DASHBOARD_IS_ADMIN ? '/api/admin/analytics' : '/api/producer/analytics'


const asNum = (v: any, d = 0) => (v == null || v === '' || isNaN(Number(v)) ? d : Number(v))
const fmtEur = (n: number) => `${n.toFixed(2)}€`
const fmtDateTime = (s?: string) => (s ? new Date(s).toLocaleString('fr-FR') : '')
const fmtDate = (s?: string) => (s ? new Date(s).toLocaleDateString('fr-FR') : '')

function buildDaySeriesFromRows(rows: any[]): SeriesPoint[] {
  const by: Record<string, { revenue: number; orders: Set<number>; units: number }> = {}

  for (const r of rows || []) {
    const k = localDateKey(r.created_at)
    if (!k) continue
    if (!by[k]) by[k] = { revenue: 0, orders: new Set<number>(), units: 0 }
    by[k].revenue += asNum(r.line_total)
    by[k].units += asNum(r.quantity)
    if (r.order_id != null) by[k].orders.add(Number(r.order_id))
  }

  return Object.keys(by)
    .sort()
    .map(k => ({
      period: k,     
      date: k,
      revenue: by[k].revenue,
      orders: by[k].orders.size,
      units: by[k].units,
    }))
}


const toYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const localDateKey = (s?: string) => (s ? toYMD(new Date(s)) : '')

const localDateTimeKey = (s?: string) => (s ? new Date(s).toLocaleString('fr-FR') : '')

const weekKeyLocal = (s: string) => {
  const d = new Date(s)  
  const day = d.getDay() === 0 ? 7 : d.getDay()
  const th = new Date(d)
  th.setDate(d.getDate() + (4 - day))
  const yearStart = new Date(th.getFullYear(), 0, 1)
  const diffDays = Math.floor((+th - +yearStart) / 86400000) + 1
  const weekNo = Math.ceil(diffDays / 7)
  return `${th.getFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

const monthKeyLocal = (s?: string) => {
  if (!s) return ''
  const d = new Date(s) // local time (Europe/Paris)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
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


{/*
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
*/}


type SeriesPoint = { period: string; date?: string; revenue?: number; orders?: number; units?: number }


function rollSeries(series: SeriesPoint[], bucket: Bucket): SeriesPoint[] {
  if (!Array.isArray(series)) return []
  if (bucket === 'day') return series.map(p => ({ ...p, period: p.date || p.period }))
  const group = new Map<string, { revenue: number; orders: number; units: number }>()
  const keyFn = bucket === 'week' ? weekKeyLocal : monthKeyLocal  
  for (const p of series) {
    const key = keyFn(p.date || p.period)
    const g = group.get(key) || { revenue: 0, orders: 0, units: 0 }
    g.revenue += asNum(p.revenue)
    g.orders  += asNum(p.orders)
    g.units   += asNum(p.units)
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

const hasProducerCol = ! DASHBOARD_IS_ADMIN
const cs = (n: number) => n - (hasProducerCol ? 0 : 1)


/* ---------- Generic tick renderer with adjustable angle ---------- */
const AngleTick: React.FC<AngleTickProps> = ({
  x = 0,
  y = 0,
  payload,
  angle,
  maxChars = 18,
  fontSize = 12,
  fill = '#333',
}) => {
  const raw = String(payload?.value ?? '')
  const label = raw.length > maxChars ? raw.slice(0, maxChars) + '…' : raw
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        dy={4}
        dx={-4}
        textAnchor="end"
        transform={`rotate(${angle})`}
        fontSize={fontSize}
        fill={fill}
      >
        {label}
      </text>
    </g>
  )
}

/* ---------- Multi-select header dropdown ---------- */
type MultiFilterState = Record<string, Set<string>>
function useMultiFilters() {
  const [filters, setFilters] = useState<MultiFilterState>({})
  const toggle = (col: string, value: string) => {
    setFilters(prev => {
      const next = new Set(prev[col] ?? [])
      if (next.has(value)) next.delete(value); else next.add(value)
      return { ...prev, [col]: next }
    })
  }
  const clearCol = (col: string) => setFilters(prev => {
    const copy = { ...prev }; delete copy[col]; return copy
  })
  const clearAll = () => setFilters({})
  return { filters, toggle, clearCol, clearAll, setFilters }
}


const HeaderFilter: React.FC<{
  title: string
  values: string[]
  colKey: string
  state: ReturnType<typeof useMultiFilters>
}> = ({ title, values, colKey, state }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = state.filters[colKey] ?? new Set<string>()
  const allChecked = values.length > 0 && values.every(v => selected.has(v))
  const someChecked = !allChecked && values.some(v => selected.has(v))

  useEffect(() => {
    if (!open) return
    const onDocPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const onScroll = (e: Event) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }

    document.addEventListener('pointerdown', onDocPointerDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)

    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v) }}
        className="inline-flex items-center gap-1 font-semibold hover:underline select-none"
        title="Filter"
      >
        {title}
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${selected.size ? 'bg-emerald-600' : 'bg-gray-300'}`} />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-2 w-64 max-h-72 overflow-auto rounded-md border bg-white shadow-lg"
          onPointerDownCapture={(e) => e.stopPropagation()}
        >
          <div className="p-2 flex items-center justify-between">
            <span className="text-xs text-gray-600">Select values</span>
            <div className="flex items-center gap-2">
              <button
                className="text-xs text-emerald-700 hover:underline"
                onClick={() => {
                  state.setFilters(prev => ({ ...prev, [colKey]: new Set(values) }))
                  setOpen(true)
                }}
              >
                All
              </button>
              <button
                className="text-xs text-gray-700 hover:underline"
                onClick={() => { state.clearCol(colKey); setOpen(true) }}
              >
                None
              </button>
            </div>
          </div>

          <div className="px-2 pb-2 space-y-1">
            <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50">
              <input
                type="checkbox"
                checked={allChecked}
                ref={el => { if (el) el.indeterminate = someChecked }}
                onChange={() => {
                  if (allChecked) state.clearCol(colKey)
                  else state.setFilters(prev => ({ ...prev, [colKey]: new Set(values) }))
                  setOpen(true)
                }}
              />
              <span className="text-sm font-medium">All</span>
            </label>

            <div className="max-h-56 overflow-auto pr-1">
              {values.map(v => (
                <label key={v} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selected.has(v)}
                    onChange={() => { state.toggle(colKey, v); setOpen(true) }}
                  />
                  <span className="text-sm">{v || '—'}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const rowCompanyNames = (r: any): string[] => {
  if (Array.isArray(r?.company_names)) {
    return r.company_names.map((s: any) => String(s).trim()).filter(Boolean)
  }
  if (r?.company_name != null) {
    return [String(r.company_name).trim()].filter(Boolean)
  }
  return []
}



// Helper: filter array of rows by the selected commerce (client-side)
const filterRowsByCommerce = (rows: any[], commerce: string): any[] => {
  const sel = String(commerce || '').trim()
  if (!sel) return rows
  return rows.filter((r: any) => rowCompanyNames(r).includes(sel))
}



/* ---------- PDF helpers ---------- */
function summarizeFilters(filters: MultiFilterState, displayNames: Record<string, string>) {
  const parts: string[] = []
  Object.keys(filters).forEach(k => {
    const vals = Array.from(filters[k] ?? [])
    if (vals.length) parts.push(`${displayNames[k] ?? k}: ${vals.join(', ')}`)
  })
  return parts.join(' • ')
}

export default function AdminDashboardTab() {
  const { user } = useAuth()

  const [tab, setTab] = useState<SubTab>('sales')
  const [bucket, setBucket] = useState<Bucket>('day')
  const [geoLevel, setGeoLevel] = useState<'region' | 'department' | 'city'>('region')
  const [viewMode, setViewMode] = useState<ViewMode>('both')
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)


  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1, 1) 
    return toISO(d)
  })
  const [dateTo, setDateTo] = useState<string>(toISO(lastDayOfThisMonth()))

  const [commerce, setCommerce] = useState<string>('')

  const [tableFontPx, setTableFontPx] = useState<number>(12)
  const [xTickAngle, setXTickAngle] = useState<number>(-35)

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const companyOptions = useMemo<string[]>(() => {
    const seen = new Set<string>()
    const out: string[] = []

    const put = (raw: unknown) => {
      if (typeof raw !== 'string') return
      const name = raw.trim()
      if (!name) return
      const key = name.toLocaleLowerCase('fr') // dedupe case-insensitive
      if (!seen.has(key)) {
        seen.add(key)
        out.push(name)
      }
    }

    const putMany = (arr: unknown) => {
      if (Array.isArray(arr)) {
        for (const el of arr) put(el)
      } else if (typeof arr === 'string') {
        for (const el of arr.split(',')) put(el)
      }
    }

    const rows = Array.isArray(data?.rows) ? data.rows : []
    for (const r of rows) {
      put(r?.company_name)
      putMany(r?.company_names)
    }

    const rowsCompany = Array.isArray((data as any)?.rows_company) ? (data as any).rows_company : []
    for (const r of rowsCompany) {
      put(r?.company_name)
      putMany(r?.company_names)
    }

    const products =
      Array.isArray((data as any)?.products) ? (data as any).products :
      Array.isArray((data as any)?.rows?.products) ? (data as any).rows.products :
      Array.isArray((data as any)?.rows?.products?.data) ? (data as any).rows.products.data :
      []

    for (const p of products) {
      put(p?.company_name)
      putMany(p?.company_names)
    }

    return out.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))
  }, [data])


  const firstLoad = useRef(true)
  const rcKey = (k: string) =>
  `${k}-${bucket}-${dateFrom}-${dateTo}-${geoLevel}-${xTickAngle}-${commerce || 'all'}`

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
    if (dateTo)   q.set('date_to', dateTo)
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


  /* ---------- Summary cards ---------- */
  const SummaryCards = useMemo(() => {
    const s = data?.summary || {}
    const cards: Array<{ icon: React.ReactNode; label: string; value: string }> = []
    const selected = String(commerce || '').trim()

    const asNumber = (v: any, d = 0) => (v == null || Number.isNaN(Number(v)) ? d : Number(v))
    const companyList = (v: any): string[] =>
      Array.isArray(v) ? v.map((x: any) => String(x).trim()).filter(Boolean) : (v != null ? [String(v).trim()] : [])
    const rowCompanyNames = (r: any): string[] =>
      r ? (Array.isArray(r.company_names) ? companyList(r.company_names) : companyList(r.company_name)) : []
    const hasSelected = (names: string[]) => (!selected ? true : names.includes(selected))

    if (tab === 'sales') {
      const rowsRaw: any[] = Array.isArray(data?.rows) ? data.rows : []
      const rows = !selected ? rowsRaw : rowsRaw.filter(r => hasSelected(rowCompanyNames(r)))
      const totalUnits = rows.reduce((a, r) => a + asNumber(r.quantity), 0)
      const revenueFromRows = rows.reduce((a, r) => {
        const line = r.line_total
        if (line != null && !Number.isNaN(Number(line))) return a + Number(line)
        const q = asNumber(r.quantity, 1)
        const pu = asNumber(r.unit_price, 0)
        return a + pu * q
      }, 0)
      const uniqueOrders = new Set(rows.map(r => r.order_id).filter(v => v != null)).size
      const aovFromRows = uniqueOrders ? (revenueFromRows / uniqueOrders) : 0
      const aivFromRows = totalUnits ? (revenueFromRows / totalUnits) : 0
      cards.push(
        { icon: <TrendingUp className="w-4 h-4" />, label: 'CA', value: fmtEur(revenueFromRows) },
        { icon: <Layers className="w-4 h-4" />,    label: 'Total produits vendus', value: String(totalUnits) },
        { icon: <BarChart3 className="w-4 h-4" />, label: 'AIV (Prix de vente moyen)', value: fmtEur(aivFromRows) },
      )

    } else if (tab === 'orders') {
      const ordersRaw: any[] = Array.isArray(data?.rows) ? data.rows : []
      const ordersFiltered = !selected ? ordersRaw : ordersRaw.map(o => {
        const its = Array.isArray(o.items) ? o.items : []
        const itsF = its.filter((it: any) => {
          const names = companyList(it?.company_names) || companyList(o?.company_names)
          return hasSelected(names)
        })
        return { ...o, items: itsF }
      }).filter(o => Array.isArray(o.items) && o.items.length > 0)

      const withItems = ordersFiltered.filter(o => Array.isArray(o.items) && o.items.length > 0)
      const ordersCount = new Set(withItems.map(o => o.id ?? o.order_id ?? o.order_code)).size
      const caGoods = withItems.reduce((acc, o) => {
        const sumItems = o.items.reduce((s: number, it: any) => {
          const q = asNumber(it.quantity, 0)
          const line = asNumber(it.total_price ?? 0)
          const unit = line ? 0 : asNumber(it.unit_price ?? 0)
          return s + (line || unit * q)
        }, 0)
        return acc + sumItems
      }, 0)
      const aovGoods = ordersCount ? (caGoods / ordersCount) : 0
      cards.push(
        { icon: <TrendingUp className="w-4 h-4" />, label: 'CA', value: fmtEur(caGoods) },
        { icon: <Receipt className="w-4 h-4" />,    label: 'Commandes', value: String(ordersCount) },
        { icon: <BarChart3 className="w-4 h-4" />,  label: 'AOV (Panier moyen)', value: fmtEur(aovGoods) },
        { icon: <Leaf className="w-4 h-4" />,       label: 'Livrées', value: String(asNumber(data?.summary?.by_status?.delivered)) },
      )

    } else if (tab === 'customers') {
      const asNumber = (v: any, d = 0) => (v == null || Number.isNaN(Number(v)) ? d : Number(v))
      const toStr = (v: any) => (v == null ? '' : String(v).trim())
      const list = (x: any) => (Array.isArray(x) ? x.map(toStr).filter(Boolean) : (x != null ? [toStr(x)] : []))
      const rowCompanyNames = (r: any): string[] => list(r?.company_names ?? r?.company_name)

      const s = data?.summary || {}
      const rowsAll: any[] = Array.isArray(data?.rows) ? data.rows : []
      const sel = toStr(commerce || '')
      const rows = sel ? rowsAll.filter(r => rowCompanyNames(r).includes(sel)) : rowsAll

      const revenue = rows.reduce((acc, r) => {
        const a = r.amount
        const tp = r.total_price
        const st = r.subtotal
        if (a != null && !Number.isNaN(Number(a))) return acc + Number(a)
        if (tp != null && !Number.isNaN(Number(tp))) return acc + Number(tp)
        if (st != null && !Number.isNaN(Number(st))) return acc + Number(st)
        const q = asNumber(r.quantity, 0)
        const pu = asNumber(r.unit_price, 0)
        return acc + q * pu
      }, 0)

      const orders = new Set(
        rows.map(r => r.order_id ?? r.order_code ?? r.order?.order_code).filter(v => v != null)
      ).size

      const customersCount = new Set(
        rows.map(r => r.user_id ?? r.user ?? r.user_name).filter(Boolean)
      ).size

      const totalCustomersAll = asNumber(s.total_customers_all ?? 0)      // from summary
      const totalProducersAll = asNumber(s.total_producers_all ?? 0)      // from summary
      const customerShare = totalCustomersAll > 0 ? (customersCount / totalCustomersAll) * 100 : 0

      cards.push(
        //{ icon: <TrendingUp className="w-4 h-4" />, label: 'CA', value: fmtEur(revenue) },
        //{ icon: <Receipt className="w-4 h-4" />,    label: 'Commandes', value: String(orders) },
        { icon: <Users className="w-4 h-4" />,      label: 'Clients', value: String(customersCount) },
        { icon: <Users className="w-4 h-4" />,      label: 'Utilisateurs existants', value: String(totalCustomersAll) },
        { icon: <Users className="w-4 h-4" />,      label: 'Producteurs existants', value: String(totalProducersAll) },
        { icon: <PieChart className="w-4 h-4" />,   label: 'Part de Clients', value: `${customerShare.toFixed(1)}%` },
      )


    } else if (tab === 'carts') {
      const rowsRaw: any[] = Array.isArray(data?.rows) ? data.rows : []
      const isItemGranularity = rowsRaw.length > 0 && !!rowsRaw[0]?.cart_item_id && !Array.isArray(rowsRaw[0]?.items)
      const rows = !selected ? rowsRaw : (
        isItemGranularity
          ? rowsRaw.filter(r => hasSelected(companyList(r?.bundle?.company_names)))
          : rowsRaw.filter(r => (Array.isArray(r.items) ? r.items : []).some((it: any) => hasSelected(companyList(it?.bundle?.company_names))))
      )
      let qty = 0, sum = 0
      if (isItemGranularity) {
        for (const r of rows) {
          const q = asNumber(r.quantity, 0)
          const line = r.line_total != null ? asNumber(r.line_total) : null
          const unit = line != null ? null : (r.unit_price != null ? asNumber(r.unit_price) : null)
          const lineSum = line != null ? line : (unit != null ? unit * q : 0)
          qty += q; sum += lineSum
        }
      } else {
        for (const r of rows) {
          let orderQty = 0, orderSum = asNumber(r.amount, NaN)
          for (const it of Array.isArray(r.items) ? r.items : []) {
            const q = asNumber(it.quantity, 0); orderQty += q
            const line = it.line_total != null ? asNumber(it.line_total) : null
            const unit = line != null ? null : (it.unit_price != null ? asNumber(it.unit_price) : null)
            const lineSum = line != null ? line : (unit != null ? unit * q : 0)
            if (isNaN(orderSum)) orderSum = 0
            orderSum += lineSum
          }
          qty += orderQty; sum += (isNaN(orderSum) ? 0 : orderSum)
        }
      }
      cards.push(
        { icon: <ShoppingCart className="w-4 h-4" />, label: 'Qté produits abandonnés', value: String(qty) },
        { icon: <TrendingUp className="w-4 h-4" />,   label: 'Somme abandonnée',       value: fmtEur(sum) },
      )

    } else if (tab === 'catalog') {
      const products: any[] =
        Array.isArray(data?.products) ? data.products
        : Array.isArray(data?.rows?.products) ? data.rows.products
        : Array.isArray(data?.rows?.products?.data) ? data.rows.products.data
        : []
      const ids = new Set(products.map(p => p.id ?? (p.code ?? (p.title ?? p.name))))
      cards.push({ icon: <Layers className="w-4 h-4" />, label: 'Types de produits (distincts)', value: String(ids.size) })

    } else if (tab === 'health') {
      const hs = data?.summary || {}
      const zero = asNumber(hs?.products?.zero_stock)
      const low  = asNumber(hs?.products?.low_stock)
      const dlcR = asNumber(hs?.dlc_en_risque)
      cards.push(
        { icon: <Layers className="w-4 h-4" />, label: 'Produits à zéro stock', value: String(zero) },
        { icon: <Layers className="w-4 h-4" />, label: 'Produits en stock bas',  value: String(low) },
        { icon: <Leaf className="w-4 h-4" />,   label: 'DLC en risque',          value: String(dlcR) },
      )

    } else if (tab === 'impact') {
      const rowsRaw: any[] = Array.isArray(data?.rows) ? data.rows : []
      const rows = !selected ? rowsRaw : rowsRaw.filter(r => hasSelected(rowCompanyNames(r)))
      const totalCO2   = rows.reduce((t, r) => t + asNumber(r.avoided_co2_kg), 0)
      const totalWaste = rows.reduce((t, r) => t + asNumber(r.avoided_waste_kg), 0)
      cards.push(
        { icon: <Leaf className="w-4 h-4" />, label: 'Total CO₂ (kg)',         value: totalCO2.toFixed(2) },
        { icon: <Leaf className="w-4 h-4" />, label: 'Total gaspillage (kg)',  value: totalWaste.toFixed(2) },
      )

    } else if (tab === 'payments') {
      const rowsRaw: any[] = Array.isArray(data?.rows) ? data.rows : []
      const rows = !selected ? rowsRaw : rowsRaw.filter(r => hasSelected(rowCompanyNames(r)))

      const pmAgg = (() => {
        const map = new Map<string, { count: number; success: number }>()
        for (const r of rows) {
          const pm = String(r.method ?? r.payment_method ?? '—')
          const a = map.get(pm) || { count: 0, success: 0 }
          a.count += 1
          const status = String(r.payment_status ?? r.status ?? '').toLowerCase()
          const paid = r.paid === true || r.success === true || ['paid','succeeded','success','completed'].includes(status)
          if (paid) a.success += 1
          map.set(pm, a)
        }
        return Array.from(map.values()).reduce(
          (acc, v) => ({ count: acc.count + v.count, success: acc.success + v.success }),
          { count: 0, success: 0 }
        )
      })()

      const methodsServer: any[] =
        Array.isArray(data?.by_method) ? data.by_method
        : Array.isArray(data?.rows?.by_method) ? data.rows.by_method : []

      const nb = selected
        ? new Set(rows.map(r => String(r.method ?? r.payment_method ?? '—'))).size
        : new Set(methodsServer.map(m => (m.method ?? m.pm ?? 'inconnu'))).size

      const avgSuccess = selected
        ? (pmAgg.count ? (pmAgg.success / pmAgg.count) * 100 : 0)
        : (methodsServer.length
            ? (methodsServer.reduce((a, m) => a + (asNumber(m.success_rate) * 100), 0) / methodsServer.length)
            : 0)

      cards.push(
        { icon: <CreditCard className="w-4 h-4" />, label: 'Méthodes de paiement', value: String(nb) },
        { icon: <BarChart3 className="w-4 h-4" />,  label: 'Taux moyen de succès', value: `${avgSuccess.toFixed(1)}%` },
      )

    } else if (tab === 'reviews') {
      const rowsRaw: any[] = Array.isArray(data?.rows) ? data.rows : []
      const rows = !selected ? rowsRaw : rowsRaw.filter(r => hasSelected(rowCompanyNames(r)))
      const itemRows  = rows.filter(r => String(r.type).trim().toLowerCase() === 'item')
      const orderRows = rows.filter(r => {
        const t = String(r.type).trim().toLowerCase()
        return t === 'order' || t === 'commande'
      })

      const sumVals = (obj: Record<string, any> | undefined) =>
        Object.values(obj || {}).reduce((acc, v) => acc + asNumber(v), 0)

      const distI = s.distribution_items  || {}
      const distO = s.distribution_orders || {}

      const evalsItems  =
        (asNumber(s.item_ratings_count)  > 0 && !selected ? asNumber(s.item_ratings_count)  : (sumVals(distI) || itemRows.length))

      const evalsOrders =
        (asNumber(s.order_ratings_count) > 0 && !selected ? asNumber(s.order_ratings_count) : (sumVals(distO) || orderRows.length))

      const uniq = (arr: any[]) => new Set(arr.filter(v => v != null)).size

      const totalCmds =
        (!selected && (asNumber(s.orders_total) || asNumber(s.total_cmds) || asNumber(s.orders?.count) || asNumber(s.orders_count) || asNumber(s.total_orders) || asNumber(s.orders)))
        || uniq(rows.map(r => r.order_id))

      const totalIts =
        (!selected && (asNumber(s.items_units_total) || asNumber(s.items_total) || asNumber(s.total_itms) || asNumber(s.items?.count) || asNumber(s.items_count) || asNumber(s.total_items)))
        || (rows.reduce((a, r) => a + (String(r.type).trim().toLowerCase() === 'item' ? asNumber(r.quantity) : 0), 0) || uniq(rows.map(r => r.item_id)))

      const avgItems =
        (!selected && asNumber(s.avg_item_rating)) ||
        (itemRows.length ? itemRows.reduce((a, r) => a + asNumber(r.rating ?? r.customer_rating), 0) / itemRows.length : 0)

      const avgOrders =
        (!selected && asNumber(s.avg_order_rating)) ||
        (orderRows.length ? orderRows.reduce((a, r) => a + asNumber(r.rating ?? r.customer_rating), 0) / orderRows.length : 0)

      cards.push(
        { icon: <ShoppingCart className="w-4 h-4" />, label: 'Total commandes évaluées', value: String(evalsOrders) },
        { icon: <Star className="w-4 h-4" />,         label: 'Note moyenne commandes',  value: avgOrders ? `${avgOrders.toFixed(2)} / 5` : '—' },
        { icon: null, label: '', value: '' },
        { icon: <Layers className="w-4 h-4" />,       label: 'Total items évalués',     value: String(evalsItems) },
        { icon: <Star className="w-4 h-4" />,         label: 'Note moyenne items',      value: avgItems ? `${avgItems.toFixed(2)} / 5` : '—' },
        { icon: null, label: '', value: '' }
      )

      const pctOrders = totalCmds > 0 ? (evalsOrders * 100) / totalCmds : 0
      const pctItems  = totalIts  > 0 ? (evalsItems  * 100) / totalIts  : 0

      cards.push(
        { icon: <ShoppingCart className="w-4 h-4" />, label: '% commandes évaluées', value: `${pctOrders.toFixed(1)}%` },
        { icon: <Layers className="w-4 h-4" />,       label: '% items évalués',      value: `${pctItems.toFixed(1)}%` },
        { icon: null, label: '', value: '' }
      )
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-full min-w-0">
        {cards.map((c, i) => (
          <div key={`${c.label}-${i}`} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 max-w-full min-w-0 overflow-hidden">
            <div className="p-2 rounded-lg bg-pale-yellow text-dark-green">{c.icon}</div>
            <div className="min-w-0">
              <div className="text-xs text-gray-500 truncate">{c.label}</div>
              <div className="text-lg font-semibold truncate">{c.value}</div>
            </div>
          </div>
        ))}
      </div>
    )
  }, [data, tab, commerce])








  /* ---------- Toolbar (view mode, sliders, date, geo, export) ---------- */
  const exportRef = useRef<HTMLDivElement>(null)
  const currentFiltersSummary = useRef<string>('')

  const doExportPDF = async () => {
    const container = exportRef.current as HTMLElement | null;
    if (!container) return;

    // Show export-only blocks / hide export-hide blocks
    container.classList.add('exporting');
    try {
      const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const marginTop = 40;
      const marginBottom = 40;
      const marginLeft = 30;
      const marginRight = 30;

      const contentWidth = pageWidth - marginLeft - marginRight;
      const contentHeight = pageHeight - marginTop - marginBottom;

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: container.scrollWidth,
        windowHeight: container.scrollHeight, // ensure full height
      });

      const imgWidth = contentWidth;
      const imgHeight = (canvas.height / canvas.width) * imgWidth;

      const rows = Array.from(container.querySelectorAll('tr')) as HTMLElement[];
      const containerRect = container.getBoundingClientRect();
      const deviceScale = canvas.width / containerRect.width;

      const safeCuts: number[] = [];
      for (const tr of rows) {
        const r = tr.getBoundingClientRect();
        const bottomInCanvas = (r.bottom - containerRect.top) * deviceScale;
        if (bottomInCanvas > 0 && bottomInCanvas < canvas.height && r.height > 4) {
          safeCuts.push(Math.round(bottomInCanvas));
        }
      }
      safeCuts.sort((a, b) => a - b);

      const pageSliceHeightCanvas = contentHeight * (canvas.width / contentWidth);
      let usedBottom = 0;

      const pickCut = (target: number, minAdvance = 100) => {
        let pick = -1;
        for (const y of safeCuts) {
          if (y <= target && y - usedBottom >= minAdvance) pick = y;
          else if (y > target) break;
        }
        return pick > 0 ? pick : Math.min(Math.round(target), canvas.height);
      };

      let pageIndex = 0;

      while (usedBottom < canvas.height - 1) {
        const targetBottom = usedBottom + pageSliceHeightCanvas;
        const cutBottom = pickCut(targetBottom);

        const sliceHeight = cutBottom - usedBottom;

        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeight;
        const sctx = sliceCanvas.getContext('2d')!;
        sctx.drawImage(
          canvas,
          0, usedBottom, canvas.width, sliceHeight,
          0, 0, canvas.width, sliceHeight
        );

        const sliceImg = sliceCanvas.toDataURL('image/png');
        if (pageIndex > 0) pdf.addPage();

        const sliceImgHeightInPdf = (sliceHeight / canvas.width) * imgWidth;
        const y = marginTop;

        pdf.addImage(sliceImg, 'PNG', marginLeft, y, imgWidth, sliceImgHeightInPdf);

        usedBottom = cutBottom;
        pageIndex += 1;
      }

      pdf.save(`GreenCart-rapport-${tab}-${dateFrom}_au_${dateTo}.pdf`);
    } finally {
      // Restore screen state
      container.classList.remove('exporting');
    }
  };


const Toolbar = (
  <div className="flex flex-col gap-3 min-w-0">
    {/* Row 1: primary controls */}
    <div className="flex flex-wrap items-center gap-3 min-w-0">
      {/* View mode segmented */}
      <div role="group" aria-label="View mode" className="inline-flex overflow-hidden rounded-lg border">
        <button
          onClick={() => setViewMode('table')}
          aria-pressed={viewMode === 'table'}
          title="Table only"
          className={[
            'px-3 py-1.5 text-sm border-r',
            viewMode === 'table' ? 'bg-dark-green text-white' : 'bg-white hover:bg-gray-50',
            'rounded-l-lg focus:outline-none focus:ring-2 focus:ring-dark-green/50',
          ].join(' ')}
        >
          <TableIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewMode('chart')}
          aria-pressed={viewMode === 'chart'}
          title="Chart only"
          className={[
            'px-3 py-1.5 text-sm border-r',
            viewMode === 'chart' ? 'bg-dark-green text-white' : 'bg-white hover:bg-gray-50',
            'rounded-none focus:outline-none focus:ring-2 focus:ring-dark-green/50',
          ].join(' ')}
        >
          <LineChartIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewMode('both')}
          aria-pressed={viewMode === 'both'}
          title="Both"
          className={[
            'px-3 py-1.5 text-sm',
            viewMode === 'both' ? 'bg-dark-green text-white' : 'bg-white hover:bg-gray-50',
            'rounded-r-lg focus:outline-none focus:ring-2 focus:ring-dark-green/50',
          ].join(' ')}
        >
          <BothIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Granularity */}
      <label className="ml-1 flex items-center gap-2">
        <span className="text-xs text-gray-600">Granularité</span>
        <select
          className="border rounded-lg px-2 py-1 text-sm"
          value={bucket}
          onChange={e => setBucket(e.target.value as Bucket)}
        >
          <option value="day">Jour</option>
          <option value="week">Semaine</option>
          <option value="month">Mois</option>
        </select>
      </label>

      <label className="flex items-center gap-2">
        <span className="text-xs text-gray-600">Commerce</span>
        <select
          className="border rounded-lg px-2 py-1 text-sm min-w-[200px] max-w-[280px]"
          value={commerce}
          onChange={(e) => { setCommerce(e.target.value); setPage(1) }}
        >
          <option value="">Tous</option>
          {companyOptions.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>

      {/* Geo level (conditional) */}
      {tab === 'geo' && (
        <label className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Niveau</span>
          <select
            className="border rounded-lg px-2 py-1 text-sm"
            value={geoLevel}
            onChange={e => setGeoLevel(e.target.value as any)}
          >
            <option value="region">Région</option>
            <option value="department">Département</option>
            <option value="city">Ville</option>
          </select>
        </label>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Export */}
      <button
        onClick={doExportPDF}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-dark-green/50"
        title="Exporter en PDF"
      >
        <Download className="w-4 h-4" />
        <span className="text-sm">Export PDF</span>
      </button>
    </div>

    {/* Row 2: secondary controls */}
    <div className="flex flex-wrap items-center gap-4">
      {/* Date range */}
      <fieldset className="flex items-center gap-2 border rounded-lg px-2 py-1">
        <legend className="sr-only">Date range</legend>
        <span className="text-xs text-gray-600">Période</span>
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
      </fieldset>

      {/* Display tweaks */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Table font (px)</span>
          <input
            type="range"
            min={10}
            max={16}
            step={1}
            value={tableFontPx}
            onChange={e => setTableFontPx(Number(e.target.value))}
          />
          <span className="text-xs text-gray-800 w-6 text-right tabular-nums">{tableFontPx}</span>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-xs text-gray-600">X-axis angle</span>
          <input
            type="range"
            min={-90}
            max={0}
            step={5}
            value={xTickAngle}
            onChange={e => setXTickAngle(Number(e.target.value))}
          />
          <span className="text-xs text-gray-800 w-10 text-right tabular-nums">{xTickAngle}°</span>
        </label>
      </div>
    </div>
  </div>
)
    
  /* ---------- Export wrapper (header + KPIs + chart + table) ---------- */
  const ExportFrame: React.FC<{
    title: string
    note?: string
    filtersText?: string
    children: React.ReactNode
  }> = ({ title, note, filtersText, children }) => {
    return (
      <div ref={exportRef} className="bg-white rounded-lg p-4 md:p-6 shadow-sm space-y-4">
        {/* This block will be hidden on screen and shown in export */}
        <div className="export-only">
          <div className="flex items-start justify-between gap-4 border-b pb-3">
            <div className="flex items-center gap-3">
              <img src="/images/logo.png" alt="Logo" className="h-12 w-auto object-contain" />
              <div>
                <div className="text-base font-semibold text-dark-green">{title}</div>
                <div className="text-xs text-gray-600">
                  Du {fmtDate(dateFrom)} au {fmtDate(dateTo)} • {new Date().toLocaleString('fr-FR')}
                </div>
                <div className="text-xs text-gray-600">
                  Onglet: {tab} • Granularité: {bucket} {tab === 'geo' ? `• Niveau: ${geoLevel}` : ''}
                </div>
                <div className="text-xs text-gray-600">Utilisateur: {user?.email ?? '—'}</div>
              </div>
            </div>
            <div className="text-[10px] px-2 py-1 rounded border bg-amber-50 text-amber-800">
              Confidentiel — Usage interne uniquement
            </div>
          </div>

          {note && <div className="text-xs text-gray-600 italic">{note}</div>}
        </div>

        {children}
      </div>
    )
  }




    /* ---------- Chart shell ---------- */
      
    const chartShell = (
    key: string,
    children: React.ReactNode,
    title: string,
    withAngleTicks?: boolean,
    dataKey?: string,
    xAxisLabel?: string
  ) => {
    const chartEl = children as any
    const dk = dataKey || 'period'

    const hasBars = React.Children
      .toArray(chartEl?.props?.children || [])
      .some((c: any) => {
        const n = c?.type?.displayName || c?.type?.name || ''
        return n.includes('Bar')
      })

    const baseMargin = chartEl?.props?.margin || { top: 8, right: 0, bottom: 0, left: 0 }
    const margin = hasBars
      ? { ...baseMargin, left: Math.max(30, baseMargin.left), right: Math.max(30, baseMargin.right) }
      : baseMargin

    const dataLen = Array.isArray(chartEl?.props?.data) ? chartEl.props.data.length : 0
    const xHeight = withAngleTicks ? (Math.abs(xTickAngle) >= 60 ? 140 : 120) : undefined

    const TickForBars = (props: any) => {
      const { x = 0, y = 0, payload, bandWidth } = props
      const cx = typeof bandWidth === 'number' ? x + bandWidth / 2 : x
      return (
        <g transform={`translate(${cx},${y})`}>
          <text
            dy={12}
            textAnchor="middle"
            transform={xTickAngle ? `rotate(${xTickAngle})` : undefined}
            fontSize={12}
            fill="#333"
          >
            {String(payload?.value ?? '')}
          </text>
        </g>
      )
    }

    return (
      <div className="bg-white rounded-lg p-6 shadow-sm relative z-0 isolate max-w-full min-w-0 overflow-hidden">
        <h4 className="text-sm font-semibold text-dark-green mb-3">{title}</h4>
        <div className="w-full h-[300px] md:h-[360px] min-w-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%" key={rcKey(key)}>
            {React.cloneElement(chartEl, { margin }, [
              <CartesianGrid key="grid" strokeDasharray="3 3" />,
              <XAxis
                key="x"
                type="category"
                dataKey={dk}
                interval={dataLen > 30 ? 'preserveStartEnd' : 0}
                minTickGap={0}
                height={xHeight}
                tickMargin={withAngleTicks ? 10 : 6}
                scale={hasBars ? 'band' : 'point'}
                padding={hasBars ? { left: 20, right: 20 } : { left: 10, right: 10 }}
                allowDuplicatedCategory={false}
                tick={
                  hasBars
                    ? ((props: any) => <TickForBars {...props} />)
                    : (withAngleTicks
                        ? ((<AngleTick angle={xTickAngle} />) as any)
                        : { fontSize: 12, fill: '#333' })
                }
              >
                {xAxisLabel && (
                  <Label
                    value={xAxisLabel}
                    position="insideBottom"
                    offset={-10}
                    style={{ fontSize: 12, fill: '#333' }}
                  />
                )}
              </XAxis>,
              ...React.Children.toArray(chartEl.props.children),
            ])}
          </ResponsiveContainer>
        </div>
      </div>
    )
  }




/* ====================== SALES ====================== */
  const salesFilters = useMultiFilters()

  useEffect(() => {
    setPage(1)
  }, [salesFilters.filters, bucket])

  const salesView = useMemo(() => {
    if (tab !== 'sales') return null

    const normalize = (v: any) => String(v ?? '').replace(/\u202F|\u00A0/g, ' ').trim()
    const asNumber = (v: any, d = 0) => (v == null || Number.isNaN(Number(v)) ? d : Number(v))

    // Base rows from server
    const baseRows: any[] = Array.isArray(data?.rows) ? data.rows : []

    // Client-side Commerce filter (company_name / company_names)
    const rowCompanyNames = (r: any): string[] => {
      if (Array.isArray(r?.company_names)) return r.company_names.map((s: any) => String(s).trim()).filter(Boolean)
      if (r?.company_name != null) return [String(r.company_name).trim()].filter(Boolean)
      return []
    }
    const rows: any[] = ((): any[] => {
      const sel = String(commerce || '').trim()
      if (!sel) return baseRows
      return baseRows.filter((r: any) => rowCompanyNames(r).includes(sel))
    })()

    // Series for chart: always rebuild from filtered rows (then roll to bucket)
    const daySeries = buildDaySeriesFromRows(rows)
    const rSeries = bucket === 'day' ? daySeries : rollSeries(daySeries, bucket)

    // HeaderFilter values from filtered rows
    const prodVals: string[] = Array.from(
      new Set(rows.map((r: any) =>
        normalize(r.producer_name ?? (Array.isArray(r.producer_names) ? r.producer_names.join(', ') : ''))
      ))
    )
    const compVals: string[] = Array.from(
      new Set(rows.map((r: any) =>
        normalize(r.company_name ?? (Array.isArray(r.company_names) ? r.company_names.join(', ') : ''))
      ))
    )
    const userVals: string[] = Array.from(
      new Set(rows.map((r: any) =>
        normalize(r.user_name ?? r.customer_name ?? r.user ?? r.user_id ?? '—')
      ))
    )
    const dateVals: string[] = Array.from(
      new Set(rows.map((r: any) => normalize(fmtDateTime(r.created_at))))
    )
    const orderVals: string[] = Array.from(
      new Set(rows.map((r: any) => normalize(r.order_id ?? '—')))
    )
    const itemVals: string[] = Array.from(
      new Set(rows.map((r: any) => normalize(r.item_id ?? '—')))
    )
    const contentVals: string[] = Array.from(
      new Set(rows.map((r: any) =>
        normalize(`${r.bundle_title ?? r.label ?? '—'} x ${asNum(r.quantity, 1)}`)
      ))
    )
    const caVals: string[] = Array.from(
      new Set(rows.map((r: any) =>
        normalize(fmtEur(asNum(r.line_total || r.unit_price)))
      ))
    )

    // Column filters (applied after client-side commerce filter)
    const applyFilter = (r: any) => {
      const f = salesFilters.filters
      const prod = normalize(r.producer_name ?? (Array.isArray(r.producer_names) ? r.producer_names.join(', ') : ''))
      const comp = normalize(r.company_name ?? (Array.isArray(r.company_names) ? r.company_names.join(', ') : ''))
      const user = normalize(r.user_name ?? r.customer_name ?? r.user ?? r.user_id ?? '—')
      const dateStr = normalize(fmtDateTime(r.created_at))
      const orderStr = normalize(r.order_id ?? '—')
      const itemStr = normalize(r.item_id ?? '—')
      const contentStr = normalize(`${r.bundle_title ?? r.label ?? '—'} x ${asNum(r.quantity, 1)}`)
      const caStr = normalize(fmtEur(asNum(r.line_total || r.unit_price)))

      const okProducer = !f.producer || f.producer.size === 0 || f.producer.has(prod)
      const okCompany  = !f.company  || f.company.size  === 0 || f.company.has(comp)
      const okUser     = !f.user     || f.user.size     === 0 || f.user.has(user)
      const okDate     = !f.date     || f.date.size     === 0 || f.date.has(dateStr)
      const okOrder    = !f.order    || f.order.size    === 0 || f.order.has(orderStr)
      const okItem     = !f.item     || f.item.size     === 0 || f.item.has(itemStr)
      const okContent  = !f.content  || f.content.size  === 0 || f.content.has(contentStr)
      const okAmount   = !f.amount   || f.amount.size   === 0 || f.amount.has(caStr)

      return okProducer && okCompany && okUser && okDate && okOrder && okItem && okContent && okAmount
    }

    const filteredRows = rows.filter(applyFilter)

    const start = (page - 1) * pageSize
    const end = page * pageSize

    currentFiltersSummary.current =
      tab === 'sales'
        ? summarizeFilters(salesFilters.filters, {
            producer: 'Producteur',
            company:  'Commerce',
            user:     'Utilisateur',
            date:     'Date',
            order:    'Commande',
            item:     'Item',
            content:  'Contenu',
            amount:   'CA (€)'
          })
        : currentFiltersSummary.current

    const chart = chartShell(
      'sales',
      <LineChart data={rSeries} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend wrapperStyle={{ overflow: 'hidden' }} />
        <Line yAxisId="left" type="monotone" dataKey="revenue" name="CA (€)" stroke="#14532d" strokeWidth={2} dot={false} />
        <Line yAxisId="right" type="monotone" dataKey="orders"  name="Commandes"    stroke="#7cb518" strokeWidth={2} dot={false} />
        <Line yAxisId="right" type="monotone" dataKey="units"   name="Unités"       stroke="#0e7490" strokeWidth={2} dot={false} />
      </LineChart>,
      'CA / commandes / unités',
      true,
      'period'
    )

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm max-w-full min-w-0 overflow-hidden" style={{ fontSize: tableFontPx }}>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                {hasProducerCol && (
                  <th className="px-4 py-2 text-left">
                    <HeaderFilter title="Producteur" values={prodVals} colKey="producer" state={salesFilters} />
                  </th>
                )}
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Commerce" values={compVals} colKey="company" state={salesFilters} />
                </th>
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Date" values={dateVals} colKey="date" state={salesFilters} />
                </th>
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Utilisateur" values={userVals} colKey="user" state={salesFilters} />
                </th>
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Commande" values={orderVals} colKey="order" state={salesFilters} />
                </th>
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Id Item" values={itemVals} colKey="item" state={salesFilters} />
                </th>
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Contenu" values={contentVals} colKey="content" state={salesFilters} />
                </th>
                <th className="px-4 py-2 text-right">
                  <HeaderFilter title="CA (€)" values={caVals} colKey="amount" state={salesFilters} />
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.slice(start, end).map((r: any, i: number) => (
                <tr key={`${r.order_id}-${r.item_id}-${i}`} className="border-b">
                  {hasProducerCol && (
                    <td className="px-4 py-2">
                      {r.producer_name ?? (Array.isArray(r.producer_names) ? r.producer_names.join(', ') : '')}
                    </td>
                  )}
                  <td className="px-4 py-2">{r.company_name ?? (Array.isArray(r.company_names) ? r.company_names.join(', ') : '')}</td>
                  <td className="px-4 py-2">{fmtDateTime(r.created_at)}</td>
                  <td className="px-4 py-2">{r.user_name ?? r.customer_name ?? r.user ?? r.user_id ?? '—'}</td>
                  <td className="px-4 py-2">{r.order_code}</td>
                  <td className="px-4 py-2">{r.item_id}</td>
                  <td className="px-4 py-2">{`${r.bundle_title ?? r.label ?? '—'} x ${asNum(r.quantity, 1)}`}</td>
                  <td className="px-4 py-2 text-right">{fmtEur(asNum(r.line_total || r.unit_price))}</td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={hasProducerCol ? 8 : 7}>
                    Aucun résultat
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between mt-3 text-sm">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="border rounded px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-2 py-1 border rounded">Prev</button>
              <span>Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} className="px-2 py-1 border rounded">Next</button>
            </div>
          </div>
        </div>
      </div>
    )

    return (
      <ExportFrame
        title="Rapport d’analytique"
        note="Note graphique: lignes — CA (€) vs Commandes/Unités, regroupement selon la granularité."
        filtersText={currentFiltersSummary.current}
      >
        <div className="space-y-6 max-w-full min-w-0">
          {viewMode !== 'table' && chart}
          {viewMode !== 'chart' && table}
        </div>
      </ExportFrame>
    )
  }, [data, bucket, tab, viewMode, tableFontPx, xTickAngle, salesFilters.filters, page, pageSize, commerce])


  /* ====================== ORDERS ====================== */
  const ordersFilters = useMultiFilters()

  useEffect(() => {
    if (tab === 'orders') setPage(1)
  }, [ordersFilters.filters, tab])

  const ordersView = useMemo(() => {
    if (tab !== 'orders') return null

    const orders: any[] = Array.isArray(data?.rows) ? data.rows : []

    // --- Client-side commerce filter for ORDERS ---
    const rowCompanyNames = (r: any): string[] => {
      if (Array.isArray(r?.company_names)) return r.company_names.map((s: any) => String(s).trim()).filter(Boolean)
      if (r?.company_name != null) return [String(r.company_name).trim()].filter(Boolean)
      return []
    }
    const orderMatchesCommerce = (o: any) => {
      const sel = String(commerce || '').trim()
      if (!sel) return true
      const namesAtOrder = Array.isArray(o.company_names) ? o.company_names : []
      const namesAtItems = Array.isArray(o.items) ? o.items.flatMap((it: any) => rowCompanyNames(it)) : []
      const names = [...namesAtOrder, ...namesAtItems].map(s => String(s).trim())
      return names.includes(sel)
    }

    const ordersForChart = orders.filter(orderMatchesCommerce)

    const keyFn =
      bucket === 'week' ? weekKeyLocal  :
      bucket === 'month' ? monthKeyLocal :
      (s: string) => localDateKey(s)

    type Agg = { period: string; revenue: number; orders: number; units: number; _seen: Set<number> }
    const chartMap = ordersForChart.reduce((acc: Record<string, Agg>, o: any) => {
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
    const rSeries = Object.values(chartMap)
      .map(({ _seen, ...rest }) => rest)
      .sort((a, b) => a.period.localeCompare(b.period, undefined, { numeric: true }))

    const chart = chartShell(
      'orders',
      <LineChart data={rSeries} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend wrapperStyle={{ overflow: 'hidden' }} />
        <Line yAxisId="left" type="monotone" dataKey="revenue" name="CA (€)" stroke="#14532d" strokeWidth={2} dot={false} />
        <Line yAxisId="right" type="monotone" dataKey="orders"  name="Commandes" stroke="#7cb518" strokeWidth={2} dot={false} />
        <Line yAxisId="right" type="monotone" dataKey="units"   name="Unités"    stroke="#0e7490" strokeWidth={2} dot={false} />
      </LineChart>,
      'Commandes / CA / unités',
      true,
      'period'
    )

    // --- Table rows at item granularity, then client-side commerce filter ---
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
          order_code: o.order_code ?? o.code ?? (o.order?.order_code) ?? '—',
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

    const itemRowsFiltered = ((): any[] => {
      const sel = String(commerce || '').trim()
      if (!sel) return itemRows
      return itemRows.filter(r => {
        const names = Array.isArray(r.company_names) ? r.company_names.map((s: any) => String(s).trim()) : []
        return names.includes(sel)
      })
    })()

    const prodVals = Array.from(new Set(itemRowsFiltered.map(r => Array.isArray(r.producer_names) ? r.producer_names.join(', ') : '')))
    const compVals = Array.from(new Set(itemRowsFiltered.map(r => Array.isArray(r.company_names) ? r.company_names.join(', ') : '')))
    const userVals = Array.from(new Set(itemRowsFiltered.map(r => r.user_name)))
    const statusVals = Array.from(new Set(itemRowsFiltered.map(r => r.status ?? '—')))

    const applyFilter = (r: any) => {
      const f = ordersFilters.filters
      const prod = Array.isArray(r.producer_names) ? r.producer_names.join(', ') : ''
      const comp = Array.isArray(r.company_names) ? r.company_names.join(', ') : ''
      const okProducer = !f.producer || f.producer.size === 0 || f.producer.has(prod)
      const okCompany = !f.company || f.company.size === 0 || f.company.has(comp)
      const okUser = !f.user || f.user.size === 0 || f.user.has(r.user_name)
      const okStatus = !f.status || f.status.size === 0 || f.status.has(r.status ?? '—')
      return okProducer && okCompany && okUser && okStatus
    }
    const filtered = itemRowsFiltered.filter(applyFilter)

    if (tab === 'orders') {
      currentFiltersSummary.current = summarizeFilters(ordersFilters.filters, {
        producer: 'Producteur', company: 'Commerce', user: 'Utilisateur', status: 'Statut'
      })
    }

    // Pagination window
    const start = (page - 1) * pageSize
    const end = page * pageSize

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm max-w-full min-w-0 overflow-hidden" style={{ fontSize: tableFontPx }}>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                {hasProducerCol && (
                  <th className="px-4 py-2 text-left">
                    <HeaderFilter title="Producteur" values={prodVals} colKey="producer" state={ordersFilters} />
                  </th>
                )}
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Commerce" values={compVals} colKey="company" state={ordersFilters} />
                </th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Utilisateur" values={userVals} colKey="user" state={ordersFilters} />
                </th>
                <th className="px-4 py-2 text-left">Commande</th>
                <th className="px-4 py-2 text-left">Id Item</th>
                <th className="px-4 py-2 text-left">Contenu</th>
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Statut" values={statusVals} colKey="status" state={ordersFilters} />
                </th>
                <th className="px-4 py-2 text-right">CA (€)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(start, end).map((r: any) => (
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
                  <td className="px-4 py-2">{r.order_code}</td>
                  <td className="px-4 py-2">{r.item_id}</td>
                  <td className="px-4 py-2">
                    {`${r.bundle_title} x ${asNum(r.quantity, 1)}`}
                  </td>
                  <td className="px-4 py-2">{r.status}</td>
                  <td className="px-4 py-2 text-right">{fmtEur(asNum(r.total_price))}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
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

          {/* Pager */}
          <div className="flex items-center justify-between mt-3 text-sm">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="border rounded px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-2 py-1 border rounded">Prev</button>
              <span>Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} className="px-2 py-1 border rounded">Next</button>
            </div>
          </div>
        </div>
      </div>
    )

    return (
      <ExportFrame
        title="Rapport d’analytique"
        note="Note graphique: lignes — CA (€), commandes et unités par période."
        filtersText={currentFiltersSummary.current}
      >
        <div className="space-y-6 max-w-full min-w-0">
          {viewMode !== 'table' && chart}
          {viewMode !== 'chart' && table}
        </div>
      </ExportFrame>
    )
  }, [data, tab, viewMode, bucket, hasProducerCol, tableFontPx, xTickAngle, ordersFilters.filters, page, pageSize, commerce])




  /* ====================== CUSTOMERS (Utilisateurs) ====================== */
  const customersFilters = useMultiFilters()

  useEffect(() => {
    if (tab === 'customers') setPage(1)
  }, [customersFilters.filters, bucket, tab])

  const customersView = useMemo(() => {
    if (tab !== 'customers') return null
    const itemsBase: any[] = Array.isArray(data?.rows) ? data.rows : []

    // Client-side Commerce filter (company_name / company_names at row level)
    const rowCompanyNames = (r: any): string[] => {
      if (Array.isArray(r?.company_names)) return r.company_names.map((s: any) => String(s).trim()).filter(Boolean)
      if (r?.company_name != null) return [String(r.company_name).trim()].filter(Boolean)
      return []
    }
    const items: any[] = ((): any[] => {
      const sel = String(commerce || '').trim()
      if (!sel) return itemsBase
      return itemsBase.filter((r: any) => rowCompanyNames(r).includes(sel))
    })()

    const keyFn =
      bucket === 'week' ? weekKeyLocal :
      bucket === 'month' ? monthKeyLocal :
      (s: string) => localDateKey(s)

    // First seen per user from filtered items
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
      <BarChart
        data={rSeries}
        barCategoryGap="15%"
        barGap={2}
        margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
      >
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
      'Nouveaux clients / période',
      true,
      'period',
      ''
    )

    const seg = data?.summary?.segments || {}
    const segData = Object.entries(seg).map(([k, v]) => ({ type: k, count: Number(v) || 0 }))
    const segmentsChart = segData.length
      ? chartShell(
          'customers-segments',
          <BarChart data={segData} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend wrapperStyle={{ overflow: 'hidden' }} />
            <Bar dataKey="count" name="Comptes" isAnimationActive={false} maxBarSize={36} />
          </BarChart>,
          'Utilisateurs par segment',
          true,
          'type'
        )
      : null

    const itemRows = items.map((r) => ({
      created_at: r.created_at,
      user_name: r.user_name ?? r.user ?? r.user_id ?? '—',
      order_id: r.order_id,
      order_code: r.order_code ?? r.order?.order_code ?? '—',
      order_item_id: r.order_item_id ?? r.item_id ?? r.id,
      item_id: r.order_item_id ?? r.item_id ?? r.id,
      quantity: asNum(r.quantity),
      amount: asNum(r.amount ?? r.total_price ?? r.subtotal ?? 0),
      status: r.order_status ?? r.status ?? '—',
      producer_names: Array.isArray(r.producer_names) ? r.producer_names : [],
      company_names: Array.isArray(r.company_names) ? r.company_names : [],
    }))

    const prodVals = Array.from(new Set(itemRows.map(r => Array.isArray(r.producer_names) ? r.producer_names.join(', ') : '')))
    const compVals = Array.from(new Set(itemRows.map(r => Array.isArray(r.company_names) ? r.company_names.join(', ') : '')))
    const userVals = Array.from(new Set(itemRows.map(r => r.user_name)))
    const statusVals = Array.from(new Set(itemRows.map(r => r.status ?? '—')))

    const applyFilter = (r: any) => {
      const f = customersFilters.filters
      const prod = Array.isArray(r.producer_names) ? r.producer_names.join(', ') : ''
      const comp = Array.isArray(r.company_names) ? r.company_names.join(', ') : ''
      const okProducer = !f.producer || f.producer.size === 0 || f.producer.has(prod)
      const okCompany = !f.company || f.company.size === 0 || f.company.has(comp)
      const okUser = !f.user || f.user.size === 0 || f.user.has(r.user_name)
      const okStatus = !f.status || f.status.size === 0 || f.status.has(r.status ?? '—')
      return okProducer && okCompany && okUser && okStatus
    }
    const filtered = itemRows.filter(applyFilter)

    if (tab === 'customers') {
      currentFiltersSummary.current = summarizeFilters(customersFilters.filters, {
        producer: 'Producteur', company: 'Commerce', user: 'Utilisateur', status: 'Statut'
      })
    }

    const start = (page - 1) * pageSize
    const end = page * pageSize

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm max-w-full min-w-0 overflow-hidden" style={{ fontSize: tableFontPx }}>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                {hasProducerCol && <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Producteur" values={prodVals} colKey="producer" state={customersFilters} />
                </th>}
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Commerce" values={compVals} colKey="company" state={customersFilters} />
                </th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Utilisateur" values={userVals} colKey="user" state={customersFilters} />
                </th>
                <th className="px-4 py-2 text-left">Commande</th>
                <th className="px-4 py-2 text-left">Id Item</th>
                {/*<th className="px-4 py-2 text-left">Qté</th>*/}
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Statut" values={statusVals} colKey="status" state={customersFilters} />
                </th>
                <th className="px-4 py-2 text-right">Montant (€)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(start, end).map((r: any) => (
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
                  <td className="px-4 py-2">{r.order_code}</td>
                  <td className="px-4 py-2">{r.order_item_id}</td>
                  {/*<td className="px-4 py-2">{asNum(r.quantity, 0)}</td>*/}
                  <td className="px-4 py-2">{r.status}</td>
                  <td className="px-4 py-2 text-right">{fmtEur(asNum(r.amount))}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={hasProducerCol ? 9 : 8}>
                    Aucun résultat
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between mt-3 text-sm">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="border rounded px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-2 py-1 border rounded">Prev</button>
              <span>Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} className="px-2 py-1 border rounded">Next</button>
            </div>
          </div>
        </div>
      </div>
    )

    return (
      <ExportFrame
        title="Rapport d’analytique"
        note="Note graphique: barres — nouveaux clients par période et répartition par segment."
        filtersText={currentFiltersSummary.current}
      >
        <div className="space-y-6 max-w-full min-w-0">
          {viewMode !== 'table' && chart}
          {viewMode !== 'table' && segmentsChart}
          {viewMode !== 'chart' && table}
        </div>
      </ExportFrame>
    )
  }, [data, tab, viewMode, bucket, hasProducerCol, tableFontPx, xTickAngle, customersFilters.filters, page, pageSize, commerce])






  /* ====================== CARTS (Paniers) ====================== */
  const cartsFilters = useMultiFilters()

  useEffect(() => {
    if (tab === 'carts') setPage(1)
  }, [cartsFilters.filters, tab])

  const cartsView = useMemo(() => {
    if (tab !== 'carts') return null

    const summary = data?.summary || {}
    const rowsRaw: any[] = Array.isArray(data?.rows) ? data.rows : []
    const topAbandoned = Array.isArray(summary?.top_abandoned_products) ? summary.top_abandoned_products : []

    const asNumOrNull = (v: any): number | null =>
      v == null || v === '' || isNaN(Number(v)) ? null : Number(v)

    const isItemGranularity =
      rowsRaw.length > 0 && !!rowsRaw[0]?.cart_item_id && !Array.isArray(rowsRaw[0]?.items)

    // --- Client-side commerce filter for CARTS ---
    const hasCommerce = (row: any): boolean => {
      const sel = String(commerce || '').trim()
      if (!sel) return true

      const inArray = (arr: any) =>
        Array.isArray(arr) && arr.map((s: any) => String(s).trim()).includes(sel)

      // item granularity: row.bundle?.company_names OR row.company_names
      if (isItemGranularity) {
        const b = row?.bundle || {}
        if (inArray(b.company_names)) return true
        if (inArray(row.company_names)) return true
        return false
      }

      // cart granularity: check order-level company_names and each item's bundle.company_names
      if (inArray(row.company_names)) return true
      if (Array.isArray(row.items)) {
        for (const it of row.items) {
          const b = it?.bundle || {}
          if (inArray(b.company_names) || inArray(it.company_names)) return true
        }
      }
      return false
    }

    const rows: any[] = rowsRaw.filter(hasCommerce)

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
        ? Array.from(aggMap.entries()).map(([label, v]) => ({ label, qty: v.qty, sum: v.sum }))
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
              <YAxis yAxisId="left" label={{ value: 'Quantité', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend wrapperStyle={{ overflow: 'hidden' }} />
              <Bar yAxisId="left" dataKey="qty" name="Qty" fill="#14532d" isAnimationActive={false} maxBarSize={36} />
              <Bar yAxisId="right" dataKey="sum" name="Somme (€)" fill="#7cb518" isAnimationActive={false} maxBarSize={36} />
            </BarChart>,
            'Produits abandonnés (Qté / €)',
            true,
            'label'
          )
        : null

    const baseRows = (isItemGranularity
      ? rows.map((r: any) => {
          const b = r.bundle || {}
          const producerNames = Array.isArray(b.producer_names) ? b.producer_names : []
          const companyNames = Array.isArray(b.company_names) ? b.company_names : []
          const qty = asNum(r.quantity, 0)
          const unitPrice = r.unit_price != null ? asNum(r.unit_price) : null
          const lineTotal = r.line_total != null ? asNum(r.line_total) : unitPrice != null ? unitPrice * qty : null
          return {
            producer_names: producerNames,
            company_names: companyNames,
            updated_at: r.updated_at ?? r.created_at,
            user_name: r.user_name ?? r.user ?? r.user_id ?? '—',
            cart_id: r.cart_id,
            cart_item_id: r.cart_item_id,
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
              if (line != null) tmp += line
              else {
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
            producer_names: Array.from(names),
            company_names: Array.from(comps),
            updated_at: r.updated_at,
            user_name: r.user_name ?? r.user ?? r.user_id ?? '—',
            cart_id: r.cart_id,
            cart_item_id: null,
            content: contents.join(' · '),
            qty: asNum(r.items_qty),
            unit_price: null,
            sum,
          }
        }))

    const prodVals = Array.from(new Set(baseRows.map(r => Array.isArray(r.producer_names) ? r.producer_names.join(', ') : '')))
    const compVals = Array.from(new Set(baseRows.map(r => Array.isArray(r.company_names) ? r.company_names.join(', ') : '')))
    const userVals = Array.from(new Set(baseRows.map(r => r.user_name)))

    const applyFilter = (r: any) => {
      const f = cartsFilters.filters
      const prod = Array.isArray(r.producer_names) ? r.producer_names.join(', ') : ''
      const comp = Array.isArray(r.company_names) ? r.company_names.join(', ') : ''
      const okProducer = !f.producer || f.producer.size === 0 || f.producer.has(prod)
      const okCompany = !f.company || f.company.size === 0 || f.company.has(comp)
      const okUser = !f.user || f.user.size === 0 || f.user.has(r.user_name)
      return okProducer && okCompany && okUser
    }
    const tableRows = baseRows.filter(applyFilter)

    if (tab === 'carts') {
      currentFiltersSummary.current = summarizeFilters(cartsFilters.filters, {
        producer: 'Producteur', company: 'Commerce', user: 'Utilisateur'
      })
    }

    const baseCols = hasProducerCol ? 9 : 8
    const colSpan = isItemGranularity ? baseCols + 1 : baseCols

    const start = (page - 1) * pageSize
    const end = page * pageSize

    const tableBlock = (
      <div className="bg-white rounded-lg p-6 shadow-sm max-w-full min-w-0 overflow-hidden" style={{ fontSize: tableFontPx }}>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                {hasProducerCol && (
                  <th className="px-4 py-2 text-left">
                    <HeaderFilter title="Producteur" values={prodVals} colKey="producer" state={cartsFilters} />
                  </th>
                )}
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Commerce" values={compVals} colKey="company" state={cartsFilters} />
                </th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Utilisateur" values={userVals} colKey="user" state={cartsFilters} />
                </th>
                <th className="px-4 py-2 text-left">Panier</th>
                <th className="px-4 py-2 text-left">Id Item</th>
                <th className="px-4 py-2 text-right">Contenu</th>
                <th className="px-4 py-2 text-right">Qté</th>
                {isItemGranularity && <th className="px-4 py-2 text-right">PU (€)</th>}
                <th className="px-4 py-2 text-right">Somme (€)</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.slice(start, end).map((r: any, i: number) => (
                <tr key={`${r.cart_id ?? 'cart'}-${r.cart_item_id ?? i}`} className="border-b">
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

          <div className="flex items-center justify-between mt-3 text-sm">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="border rounded px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-2 py-1 border rounded">Prev</button>
              <span>Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} className="px-2 py-1 border rounded">Next</button>
            </div>
          </div>
        </div>
      </div>
    )

    return (
      <ExportFrame
        title="Rapport d’analytique"
        note="Note graphique: barres — produits les plus abandonnés (quantité et somme estimée)."
        filtersText={currentFiltersSummary.current}
      >
        <div className="space-y-6 max-w-full min-w-0">
          {viewMode !== 'table' && chartBlock}
          {viewMode !== 'chart' && tableBlock}
        </div>
      </ExportFrame>
    )
  }, [data, tab, viewMode, hasProducerCol, tableFontPx, xTickAngle, cartsFilters.filters, page, pageSize, commerce])






  /* ====================== CATALOGUE ====================== */
  const catalogFilters = useMultiFilters()
  const [catalogSort, setCatalogSort] = useState<
    'name-asc' | 'name-desc' | 'sold-desc' | 'sold-asc' | 'stock-desc' | 'stock-asc'
  >('sold-desc')

  useEffect(() => {
    if (tab === 'catalog') setPage(1)
  }, [catalogFilters.filters, tab])

  const catalogView = useMemo(() => {
    if (tab !== 'catalog') return null
    const productsRaw: any[] =
      Array.isArray(data?.products) ? data.products
      : Array.isArray(data?.rows?.products) ? data.rows.products
      : Array.isArray(data?.rows?.products?.data) ? data.rows.products.data
      : []

    const rowCompanyNames = (p: any): string[] => {
      if (Array.isArray(p?.company_names)) return p.company_names.map((s: any) => String(s).trim()).filter(Boolean)
      if (p?.company_name != null) return [String(p.company_name).trim()].filter(Boolean)
      return []
    }
    const products: any[] = ((): any[] => {
      const sel = String(commerce || '').trim()
      if (!sel) return productsRaw
      return productsRaw.filter((p: any) => rowCompanyNames(p).includes(sel))
    })()

    const labelOf = (p: any) => String(p.title || p.name || '')

    const chartData = products.map((p: any) => ({
      label: labelOf(p),
      sold: asNum(p.sold),
      stock: asNum(p.stock),
    }))

    const byName = (a: any, b: any) =>
      String(a.label || labelOf(a)).localeCompare(String(b.label || labelOf(b)), 'fr', {
        sensitivity: 'base',
        numeric: true,
      })
    const bySold = (a: any, b: any) => asNum(b.sold) - asNum(a.sold)
    const byStock = (a: any, b: any) => asNum(b.stock) - asNum(a.stock)
    const cmp = (a: any, b: any) => {
      switch (catalogSort) {
        case 'name-asc':  return byName(a, b)
        case 'name-desc': return byName(b, a)
        case 'sold-asc':  return -bySold(a, b)
        case 'sold-desc': return  bySold(a, b)
        case 'stock-asc': return -byStock(a, b)
        case 'stock-desc':return  byStock(a, b)
        default:          return bySold(a, b)
      }
    }

    const sortedChartData = [...chartData].sort(cmp)

    const chart = chartShell(
      'catalog',
      <BarChart
        data={sortedChartData}
        barCategoryGap="20%"
        margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
      >
        <YAxis />
        <Tooltip />
        <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 50 }} />
        <Bar dataKey="sold"  name="Vendu" fill="#14532d" isAnimationActive={false} maxBarSize={36} />
        <Bar dataKey="stock" name="Stock" fill="#7cb518" isAnimationActive={false} maxBarSize={36} />
      </BarChart>,
      'Ventes & stock par produit',
      true,
      'label'
    )

    const byCatMap: Record<string, { category: string; products: number; sold: number; stock: number }> = {}
    for (const p of products) {
      const cat =
        typeof p.category === 'object'
          ? (p.category?.label ?? p.category?.name ?? p.category?.code ?? '—')
          : (p.category ?? '—')
      if (!byCatMap[cat]) byCatMap[cat] = { category: cat, products: 0, sold: 0, stock: 0 }
      byCatMap[cat].products += 1
      byCatMap[cat].sold += asNum(p.sold)
      byCatMap[cat].stock += asNum(p.stock)
    }
    const byCategory = Object.values(byCatMap).sort(
      (a, b) =>
        (catalogSort === 'name-asc' || catalogSort === 'name-desc')
          ? a.category.localeCompare(b.category, 'fr', { sensitivity: 'base', numeric: true }) * (catalogSort === 'name-desc' ? -1 : 1)
          : b.products - a.products || a.category.localeCompare(b.category, 'fr', { sensitivity: 'base', numeric: true })
    )

    const catChart = chartShell(
      'catalog-by-category',
      <BarChart data={byCategory} barCategoryGap="20%" margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 50 }} />
        <Bar dataKey="products" name="Produits distincts" isAnimationActive={false} maxBarSize={36} />
      </BarChart>,
      'Produits distincts par catégorie',
      true,
      'category'
    )

    const prodVals = Array.from(new Set(products.map((p: any) =>
      (Array.isArray(p.producer_names) ? p.producer_names.join(', ') : (p.producer_name ?? ''))
    )))
    const compVals = Array.from(new Set(products.map((p: any) =>
      (Array.isArray(p.company_names) ? p.company_names.join(', ') : (p.company_name ?? ''))
    )))
    const catVals = Array.from(new Set(products.map((p: any) => {
      const category =
        typeof p.category === 'object'
          ? (p.category?.label ?? p.category?.name ?? p.category?.code ?? '')
          : (p.category ?? '')
      return category
    })))

    const applyFilter = (p: any) => {
      const f = catalogFilters.filters
      const prod = Array.isArray(p.producer_names) ? p.producer_names.join(', ') : (p.producer_name ?? '')
      const comp = Array.isArray(p.company_names) ? p.company_names.join(', ') : (p.company_name ?? '')
      const category =
        typeof p.category === 'object'
          ? (p.category?.label ?? p.category?.name ?? p.category?.code ?? '')
          : (p.category ?? '')
      const okProducer = !f.producer || f.producer.size === 0 || f.producer.has(prod)
      const okCompany  = !f.company  || f.company.size  === 0 || f.company.has(comp)
      const okCategory = !f.category || f.category.size === 0 || f.category.has(category)
      return okProducer && okCompany && okCategory
    }
    const filtered = products.filter(applyFilter)

    if (tab === 'catalog') {
      currentFiltersSummary.current = summarizeFilters(catalogFilters.filters, {
        producer: 'Producteur', company: 'Commerce', category: 'Catégorie'
      })
    }

    const sorted = [...filtered].sort((a, b) => {
      const aRow = { label: labelOf(a), sold: asNum(a.sold), stock: asNum(a.stock) }
      const bRow = { label: labelOf(b), sold: asNum(b.sold), stock: asNum(b.stock) }
      return cmp(aRow, bRow)
    })

    const start = (page - 1) * pageSize
    const end = page * pageSize

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm max-w-full min-w-0 overflow-hidden" style={{ fontSize: tableFontPx }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-600">Ordonner par</span>
          <select
            className="border rounded-lg px-2 py-1 text-sm"
            value={catalogSort}
            onChange={e => { setCatalogSort(e.target.value as any); setPage(1) }}
          >
            <option value="name-asc">Nom A→Z</option>
            <option value="name-desc">Nom Z→A</option>
            <option value="sold-desc">Le plus vendu</option>
            <option value="sold-asc">Le moins vendu</option>
            <option value="stock-desc">Le plus de stock</option>
            <option value="stock-asc">Le moins de stock</option>
          </select>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                {hasProducerCol && <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Producteur" values={prodVals} colKey="producer" state={catalogFilters} />
                </th>}
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Commerce" values={compVals} colKey="company" state={catalogFilters} />
                </th>
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Catégorie" values={catVals} colKey="category" state={catalogFilters} />
                </th>
                <th className="px-4 py-2 text-left">Produit</th>
                <th className="px-4 py-2 text-right">Stock</th>
                <th className="px-4 py-2 text-right">Vendu</th>
              </tr>
            </thead>
            <tbody>
              {sorted.slice(start, end).map((p: any, i: number) => {
                const category =
                  typeof p.category === 'object'
                    ? (p.category?.label ?? p.category?.name ?? p.category?.code ?? '')
                    : (p.category ?? '')
                return (
                  <tr key={p.product_id || i} className="border-b">
                    {hasProducerCol && <td className="px-4 py-2">{Array.isArray(p.producer_names) ? p.producer_names.join(', ') : (p.producer_name ?? '')}</td>}
                    <td className="px-4 py-2">{Array.isArray(p.company_names) ? p.company_names.join(', ') : (p.company_name ?? '')}</td>
                    <td className="px-4 py-2">{category}</td>
                    <td className="px-4 py-2">{labelOf(p)}</td>
                    <td className="px-4 py-2 text-right">{asNum(p.stock)}</td>
                    <td className="px-4 py-2 text-right">{asNum(p.sold)}</td>
                  </tr>
                )
              })}
              {sorted.length === 0 && <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={hasProducerCol ? 6 : 5}>Aucun résultat</td></tr>}
            </tbody>
          </table>

          <div className="flex items-center justify-between mt-3 text-sm">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="border rounded px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-2 py-1 border rounded">Prev</button>
              <span>Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} className="px-2 py-1 border rounded">Next</button>
            </div>
          </div>
        </div>
      </div>
    )

    return (
      <ExportFrame
        title="Rapport d’analytique"
        note="Note graphique : barres — stock vs vendu par produit. Et barres — produits distincts par catégorie."
        filtersText={currentFiltersSummary.current}
      >
        <div className="space-y-6 max-w-full min-w-0">
          {viewMode !== 'table' && (
            <>
              {catChart}
              {chart}
            </>
          )}
          {viewMode !== 'chart' && table}
        </div>
      </ExportFrame>
    )
  }, [
    data, tab, viewMode, tableFontPx, xTickAngle,
    catalogFilters.filters, page, pageSize, hasProducerCol, catalogSort, commerce
  ])



  /* ====================== SANTÉ ====================== */
  const healthFilters = useMultiFilters()

  useEffect(() => {
    if (tab === 'health') setPage(1)
  }, [healthFilters.filters, bucket, tab])

  const healthView = useMemo(() => {
    if (tab !== 'health') return null
    const productsRaw =
      Array.isArray(data?.rows?.products) ? data.rows.products
      : Array.isArray(data?.rows?.products?.data) ? data.rows.products.data
      : (Array.isArray(data?.products) ? data.products : [])

    const rowCompanyNames = (p: any): string[] => {
      if (Array.isArray(p?.company_names)) return p.company_names.map((s: any) => String(s).trim()).filter(Boolean)
      if (p?.company_name != null) return [String(p.company_name).trim()].filter(Boolean)
      return []
    }
    const products: any[] = ((): any[] => {
      const sel = String(commerce || '').trim()
      if (!sel) return productsRaw
      return productsRaw.filter((p: any) => rowCompanyNames(p).includes(sel))
    })()

    const labelOf = (p: any) => String(p.title || p.name || '')

    const chartData = products.map((p: any) => ({
      label: labelOf(p),
      sold: asNum(p.sold),
      stock: asNum(p.stock)
    }))

    const sortedChartData = [...chartData].sort(
      (a, b) => (b.sold - a.sold) || a.label.localeCompare(b.label, 'fr', { sensitivity: 'base', numeric: true })
    )

    const chart = chartShell(
      'health',
      <BarChart
        data={sortedChartData}
        barCategoryGap="20%"
        margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
      >
        <XAxis
          dataKey="label"
          type="category"
          scale="band"
          interval={0}
          minTickGap={0}
          tick={{ fontSize: 11 }}
          angle={xTickAngle ?? -35}
          textAnchor="end"
          height={xTickAngle ? 60 : 30}
        />
        <YAxis />
        <Tooltip />
        <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 50 }} />
        <Bar dataKey="stock" name="Stock" fill="#14532d" isAnimationActive={false} maxBarSize={36} />
        <Bar dataKey="sold"  name="Vendu" fill="#7cb518" isAnimationActive={false} maxBarSize={36} />
      </BarChart>,
      'Santé du catalogue',
      true,
      'label'
    )

    const prodVals: string[] = Array.from(
      new Set<string>(
        products.map((p: any) =>
          String(Array.isArray(p.producer_names) ? p.producer_names.join(', ') : (p.producer_name ?? ''))
        )
      )
    )
    const compVals: string[] = Array.from(
      new Set<string>(
        products.map((p: any) =>
          String(Array.isArray(p.company_names) ? p.company_names.join(', ') : (p.company_name ?? ''))
        )
      )
    )
    const catVals: string[] = Array.from(
      new Set<string>(
        products.map((p: any) => {
          const category =
            typeof p.category === 'object'
              ? (p.category?.label ?? p.category?.name ?? p.category?.code ?? '')
              : (p.category ?? '')
          return String(category)
        })
      )
    )
    const levelVals: string[] = Array.from(
      new Set<string>(products.map((p: any) => String(riskWordFR(p.level))))
    )

    const applyFilter = (p: any) => {
      const f = healthFilters.filters
      const prod = Array.isArray(p.producer_names) ? p.producer_names.join(', ') : (p.producer_name ?? '')
      const comp = Array.isArray(p.company_names) ? p.company_names.join(', ') : (p.company_name ?? '')
      const category =
        typeof p.category === 'object'
          ? (p.category?.label ?? p.category?.name ?? p.category?.code ?? '')
          : (p.category ?? '')
      const level = riskWordFR(p.level)
      const okProducer = !f.producer || f.producer.size === 0 || f.producer.has(prod)
      const okCompany = !f.company || f.company.size === 0 || f.company.has(comp)
      const okCategory = !f.category || f.category.size === 0 || f.category.has(category)
      const okLevel = !f.level || f.level.size === 0 || f.level.has(level)
      return okProducer && okCompany && okCategory && okLevel
    }
    const filtered = products.filter(applyFilter)

    if (tab === 'health') {
      currentFiltersSummary.current = summarizeFilters(healthFilters.filters, {
        producer: 'Producteur', company: 'Commerce', category: 'Catégorie', level: 'Niveau'
      })
    }

    const sortedRows = [...filtered].sort((a, b) => {
      const diff = asNum(b.sold) - asNum(a.sold)
      if (diff !== 0) return diff
      return labelOf(a).localeCompare(labelOf(b), 'fr', { sensitivity: 'base', numeric: true })
    })

    const start = (page - 1) * pageSize
    const end = page * pageSize

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm max-w-full min-w-0 overflow-hidden" style={{ fontSize: tableFontPx }}>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                {hasProducerCol && <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Producteur" values={prodVals} colKey="producer" state={healthFilters} />
                </th>}
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Commerce" values={compVals} colKey="company" state={healthFilters} />
                </th>
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Catégorie" values={catVals} colKey="category" state={healthFilters} />
                </th>
                <th className="px-4 py-2 text-left">Produit</th>
                <th className="px-4 py-2 text-right">Stock</th>
                <th className="px-4 py-2 text-right">Vendu</th>
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Niveau" values={levelVals} colKey="level" state={healthFilters} />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.slice(start, end).map((p: any, i: number) => {
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
                    <td className="px-4 py-2">{labelOf(p)}</td>
                    <td className="px-4 py-2 text-right">{asNum(p.stock)}</td>
                    <td className="px-4 py-2 text-right">{asNum(p.sold)}</td>
                    <td className="px-4 py-2">{riskWordFR(p.level)}</td>
                  </tr>
                )
              })}
              {sortedRows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={hasProducerCol ? 7 : 6}>
                    Aucun résultat
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between mt-3 text-sm">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="border rounded px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-2 py-1 border rounded">Prev</button>
              <span>Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} className="px-2 py-1 border rounded">Next</button>
            </div>
          </div>
        </div>
      </div>
    )

    return (
      <ExportFrame
        title="Rapport d’analytique"
        note="Note graphique: barres — niveau de stock et ventes."
        filtersText={currentFiltersSummary.current}
      >
        <div className="space-y-6 max-w-full min-w-0">
          {viewMode !== 'table' && chart}
          {viewMode !== 'chart' && table}
        </div>
      </ExportFrame>
    )
  }, [data, tab, viewMode, tableFontPx, xTickAngle, hasProducerCol, healthFilters.filters, bucket, page, pageSize, commerce])



  /* ====================== IMPACT ====================== */
  const impactFilters = useMultiFilters()

  useEffect(() => {
    if (tab === 'impact') setPage(1)
  }, [impactFilters.filters, bucket, tab])

  const impactView = useMemo(() => {
    if (tab !== 'impact') return null
    const rowsRaw: any[] = Array.isArray(data?.rows) ? data.rows : []

    const rowCompanyNames = (r: any): string[] => {
      if (Array.isArray(r?.company_names)) return r.company_names.map((s: any) => String(s).trim()).filter(Boolean)
      if (r?.company_name != null) return [String(r.company_name).trim()].filter(Boolean)
      return []
    }
    const rows: any[] = ((): any[] => {
      const sel = String(commerce || '').trim()
      if (!sel) return rowsRaw
      return rowsRaw.filter((r: any) => rowCompanyNames(r).includes(sel))
    })()

    const keyFn = bucket === 'week' ? weekKeyLocal : bucket === 'month' ? monthKeyLocal : (s: string) => localDateKey(s)
    const chartData = rows.reduce((acc: Record<string, { period: string; co2: number; waste: number }>, r: any) => {
      const k = keyFn(r.created_at)
      const a = acc[k] || { period: k, co2: 0, waste: 0 }
      a.co2 += asNum(r.avoided_co2_kg)
      a.waste += asNum(r.avoided_waste_kg)
      acc[k] = a
      return acc
    }, {} as Record<string, { period: string; co2: number; waste: number }>)

    const sortKey = (p: string) => {
      if (!p) return 0
      if (bucket === 'day') return new Date(p).getTime() || 0
      if (bucket === 'month') {
        const [y, m] = p.split('-').map(Number)
        return new Date(y || 0, (m || 1) - 1, 1).getTime()
      }
      if (bucket === 'week') {
        const [yStr, wStr] = p.split('-W')
        const y = Number(yStr), w = Number(wStr)
        const base = new Date(Date.UTC(y || 0, 0, 1 + (Math.max(1, w) - 1) * 7))
        const dow = base.getUTCDay() || 7
        base.setUTCDate(base.getUTCDate() - dow + 1)
        return base.getTime()
      }
      return 0
    }

    const chartArr = Object.values(chartData).sort((a, b) => sortKey(a.period) - sortKey(b.period))

    const chart = chartShell(
      'impact',
      <LineChart data={chartArr} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 30 }} />
        <Line yAxisId="left" type="monotone" dataKey="co2" name="CO₂ (kg)" stroke="#14532d" strokeWidth={2} dot={false} />
        <Line yAxisId="right" type="monotone" dataKey="waste" name="Gaspillage (kg)" stroke="#7cb518" strokeWidth={2} dot={false} />
      </LineChart>,
      'Impact (CO₂ / déchets évités)',
      true,
      'period'
    )

    const baseRows = rows.map((r: any, i: number) => ({
      producer_name: r.producer_name ?? (Array.isArray(r.producer_names) ? r.producer_names.join(', ') : ''),
      company_name: r.company_name ?? (Array.isArray(r.company_names) ? r.company_names.join(', ') : ''),
      created_at: r.created_at,
      user_name: r.user_name ?? r.customer_name ?? r.user ?? r.user_id ?? '—',
      order_code: r.order_code,
      order_id: r.order_id,
      item_id: r.item_id,
      bundle_title: r.bundle_title ?? '—',
      avoided_co2_kg: asNum(r.avoided_co2_kg),
      avoided_waste_kg: asNum(r.avoided_waste_kg),
      savings_eur: asNum(r.savings_eur),
      _k: `${r.order_id}-${r.item_id}-${i}`,
    }))

    const prodVals = Array.from(new Set(baseRows.map(r => r.producer_name)))
    const compVals = Array.from(new Set(baseRows.map(r => r.company_name)))
    const userVals = Array.from(new Set(baseRows.map(r => r.user_name)))

    const applyFilter = (r: any) => {
      const f = impactFilters.filters
      const okProducer = !f.producer || f.producer.size === 0 || f.producer.has(r.producer_name)
      const okCompany  = !f.company  || f.company.size  === 0 || f.company.has(r.company_name)
      const okUser     = !f.user     || f.user.size     === 0 || f.user.has(r.user_name)
      return okProducer && okCompany && okUser
    }
    const filtered = baseRows.filter(applyFilter)

    if (tab === 'impact') {
      currentFiltersSummary.current = summarizeFilters(impactFilters.filters, {
        producer: 'Producteur', company: 'Commerce', user: 'Utilisateur'
      })
    }

    const totalCO2 = filtered.reduce((s, r) => s + asNum(r.avoided_co2_kg), 0)
    const totalWaste = filtered.reduce((s, r) => s + asNum(r.avoided_waste_kg), 0)
    void totalCO2; void totalWaste

    const start = (page - 1) * pageSize
    const end = page * pageSize

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm max-w-full min-w-0 overflow-hidden" style={{ fontSize: tableFontPx }}>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                {hasProducerCol && <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Producteur" values={prodVals} colKey="producer" state={impactFilters} />
                </th>}
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Commerce" values={compVals} colKey="company" state={impactFilters} />
                </th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Utilisateur" values={userVals} colKey="user" state={impactFilters} />
                </th>
                <th className="px-4 py-2 text-left">Commande</th>
                <th className="px-4 py-2 text-left">Id Item</th>
                <th className="px-4 py-2 text-left">Produit</th>
                <th className="px-4 py-2 text-right">CO₂ évité (kg)</th>
                <th className="px-4 py-2 text-right">Gaspillage évité (kg)</th>
                <th className="px-4 py-2 text-right">Économies (€)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(start, end).map((r: any) => (
                <tr key={r._k} className="border-b">
                  {hasProducerCol && <td className="px-4 py-2">{r.producer_name}</td>}
                  <td className="px-4 py-2">{r.company_name}</td>
                  <td className="px-4 py-2">{fmtDateTime(r.created_at)}</td>
                  <td className="px-4 py-2">{r.user_name}</td>
                  <td className="px-4 py-2">{r.order_code}</td>
                  <td className="px-4 py-2">{r.item_id}</td>
                  <td className="px-4 py-2">{r.bundle_title}</td>
                  <td className="px-4 py-2 text-right">{asNum(r.avoided_co2_kg).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">{asNum(r.avoided_waste_kg).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">{fmtEur(asNum(r.savings_eur))}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={hasProducerCol ? 10 : 9}>
                    Aucun résultat
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between mt-3 text-sm">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="border rounded px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-2 py-1 border rounded">Prev</button>
              <span>Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} className="px-2 py-1 border rounded">Next</button>
            </div>
          </div>
        </div>
      </div>
    )

    return (
      <ExportFrame
        title="Rapport d’analytique"
        note="Note graphique: barres — CO₂ et gaspillage évités par période."
        filtersText={currentFiltersSummary.current}
      >
        <div className="space-y-6 max-w-full min-w-0">
          {viewMode !== 'table' && chart}
          {viewMode !== 'chart' && table}
        </div>
      </ExportFrame>
    )
  }, [data, tab, viewMode, bucket, tableFontPx, hasProducerCol, xTickAngle, impactFilters.filters, page, pageSize, commerce])







  /* ====================== PAIEMENTS ====================== */
  const paymentsFilters = useMultiFilters()

  useEffect(() => {
    if (tab === 'payments') setPage(1)
  }, [paymentsFilters.filters, tab])

  const paymentsView = useMemo(() => {
    if (tab !== 'payments') return null

    const methodsServer: any[] =
      Array.isArray(data?.by_method) ? data.by_method :
      Array.isArray(data?.rows?.by_method) ? data.rows.by_method : []

    const rowsRaw: any[] = Array.isArray(data?.rows) ? data.rows : []

    const rowCompanyNames = (r: any): string[] => {
      if (Array.isArray(r?.company_names)) return r.company_names.map((s: any) => String(s).trim()).filter(Boolean)
      if (r?.company_name != null) return [String(r.company_name).trim()].filter(Boolean)
      return []
    }

    const rows: any[] = (() => {
      const sel = String(commerce || '').trim()
      if (!sel) return rowsRaw
      return rowsRaw.filter((r: any) => rowCompanyNames(r).includes(sel))
    })()

    const asNumber = (v: any) => (v == null || Number.isNaN(Number(v)) ? 0 : Number(v))

    const aggFromRows = (() => {
      const map = new Map<string, { count: number; revenue: number; success: number }>()
      for (const r of rows) {
        const key = String(r.method ?? r.payment_method ?? '—')
        const a = map.get(key) || { count: 0, revenue: 0, success: 0 }
        a.count += 1
        a.revenue += asNumber(r.amount ?? r.total_price ?? r.subtotal ?? 0)
        const status = String(r.payment_status ?? r.status ?? '').toLowerCase()
        const paid = r.paid === true || r.success === true || ['paid','succeeded','success','completed'].includes(status)
        if (paid) a.success += 1
        map.set(key, a)
      }
      return Array.from(map.entries()).map(([pm, v]) => ({
        pm,
        success_rate: v.count ? (v.success / v.count) * 100 : 0,
        aov: v.count ? (v.revenue / v.count) : 0,
      }))
    })()

    const chartData = commerce || rows.length
      ? aggFromRows
      : methodsServer.map(m => ({
          pm: m.method || 'inconnu',
          success_rate: asNumber(m.success_rate) * 100,
          aov: asNumber(m.count) ? (asNumber(m.revenue) / asNumber(m.count)) : 0,
        }))

    const chart = chartShell(
      'payments',
      <BarChart data={chartData} barCategoryGap="20%" margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <YAxis />
        <Tooltip />
        <Legend wrapperStyle={{ overflow: 'hidden' }} />
        <Bar dataKey="success_rate" name="Succès (%)" fill="#14532d" isAnimationActive={false} maxBarSize={36} />
        <Bar dataKey="aov"           name="AOV (€)"    fill="#7cb518" isAnimationActive={false} maxBarSize={36} />
      </BarChart>,
      'Paiements (taux de succès / AOV)',
      true,
      'pm'
    )

    const prodVals = Array.from(new Set(rows.map(r => Array.isArray(r.producer_names) ? r.producer_names.join(', ') : (r.producer_name ?? ''))))
    const compVals = Array.from(new Set(rows.map(r => Array.isArray(r.company_names) ? r.company_names.join(', ') : (r.company_name ?? ''))))
    const userVals = Array.from(new Set(rows.map(r => r.user_name ?? r.customer_name ?? r.user ?? r.user_id ?? '—')))
    const pmVals   = Array.from(new Set(rows.map(r => r.method ?? r.payment_method ?? '—')))

    const applyFilter = (r: any) => {
      const f = paymentsFilters.filters
      const prod = Array.isArray(r.producer_names) ? r.producer_names.join(', ') : (r.producer_name ?? '')
      const comp = Array.isArray(r.company_names) ? r.company_names.join(', ') : (r.company_name ?? '')
      const user = r.user_name ?? r.customer_name ?? r.user ?? r.user_id ?? '—'
      const pm   = r.method ?? r.payment_method ?? '—'
      const okProducer = !f.producer || f.producer.size === 0 || f.producer.has(prod)
      const okCompany  = !f.company  || f.company.size  === 0 || f.company.has(comp)
      const okUser     = !f.user     || f.user.size     === 0 || f.user.has(user)
      const okPm       = !f.method   || f.method.size   === 0 || f.method.has(pm)
      return okProducer && okCompany && okUser && okPm
    }
    const filtered = rows.filter(applyFilter)

    if (tab === 'payments') {
      currentFiltersSummary.current = summarizeFilters(paymentsFilters.filters, {
        producer: 'Producteur', company: 'Commerce', user: 'Utilisateur', method: 'Méthode'
      })
    }

    const start = (page - 1) * pageSize
    const end = page * pageSize

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm max-w-full min-w-0 overflow-hidden" style={{ fontSize: tableFontPx }}>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                {hasProducerCol && (
                  <th className="px-4 py-2 text-left">
                    <HeaderFilter title="Producteur" values={prodVals} colKey="producer" state={paymentsFilters} />
                  </th>
                )}
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Commerce" values={compVals} colKey="company" state={paymentsFilters} />
                </th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Utilisateur" values={userVals} colKey="user" state={paymentsFilters} />
                </th>
                <th className="px-4 py-2 text-left">Commande</th>
                <th className="px-4 py-2 text-left">Id Item</th>
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Méthode" values={pmVals} colKey="method" state={paymentsFilters} />
                </th>
                <th className="px-4 py-2 text-right">Montant (€)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(start, end).map((r: any, i: number) => (
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
                  <td className="px-4 py-2">{r.order_code}</td>
                  <td className="px-4 py-2">{r.order_item_id ?? r.item_id ?? '—'}</td>
                  <td className="px-4 py-2">{r.method ?? r.payment_method ?? '—'}</td>
                  <td className="px-4 py-2 text-right">{fmtEur(asNumber(r.amount ?? r.total_price ?? 0))}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={hasProducerCol ? 8 : 7}>Aucun résultat</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between mt-3 text-sm">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="border rounded px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-2 py-1 border rounded">Prev</button>
              <span>Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} className="px-2 py-1 border rounded">Next</button>
            </div>
          </div>
        </div>
      </div>
    )

    return (
      <ExportFrame
        title="Rapport d’analytique"
        note="Note graphique: barres — taux de succès et AOV par méthode de paiement."
        filtersText={currentFiltersSummary.current}
      >
        <div className="space-y-6 max-w-full min-w-0">
          {viewMode !== 'table' && chart}
          {viewMode !== 'chart' && table}
        </div>
      </ExportFrame>
    )
  }, [data, tab, viewMode, tableFontPx, hasProducerCol, xTickAngle, paymentsFilters.filters, page, pageSize, commerce])



  /* ====================== COHORTES ====================== */
  const cohortsFilters = useMultiFilters()

  useEffect(() => {
    if (tab === 'cohorts') setPage(1)
  }, [cohortsFilters.filters, tab])

  const cohortsView = useMemo(() => {
    if (tab !== 'cohorts') return null
    const itemsRaw: any[] = Array.isArray(data?.rows_company) ? data.rows_company : (Array.isArray(data?.rows) ? data.rows : [])

    const rowCompanyNames = (r: any): string[] => {
      if (Array.isArray(r?.company_names)) return r.company_names.map((s: any) => String(s).trim()).filter(Boolean)
      if (r?.company_name != null) return [String(r.company_name).trim()].filter(Boolean)
      return []
    }
    const items: any[] = (() => {
      const sel = String(commerce || '').trim()
      if (!sel) return itemsRaw
      return itemsRaw.filter((r: any) => rowCompanyNames(r).includes(sel))
    })()

    const prodVals   = Array.from(new Set(items.map((r: any) => r.producer_name ?? '—')))
    const compVals   = Array.from(new Set(items.map((r: any) => r.company_name  ?? '—')))
    const cohortVals = Array.from(new Set(items.map((r: any) => r.cohort_month  ?? '—')))

    const applyFilter = (r: any) => {
      const f = cohortsFilters.filters
      const okProducer = !f.producer || f.producer.size === 0 || f.producer.has(r.producer_name ?? '—')
      const okCompany  = !f.company  || f.company.size  === 0 || f.company.has(r.company_name  ?? '—')
      const okCohort   = !f.cohort   || f.cohort.size   === 0 || f.cohort.has(r.cohort_month  ?? '—')
      return okProducer && okCompany && okCohort
    }
    const filtered = items.filter(applyFilter)

    if (tab === 'cohorts') {
      currentFiltersSummary.current = summarizeFilters(cohortsFilters.filters, {
        producer: 'Producteur', company: 'Commerce', cohort: 'Cohorte'
      })
    }

    const start = (page - 1) * pageSize
    const end = page * pageSize

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm max-w-full min-w-0 overflow-hidden" style={{ fontSize: tableFontPx }}>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                {hasProducerCol && <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Producteur" values={prodVals} colKey="producer" state={cohortsFilters} />
                </th>}
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Commerce" values={compVals} colKey="company" state={cohortsFilters} />
                </th>
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Cohorte" values={cohortVals} colKey="cohort" state={cohortsFilters} />
                </th>
                <th className="px-4 py-2 text-left">Offsets</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(start, end).map((r: any, i: number) => (
                <tr key={`${r.company_id ?? r.user_id ?? i}`} className="border-b">
                  {hasProducerCol && <td className="px-4 py-2">{r.producer_name ?? '—'}</td>}
                  <td className="px-4 py-2">{r.company_name ?? '—'}</td>
                  <td className="px-4 py-2">{r.cohort_month}</td>
                  <td className="px-4 py-2">
                    {(r.periods || []).map((p: any) => `+${p.offset}: ${p.orders} Commandes / ${fmtEur(asNum(p.revenue))}`).join(' · ')}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={hasProducerCol ? 4 : 3}>Aucun résultat</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between mt-3 text-sm">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="border rounded px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-2 py-1 border rounded">Prev</button>
              <span>Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} className="px-2 py-1 border rounded">Next</button>
            </div>
          </div>
        </div>
      </div>
    )

    return (
      <ExportFrame
        title="Rapport d’analytique"
        note="Note: tableau des cohortes avec offsets (+0, +1, ...)."
        filtersText={currentFiltersSummary.current}
      >
        <div className="space-y-6 max-w-full min-w-0">
          {table}
        </div>
      </ExportFrame>
    )
  }, [data, tab, tableFontPx, hasProducerCol, cohortsFilters.filters, page, pageSize, commerce])



  /* ====================== GÉO ====================== */
  const geoFilters = useMultiFilters()

  useEffect(() => {
    if (tab === 'geo') setPage(1)
  }, [geoFilters.filters, tab])

  const geoView = useMemo(() => {
    if (tab !== 'geo') return null

    const byZoneServer: any[] = Array.isArray(data?.by_zone) ? data.by_zone : []
    const itemsRaw: any[]  = Array.isArray(data?.rows) ? data.rows : []

    const rowCompanyNames = (r: any): string[] => {
      if (Array.isArray(r?.company_names)) return r.company_names.map((s: any) => String(s).trim()).filter(Boolean)
      if (r?.company_name != null) return [String(r.company_name).trim()].filter(Boolean)
      return []
    }
    const items: any[] = (() => {
      const sel = String(commerce || '').trim()
      if (!sel) return itemsRaw
      return itemsRaw.filter((r: any) => rowCompanyNames(r).includes(sel))
    })()

    const regionAgg: Record<string, { code?: string; name?: string; orders: number; revenue: number }> = {}

    if (items.length) {
      for (const r of items) {
        const name = String(r.zone_desc || r.region || r.zone || '').trim()
        const code = String(r.zone_code || r.region_code || '').toUpperCase()
        const key = code || name.toLowerCase()
        if (!key) continue
        if (!regionAgg[key]) regionAgg[key] = { code: code || undefined, name: name || undefined, orders: 0, revenue: 0 }
        regionAgg[key].orders  += 1
        regionAgg[key].revenue += asNum(r.revenue_share ?? r.line_total ?? r.amount ?? 0)
      }
    } else {
      for (const z of byZoneServer) {
        const name = String(z.zone_desc || z.zone || '').trim()
        const code = String(z.zone_code || z.region_code || z.code || '').toUpperCase()
        const key = code || name.toLowerCase()
        if (!key) continue
        regionAgg[key] = {
          code: code || undefined,
          name: name || undefined,
          orders: asNum(z.orders),
          revenue: asNum(z.revenue),
        }
      }
    }

    const mapBlock = (
      <FranceRegionsMap
        data={regionAgg}
        getKey={(geo: any) => String(geo.properties?.code || '').toUpperCase()}
      />
    )

    const chartData = Object.values(regionAgg).map(v => ({
      zone: v.name || v.code || '—',
      revenue: asNum(v.revenue),
      orders:  asNum(v.orders),
    }))

    const chart = chartShell(
      'geo',
      <BarChart data={chartData} barCategoryGap="20%" margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <YAxis />
        <Tooltip />
        <Legend wrapperStyle={{ overflow: 'hidden' }} />
        <Bar dataKey="revenue" name="CA (€)"   fill="#14532d" isAnimationActive={false} maxBarSize={36} />
        <Bar dataKey="orders"  name="Commandes" fill="#7cb518" isAnimationActive={false} maxBarSize={36} />
      </BarChart>,
      'CA par zone',
      true,
      'zone'
    )

    const prodVals: string[] = Array.from(new Set(items.map(r =>
      String(r.producer_name ?? (Array.isArray(r.producer_names) ? r.producer_names.join(', ') : ''))
    )))
    const compVals: string[] = Array.from(new Set(items.map(r =>
      String(r.company_name ?? (Array.isArray(r.company_names) ? r.company_names.join(', ') : ''))
    )))
    const userVals: string[] = Array.from(new Set(items.map(r =>
      String(r.user_name ?? r.customer_name ?? r.user ?? r.user_id ?? '—')
    )))
    const zoneVals: string[] = Array.from(new Set([
      ...Object.values(regionAgg).map(v => String(v.name || v.code || '—')),
    ]))

    const applyFilter = (r: any) => {
      const f = geoFilters.filters
      const prod = r.producer_name ?? (Array.isArray(r.producer_names) ? r.producer_names.join(', ') : '')
      const comp = r.company_name   ?? (Array.isArray(r.company_names) ? r.company_names.join(', ') : '')
      const user = r.user_name ?? r.customer_name ?? r.user ?? r.user_id ?? '—'
      const zone = r.zone_desc ?? r.zone ?? '—'
      const okProducer = !f.producer || f.producer.size === 0 || f.producer.has(String(prod))
      const okCompany  = !f.company  || f.company.size  === 0 || f.company.has(String(comp))
      const okUser     = !f.user     || f.user.size     === 0 || f.user.has(String(user))
      const okZone     = !f.zone     || f.zone.size     === 0 || f.zone.has(String(zone))
      return okProducer && okCompany && okUser && okZone
    }
    const filtered = items.filter(applyFilter)

    if (tab === 'geo') {
      currentFiltersSummary.current = summarizeFilters(geoFilters.filters, {
        producer: 'Producteur',
        company:  'Commerce',
        user:     'Utilisateur',
        zone:     'Zone',
      })
    }

    const start = (page - 1) * pageSize
    const end = page * pageSize

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm max-w-full min-w-0 overflow-hidden" style={{ fontSize: tableFontPx }}>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                {hasProducerCol && (
                  <th className="px-4 py-2 text-left">
                    <HeaderFilter title="Producteur" values={prodVals} colKey="producer" state={geoFilters} />
                  </th>
                )}
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Commerce" values={compVals} colKey="company" state={geoFilters} />
                </th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Utilisateur" values={userVals} colKey="user" state={geoFilters} />
                </th>
                <th className="px-4 py-2 text-left">Commande</th>
                <th className="px-4 py-2 text-left">Id Item</th>
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Zone" values={zoneVals} colKey="zone" state={geoFilters} />
                </th>
                <th className="px-4 py-2 text-right">Montant (€)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(start, end).map((r: any, i: number) => (
                <tr key={`${r.order_id}-${r.order_item_id ?? '—'}-${i}`} className="border-b">
                  {hasProducerCol && (
                    <td className="px-4 py-2">
                      {r.producer_name ?? (Array.isArray(r.producer_names) ? r.producer_names.join(', ') : '')}
                    </td>
                  )}
                  <td className="px-4 py-2">
                    {r.company_name ?? (Array.isArray(r.company_names) ? r.company_names.join(', ') : '')}
                  </td>
                  <td className="px-4 py-2">{fmtDateTime(r.created_at)}</td>
                  <td className="px-4 py-2">{r.user_name ?? r.customer_name ?? r.user ?? r.user_id ?? '—'}</td>
                  <td className="px-4 py-2">{r.order_code}</td>
                  <td className="px-4 py-2">{r.order_item_id ?? '—'}</td>
                  <td className="px-4 py-2">{r.zone_desc ?? r.zone ?? '—'}</td>
                  <td className="px-4 py-2 text-right">
                    {fmtEur(asNum(r.revenue_share ?? r.line_total ?? 0))}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={hasProducerCol ? 8 : 7}>Aucun résultat</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between mt-3 text-sm">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="border rounded px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-2 py-1 border rounded">Prev</button>
              <span>Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} className="px-2 py-1 border rounded">Next</button>
            </div>
          </div>
        </div>
      </div>
    )

    return (
      <ExportFrame
        title="Rapport d’analytique"
        note="Note: répartition géographique des commandes."
        filtersText={currentFiltersSummary.current}
      >
        <div className="space-y-6 max-w-full min-w-0">
          {mapBlock}
          {viewMode !== 'table' && chart}
          {viewMode !== 'chart' && table}
        </div>
      </ExportFrame>
    )
  }, [data, tab, viewMode, tableFontPx, hasProducerCol, xTickAngle, geoFilters.filters, page, pageSize, commerce])



  /* ====================== REVIEWS ====================== */
  const reviewsFilters = useMultiFilters()

  useEffect(() => {
    if (tab === 'reviews') setPage(1)
  }, [reviewsFilters.filters, tab])

  const reviewsView = useMemo(() => {
    if (tab !== 'reviews') return null

    const rowsRaw: any[] = Array.isArray(data?.rows) ? data.rows : []

    const rowCompanyNames = (r: any): string[] => {
      if (Array.isArray(r?.company_names)) return r.company_names.map((s: any) => String(s).trim()).filter(Boolean)
      if (r?.company_name != null) return [String(r.company_name).trim()].filter(Boolean)
      return []
    }
    const commerceRows: any[] = (() => {
      const sel = String(commerce || '').trim()
      if (!sel) return rowsRaw
      return rowsRaw.filter((r: any) => rowCompanyNames(r).includes(sel))
    })()

    const asInt = (v: any) => (v == null || Number.isNaN(Number(v)) ? 0 : Number(v))
    const isItem  = (t: any) => String(t ?? '').trim().toLowerCase() === 'item'
    const isOrder = (t: any) => {
      const v = String(t ?? '').trim().toLowerCase()
      return v === 'order' || v === 'commande'
    }

    const applyFilter = (r: any) => {
      const f = reviewsFilters.filters
      const prod = r.producer_name ?? (Array.isArray(r.producer_names) ? r.producer_names.join(', ') : '')
      const comp = r.company_name  ?? (Array.isArray(r.company_names) ? r.company_names.join(', ') : '')
      const typ  = r.type ?? '—'
      const rtg  = String(r.rating ?? r.customer_rating ?? '—')
      const okProducer = !f.producer || f.producer.size === 0 || f.producer.has(String(prod))
      const okCompany  = !f.company  || f.company.size  === 0 || f.company.has(String(comp))
      const okType     = !f.type     || f.type.size     === 0 || f.type.has(String(typ))
      const okRating   = !f.rating   || f.rating.size   === 0 || f.rating.has(String(rtg))
      return okProducer && okCompany && okType && okRating
    }

    const rows = commerceRows.filter(applyFilter)

    const distItems: Record<string, number> = rows
      .filter(r => isItem(r.type))
      .reduce((acc: Record<string, number>, r: any) => {
        const k = String(asInt(r.rating ?? r.customer_rating))
        if (!k || k === '0') return acc
        acc[k] = (acc[k] || 0) + 1
        return acc
      }, {})

    const seenOrders = new Set<number | string>()
    const distOrders: Record<string, number> = rows
      .filter(r => isOrder(r.type))
      .reduce((acc: Record<string, number>, r: any) => {
        const oid = r.order_id ?? r.id
        if (oid != null && seenOrders.has(oid)) return acc
        if (oid != null) seenOrders.add(oid)
        const k = String(asInt(r.rating ?? r.customer_rating))
        if (!k || k === '0') return acc
        acc[k] = (acc[k] || 0) + 1
        return acc
      }, {})

    const allRatings = Array.from(new Set([...Object.keys(distItems), ...Object.keys(distOrders)]))
      .sort((a, b) => Number(a) - Number(b))

    const chartData = allRatings.map(r => ({
      rating: r,
      items:  asInt(distItems[r]),
      orders: asInt(distOrders[r]),
    }))

    const chart = chartShell(
      'reviews',
      <BarChart data={chartData} barCategoryGap="20%" margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <YAxis label={{ value: 'Nombre', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 50 }} />
        <Bar dataKey="items"  name="Articles"   fill="#14532d" isAnimationActive={false} maxBarSize={36} />
        <Bar dataKey="orders" name="Commandes"  fill="#7cb518" isAnimationActive={false} maxBarSize={36} />
      </BarChart>,
      'Répartition des notes (Articles vs Commandes)',
      false,
      'rating',
      'Note'
    )

    const pointsItems = rows
      .filter(r => isItem(r.type) && r.created_at != null)
      .map(r => ({ x: localDateTimeKey(r.created_at), y: asInt(r.rating ?? r.customer_rating) }))
      .filter(p => p.y >= 1 && p.y <= 5)

    const seenOrderPoint = new Set<string>()
    const pointsOrders = rows
      .filter(r => isOrder(r.type) && r.created_at != null)
      .map(r => {
        const x = localDateTimeKey(r.created_at)
        const y = asInt(r.rating ?? r.customer_rating)
        const key = `${x}-${r.order_id ?? r.id ?? ''}`
        return { x, y, key }
      })
      .filter(p => p.y >= 1 && p.y <= 5 && !seenOrderPoint.has(p.key) && seenOrderPoint.add(p.key))

    const timeScatter = chartShell(
      'reviews-time',
      <ScatterChart margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <YAxis type="number" dataKey="y" name="Note" domain={[1, 5]} allowDecimals={false} />
        <Tooltip labelFormatter={(v: any) => String(v)} />
        <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 50 }} />
        <Scatter name="Articles" data={pointsItems} fill="#14532d" />
        <Scatter name="Commandes" data={pointsOrders} fill="#7cb518" />
      </ScatterChart>,
      'Évolution des notes (Articles vs Commandes)',
      true,
      'x',
      'Date & heure'
    )

    const prodVals: string[] = Array.from(new Set(rows.map(r =>
      String(r.producer_name ?? (Array.isArray(r.producer_names) ? r.producer_names.join(', ') : ''))
    )))
    const compVals: string[] = Array.from(new Set(rows.map(r =>
      String(r.company_name ?? (Array.isArray(r.company_names) ? r.company_names.join(', ') : ''))
    )))
    const typeVals: string[]   = Array.from(new Set(rows.map(r => String(r.type ?? '—'))))
    const ratingVals: string[] = Array.from(new Set(rows.map(r =>
      String(r.rating ?? r.customer_rating ?? '—')
    )))

    const start = (page - 1) * pageSize
    const end = page * pageSize

    const table = (
      <div className="bg-white rounded-lg p-6 shadow-sm max-w-full min-w-0 overflow-hidden" style={{ fontSize: tableFontPx }}>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                {hasProducerCol && (
                  <th className="px-4 py-2 text-left">
                    <HeaderFilter title="Producteur" values={prodVals} colKey="producer" state={reviewsFilters} />
                  </th>
                )}
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Commerce" values={compVals} colKey="company" state={reviewsFilters} />
                </th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Type" values={typeVals} colKey="type" state={reviewsFilters} />
                </th>
                <th className="px-4 py-2 text-left">Commande</th>
                <th className="px-4 py-2 text-left">Id Item</th>
                <th className="px-4 py-2 text-left">Bundle / Titre</th>
                <th className="px-4 py-2 text-left">
                  <HeaderFilter title="Note" values={ratingVals} colKey="rating" state={reviewsFilters} />
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(start, end).map((r: any, i: number) => (
                <tr key={`${r.type}-${r.order_id ?? '0'}-${r.item_id ?? '0'}-${i}`} className="border-b">
                  {hasProducerCol && (
                    <td className="px-4 py-2">
                      {r.producer_name ?? (Array.isArray(r.producer_names) ? r.producer_names.join(', ') : '')}
                    </td>
                  )}
                  <td className="px-4 py-2">
                    {r.company_name ?? (Array.isArray(r.company_names) ? r.company_names.join(', ') : '')}
                  </td>
                  <td className="px-4 py-2">{fmtDateTime(r.rated_at ?? r.created_at)}</td>
                  <td className="px-4 py-2">{r.type}</td>
                  <td className="px-4 py-2">{r.order_code ?? '—'}</td>
                  <td className="px-4 py-2">{r.item_id ?? '—'}</td>
                  <td className="px-4 py-2">{r.bundle_title ?? r.title ?? '—'}</td>
                  <td className="px-4 py-2">{r.rating ?? r.customer_rating ?? '—'}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={hasProducerCol ? 8 : 7}>
                    Aucun résultat
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="flex items-center justify-between mt-3 text-sm">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="border rounded px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-2 py-1 border rounded">Prev</button>
              <span>Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} className="px-2 py-1 border rounded">Next</button>
            </div>
          </div>
        </div>
      </div>
    )

    return (
      <div className="space-y-6 max-w-full min-w-0">
        {viewMode !== 'table' && (
          <>
            {chart}
            {timeScatter}
          </>
        )}
        {viewMode !== 'chart' && table}
      </div>
    )
  }, [data, tab, viewMode, tableFontPx, xTickAngle, hasProducerCol, reviewsFilters.filters, page, pageSize, commerce])






  /* ====================== RENDER ====================== */
  return (
    <div className="space-y-6 isolate">
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b py-2">
        <div className="flex flex-wrap gap-2 px-2">
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