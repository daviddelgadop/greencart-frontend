import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  SlidersHorizontal,
  Grid,
  List,
  Factory,
  Globe,
  Landmark,
  ShoppingBag,
  Star,
  ChevronDown
} from 'lucide-react'
import BundleCard from '../components/BundleCard'
import { http } from '../lib/api'

interface Certification { code: string }
interface Category { code: string; label: string }
interface CatalogEntry { category: Category }
interface CompanyAddressCity { postal_code: string; name: string; department?: number }

interface ProductItem {
  product: {
    title: string
    eco_score?: string
    catalog_entry_data: CatalogEntry
    certifications: Certification[]
    company_data: {
      name: string
      certifications: Certification[]
      address: { city: CompanyAddressCity }
    }
  }
  best_before_date?: string | null
}

interface Bundle {
  id: number
  title: string
  items: ProductItem[]
  discounted_price: string
  original_price: string
  company_id: number
  producer_data: { public_display_name: string }
  region_data?: { name: string; code: string }
  department_data?: { name: string; code: string }
  stock?: number
  discounted_percentage?: number
  created_at?: string
  total_avoided_waste_kg?: string
  total_avoided_co2_kg?: string
  avg_rating?: string | number | null
  ratings_count?: number
}

type SortField =
  | 'price'
  | 'discounted_percentage'
  | 'created_at'
  | 'expiry'
  | 'impact_waste'
  | 'impact_co2'
  | 'eco'
  | 'title'
  | 'producer'
  | 'region'
  | 'department_code'
  | 'commerce'
  | 'rating'

type SortOrder = 'asc' | 'desc'
const EPS = 1e-6

function toNum(v?: string | number | null) {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : NaN
}
function minBestBefore(bundle: Bundle): number | null {
  const times = bundle.items
    .map(i => (i.best_before_date ? Date.parse(i.best_before_date) : NaN))
    .filter(t => Number.isFinite(t)) as number[]
  return times.length ? Math.min(...times) : null
}
function priceStepFor(range: number) { if (range >= 100) return 1; if (range >= 10) return 0.1; return 0.01 }
function commerceName(b: Bundle) { return b.items[0]?.product.company_data.name || '' }
function commercePostalCode(b: Bundle) { return b.items[0]?.product.company_data.address.city.postal_code || '' }
function commerceDeptCodeFromPostal(pc: string) { return pc && pc.length >= 2 ? pc.slice(0, 2) : '' }
function commerceDepartmentCode(b: Bundle) { return b.department_data?.code || commerceDeptCodeFromPostal(commercePostalCode(b)) }
function commerceDepartmentName(b: Bundle) { return b.department_data?.name || '' }
function commerceRegionName(b: Bundle) { return b.region_data?.name || '' }


/* =========================
   MultiSelect – dropdown with checkboxes
   ========================= */
type Opt = { value: string; label: string }

