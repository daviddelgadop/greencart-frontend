import React, { useEffect, useMemo, useState } from 'react'
import { http } from '../lib/api'
import { ChevronDown, ChevronUp } from 'lucide-react'

type City = {
  id: number
  postal_code: string
  name: string
  commune_code?: string
  latitude?: string
  longitude?: string
  country_name?: string
  department?: number
}

type AddressSnapshot = {
  id: number
  city: City
  user: number
  title: string
  is_active: boolean
  complement?: string | null
  created_at: string
  is_primary: boolean
  updated_at: string
  street_name: string
  street_number: string
  deactivated_at: string | null
}

type PaymentMethodSnapshot = {
  type: string
  digits: string | null
  provider: string
  paypal_email: string
}

type OrderItemProduct = {
  id: number
  title: string
  variety?: string
  original_price?: string
  unit?: string
  company_name?: string
  images?: { id: number; image: string }[]
  catalog_entry_data?: {
    id: number
    category: { id: number; code?: string; label: string }
  }
}

type OrderItemBundle = {
  id: number
  title: string
  items?: { product: OrderItemProduct; quantity: number }[]
  stock?: number
  discounted_percentage?: number
  original_price?: string
  discounted_price?: string
  status?: string
  is_active?: boolean
  created_at?: string
  company_id?: number
  region_data?: { code: string; name: string }
  department_data?: { code: string; name: string }
  avg_rating?: string
  ratings_count?: number
  evaluations?: any[]
}

type OrderItem = {
  id: number
  bundle: OrderItemBundle
  quantity: number
  total_price: string
  order_item_savings?: string
  order_item_total_avoided_waste_kg?: string
  order_item_total_avoided_co2_kg?: string
  bundle_snapshot?: {
    id: number
    title: string
    region?: { code: string; name: string }
    department?: { code: string; name: string }
    products?: { product_id: number; category_id: number; category_name: string; product_title: string; per_bundle_quantity: number }[]
    company_id?: number
    company_name?: string
    stock_before?: number
    stock_after?: number
    original_price?: string
    discounted_price?: string
    created_at?: string
  }
  customer_rating?: number
  customer_note?: string
  rated_at?: string
}

type Order = {
  order_code: string
  status: string
  total_price: string
  subtotal: string
  shipping_cost: string
  order_total_savings?: string
  order_total_avoided_waste_kg?: string
  order_total_avoided_co2_kg?: string
  created_at: string
  shipping_address?: AddressSnapshot
  billing_address?: AddressSnapshot
  shipping_address_snapshot?: AddressSnapshot
  billing_address_snapshot?: AddressSnapshot
  payment_method?: number
  payment_method_snapshot?: PaymentMethodSnapshot
  customer_rating?: number
  customer_note?: string
  rated_at?: string
  items: OrderItem[]
}

