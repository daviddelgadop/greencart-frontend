// src/tabs/ProducerDashboardTab.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { http } from '../lib/api'
import {
  TrendingUp, Receipt, Users, ShoppingCart, Layers, HeartPulse, Leaf,
  BarChart3, CreditCard, CalendarRange, MapPin,
  Table as TableIcon, LineChart as LineChartIcon, Layout as BothIcon,
} from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useAuth } from '../contexts/AuthContext'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from 'recharts'

type SubTab =
  | 'sales' | 'orders' | 'customers' | 'carts' | 'catalog'
  | 'health' | 'impact' | 'category' | 'payments' | 'cohorts' | 'geo'

type Bucket = 'day' | 'week' | 'month'
type ViewMode = 'table' | 'chart' | 'both'

const asNum = (v: any, d = 0) => (v == null || v === '' || isNaN(Number(v)) ? d : Number(v))
const fmtEur = (n: number) => `${n.toFixed(2)}€`
const fmtDate = (s?: string) => (s ? new Date(s).toLocaleString('fr-FR') : '')
const ascii = (s: string) => s.normalize('NFKD').replace(/[^\x20-\x7E]/g, '')

// === Roll-up helpers
type Point = { period: string; revenue?: number; orders?: number; units?: number };

const toDate = (s: string) => new Date(s);