function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Tous',
}: {
  options: Opt[]
  value: string[]
  onChange: (vals: string[]) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleValue = (v: string) => {
    if (value.includes(v)) onChange(value.filter(x => x !== v))
    else onChange([...value, v])
  }
  const clearAll = () => onChange([])

  const selectedLabels = options.filter(o => value.includes(o.value)).map(o => o.label)
  const buttonText =
    value.length === 0
      ? placeholder
      : selectedLabels.length === 1
      ? selectedLabels[0]
      : `${selectedLabels[0]} +${value.length - 1}`

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full border px-3 py-2 rounded bg-white flex items-center justify-between text-left"
      >
        <span className="truncate">{buttonText || placeholder}</span>
        <ChevronDown className="w-4 h-4 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-64 overflow-auto bg-white border rounded-lg shadow">
          <div className="sticky top-0 bg-white border-b px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-gray-500">{placeholder}</span>
            {value.length > 0 && (
              <button onClick={clearAll} className="text-xs text-dark-green hover:underline">Effacer</button>
            )}
          </div>
          <ul className="py-1">
            {options.map(opt => (
              <li key={opt.value}>
                <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={value.includes(opt.value)}
                    onChange={() => toggleValue(opt.value)}
                  />
                  <span className="truncate">{opt.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const commerceParam = searchParams.get('commerce') || ''
  const producerParamLegacy = searchParams.get('producer') || ''
  const producerParam = searchParams.get('producteur') || producerParamLegacy

  const [bundles, setBundles] = useState<Bundle[]>([])
  const [filteredBundles, setFilteredBundles] = useState<Bundle[]>([])
  const [showFilters, setShowFilters] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [loading, setLoading] = useState(true) 


  const [filters, setFilters] = useState({
    categories: [] as string[],
    ecoScores: [] as string[],
    certifications: [] as string[],
    maxPrice: 0,
    searchText: '',
    producerNames: [] as string[],
    commerceNames: [] as string[],
    departments: [] as string[],
    ratingMin: 0,
    inStockOnly: false,
  })

  useEffect(() => {
    if (producerParam) setFilters(f => ({ ...f, producerNames: [producerParam] }))
    if (commerceParam) setFilters(f => ({ ...f, commerceNames: [commerceParam] }))
  }, [producerParam, commerceParam])

  const prices = useMemo(
    () => bundles.map(b => toNum(b.discounted_price)).filter(Number.isFinite) as number[],
    [bundles]
  )
  const minPrice = prices.length ? Math.min(...prices) : 0
  const maxPrice = prices.length ? Math.max(...prices) : 0
  const priceStep = priceStepFor(maxPrice - minPrice)
  const minPriceDisplay = prices.length ? Math.floor(minPrice * 100) / 100 : 0
  const maxPriceDisplay = prices.length ? Math.ceil(maxPrice * 100) / 100 : 0

  useEffect(() => {
    if (bundles.length > 0) setFilters(prev => ({ ...prev, maxPrice }))
  }, [maxPrice, bundles.length])

  const allCompanies = useMemo(() => {
    return Array.from(
      new Map(
        bundles.map(b => {
          const producer = b.producer_data?.public_display_name || ''
          return [producer, { label: producer, value: producer }]
        })
      ).values()
    ).filter(o => o.value)
  }, [bundles])

  const allCommerces = useMemo(() => {
    return Array.from(
      new Map(
        bundles.map(b => {
          const name = commerceName(b)
          return [name, { label: name, value: name }]
        })
      ).values()
    ).filter(o => o.value)
  }, [bundles])

  const allDepartments = useMemo(() => {
    const entries = bundles
      .map(b => {
        const code = commerceDepartmentCode(b)
        const name = commerceDepartmentName(b)
        const region = commerceRegionName(b)
        if (!code) return null
        return [code, { code, name: name || code, region: region || '' }] as [
          string,
          { code: string; name: string; region: string }
        ]
      })
      .filter(Boolean) as [string, { code: string; name: string; region: string }][]
    return [...new Map(entries).values()]
  }, [bundles])

  const allCategories = useMemo(() => {
    return [...new Map(
      bundles.flatMap(b =>
        b.items.map(i => {
          const category = i.product.catalog_entry_data.category
          return [category.code, category.label]
        })
      )
    )].map(([code, label]) => ({ code, label } as { code: string; label: string }))
  }, [bundles])

  const allEcoScores = useMemo(() => {
    const set = new Set<string>()
    bundles.forEach(b =>
      b.items.forEach(i => {
        const s = (i.product.eco_score || '').toUpperCase().trim()
        if (s) set.add(s)
      })
    )
    return Array.from(set).sort()
  }, [bundles])

  const allCertifications = useMemo(() => {
    return [...new Set(
      bundles.flatMap(b =>
        b.items.flatMap(i => [...i.product.certifications, ...i.product.company_data.certifications])
      ).map(c => c.code)
    )]
  }, [bundles])

  const searchQuery = searchParams.get('search') || ''
  const initialSortField = (searchParams.get('sortField') as SortField) || 'created_at'
  const initialOrder: SortOrder = (searchParams.get('order') as SortOrder) === 'desc' ? 'desc' : 'asc'
  const [sortField, setSortField] = useState<SortField>(initialSortField)
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialOrder)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true) 
        const data = await http.get<Bundle[]>('/api/public-bundles/')
        setBundles(data || [])
      } catch (err) {
        console.error('Erreur lors du chargement des bundles:', err)
      } finally {
        setLoading(false) 
      }
    }
    load()
  }, [])

  useEffect(() => {
    let filtered = [...bundles]

    const text = (filters.searchText || searchQuery).trim().toLowerCase()
    if (text) {
      filtered = filtered.filter(bundle =>
        bundle.title.toLowerCase().includes(text) ||
        bundle.items.some(item => item.product.title.toLowerCase().includes(text))
      )
    }

    if (filters.categories.length > 0) {
      const wanted = new Set(filters.categories)
      filtered = filtered.filter(bundle =>
        bundle.items.some(item => wanted.has(item.product.catalog_entry_data.category.code))
      )
    }

    if (filters.ecoScores.length > 0) {
      const wanted = new Set(filters.ecoScores.map(s => s.toUpperCase()))
      filtered = filtered.filter(bundle =>
        bundle.items.some(item => wanted.has((item.product.eco_score || '').toUpperCase()))
      )
    }

    if (filters.certifications.length > 0) {
      const wanted = new Set(filters.certifications)
      filtered = filtered.filter(bundle =>
        bundle.items.some(item =>
          item.product.certifications.some(c => wanted.has(c.code)) ||
          item.product.company_data.certifications.some(c => wanted.has(c.code))
        )
      )
    }

    filtered = filtered.filter(bundle => {
      const price = toNum(bundle.discounted_price)
      return Number.isFinite(price) && price <= filters.maxPrice + EPS
    })

    if (filters.producerNames.length > 0) {
      const wanted = new Set(filters.producerNames.map(s => s.toLowerCase()))
      filtered = filtered.filter(bundle =>
        wanted.has((bundle.producer_data?.public_display_name || '').toLowerCase()) ||
        bundle.items.some(item => wanted.has(item.product.company_data.name.toLowerCase()))
      )
    }

    if (filters.commerceNames.length > 0) {
      const wanted = new Set(filters.commerceNames.map(s => s.toLowerCase()))
      filtered = filtered.filter(bundle => wanted.has(commerceName(bundle).toLowerCase()))
    }

    if (filters.departments.length > 0) {
      const wanted = new Set(filters.departments)
      filtered = filtered.filter(bundle => wanted.has(commerceDepartmentCode(bundle)))
    }

    if (filters.ratingMin > 0) {
      filtered = filtered.filter(b => {
        const r = toNum(b.avg_rating)
        return Number.isFinite(r) && r >= filters.ratingMin
      })
    }

    if (filters.inStockOnly) {
      filtered = filtered.filter(b => Number(b.stock) > 0)
    }

    setFilteredBundles(filtered)
  }, [filters, searchQuery, bundles])

  useEffect(() => {
    const next = new URLSearchParams(searchParams.toString())
    next.set('sortField', sortField)
    next.set('order', sortOrder)
    setSearchParams(next, { replace: true })
  }, [sortField, sortOrder])

  const sortedBundles = useMemo(() => {
    const arr = [...filteredBundles]
    const ecoRank: Record<string, number> = {}
    allEcoScores.forEach((s, idx) => { ecoRank[s] = idx + 1 })

    const ratingKey = (b: Bundle, order: SortOrder) => {
      const n = toNum(b.avg_rating)
      if (!Number.isFinite(n)) return order === 'asc' ? Infinity : -Infinity
      return n
    }

    const cmp = (a: Bundle, b: Bundle): number => {
      const aPrice = toNum(a.discounted_price)
      const bPrice = toNum(b.discounted_price)
      const aEco = ecoRank[(a.items[0]?.product.eco_score || '').toUpperCase()] || 999
      const bEco = ecoRank[(b.items[0]?.product.eco_score || '').toUpperCase()] || 999
      const aExp = minBestBefore(a)
      const bExp = minBestBefore(b)
      const aTitle = a.title || ''
      const bTitle = b.title || ''
      const aProducer = a.producer_data?.public_display_name || ''
      const bProducer = b.producer_data?.public_display_name || ''
      const aRegion = commerceRegionName(a)
      const bRegion = commerceRegionName(b)
      const aDept = commerceDepartmentCode(a)
      const bDept = commerceDepartmentCode(b)
      const aCommerce = commerceName(a)
      const bCommerce = commerceName(b)
      const aCreated = Date.parse(a.created_at || '')
      const bCreated = Date.parse(b.created_at || '')

      switch (sortField) {
        case 'price': return aPrice - bPrice
        case 'discounted_percentage': return (a.discounted_percentage || 0) - (b.discounted_percentage || 0)
        case 'created_at': return aCreated - bCreated
        case 'expiry':
          if (aExp === null && bExp === null) return 0
          if (aExp === null) return 1
          if (bExp === null) return -1
          return aExp - bExp
        case 'impact_waste': return (Number(a.total_avoided_waste_kg) || 0) - (Number(b.total_avoided_waste_kg) || 0)
        case 'impact_co2': return (Number(a.total_avoided_co2_kg) || 0) - (Number(b.total_avoided_co2_kg) || 0)
        case 'eco': return aEco - bEco
        case 'title': return aTitle.localeCompare(bTitle, 'fr', { sensitivity: 'base' })
        case 'producer': return aProducer.localeCompare(bProducer, 'fr', { sensitivity: 'base' })
        case 'region': return aRegion.localeCompare(bRegion, 'fr', { sensitivity: 'base' })
        case 'department_code': return aDept.localeCompare(bDept, 'fr', { numeric: true, sensitivity: 'base' })
        case 'commerce': return aCommerce.localeCompare(bCommerce, 'fr', { sensitivity: 'base' })
        case 'rating': {
          const ar = ratingKey(a, sortOrder)
          const br = ratingKey(b, sortOrder)
          return ar - br
        }
        default: return 0
      }
    }

    arr.sort((a, b) => {
      const base = cmp(a, b)
      return sortOrder === 'asc' ? base : -base
    })
    return arr
  }, [filteredBundles, sortField, sortOrder, allEcoScores])

  const stats = useMemo(() => {
    const producers = new Set<string>()
    const regions = new Set<string>()
    const departments = new Set<string>()
    bundles.forEach(b => {
      if (b.producer_data?.public_display_name) producers.add(b.producer_data.public_display_name)
      const r = commerceRegionName(b)
      const d = commerceDepartmentName(b) || commerceDepartmentCode(b)
      if (r) regions.add(r)
      if (d) departments.add(d)
    })
    return { bundles: bundles.length, producers: producers.size, regions: regions.size, departments: departments.size }
  }, [bundles])

  return (
    <div className="min-h-screen bg-pale-yellow/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="mb-8">
          <div className="rounded-3xl bg-white/90 backdrop-blur px-6 py-7 md:px-8 md:py-9 shadow-sm ring-1 ring-black/5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-dark-green tracking-tight flex items-center gap-4">
                  <ShoppingBag className="w-8 h-8" />
                  Boutique
                </h1>
                <p className="mt-2 text-gray-600 max-w-2xl">
                  Découvrez nos produits disponibles et soutenez les producteurs locaux tout en luttant contre le gaspillage.
                </p>
              </div>

              {/* KPIs responsive (2 cols on mobile, 4 on >=sm) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x rounded-2xl bg-[#F7FAF4] text-dark-green">
                <div className="px-5 py-3 text-center">
                  <div className="text-2xl font-bold">{stats.bundles}</div>
                  <div className="text-xs uppercase tracking-wide">Produits</div>
                </div>
                <div className="px-5 py-3 text-center">
                  <div className="text-2xl font-bold flex items-center justify-center gap-1">
                    <Factory className="w-5 h-5" /> {stats.producers}
                  </div>
                  <div className="text-xs uppercase tracking-wide">Producteurs</div>
                </div>
                <div className="px-5 py-3 text-center">
                  <div className="text-2xl font-bold flex items-center justify-center gap-1">
                    <Globe className="w-5 h-5" /> {stats.regions}
                  </div>
                  <div className="text-xs uppercase tracking-wide">Régions (commerce)</div>
                </div>
                <div className="px-5 py-3 text-center">
                  <div className="text-2xl font-bold flex items-center justify-center gap-1">
                    <Landmark className="w-5 h-5" /> {stats.departments}
                  </div>
                  <div className="text-xs uppercase tracking-wide">Départements (commerce)</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                  <span>Filtres</span>
                </button>

                <div className="flex items-end gap-4 w-full sm:w-auto">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Critère</label>
                    <select
                      value={sortField}
                      onChange={e => setSortField(e.target.value as SortField)}
                      className="bg-white px-3 py-2 rounded-lg shadow-sm border"
                      aria-label="Critère de tri"
                    >
                      <optgroup label="Prix & remises">
                        <option value="price">Prix</option>
                        <option value="discounted_percentage">% remise</option>
                      </optgroup>
                      <optgroup label="Dates">
                        <option value="created_at">Date de création</option>
                        <option value="expiry">Date limite</option>
                      </optgroup>
                      <optgroup label="Impact">
                        <option value="impact_waste">Déchets évités</option>
                        <option value="impact_co2">CO₂ évité</option>
                        <option value="eco">Eco-score</option>
                      </optgroup>
                      <optgroup label="Texte (A → Z)">
                        <option value="title">Nom du produit</option>
                        <option value="producer">Producteur</option>
                        <option value="commerce">Commerce</option>
                        <option value="region">Région (commerce)</option>
                        <option value="department_code">Département (code commerce)</option>
                      </optgroup>
                      <optgroup label="Notes">
                        <option value="rating">Note moyenne (bundle)</option>
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Ordre</label>
                    <select
                      value={sortOrder}
                      onChange={e => setSortOrder(e.target.value as SortOrder)}
                      className="bg-white px-3 py-2 rounded-lg shadow-sm border"
                      aria-label="Ordre de tri"
                    >
                      <option value="asc">
                        Ascendant {['title','producer','region','department_code','commerce'].includes(sortField) ? '(A → Z)' : ''}
                      </option>
                      <option value="desc">
                        Descendant {['title','producer','region','department_code','commerce'].includes(sortField) ? '(Z → A)' : ''}
                      </option>
                    </select>
                  </div>

                  <div className="flex bg-white rounded-lg shadow-sm border">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-l-lg ${viewMode === 'grid' ? 'bg-dark-green text-pale-yellow' : 'text-gray-600 hover:bg-gray-50'}`}
                      aria-label="Vue grille"
                    >
                      <Grid className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-r-lg ${viewMode === 'list' ? 'bg-dark-green text-pale-yellow' : 'text-gray-600 hover:bg-gray-50'}`}
                      aria-label="Vue liste"
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={filters.searchText}
                  onChange={e => setFilters({ ...filters, searchText: e.target.value })}
                  placeholder="Rechercher un produit…"
                  aria-label="Recherche"
                  className="w-full pl-3 pr-3 py-2.5 bg-white rounded-xl border shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green/30"
                />
              </div>
            </div>
          </div>
        </section>

        <p className="text-sm text-gray-600 mb-6">
          {sortedBundles.length} produit{sortedBundles.length > 1 ? 's' : ''} trouvé{sortedBundles.length > 1 ? 's' : ''}.
        </p>

        {/* MAIN WRAPPER: column on mobile, row on >=lg */}
        <div className="flex flex-col lg:flex-row gap-8">
          {showFilters && (
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="bg-white p-6 rounded-lg shadow-sm lg:sticky lg:top-24">
                <h3 className="text-lg font-semibold text-dark-green mb-4">Filtres</h3>

                {/* Categories */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1">Catégories</label>
                  <MultiSelect
                    placeholder="Toutes"
                    options={allCategories.map(c => ({ value: c.code, label: c.label }))}
                    value={filters.categories}
                    onChange={(vals) => setFilters({ ...filters, categories: vals })}
                  />
                </div>

                {/* Price max */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1">Prix max.</label>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>{minPriceDisplay.toFixed(2)} €</span>
                    <span>{maxPriceDisplay.toFixed(2)} €</span>
                  </div>
                  <input
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    step={priceStep}
                    value={Math.min(Math.max(filters.maxPrice, minPrice), maxPrice)}
                    onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
                    className="w-full"
                  />
                  <div className="mt-2">
                    <input
                      type="number"
                      min={minPrice}
                      max={maxPrice}
                      step={priceStep}
                      value={Number.isFinite(filters.maxPrice) ? filters.maxPrice : maxPrice}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        if (Number.isFinite(val)) {
                          const clamped = Math.max(minPrice, Math.min(maxPrice, val))
                          setFilters({ ...filters, maxPrice: clamped })
                        }
                      }}
                      className="w-full border px-3 py-2 rounded"
                    />
                  </div>
                </div>

                {/* Producers */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1">Producteurs</label>
                  <MultiSelect
                    placeholder="Tous"
                    options={allCompanies}
                    value={filters.producerNames}
                    onChange={(vals) => setFilters({ ...filters, producerNames: vals })}
                  />
                </div>

                {/* Commerces */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1">Commerces</label>
                  <MultiSelect
                    placeholder="Tous"
                    options={allCommerces}
                    value={filters.commerceNames}
                    onChange={(vals) => setFilters({ ...filters, commerceNames: vals })}
                  />
                </div>

                {/* Departments */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1">Origine (Département)</label>
                  <MultiSelect
                    placeholder="Tous"
                    options={allDepartments.map(d => ({ value: d.code, label: `${d.name} (${d.code}) - ${d.region}` }))}
                    value={filters.departments}
                    onChange={(vals) => setFilters({ ...filters, departments: vals })}
                  />
                </div>

                {/* Eco-score */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1">Score écologique</label>
                  <MultiSelect
                    placeholder="Tous"
                    options={allEcoScores.map(s => ({ value: s, label: s }))}
                    value={filters.ecoScores}
                    onChange={(vals) => setFilters({ ...filters, ecoScores: vals })}
                  />
                </div>

                {/* Certifications */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1">Certification</label>
                  <MultiSelect
                    placeholder="Toutes"
                    options={allCertifications.map(c => ({ value: c, label: c }))}
                    value={filters.certifications}
                    onChange={(vals) => setFilters({ ...filters, certifications: vals })}
                  />
                </div>

                {/* Min rating */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1">Note minimum (bundle)</label>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <select
                      value={String(filters.ratingMin)}
                      onChange={(e) => setFilters({ ...filters, ratingMin: Number(e.target.value) })}
                      className="w-full border px-3 py-2 rounded"
                    >
                      <option value="0">Toutes</option>
                      <option value="1">1★ et plus</option>
                      <option value="2">2★ et plus</option>
                      <option value="3">3★ et plus</option>
                      <option value="4">4★ et plus</option>
                      <option value="4.5">4.5★ et plus</option>
                    </select>
                  </div>
                </div>

                {/* Stock */}
                <div className="mb-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={filters.inStockOnly}
                      onChange={(e) => setFilters({ ...filters, inStockOnly: e.target.checked })}
                    />
                    <span>Afficher uniquement en stock</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Masque les lots en rupture.</p>
                </div>

                {/* Reset */}
                <div className="mt-6 text-center">
                  <button
                    onClick={() =>
                      setFilters({
                        categories: [],
                        ecoScores: [],
                        certifications: [],
                        maxPrice: maxPrice,
                        searchText: '',
                        producerNames: [],
                        commerceNames: [],
                        departments: [],
                        ratingMin: 0,
                        inStockOnly: false,
                      })
                    }
                    className="text-sm px-4 py-2 rounded-full border border-dark-green text-dark-green hover:bg-dark-green hover:text-white transition"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1">
            {loading ? (
              <div className="text-center py-20 text-gray-500 animate-pulse">
                Chargement des produits...
              </div>
            ) : sortedBundles.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                Aucun produit trouvé
              </div>
            ) : (
              <div
                className={`grid gap-6 ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-1'
                }`}
              >
                {sortedBundles.map((bundle) => (
                  <BundleCard key={bundle.id} bundle={bundle} viewMode={viewMode} />
                ))}
              </div>
            )}
          </div>


          
        </div>
      </div>
    </div>
  )
}