type SortField =
  | ''
  | 'order_code'
  | 'status'
  | 'created_at'
  | 'total_price'
  | 'subtotal'
  | 'shipping_cost'
  | 'customer_rating'

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [expandedCode, setExpandedCode] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    const data = await http.get<Order[]>('/api/producer/orders')
    setOrders(Array.isArray(data) ? data : [])
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const fmtEUR = (val: string | number | null | undefined) => {
    const n = typeof val === 'string' ? Number(val) : typeof val === 'number' ? val : 0
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n || 0)
  }

  const fmtDate = (iso: string | undefined) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  const addrLine = (a?: AddressSnapshot) => {
    if (!a) return '—'
    const parts = [
      [a.street_number, a.street_name].filter(Boolean).join(' '),
      a.complement,
      [a.city?.postal_code, a.city?.name].filter(Boolean).join(' '),
      a.city?.country_name,
    ].filter(Boolean)
    return parts.join(', ')
  }

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      delivered: 'bg-green-100 text-green-800',
      pending: 'bg-orange-100 text-orange-800',
      processing: 'bg-blue-100 text-blue-800',
      canceled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-200 text-gray-700',
    }
    return map[s] || 'bg-gray-100 text-gray-800'
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const base = term
      ? orders.filter(o => {
          const inCode = o.order_code?.toLowerCase().includes(term)
          const inCity =
            o.shipping_address_snapshot?.city?.name?.toLowerCase().includes(term) ||
            o.billing_address_snapshot?.city?.name?.toLowerCase().includes(term)
          const inItems = o.items?.some(it =>
            (it.bundle?.title || it.bundle_snapshot?.title || '').toLowerCase().includes(term)
          )
          const inStatus = o.status?.toLowerCase().includes(term)
          return inCode || inCity || inItems || inStatus
        })
      : orders.slice()

    if (!sortField) return base

    const getVal = (o: Order) => {
      switch (sortField) {
        case 'order_code':
          return o.order_code || ''
        case 'status':
          return o.status || ''
        case 'created_at':
          return o.created_at || ''
        case 'total_price':
          return Number(o.total_price) || 0
        case 'subtotal':
          return Number(o.subtotal) || 0
        case 'shipping_cost':
          return Number(o.shipping_cost) || 0
        case 'customer_rating':
          return Number(o.customer_rating ?? 0)
        default:
          return ''
      }
    }

    return base.sort((a, b) => {
      const av = getVal(a) as any
      const bv = getVal(b) as any
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av
      }
      const res = String(av).localeCompare(String(bv), 'fr', { sensitivity: 'base' })
      return sortDir === 'asc' ? res : -res
    })
  }, [orders, search, sortField, sortDir])

  const statusLabels: Record<string, string> = {
    delivered: 'Livrée',
    pending: 'En attente',
    processing: 'En cours',
    canceled: 'Annulée',
    refunded: 'Remboursée',
    confirmed: 'Confirmée',
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par code, ville, produit, statut..."
            className="form-input w-full max-w-md"
          />
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <p className="text-gray-500 px-2">Aucune commande trouvée.</p>
        ) : (
          filtered.map(o => {
            const isOpen = expandedCode === o.order_code
            return (
              <div
                key={o.order_code}
                className={`rounded-lg shadow-sm p-4 transition-colors ${
                  isOpen ? 'bg-gray-100' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-dark-green">#{o.order_code}</div>
                    <div className="text-xs text-gray-600">{fmtDate(o.created_at)}</div>
                    <div className="mt-1 text-sm text-gray-800 truncate">
                      {addrLine(o.shipping_address_snapshot || o.shipping_address)}
                    </div>
                    <div className="mt-1 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${statusBadge(o.status)}`}>
                        {statusLabels[o.status] || o.status}
                      </span>
                    </div>
                    <div className="mt-1 font-medium">{fmtEUR(o.total_price)}</div>
                    <div className="text-xs text-gray-600">
                      Note client : {o.customer_rating ? `${Math.round(o.customer_rating)}/5` : '—'}
                    </div>
                  </div>
                  <button
                    className="shrink-0 inline-flex items-center gap-1 text-dark-green hover:underline"
                    onClick={() => setExpandedCode(isOpen ? null : o.order_code)}
                  >
                    {isOpen ? <>Réduire <ChevronUp className="w-4 h-4" /></> : <>Voir <ChevronDown className="w-4 h-4" /></>}
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-gray-800 text-sm">Paiement</h4>
                        <p className="text-gray-700 text-sm">
                          Type: <span className="font-medium">{o.payment_method_snapshot?.type || '—'}</span>
                        </p>
                        <p className="text-gray-700 text-sm">
                          Fournisseur: <span className="font-medium">{o.payment_method_snapshot?.provider || '—'}</span>
                        </p>
                        {o.payment_method_snapshot?.digits && (
                          <p className="text-gray-700 text-sm">Digits: **** {o.payment_method_snapshot.digits}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-semibold text-gray-800 text-sm">Adresses</h4>
                        <p className="text-gray-700 text-sm">
                          Livraison: <span className="font-medium">{addrLine(o.shipping_address_snapshot || o.shipping_address)}</span>
                        </p>
                        <p className="text-gray-700 text-sm">
                          Facturation: <span className="font-medium">{addrLine(o.billing_address_snapshot || o.billing_address)}</span>
                        </p>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-semibold text-gray-800 text-sm">Totaux</h4>
                        <p className="text-gray-700 text-sm">Sous-total: <span className="font-medium">{fmtEUR(o.subtotal)}</span></p>
                        <p className="text-gray-700 text-sm">Livraison: <span className="font-medium">{fmtEUR(o.shipping_cost)}</span></p>
                        <p className="text-gray-700 text-sm">Total: <span className="font-semibold">{fmtEUR(o.total_price)}</span></p>
                        {o.order_total_savings && (
                          <p className="text-gray-700 text-sm">Économies: <span className="font-medium">{fmtEUR(o.order_total_savings)}</span></p>
                        )}
                        {(o.order_total_avoided_waste_kg || o.order_total_avoided_co2_kg) && (
                          <p className="text-gray-700 text-sm">
                            Impact: <span className="font-medium">
                              {o.order_total_avoided_waste_kg ? `${o.order_total_avoided_waste_kg} kg déchets évités` : ''}
                              {o.order_total_avoided_waste_kg && o.order_total_avoided_co2_kg ? ' • ' : ''}
                              {o.order_total_avoided_co2_kg ? `${o.order_total_avoided_co2_kg} kg CO₂ évités` : ''}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-800 text-sm mb-2">Produits</h4>
                      <div className="space-y-2">
                        {o.items.map(it => (
                          <div key={it.id} className="border rounded p-3">
                            <div className="font-medium text-gray-900">
                              {it.bundle_snapshot?.title || it.bundle?.title || '—'}
                            </div>
                            {it.bundle_snapshot?.products && it.bundle_snapshot.products.length > 0 && (
                              <div className="text-gray-600 mt-1 text-sm">
                                {it.bundle_snapshot.products.map(p => (
                                  <div key={`${p.product_id}-${p.category_id}`} className="truncate">
                                    {p.product_title} × {p.per_bundle_quantity}
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="mt-2 text-sm grid grid-cols-2 gap-1">
                              <span>Qté: <b>{it.quantity}</b></span>
                              <span className="text-right">Ligne: <b>{fmtEUR(it.total_price)}</b></span>
                              <span>
                                Économie:{' '}
                                <b>{it.order_item_savings ? fmtEUR(it.order_item_savings) : '—'}</b>
                              </span>
                              <span className="text-right">
                                Impact:{' '}
                                <b>
                                  {[
                                    it.order_item_total_avoided_waste_kg ? `${it.order_item_total_avoided_waste_kg} kg déchets` : null,
                                    it.order_item_total_avoided_co2_kg ? `${it.order_item_total_avoided_co2_kg} kg CO₂` : null,
                                  ].filter(Boolean).join(' • ') || '—'}
                                </b>
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-gray-600">
                              Avis:{' '}
                              {it.customer_rating ? (
                                <>
                                  {Math.round(it.customer_rating)}/5
                                  {it.customer_note ? <> — <span className="italic">{it.customer_note}</span></> : null}
                                </>
                              ) : (
                                'Non noté'
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {o.customer_note && (
                      <div>
                        <h4 className="font-semibold text-gray-800 text-sm mb-1">Note du client (commande)</h4>
                        <p className="text-sm text-gray-700">{o.customer_note}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Desktop table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden hidden md:block">
        {filtered.length === 0 ? (
          <p className="text-gray-500 px-6 py-6">Aucune commande trouvée.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="max-w-6xl mx-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      onClick={() => toggleSort('order_code')}
                      className="px-6 py-3 text-xs font-medium text-gray-700 uppercase cursor-pointer select-none hover:text-dark-green"
                    >
                      Code
                      {sortField === 'order_code' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : <span className="text-gray-300">▲</span>}
                    </th>
                    <th
                      onClick={() => toggleSort('created_at')}
                      className="px-6 py-3 text-xs font-medium text-gray-700 uppercase cursor-pointer select-none hover:text-dark-green"
                    >
                      Date
                      {sortField === 'created_at' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : <span className="text-gray-300">▲</span>}
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-700 uppercase">Adresse de livraison</th>
                    <th
                      onClick={() => toggleSort('total_price')}
                      className="px-6 py-3 text-xs font-medium text-gray-700 uppercase cursor-pointer select-none hover:text-dark-green text-right"
                    >
                      Total
                      {sortField === 'total_price' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : <span className="text-gray-300">▲</span>}
                    </th>
                    <th
                      onClick={() => toggleSort('status')}
                      className="px-6 py-3 text-xs font-medium text-gray-700 uppercase cursor-pointer select-none hover:text-dark-green text-center"
                    >
                      Statut
                      {sortField === 'status' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : <span className="text-gray-300">▲</span>}
                    </th>
                    <th
                      onClick={() => toggleSort('customer_rating')}
                      className="px-6 py-3 text-xs font-medium text-gray-700 uppercase cursor-pointer select-none hover:text-dark-green text-center"
                    >
                      Note client
                      {sortField === 'customer_rating' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : <span className="text-gray-300">▲</span>}
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-700 uppercase text-center">Détails</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200 text-xs">
                  {filtered.map(o => {
                    const isOpen = expandedCode === o.order_code
                    return (
                      <React.Fragment key={o.order_code}>
                        <tr
                          className={`transition-colors ${
                            isOpen ? 'bg-gray-200' : 'hover:bg-gray-100'
                          }`}
                        >
                          <td className="px-6 py-3 font-medium text-gray-900">{o.order_code}</td>
                          <td className="px-6 py-3">{fmtDate(o.created_at)}</td>
                          <td className="px-6 py-3 truncate">{addrLine(o.shipping_address_snapshot || o.shipping_address)}</td>
                          <td className="px-6 py-3 text-right">{fmtEUR(o.total_price)}</td>
                          <td className="px-6 py-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs ${statusBadge(o.status)}`}>
                              {statusLabels[o.status] || o.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-center">
                            {o.customer_rating ? `${Math.round(o.customer_rating)}/5` : '—'}
                          </td>
                          <td className="px-6 py-3 text-center">
                            <button
                              className="inline-flex items-center gap-1 text-dark-green hover:underline"
                              onClick={() => setExpandedCode(isOpen ? null : o.order_code)}
                            >
                              {isOpen ? <>Réduire <ChevronUp className="w-4 h-4" /></> : <>Voir <ChevronDown className="w-4 h-4" /></>}
                            </button>
                          </td>
                        </tr>

                        {isOpen && (
                          <tr>
                            <td colSpan={7} className="px-6 pb-6">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 rounded-lg p-4">
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-gray-800 text-sm">Paiement</h4>
                                  <p className="text-gray-700 text-sm">
                                    Type: <span className="font-medium">{o.payment_method_snapshot?.type || '—'}</span>
                                  </p>
                                  <p className="text-gray-700 text-sm">
                                    Fournisseur: <span className="font-medium">{o.payment_method_snapshot?.provider || '—'}</span>
                                  </p>
                                  {o.payment_method_snapshot?.digits && (
                                    <p className="text-gray-700 text-sm">Digits: **** {o.payment_method_snapshot.digits}</p>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <h4 className="font-semibold text-gray-800 text-sm">Adresses</h4>
                                  <p className="text-gray-700 text-sm">
                                    Livraison: <span className="font-medium">{addrLine(o.shipping_address_snapshot || o.shipping_address)}</span>
                                  </p>
                                  <p className="text-gray-700 text-sm">
                                    Facturation: <span className="font-medium">{addrLine(o.billing_address_snapshot || o.billing_address)}</span>
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <h4 className="font-semibold text-gray-800 text-sm">Totaux</h4>
                                  <p className="text-gray-700 text-sm">Sous-total: <span className="font-medium">{fmtEUR(o.subtotal)}</span></p>
                                  <p className="text-gray-700 text-sm">Livraison: <span className="font-medium">{fmtEUR(o.shipping_cost)}</span></p>
                                  <p className="text-gray-700 text-sm">Total: <span className="font-semibold">{fmtEUR(o.total_price)}</span></p>
                                  {o.order_total_savings && (
                                    <p className="text-gray-700 text-sm">Économies: <span className="font-medium">{fmtEUR(o.order_total_savings)}</span></p>
                                  )}
                                  {(o.order_total_avoided_waste_kg || o.order_total_avoided_co2_kg) && (
                                    <p className="text-gray-700 text-sm">
                                      Impact: <span className="font-medium">
                                        {o.order_total_avoided_waste_kg ? `${o.order_total_avoided_waste_kg} kg déchets évités` : ''}
                                        {o.order_total_avoided_waste_kg && o.order_total_avoided_co2_kg ? ' • ' : ''}
                                        {o.order_total_avoided_co2_kg ? `${o.order_total_avoided_co2_kg} kg CO₂ évités` : ''}
                                      </span>
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="mt-4">
                                <h4 className="font-semibold text-gray-800 text-sm mb-2">Produits</h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full table-fixed">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Lot</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Quantité</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Prix ligne</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Économie</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Impact</th>
                                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 uppercase">Avis</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 text-xs">
                                      {o.items.map(it => (
                                        <tr key={it.id}>
                                          <td className="px-4 py-2">
                                            <div className="font-medium text-gray-900">{it.bundle_snapshot?.title || it.bundle?.title || '—'}</div>
                                            {it.bundle_snapshot?.products && it.bundle_snapshot.products.length > 0 && (
                                              <div className="text-gray-600 mt-1">
                                                {it.bundle_snapshot.products.map(p => (
                                                  <div key={`${p.product_id}-${p.category_id}`} className="truncate">
                                                    {p.product_title} × {p.per_bundle_quantity}
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </td>
                                          <td className="px-4 py-2">{it.quantity}</td>
                                          <td className="px-4 py-2">{fmtEUR(it.total_price)}</td>
                                          <td className="px-4 py-2">{it.order_item_savings ? fmtEUR(it.order_item_savings) : '—'}</td>
                                          <td className="px-4 py-2">
                                            {[
                                              it.order_item_total_avoided_waste_kg ? `${it.order_item_total_avoided_waste_kg} kg déchets` : null,
                                              it.order_item_total_avoided_co2_kg ? `${it.order_item_total_avoided_co2_kg} kg CO₂` : null,
                                            ].filter(Boolean).join(' • ') || '—'}
                                          </td>
                                          <td className="px-4 py-2 text-center">
                                            {it.customer_rating ? (
                                              <>
                                                {Math.round(it.customer_rating)}/5
                                                <br />
                                                <span className="text-gray-500">{it.customer_note || ''}</span>
                                              </>
                                            ) : (
                                              'Non noté'
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {o.customer_note && (
                                <div className="mt-4">
                                  <h4 className="font-semibold text-gray-800 text-sm mb-1">Note du client (commande)</h4>
                                  <p className="text-sm text-gray-700">{o.customer_note}</p>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