// Semaine ISO 
function isoWeek(d: Date) {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = tmp.getUTCDay() || 7;           // 1..7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum); // jueves de esa semana
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// YYYY-Www
const weekKey = (s: string) => {
  const d = toDate(s);
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const y = tmp.getUTCFullYear();
  const w = isoWeek(d);
  return `${y}-W${String(w).padStart(2, '0')}`;
};

// YYYY-MM
const monthKey = (s: string) => {
  const d = toDate(s);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// roll-up
function rollSeries(series: Point[], bucket: 'day'|'week'|'month'): Point[] {
  if (bucket === 'day') return series;

  const keyFn = bucket === 'week' ? weekKey : monthKey;
  const acc: Record<string, { revenue: number; orders: number; units: number }> = {};

  for (const p of series) {
    const k = keyFn(p.period);
    acc[k] ||= { revenue: 0, orders: 0, units: 0 };
    acc[k].revenue += Number(p.revenue || 0);
    acc[k].orders  += Number(p.orders  || 0);
    acc[k].units   += Number(p.units   || 0);
  }

  return Object.entries(acc)
    .sort(([a],[b]) => a.localeCompare(b))
    .map(([period, v]) => ({ period, ...v }));
}


function KpiCard({ title, value, hint }: { title: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <p className="text-gray-600 text-xs">{title}</p>
      <p className="text-2xl font-bold text-dark-green leading-tight">{value}</p>
      {hint ? <p className="text-xs text-green-700 mt-1">{hint}</p> : null}
    </div>
  )
}
function JsonView({ data }: { data: any }) {
  return (
    <pre className="text-xs bg-gray-50 rounded-lg p-4 shadow-sm overflow-auto max-h-[60vh]">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

export default function ProducerDashboardTab() {

  const rcKey = (name: string, useBucket = false) =>
    `${name}-${useBucket ? bucket + '-' : ''}${dateFrom}-${dateTo}-${limit}`;

  const { user } = useAuth()
  const [tab, setTab] = useState<SubTab>('sales')
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 2); return d.toISOString().slice(0, 10)
  })
  const [dateTo, setDateTo] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [bucket, setBucket] = useState<Bucket>('day')
  const [limit, setLimit] = useState<number>(100)
  const [viewMode, setViewMode] = useState<ViewMode>('both')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)

  const reportRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  const subTabs: { id: SubTab; label: string; icon: any }[] = [
    { id: 'sales',    label: 'Ventes',        icon: TrendingUp },
    { id: 'orders',   label: 'Commandes',     icon: Receipt },
    { id: 'customers',label: 'Clients',       icon: Users },
    { id: 'carts',    label: 'Paniers',       icon: ShoppingCart },
    { id: 'catalog',  label: 'Catalogue',     icon: Layers },
    { id: 'health',   label: 'Santé',         icon: HeartPulse },
    { id: 'impact',   label: 'Impact',        icon: Leaf },
    { id: 'category', label: 'Par catégorie', icon: BarChart3 },
    { id: 'payments', label: 'Paiements',     icon: CreditCard },
    { id: 'cohorts',  label: 'Cohortes',      icon: CalendarRange },
    { id: 'geo',      label: 'Géo',           icon: MapPin },
  ]
  const firstRow = subTabs.slice(0, 7)
  const secondRow = subTabs.slice(7)

  async function fetcher() {
    setLoading(true); setError(null)
    try {
      let url = ''
      const params: Record<string, any> = { date_from: dateFrom, date_to: dateTo, limit }
      if (tab === 'sales') { url = '/api/producer/analytics/sales/timeseries/'; params.bucket = bucket }
      else if (tab === 'orders') { url = '/api/producer/analytics/orders/deep/' }
      else if (tab === 'customers') { url = '/api/producer/analytics/customers/deep/' }
      else if (tab === 'carts') { url = '/api/producer/analytics/carts/abandoned/deep/' }
      else if (tab === 'catalog') { url = '/api/producer/analytics/catalog/deep/' }
      else if (tab === 'health') { url = '/api/producer/analytics/products/health/' }
      else if (tab === 'impact') { url = '/api/producer/analytics/impact/' }
      else if (tab === 'category') { url = '/api/producer/analytics/sales/by-category/deep/'; params.bucket = bucket }
      else if (tab === 'payments') { url = '/api/producer/analytics/payments/deep/' }
      else if (tab === 'cohorts') { url = '/api/producer/analytics/cohorts/monthly/' }
      else if (tab === 'geo') { url = '/api/producer/analytics/geo/deep/' }
      const res = await http.get(url, { params })
      setData((res as any)?.data ?? res)
    } catch (e: any) {
      setError(e?.response?.data ? JSON.stringify(e.response.data) : 'Erreur de chargement')
      setData(null)
    } finally { setLoading(false) }
  }


  useEffect(() => {
    const tid = setTimeout(() => { fetcher() }, 150)
    return () => clearTimeout(tid)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, dateFrom, dateTo, bucket, limit])


  const onRefresh = () => fetcher()

  function getExportTable(current: SubTab, payload: any, max: number): { headers: string[]; rows: any[]; filename: string } {
    const take = (arr: any[]) => (Array.isArray(arr) ? arr.slice(0, max) : [])
    const safe = (obj: any, keys: string[]) => keys.filter(Boolean).map(k => (obj?.[k] !== undefined ? k : '')).filter(Boolean)
    if (!payload) return { headers: [], rows: [], filename: `report_${current}` }
    switch (current) {
      case 'sales': {
        const series = take(payload?.series || [])
        const headers = ['period', 'revenue', 'orders', 'units']
        return { headers, rows: series, filename: 'sales_timeseries' }
      }
      case 'orders': {
        const items = take(Array.isArray(payload) ? payload : payload?.rows || [])
        const headers = ['id','created_at','status','total_price'] // los que existan
        return { headers, rows: items, filename: 'orders' }
      }
      case 'customers': {
        const items = take(Array.isArray(payload) ? payload : payload?.rows || [])
        const headers = ['user_id','orders','spent','first_order','last_order','segment']
        return { headers, rows: items, filename: 'customers' }
      }
      case 'carts': {
        const items = take(payload?.rows || [])
        const headers = ['cart_id','user_id','items_qty','updated_at']
        return { headers, rows: items, filename: 'carts' }
      }
      case 'catalog': {
        const items = take(payload?.products || payload?.rows || payload?.results || [])
        const headers = ['title','sku','stock','sold','category']
        const rows = items.map((p: any) => ({
          ...p,
          category: typeof p?.category === 'object' ? (p.category?.name ?? '') : (p?.category ?? '')
        }))
        return { headers, rows, filename: 'catalog' }
      }
      case 'health': {
        const items = take(payload?.rows?.products?.data || [])
        const headers = safe(items[0], ['product_id','title','stock','sold','level'])
        return { headers, rows: items, filename: 'health_products' }
      }
      case 'impact': {
        const items = take(payload?.rows || [])
        const headers = safe(items[0], ['order_id','created_at','avoided_waste_kg','avoided_co2_kg','savings_eur'])
        return { headers, rows: items, filename: 'impact' }
      }
      case 'category': {
        const items = take(payload?.by_category || [])
        const headers = safe(items[0], ['category_id','category_name','revenue','orders','units'])
        return { headers, rows: items, filename: 'sales_by_category' }
      }
      case 'payments': {
        const items = take(payload?.rows || [])
        const headers = safe(items[0], ['order_id','created_at','method','status','amount'])
        return { headers, rows: items, filename: 'payments' }
      }
      case 'cohorts': {
        const items = take(payload?.rows || [])
        const headers = safe(items[0], ['user_id','cohort_month','first_order','orders','revenue'])
        return { headers, rows: items, filename: 'cohorts' }
      }
      case 'geo': {
        const items = take(payload?.rows || [])
        const headers = safe(items[0], ['order_id','created_at','total_price','zone'])
        return { headers, rows: items, filename: 'geo' }
      }
      default:
        return { headers: [], rows: [], filename: `report_${current}` }
    }
  }

  function toCsvCell(v: any) {
    if (v == null) return ''
    if (typeof v === 'object') {
      if ('name' in (v as any)) return String((v as any).name ?? '')
      return JSON.stringify(v)
    }
    const s = String(v)
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  async function onExportCSV() {
    const { headers, rows, filename } = getExportTable(tab, data, limit)
    const csv = [
      headers.join(','),
      ...rows.map((r: any) => headers.map(h => toCsvCell(r?.[h])).join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const today = new Date().toISOString().slice(0,10)
    a.download = `${filename}_${today}.csv`
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }


    const labelMap: Record<SubTab, string> = {
    sales: 'Ventes', orders: 'Commandes', customers: 'Clients', carts: 'Paniers',
    catalog: 'Catalogue', health: 'Santé', impact: 'Impact', category: 'Par catégorie',
    payments: 'Paiements', cohorts: 'Cohortes', geo: 'Géo'
    }
    const getCurrentLabel = (t: SubTab) => labelMap[t] ?? t


    async function onExportPDF() {
        if (!reportRef.current) return;
        setExporting(true);
        const node = reportRef.current;

        try {
            const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const padX = 36;
            const contentWidth = pageWidth - padX * 2;

            const headerTop = 36;
            const headerL2 = headerTop + 18;
            const headerL3 = headerTop + 32;
            const headerL4 = headerTop + 46;
            const headerHeight = headerL4 + 10;
            const marginTop = headerHeight + 8;
            const marginBottom = 40;
            const usablePageHeight = pageHeight - marginTop - marginBottom;

            const normalize = (s: string) =>
            s
                .normalize('NFKD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^\x20-\x7E]/g, '');

            const currentLabel =
            (
                [
                { id: 'sales', label: 'Ventes' }, { id: 'orders', label: 'Commandes' },
                { id: 'customers', label: 'Clients' }, { id: 'carts', label: 'Paniers' },
                { id: 'catalog', label: 'Catalogue' }, { id: 'health', label: 'Sante' },
                { id: 'impact', label: 'Impact' }, { id: 'category', label: 'Par categorie' },
                { id: 'payments', label: 'Paiements' }, { id: 'cohorts', label: 'Cohortes' },
                { id: 'geo', label: 'Geo' }
                ] as Array<{ id: SubTab; label: string }>
            ).find(x => x.id === tab)?.label ?? String(tab);

            const producerName =
            user?.first_name && user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : user?.public_display_name || user?.email || 'Producteur';
            const producerEmail = user?.email ? ` - ${user.email}` : '';
            const bucketLabel = bucket === 'day' ? 'Jour' : bucket === 'week' ? 'Semaine' : 'Mois';
            const header1 = normalize(`Dashboard - ${currentLabel}`);
            const header2 = normalize(`${producerName}${producerEmail}`);
            const header3 = normalize(`Periode: ${dateFrom} - ${dateTo}   -   Granularite: ${bucketLabel}   -   Vue: ${viewMode.toUpperCase()}`);
            const header4 = normalize(`Genere: ${new Date().toLocaleString('fr-FR')}`);

            const pxWidth = Math.floor(pageWidth * (96 / 72));
            const original = { width: node.style.width, maxWidth: node.style.maxWidth, margin: node.style.margin, overflow: node.style.overflow };
            node.style.width = `${pxWidth}px`;
            node.style.maxWidth = `${pxWidth}px`;
            node.style.margin = '0 auto';
            node.style.overflow = 'visible';
            window.dispatchEvent(new Event('resize'));
            await new Promise(r => setTimeout(r, 60));

            const canvas = await html2canvas(node, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true,
            foreignObjectRendering: false,
            });
            const imgData = canvas.toDataURL('image/png');

            const scale = contentWidth / canvas.width;
            const imgHeight = canvas.height * scale;

            let heightLeft = imgHeight;
            pdf.addImage(imgData, 'PNG', padX, marginTop, contentWidth, imgHeight);
            heightLeft -= usablePageHeight;

            while (heightLeft > 0) {
            pdf.addPage();
            const shift = imgHeight - heightLeft;
            pdf.addImage(imgData, 'PNG', padX, marginTop - shift, contentWidth, imgHeight);
            heightLeft -= usablePageHeight;
            }

            const pages = pdf.getNumberOfPages();
            for (let i = 1; i <= pages; i++) {
            pdf.setPage(i);
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, pageWidth, marginTop, 'F');
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(14);
            pdf.text(header1, padX, headerTop);
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
            pdf.text(header2, padX, headerL2);
            pdf.text(header3, padX, headerL3);
            pdf.setTextColor(90);
            pdf.text(header4, padX, headerL4);
            pdf.setTextColor(0);
            const footer = `Page ${i}/${pages}`;
            pdf.setFontSize(9);
            pdf.text(footer, pageWidth - padX - pdf.getTextWidth(footer), pageHeight - 16);
            }

            const today = new Date().toISOString().slice(0, 10);
            pdf.save(`dashboard_${tab}_${today}.pdf`);

            node.style.width = original.width;
            node.style.maxWidth = original.maxWidth;
            node.style.margin = original.margin;
            node.style.overflow = original.overflow;
            window.dispatchEvent(new Event('resize'));
        } catch (err) {
            console.error('Export PDF error:', err);
        } finally {
            setExporting(false);
        }
    }



  const Toolbar = (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2 mb-2">
        {firstRow.map(s => {
          const ActiveIcon = s.icon; const active = s.id === tab
          return (
            <button key={s.id} onClick={() => setTab(s.id)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-dark-green text-pale-yellow' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}>
              <ActiveIcon className="w-4 h-4" /> {s.label}
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        {secondRow.map(s => {
          const ActiveIcon = s.icon; const active = s.id === tab
          return (
            <button key={s.id} onClick={() => setTab(s.id)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-dark-green text-pale-yellow' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}>
              <ActiveIcon className="w-4 h-4" /> {s.label}
            </button>
          )
        })}
      </div>

      <div className="mt-4 bg-white rounded-lg p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-dark-green mb-1">Du</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark-green mb-1">Au</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark-green mb-1">Granularité</label>
            <select value={bucket} onChange={e => setBucket(e.target.value as Bucket)} className="w-full px-3 py-2 border rounded-lg">
              <option value="day">Jour</option>
              <option value="week">Semaine</option>
              <option value="month">Mois</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark-green mb-1">Limite</label>
            <input type="number" min={10} step={10} value={limit} onChange={e => setLimit(parseInt(e.target.value || '10', 10))} className="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-dark-green mb-1">Vue</label>
            <div className="flex rounded-lg overflow-hidden border">
              <button onClick={() => setViewMode('table')}
                className={`flex-1 px-3 py-2 text-sm inline-flex items-center justify-center gap-2 ${
                  viewMode === 'table' ? 'bg-dark-green text-pale-yellow' : 'bg-white hover:bg-gray-50'
                }`}><TableIcon className="w-4 h-4" /> Tableau</button>
              <button onClick={() => setViewMode('chart')}
                className={`flex-1 px-3 py-2 text-sm inline-flex items-center justify-center gap-2 ${
                  viewMode === 'chart' ? 'bg-dark-green text-pale-yellow' : 'bg-white hover:bg-gray-50'
                }`}><LineChartIcon className="w-4 h-4" /> Graphique</button>
              <button onClick={() => setViewMode('both')}
                className={`flex-1 px-3 py-2 text-sm inline-flex items-center justify-center gap-2 ${
                  viewMode === 'both' ? 'bg-dark-green text-pale-yellow' : 'bg-white hover:bg-gray-50'
                }`}><BothIcon className="w-4 h-4" /> Les deux</button>
            </div>
          </div>
          <div className="lg:col-span-1 flex lg:justify-end">
            <button
              onClick={onRefresh}
              className="bg-dark-green text-pale-yellow px-4 py-2 rounded-lg font-semibold hover:bg-dark-green/90"
            >
              Actualiser
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-start lg:justify-end">
          <button
            onClick={onExportCSV}
            disabled={exporting}
            className="px-4 py-2 rounded-lg font-semibold bg-white text-dark-green ring-1 ring-black/5 hover:bg-gray-50 disabled:opacity-60"
          >
            Exporter CSV
          </button>
          <button
            onClick={onExportPDF}
            disabled={exporting}
            className="px-4 py-2 rounded-lg font-semibold bg-white text-dark-green ring-1 ring-black/5 hover:bg-gray-50 disabled:opacity-60"
          >
            Exporter PDF
          </button>
        </div>
      </div>
    </div>
  )

    const salesView = useMemo(() => {
        if (tab !== 'sales') return null
        const results: any[] = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : []

        const dayKey = (s?: string) => s ? new Date(s).toISOString().slice(0, 10) : 'n/a'

        const perSale = results.map((o: any) => ({
            period: dayKey(o.created_at),
            revenue: asNum(o.total_price),
            units: asNum(o.units_count || 0),
        }))

        const byDay: Record<string, { revenue: number; units: number }> = {}
        for (const p of perSale) {
            const k = p.period
            byDay[k] ||= { revenue: 0, units: 0 }
            byDay[k].revenue += p.revenue || 0
            byDay[k].units += p.units || 0
        }

        const dailySeries = Object.entries(byDay)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([period, v]) => ({ period, ...v }))

        const chartData = bucket === 'day'
            ? dailySeries
            : rollSeries(dailySeries, bucket)

        const chartBlock = (
            <div className="bg-white rounded-lg p-6 shadow-sm">
            <h4 className="text-sm font-semibold text-dark-green mb-3">Chiffre d'affaires par jour</h4>
            <div className="w-full" style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%" key={rcKey('sales', true)}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" label={{ value: 'Date', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Valeur (€)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" name="CA (€)" stroke="#14532d" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="units" name="Unités" stroke="#4d7c0f" strokeWidth={2} dot={false} />
                </LineChart>
                </ResponsiveContainer>
            </div>
            </div>
        )

        const tableBlock = (
            <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="overflow-auto">
                <table className="w-full table-auto">
                <thead>
                    <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                    <th className="px-4 py-2 text-left">Vente</th>
                    <th className="px-4 py-2 text-right">Total</th>
                    <th className="px-4 py-2 text-left">Créée</th>
                    <th className="px-4 py-2 text-left">Unités</th>
                    </tr>
                </thead>
                <tbody>
                    {results.slice(0, limit).map((o: any, i: number) => (
                    <tr key={o.id || i} className="border-b">
                        <td className="px-4 py-2">{o.id}</td>
                        <td className="px-4 py-2 text-right">{fmtEur(asNum(o.total_price))}</td>
                        <td className="px-4 py-2">{fmtDate(o.created_at)}</td>
                        <td className="px-4 py-2">{o.units_count || 0}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            </div>
        )

        return <div className="space-y-6">{viewMode !== 'table' && chartBlock}{viewMode !== 'chart' && tableBlock}</div>
        }, [data, limit, tab, viewMode, bucket])

        const ordersView = useMemo(() => {
            if (tab !== 'orders') return null
            const results: any[] = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : []

            const dayKey = (s?: string) => s ? new Date(s).toISOString().slice(0, 10) : 'n/a'

            const perOrder = results.map((o: any) => ({
                period: dayKey(o.created_at),
                revenue: asNum(o.total_price),
                orders: 1,
                units: 0,
            }))

            const byDay: Record<string, { revenue: number; orders: number; units: number }> = {}
            for (const p of perOrder) {
                const k = p.period
                byDay[k] ||= { revenue: 0, orders: 0, units: 0 }
                byDay[k].revenue += p.revenue || 0
                byDay[k].orders += p.orders || 0
                byDay[k].units += p.units || 0
            }

            const dailySeries = Object.entries(byDay)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([period, v]) => ({ period, ...v }))

            const chartData = bucket === 'day'
                ? dailySeries
                : rollSeries(dailySeries, bucket)

            const chartBlock = (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                <h4 className="text-sm font-semibold text-dark-green mb-3">CA et commandes par jour</h4>
                <div className="w-full" style={{ height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%" key={rcKey('orders', true)}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" label={{ value: 'Date', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: 'Valeur', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="revenue" name="CA (€)" fill="#14532d" isAnimationActive={false} />
                        <Bar dataKey="orders" name="Cmd" fill="#4d7c0f" isAnimationActive={false} />
                    </BarChart>
                    </ResponsiveContainer>
                </div>
                </div>
            )

            const tableBlock = (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="overflow-auto">
                    <table className="w-full table-auto">
                    <thead>
                        <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                        <th className="px-4 py-2 text-left">Commande</th>
                        <th className="px-4 py-2 text-right">Total</th>
                        <th className="px-4 py-2 text-left">Créée</th>
                        <th className="px-4 py-2 text-left">Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.slice(0, limit).map((o: any, i: number) => (
                        <tr key={o.id || i} className="border-b">
                            <td className="px-4 py-2">{o.id}</td>
                            <td className="px-4 py-2 text-right">{fmtEur(asNum(o.total_price))}</td>
                            <td className="px-4 py-2">{fmtDate(o.created_at)}</td>
                            <td className="px-4 py-2">{o.status || ''}</td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                </div>
            )

        return <div className="space-y-6">{viewMode !== 'table' && chartBlock}{viewMode !== 'chart' && tableBlock}</div>
    }, [data, limit, tab, viewMode, bucket])


  const customersView = useMemo(() => {
    if (tab !== 'customers') return null
    const results: any[] = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : []
    const topBySpent = [...results]
        .sort((a,b) => asNum(b.spent) - asNum(a.spent))
        .slice(0, 12)
        .map(r => ({ label: String(r.user_id), value: asNum(r.spent) }))

    const chartBlock = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h4 className="text-sm font-semibold text-dark-green mb-3">Top clients par dépense</h4>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%" key={rcKey('customers')}>
            <BarChart data={topBySpent}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={false} label={{ value: 'Client', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Dépense (€)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Dépense (€)" fill="#14532d" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )

    const tableBlock = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="overflow-auto">
          <table className="w-full table-auto">
            <thead>
            <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                <th className="px-4 py-2 text-left">Utilisateur</th>
                <th className="px-4 py-2 text-right">Cmd</th>
                <th className="px-4 py-2 text-right">Dépense (€)</th>
                <th className="px-4 py-2 text-left">1ère cmd</th>
                <th className="px-4 py-2 text-left">Dernière cmd</th>
                <th className="px-4 py-2 text-left">Segment</th>
            </tr>
            </thead>
            <tbody>
            {results.slice(0, limit).map((c: any, i: number) => (
                <tr key={c.user_id || i} className="border-b">
                <td className="px-4 py-2">{c.user_id}</td>
                <td className="px-4 py-2 text-right">{asNum(c.orders)}</td>
                <td className="px-4 py-2 text-right">{asNum(c.spent).toFixed(2)}</td>
                <td className="px-4 py-2">{fmtDate(c.first_order)}</td>
                <td className="px-4 py-2">{fmtDate(c.last_order)}</td>
                <td className="px-4 py-2">{c.segment || ''}</td>
                </tr>
            ))}
            </tbody>
          </table>
        </div>
      </div>
    )

    return <div className="space-y-6">{viewMode !== 'table' && chartBlock}{viewMode !== 'chart' && tableBlock}</div>
  }, [data, limit, tab, viewMode])

  const catalogView = useMemo(() => {
    if (tab !== 'catalog') return null
    const items = Array.isArray(data?.products) ? data.products
      : Array.isArray(data?.rows) ? data.rows
      : Array.isArray(data?.results) ? data.results : []
    const tableCols = ['title','sku','stock','sold','category']

    const chartData = items.slice(0, 12).map((p: any) => ({
      label: p.title || p.name, sold: asNum(p.sold), stock: asNum(p.stock),
    }))

    const chartBlock = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h4 className="text-sm font-semibold text-dark-green mb-3">Ventes & stock par produit</h4>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%" key={rcKey('catalog')}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={false} label={{ value: 'Produit', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Quantité', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="sold" name="Vendu" fill="#14532d" isAnimationActive={false} />
              <Bar dataKey="stock" name="Stock" fill="#4d7c0f" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )

    const tableBlock = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="overflow-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                {tableCols.map(k => <th key={k} className="px-4 py-2 text-left">{k.toUpperCase()}</th>)}
              </tr>
            </thead>
            <tbody>
              {items.slice(0, limit).map((p: any, i: number) => (
                <tr key={p.product_id || i} className="border-b">
                  <td className="px-4 py-2">{p.title || p.name}</td>
                  <td className="px-4 py-2">{p.sku ?? ''}</td>
                  <td className="px-4 py-2">{asNum(p.stock)}</td>
                  <td className="px-4 py-2">{asNum(p.sold)}</td>
                  <td className="px-4 py-2">{typeof p.category === 'object' ? (p.category?.name ?? '') : (p.category ?? '')}</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={tableCols.length}>Aucun résultat</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )

    return <div className="space-y-6">{viewMode !== 'table' && chartBlock}{viewMode !== 'chart' && tableBlock}</div>
  }, [data, limit, tab, viewMode])

  const healthView = useMemo(() => {
    if (tab !== 'health') return null
    const summary = data?.summary || {}
    const items = Array.isArray(data?.rows?.products?.data) ? data.rows.products.data : []
    const top = Array.isArray(data?.top_products) ? data.top_products : []
    const chartData = top.map((t: any) => ({ label: t.label, units: asNum(t.units) }))

    const chartBlock = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h4 className="text-sm font-semibold text-dark-green mb-3">Top produits (unités)</h4>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%" key={rcKey('health')}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={false} label={{ value: 'Produit', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Unités', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="units" name="Unités" fill="#14532d" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )

    const tableBlock = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="overflow-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                <th className="px-4 py-2 text-left">Produit</th>
                <th className="px-4 py-2 text-right">Stock</th>
                <th className="px-4 py-2 text-right">Vendu</th>
                <th className="px-4 py-2 text-left">Niveau</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, limit).map((p: any, i: number) => (
                <tr key={p.product_id || i} className="border-b">
                  <td className="px-4 py-2">{p.title}</td>
                  <td className="px-4 py-2 text-right">{asNum(p.stock)}</td>
                  <td className="px-4 py-2 text-right">{asNum(p.sold)}</td>
                  <td className="px-4 py-2">{p.level}</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={4}>Aucun résultat</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <KpiCard title="Produits (total)" value={asNum(summary?.products?.count)} />
          <KpiCard title="Zero stock" value={asNum(summary?.products?.zero_stock)} />
          <KpiCard title="Faible stock" value={asNum(summary?.products?.low_stock)} />
        </div>
        {viewMode !== 'table' && chartBlock}
        {viewMode !== 'chart' && tableBlock}
      </div>
    )
  }, [data, limit, tab, viewMode])

  const categoryView = useMemo(() => {
    if (tab !== 'category') return null
    const byCat = Array.isArray(data?.by_category) ? data.by_category : []
    const items = byCat
    const chartData = byCat.map((c: any) => ({ label: c.category_name || c.category_id, revenue: asNum(c.revenue), orders: asNum(c.orders) }))

    const chartBlock = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h4 className="text-sm font-semibold text-dark-green mb-3">CA par catégorie</h4>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%" key={rcKey('category', true)}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" label={{ value: 'Catégorie', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Valeur', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" name="CA (€)" fill="#14532d" isAnimationActive={false} />
              <Bar dataKey="orders" name="Cmd" fill="#4d7c0f" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )

    const tableBlock = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="overflow-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                <th className="px-4 py-2 text-left">Catégorie</th>
                <th className="px-4 py-2 text-right">CA</th>
                <th className="px-4 py-2 text-right">Cmd</th>
                <th className="px-4 py-2 text-right">Unités</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, limit).map((c: any, i: number) => (
                <tr key={c.category_id || i} className="border-b">
                  <td className="px-4 py-2">{c.category_name || c.category_id}</td>
                  <td className="px-4 py-2 text-right">{asNum(c.revenue).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">{asNum(c.orders)}</td>
                  <td className="px-4 py-2 text-right">{asNum(c.units)}</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={4}>Aucun résultat</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )

    return <div className="space-y-6">{viewMode !== 'table' && chartBlock}{viewMode !== 'chart' && tableBlock}</div>
  }, [data, limit, tab, viewMode])

  const paymentsView = useMemo(() => {
    if (tab !== 'payments') return null
    const byMethod = Array.isArray(data?.by_method) ? data.by_method : []
    const items = Array.isArray(data?.rows) ? data.rows : []
    const chartData = byMethod.map((m: any) => ({ label: m.method, revenue: asNum(m.revenue), count: asNum(m.count) }))

    const chartBlock = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h4 className="text-sm font-semibold text-dark-green mb-3">Paiements par méthode</h4>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%" key={rcKey('payments')}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" label={{ value: 'Méthode', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Valeur', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" name="CA (€)" fill="#14532d" isAnimationActive={false} />
              <Bar dataKey="count" name="Transactions" fill="#4d7c0f" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )

    const tableBlock = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="overflow-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                <th className="px-4 py-2 text-left">Commande</th>
                <th className="px-4 py-2 text-left">Méthode</th>
                <th className="px-4 py-2 text-right">Montant</th>
                <th className="px-4 py-2 text-left">Statut</th>
                <th className="px-4 py-2 text-left">Créée</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, limit).map((r: any, i: number) => (
                <tr key={r.order_id || i} className="border-b">
                  <td className="px-4 py-2">{r.order_id}</td>
                  <td className="px-4 py-2">{r.method}</td>
                  <td className="px-4 py-2 text-right">{asNum(r.amount).toFixed(2)}</td>
                  <td className="px-4 py-2">{r.status}</td>
                  <td className="px-4 py-2">{fmtDate(r.created_at)}</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={5}>Aucun résultat</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )

    return <div className="space-y-6">{viewMode !== 'table' && chartBlock}{viewMode !== 'chart' && tableBlock}</div>
  }, [data, limit, tab, viewMode])

  const cohortsView = useMemo(() => {
    if (tab !== 'cohorts') return null
    const cohorts = Array.isArray(data?.cohorts) ? data.cohorts : []
    const items = Array.isArray(data?.rows) ? data.rows : []
    const chartData = cohorts.map((c: any) => ({
      cohort: c.cohort_month,
      revenue: (Array.isArray(c.periods) ? c.periods : []).reduce((s: number, p: any) => s + asNum(p.revenue), 0),
      orders: (Array.isArray(c.periods) ? c.periods : []).reduce((s: number, p: any) => s + asNum(p.orders), 0),
    }))

    const chartBlock = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h4 className="text-sm font-semibold text-dark-green mb-3">Revenu par cohorte</h4>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%" key={rcKey('cohorts')}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cohort" label={{ value: 'Cohorte', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Valeur', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" name="CA (€)" fill="#14532d" isAnimationActive={false} />
              <Bar dataKey="orders" name="Cmd" fill="#4d7c0f" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )

    const tableBlock = (
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
                  <td className="px-4 py-2">{r.user_id ?? ''}</td>
                  <td className="px-4 py-2">{r.cohort_month ?? ''}</td>
                  <td className="px-4 py-2">{fmtDate(r.first_order)}</td>
                  <td className="px-4 py-2 text-right">{asNum(r.orders).toFixed(0)}</td>
                  <td className="px-4 py-2 text-right">{asNum(r.revenue).toFixed(2)}</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={5}>Aucun résultat</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )

    return <div className="space-y-6">{viewMode !== 'table' && chartBlock}{viewMode !== 'chart' && tableBlock}</div>
  }, [data, limit, tab, viewMode])

  const geoView = useMemo(() => {
    if (tab !== 'geo') return null
    const byZone = Array.isArray(data?.by_zone) ? data.by_zone : []
    const items = Array.isArray(data?.rows) ? data.rows : []
    const chartData = byZone.map((z: any) => ({ zone: z.zone, revenue: asNum(z.revenue), orders: asNum(z.orders) }))

    const chartBlock = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h4 className="text-sm font-semibold text-dark-green mb-3">CA par zone</h4>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%" key={rcKey('geo')}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="zone" label={{ value: 'Zone', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Valeur', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" name="CA (€)" fill="#14532d" isAnimationActive={false} />
              <Bar dataKey="orders" name="Cmd" fill="#4d7c0f" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )

    const tableBlock = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="overflow-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                <th className="px-4 py-2 text-left">Commande</th>
                <th className="px-4 py-2 text-right">Total</th>
                <th className="px-4 py-2 text-left">Créée</th>
                <th className="px-4 py-2 text-left">Zone</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, limit).map((r: any, i: number) => (
                <tr key={r.order_id || i} className="border-b">
                  <td className="px-4 py-2">{r.order_id}</td>
                  <td className="px-4 py-2 text-right">{asNum(r.total_price).toFixed(2)}</td>
                  <td className="px-4 py-2">{fmtDate(r.created_at)}</td>
                  <td className="px-4 py-2">{r.zone}</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={4}>Aucun résultat</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )

    return <div className="space-y-6">{viewMode !== 'table' && chartBlock}{viewMode !== 'chart' && tableBlock}</div>
  }, [data, limit, tab, viewMode])

  const cartsView = useMemo(() => {
    if (tab !== 'carts') return null
    const summary = data?.summary || {}
    const items: any[] = Array.isArray(data?.rows) ? data.rows : []
    const topAbandoned = Array.isArray(summary?.top_abandoned_products)
      ? summary.top_abandoned_products
      : Array.isArray(data?.top_abandoned_products)
      ? data.top_abandoned_products
      : []

    const chartData = topAbandoned.map((p: any) => ({ label: p.label || p.title, value: asNum(p.count || p.units || p.qty || 0) }))

    const chartBlock = chartData.length ? (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h4 className="text-sm font-semibold text-dark-green mb-3">Produits abandonnés</h4>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%" key={rcKey('carts')}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={false} label={{ value: 'Produit', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Quantité', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Qté" fill="#14532d" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    ) : (
      <div className="bg-white rounded-lg p-6 shadow-sm text-gray-500">Aucune donnée de produits abandonnés.</div>
    )

    const tableBlock = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="overflow-auto">
          <table className="w-full table-auto">
            <thead>
            <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                <th className="px-4 py-2 text-left">Panier</th>
                <th className="px-4 py-2 text-left">Utilisateur</th>
                <th className="px-4 py-2 text-right">Qté</th>
                <th className="px-4 py-2 text-left">MAJ</th>
            </tr>
            </thead>
            <tbody>
            {items.slice(0, limit).map((r: any, i: number) => (
                <tr key={r.cart_id || i} className="border-b">
                <td className="px-4 py-2">{r.cart_id}</td>
                <td className="px-4 py-2">{r.user_id ?? ''}</td>
                <td className="px-4 py-2 text-right">{asNum(r.items_qty).toFixed(0)}</td>
                <td className="px-4 py-2">{fmtDate(r.updated_at)}</td>
                </tr>
            ))}
            </tbody>
          </table>
        </div>
      </div>
    )

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <KpiCard title="Utilisateurs sans achat" value={asNum(summary.users_no_purchase)} />
          <KpiCard title="Paniers actifs" value={asNum(summary.active_carts)} />
          <KpiCard title="Qté moyenne/panier" value={asNum(summary.avg_cart_qty)} />
        </div>
        {viewMode !== 'table' && chartBlock}
        {viewMode !== 'chart' && tableBlock}
      </div>
    )
  }, [data, limit, tab, viewMode])

  const impactView = useMemo(() => {
    if (tab !== 'impact') return null
    const s = data?.summary || {}
    const rows: any[] = Array.isArray(data?.rows) ? data.rows : []

    const lineData = rows.map(r => ({
      date: String(r.created_at).slice(0, 10),
      waste: asNum(r.avoided_waste_kg),
      co2: asNum(r.avoided_co2_kg),
      savings: asNum(r.savings_eur),
    }))

    const chartBlock = lineData.length ? (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h4 className="text-sm font-semibold text-dark-green mb-3">Impact par commande</h4>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%" key={rcKey('impact')}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" label={{ value: 'Date', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Valeur', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="waste" name="Déchets évités (kg)" stroke="#14532d" isAnimationActive={false} />
              <Line type="monotone" dataKey="co2" name="CO₂ évité (kg)" stroke="#4d7c0f" isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    ) : (
      <div className="bg-white rounded-lg p-6 shadow-sm text-gray-500">Aucune donnée.</div>
    )

    const tableBlock = (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="overflow-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-600 bg-gray-50">
                <th className="px-4 py-2 text-left">Commande</th>
                <th className="px-4 py-2 text-left">Créée</th>
                <th className="px-4 py-2 text-right">Déchets évités (kg)</th>
                <th className="px-4 py-2 text-right">CO₂ évité (kg)</th>
                <th className="px-4 py-2 text-right">Économies (€)</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, limit).map((r: any, i: number) => (
                <tr key={r.order_id || i} className="border-b">
                  <td className="px-4 py-2">{r.order_id}</td>
                  <td className="px-4 py-2">{fmtDate(r.created_at)}</td>
                  <td className="px-4 py-2 text-right">{asNum(r.avoided_waste_kg).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">{asNum(r.avoided_co2_kg).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">{asNum(r.savings_eur).toFixed(2)}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={5}>Aucun résultat</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <KpiCard title="Déchets évités (kg)" value={asNum(s.avoided_waste_kg)} />
          <KpiCard title="CO₂ évité (kg)" value={asNum(s.avoided_co2_kg)} />
          <KpiCard title="Économies clients (€)" value={asNum(s.savings_eur).toFixed(2)} />
        </div>
        {viewMode !== 'table' && chartBlock}
        {viewMode !== 'chart' && tableBlock}
      </div>
    )
  }, [data, limit, tab, viewMode])


  return (
    <div className="space-y-6">
      {Toolbar}
      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
      {loading && <div className="bg-white rounded-lg p-6 shadow-sm text-gray-500">Chargement…</div>}
      {!loading && !error && (
        <div ref={reportRef} className="space-y-6">
          {salesView}
          {ordersView}
          {customersView}
          {cartsView}
          {catalogView}
          {healthView}
          {impactView}
          {categoryView}
          {paymentsView}
          {cohortsView}
          {geoView}
          {tab !== 'sales' &&
            tab !== 'orders' &&
            tab !== 'customers' &&
            tab !== 'carts' &&
            tab !== 'catalog' &&
            tab !== 'health' &&
            tab !== 'impact' &&
            tab !== 'category' &&
            tab !== 'payments' &&
            tab !== 'cohorts' &&
            tab !== 'geo' && (
              <div className="bg-white rounded-lg p-6 shadow-sm"><JsonView data={data} /></div>
          )}
        </div>
      )}
    </div>
  )
}
