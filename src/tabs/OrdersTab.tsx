import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { useCart } from '../contexts/CartContext'
import type {
  CartItem as CartItemType,
  BundleItem as CartBundleItem,
  Product as CartProduct
} from '../types/CartItem'
import { http } from '../lib/api'

type Image = { id: number; image: string }
type Product = {
  id: number
  title: string
  images?: Image[]
  company_data?: { name: string | null }
}
type BundleItem = { product: Product; quantity?: number; best_before_date?: string | null }
type Bundle = {
  id: number
  title: string
  items: BundleItem[]
  producer_data?: { public_display_name?: string | null }
  stock?: number
}
type OrderItem = {
  id: number
  bundle: Bundle
  quantity: number
  total_price: string
  order_item_savings?: string
  customer_rating?: number | null
  customer_note?: string | null
  rated_at?: string | null
}
type City = { name: string }
type Address = {
  line1?: string | null
  line2?: string | null
  postal_code?: string | null
  city?: City | null
  country?: string | null
}
type PaymentMethodSnap = { provider?: string; digits?: string }
type Order = {
  id: number
  order_code: string
  status: string
  total_price: string
  subtotal?: string
  shipping_cost?: string
  order_total_savings?: string
  order_total_avoided_waste_kg?: string
  order_total_avoided_co2_kg?: string
  created_at: string
  shipping_address?: Address | null
  billing_address?: Address | null
  payment_method_snapshot?: PaymentMethodSnap | null
  items: OrderItem[]
  customer_rating?: number | null
  customer_note?: string | null
  rated_at?: string | null
}

function normalizeStatus(s: string) {
  const v = (s || '').toLowerCase()
  if (['livré', 'delivered'].includes(v)) return 'Livrée'
  if (['confirmed', 'confirmée', 'en cours', 'processing'].includes(v)) return 'En cours'
  if (['pending', 'en attente'].includes(v)) return 'En attente'
  if (['cancelled', 'annulée'].includes(v)) return 'Annulée'
  return s
}
function statusClasses(s: string) {
  const v = normalizeStatus(s)
  if (v === 'Évaluée') return 'bg-green-100 text-green-800' 
  if (v === 'Livrée') return 'bg-green-100 text-green-800'
  if (v === 'En cours') return 'bg-orange-100 text-orange-800'
  if (v === 'En attente') return 'bg-yellow-100 text-yellow-800'
  if (v === 'Annulée') return 'bg-red-100 text-red-800'
  return 'bg-gray-100 text-gray-800'
}
function formatDateTimeFR(iso: string) {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return iso
  }
}
function extractThumbnails(order: Order, max = 4): string[] {
  const urls: string[] = []
  for (const it of order.items || []) {
    for (const bi of it.bundle?.items || []) {
      const imgs = bi.product?.images || []
      for (const im of imgs) {
        if (im?.image && !urls.includes(im.image)) {
          urls.push(im.image)
          if (urls.length >= max) return urls
        }
      }
    }
  }
  return urls
}
function collectSearchHaystack(o: Order): string {
  const fields: string[] = []
  fields.push(o.order_code || '')
  fields.push(o.status || '')
  fields.push(o.shipping_address?.city?.name || '')
  fields.push(o.billing_address?.city?.name || '')
  for (const item of o.items || []) {
    fields.push(item.bundle?.title || '')
    for (const bi of item.bundle?.items || []) {
      fields.push(bi.product?.title || '')
      const comp = bi.product?.company_data?.name || ''
      if (comp) fields.push(comp)
    }
  }
  return fields.join(' ').toLowerCase()
}
const safeNumber = (v: unknown): number => {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN
  return Number.isFinite(n) ? n : 0
}
const clamp0 = (n: number) => (n < 0 ? 0 : n)
const fmtEuro = (n: number) => `${n.toFixed(2)}€`
const fmtKg = (n: number) => `${n.toFixed(2)} kg`

/* Botones */
const btnDetails =
  "bg-white text-dark-green border border-dark-green px-2.5 py-1.5 rounded-full font-semibold text-sm hover:bg-dark-green hover:text-pale-yellow shadow-sm transition-colors"
const btnEval =
  "bg-white text-dark-green border border-dark-green px-2.5 py-1.5 rounded-full font-semibold text-sm hover:bg-dark-green hover:text-pale-yellow shadow-sm transition-colors"
const btnReorder =
  "bg-white text-dark-green border border-dark-green px-2.5 py-1.5 rounded-full font-semibold text-sm hover:bg-dark-green hover:text-pale-yellow shadow-sm transition-colors"
const btnActive =
  "bg-dark-green text-pale-yellow px-2.5 py-1.5 rounded-full font-semibold text-sm hover:bg-dark-green/90 shadow-sm transition-colors"

function formatAddress(a?: Address | null): string {
  if (!a) return '—'
  const parts = [
    a.line1,
    a.line2,
    [a.postal_code, a.city?.name].filter(Boolean).join(' '),
    a.country
  ].filter(Boolean)
  return parts.length ? parts.join(', ') : (a.city?.name || '—')
}

/* Tracking */
function hashString(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i)
  return h >>> 0
}
function toBase36Padded(n: number, len = 8): string {
  const s = n.toString(36).toUpperCase()
  return s.padStart(len, '0').slice(-len)
}
function generateTrackingFor(order: Order): string | null {
  const status = normalizeStatus(order.status)
  const eligible = status === 'En cours' || status === 'Livrée'
  const created = new Date(order.created_at).getTime()
  const ageHours = (Date.now() - created) / 36e5
  if (!eligible || ageHours < 24) return null
  const h = hashString(order.order_code || '')
  const body = toBase36Padded(h + 0x9E3779B9, 10)
  const chk = toBase36Padded(hashString(String(h ^ 0xA5A5A5A5)), 2)
  return `TRK-${body}${chk}`
}

/* Reorder adapters */
function firstImage(orderItem: OrderItem): string {
  return orderItem.bundle?.items?.[0]?.product?.images?.[0]?.image || ''
}
function earliestDate(dates: (string | null | undefined)[]): string | null {
  const ts = dates
    .filter(Boolean)
    .map(d => new Date(d as string).getTime())
    .filter(n => Number.isFinite(n))
  if (ts.length === 0) return null
  return new Date(Math.min(...ts)).toISOString()
}
function toCartBundleItems(items: BundleItem[]): CartBundleItem[] {
  return (items || []).map((bi) => {
    const p = bi.product
    const product: CartProduct = {
      id: p.id,
      title: p.title,
      images: p.images ?? [],
      company_name: p.company_data?.name ?? '',
      eco_score: undefined,
      unit: undefined
    }
    const quantity = (bi as any)?.quantity ?? 1
    const best_before_date = (bi as any)?.best_before_date ?? null
    return { product, quantity, best_before_date }
  })
}

/* Rating widgets */
function Star({ filled, onClick, disabled = false }: { filled: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`text-2xl leading-none ${filled ? 'text-yellow-500' : 'text-gray-300'} ${disabled ? 'cursor-default' : 'hover:scale-110'} transition`}
      aria-label={filled ? 'star filled' : 'star empty'}
    >
      ★
    </button>
  )
}
function StarRating({
  value,
  onChange,
  size = 5,
  readOnly = false,
}: {
  value: number
  onChange: (n: number) => void
  size?: number
  readOnly?: boolean
}) {
  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: size }).map((_, i) => (
        <Star key={i} filled={i < value} onClick={() => onChange(i + 1)} disabled={readOnly} />
      ))}
    </div>
  )
}

function displayStatus(order: Order): string {
  const base = normalizeStatus(order.status)
  if (base === 'Livrée' && !!order.customer_rating) return 'Évaluée'
  return base
}

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [ratingId, setRatingId] = useState<number | null>(null)

  const [orderRatingDraft, setOrderRatingDraft] = useState<Record<number, { rating: number; note: string }>>({})
  const [itemRatingDraft, setItemRatingDraft] = useState<Record<string, { rating: number; note: string }>>({})

  const { addToCart } = useCart()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const data = await http.get<Order[]>('/api/orders/')
      setOrders(data)
    } catch {
      toast.error('Erreur lors du chargement des commandes.')
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase()
    const base = q ? orders.filter(o => collectSearchHaystack(o).includes(q)) : orders
    const withProducts = base.filter(o =>
      (o.items || []).reduce((sum, it) => sum + (Number(it.quantity) || 0), 0) > 0
    )
    return [...withProducts].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [orders, search])

  /* Exclusión mutua */
  const openDetails = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id))
    setRatingId(null)
  }
  const openRating = (id: number) => {
    setRatingId(prev => (prev === id ? null : id))
    setExpandedId(null)
  }

  const canReorder = (order: Order) => {
    const v = normalizeStatus(order.status)
    if (!(v === 'Livrée' || v === 'En cours')) return false
    const allOk = order.items.every(it => {
      const stock = (it.bundle && typeof it.bundle.stock === 'number') ? it.bundle.stock! : Infinity
      return stock >= it.quantity
    })
    return allOk
  }
  const canRate = (status: string) => normalizeStatus(status) === 'Livrée'

  const onReorder = async (order: Order) => {
    try {
      const totalOrderWaste = Number(order.order_total_avoided_waste_kg) || 0
      const totalOrderCO2 = Number(order.order_total_avoided_co2_kg) || 0
      const orderSubtotal = order.items.reduce((acc, it) => acc + (Number(it.total_price) || 0), 0)

      const eligibleItems = order.items.filter(it => {
        const stock = (it.bundle && typeof it.bundle.stock === 'number') ? it.bundle.stock! : Infinity
        return stock >= it.quantity
      })
      const skipped = order.items.length - eligibleItems.length

      await Promise.all(
        eligibleItems.map(async (item) => {
          const itemSubtotal = Number(item.total_price) || 0
          const share = orderSubtotal > 0 ? itemSubtotal / orderSubtotal : 0

          const cartItems = toCartBundleItems(item.bundle.items)
          const unitPrice = item.quantity > 0 ? itemSubtotal / item.quantity : itemSubtotal
          const dluo = earliestDate(cartItems.map(ci => ci.best_before_date))

          const payload: CartItemType = {
            id: item.bundle.id,
            title: item.bundle.title,
            image: firstImage(item),
            price: unitPrice,
            quantity: item.quantity,
            dluo,
            items: cartItems,
            producerName: undefined,
            total_avoided_waste_kg: +(totalOrderWaste * share).toFixed(3),
            total_avoided_co2_kg: +(totalOrderCO2 * share).toFixed(3)
          }
          await addToCart(payload)
        })
      )

      if (skipped > 0) {
        toast.warn(`${skipped} article(s) indisponible(s) n'ont pas été ajoutés.`)
      }
      if (eligibleItems.length > 0) {
        toast.success('Articles ajoutés au panier.')
      } else if (skipped > 0) {
        toast.info('Aucun article ajouté en raison du stock insuffisant.')
      }
    } catch {
      toast.error("Impossible d'ajouter les articles au panier.")
    }
  }

  /* Envío conjunto: orden + items */
  const submitAllRatings = async (order: Order) => {
    const orderRated = !!order.customer_rating
    const orderDraft = orderRatingDraft[order.id] || { rating: order.customer_rating || 0, note: order.customer_note || '' }

    if (!orderRated && !orderDraft.rating) {
      toast.error('Veuillez évaluer la commande (1–5 étoiles).')
      return
    }
    const missingItems = order.items.filter(it => {
      const key = `${order.id}:${it.id}`
      const draft = itemRatingDraft[key]?.rating || 0
      const already = it.customer_rating || 0
      return !(already > 0 || draft > 0)
    })
    if (missingItems.length > 0) {
      toast.error(`Veuillez évaluer tous les articles (${missingItems.length} manquant${missingItems.length > 1 ? 's' : ''}).`)
      return
    }
    if (orderRated) {
      toast.info('Cette commande est déjà évaluée.')
      return
    }

    try {
      const itemPromises = order.items.map(async (it) => {
        if (it.customer_rating) return null
        const key = `${order.id}:${it.id}`
        const draft = itemRatingDraft[key]
        return http.post<OrderItem>(`/api/orders/${order.id}/items/${it.id}/rate/`, {
          rating: draft?.rating,
          note: draft?.note ?? ''
        })
      })
      const itemResults = await Promise.all(itemPromises)

      setOrders(prev =>
        prev.map(o => {
          if (o.id !== order.id) return o
          const updatedItems = o.items.map((it, idx) => {
            const apiRes = itemResults[idx]
            return apiRes ? { ...it, ...apiRes } : it
          })
          return { ...o, items: updatedItems }
        })
      )

      const updatedOrder = await http.post<Order>(`/api/orders/${order.id}/rate/`, {
        rating: orderDraft.rating,
        note: orderDraft.note ?? ''
      })

      setOrders(prev => prev.map(o => (o.id === order.id ? updatedOrder : o)))
      toast.success('Merci pour votre évaluation !')
    } catch {
      toast.error("Impossible d'enregistrer l'évaluation.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par code, statut, ville, producteur, produit…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-dark-green"
        />
        <button
          onClick={fetchOrders}
          className="bg-dark-green text-pale-yellow px-2.5 py-1.5 rounded-full font-semibold text-sm hover:bg-dark-green/90 shadow-sm transition-colors"
        >
          Actualiser
        </button>
      </div>

      {loading ? (
        <div className="text-gray-600">Chargement des commandes…</div>
      ) : filteredAndSorted.length === 0 ? (
        <p className="text-gray-500">Aucune commande trouvée.</p>
      ) : (
        <div className="space-y-4">
          {filteredAndSorted.map(order => {
            const thumbnails = extractThumbnails(order, 4)
            const statusLabel = displayStatus(order)
            const isExpanded = expandedId === order.id
            const itemsDistinct = order.items?.length ?? 0
            const itemsQty = (order.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 0), 0)

            const savings = clamp0(safeNumber(order.order_total_savings))
            const avoidedWaste = clamp0(safeNumber(order.order_total_avoided_waste_kg))
            const avoidedCO2 = clamp0(safeNumber(order.order_total_avoided_co2_kg))

            const subtotalProvided = safeNumber(order.subtotal)
            const subtotalFallback = order.items.reduce((acc, it) => acc + safeNumber(it.total_price), 0)
            const subtotal = subtotalProvided > 0 ? subtotalProvided : subtotalFallback

            const shipping = clamp0(safeNumber(order.shipping_cost))
            const total = safeNumber(order.total_price) || subtotal + shipping

            const tracking = generateTrackingFor(order)
            const allowReorder = canReorder(order)
            const allowRate = canRate(order.status)
            const orderRated = !!order.customer_rating
            const orderDraft = orderRatingDraft[order.id] || { rating: order.customer_rating || 0, note: order.customer_note || '' }

            const evalBtnLabel =
              ratingId === order.id
                ? (orderRated ? 'Fermer' : 'Fermer évaluation')
                : (orderRated ? 'Voir l’évaluation' : 'Évaluer')

            return (
              <div
                key={order.id}
                className={`rounded-lg p-6 shadow-sm transition-colors ${(isExpanded || ratingId === order.id) ? 'bg-emerald-50' : 'bg-white'}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex -space-x-2">
                      {thumbnails.length > 0 ? (
                        thumbnails.map((src, idx) => (
                          <a key={idx} href={src} className="inline-block">
                            <img
                              src={src}
                              alt="miniature"
                              className="w-10 h-10 rounded-md border border-white object-cover shadow-sm hover:opacity-90"
                            />
                          </a>
                        ))
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-gray-100 border border-white flex items-center justify-center text-xs text-gray-500">
                          —
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-dark-green">
                        Commande {order.order_code}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {formatDateTimeFR(order.created_at)}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {order.shipping_address?.city?.name ||
                          order.billing_address?.city?.name ||
                          '—'}
                      </p>
                      {tracking ? (
                        <p className="text-xs font-medium text-gray-700 mt-1">Tracking: {tracking}</p>
                      ) : null}
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusClasses(statusLabel)}`}>
                    {statusLabel}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                  <div className="text-sm text-gray-700">
                    {itemsQty} unité{itemsQty > 1 ? 's' : ''} 
                    ({itemsDistinct} produit{itemsDistinct > 1 ? 's' : ''})
                  </div>

                  <div className="text-sm text-gray-700 flex flex-wrap gap-x-4 gap-y-1">
                    <span>Économies: <span className="font-medium">{fmtEuro(savings)}</span></span>
                    <span>Déchets évités: <span className="font-medium">{fmtKg(avoidedWaste)}</span></span>
                    <span>CO₂ évité: <span className="font-medium">{fmtKg(avoidedCO2)}</span></span>
                  </div>

                  <div className="text-right text-lg font-bold text-dark-green">
                    {fmtEuro(total)}
                  </div>
                </div>

                {/* Botones con estado activo */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => openDetails(order.id)}
                    className={isExpanded ? btnActive : btnDetails}
                  >
                    {isExpanded ? 'Masquer les détails' : 'Voir les détails'}
                  </button>

                  {allowRate && (
                    <button
                      onClick={() => openRating(order.id)}
                      className={ratingId === order.id ? btnActive : btnEval}
                    >
                      {evalBtnLabel}
                    </button>
                  )}

                  <button
                    onClick={() => onReorder(order)}
                    className={btnReorder}
                    disabled={!allowReorder}
                  >
                    Recommander
                  </button>
                </div>

                {/* ÉVALUER */}
                {allowRate && ratingId === order.id && (
                  <div className="mt-4 border rounded-lg p-4 bg-amber-50">
                    {/* Orden */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-700">Évaluation de la commande</span>
                        <StarRating
                          value={orderDraft.rating}
                          onChange={(n) => setOrderRatingDraft(prev => ({ ...prev, [order.id]: { rating: n, note: (prev[order.id]?.note ?? order.customer_note ?? '') } }))}
                          readOnly={orderRated}
                        />
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${orderRated ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'}`}>
                        {orderRated ? 'Évaluée' : 'À évaluer'}
                      </span>
                    </div>
                    <textarea
                      value={orderDraft.note}
                      onChange={e => setOrderRatingDraft(prev => ({ ...prev, [order.id]: { rating: orderDraft.rating, note: e.target.value } }))}
                      placeholder="Votre commentaire (optionnel)"
                      className="mt-3 w-full border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
                      rows={2}
                      disabled={orderRated}
                    />

                    {/* Items */}
                    <div className="mt-4">
                      <div className="text-xs uppercase tracking-wide text-gray-600 mb-2">Articles de la commande</div>
                      <ul className="space-y-3">
                        {order.items.map(item => {
                          const firstImg = item.bundle?.items?.[0]?.product?.images?.[0]?.image
                          const companyName = item.bundle?.items?.[0]?.product?.company_data?.name || ''
                          const key = `${order.id}:${item.id}`
                          const draft = itemRatingDraft[key] || { rating: item.customer_rating || 0, note: item.customer_note || '' }
                          const readOnly = orderRated || !!item.customer_rating

                          return (
                            <li key={item.id} className="rounded-lg border p-3 bg-white">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className="w-12 h-12 rounded-md bg-gray-50 overflow-hidden">
                                    {firstImg ? (
                                      <a href={firstImg} className="inline-block w-full h-full">
                                        <img
                                          src={firstImg}
                                          alt="miniature"
                                          className="w-full h-full object-cover hover:opacity-90"
                                        />
                                      </a>
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">—</div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-medium text-sm text-gray-900">
                                      <a href={`/bundle/${item.bundle?.id}`} className="hover:underline hover:text-dark-green">
                                        {item.bundle?.title ?? 'Bundle'}
                                      </a>
                                    </div>
                                    {companyName ? (
                                      <div className="text-xs text-gray-600">{companyName}</div>
                                    ) : null}
                                    <div className="text-xs text-gray-600">
                                      Qté: {item.quantity}
                                      {clamp0(safeNumber(item.order_item_savings)) >= 0 && (
                                        <span className="ml-2">
                                          • Économie: {fmtEuro(clamp0(safeNumber(item.order_item_savings)))}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-sm font-semibold text-dark-green">
                                  {fmtEuro(safeNumber(item.total_price))}
                                </div>
                              </div>

                              <div className="mt-3 rounded-md bg-amber-50 p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-700">Note</span>
                                    <StarRating
                                      value={draft.rating}
                                      onChange={(n) => setItemRatingDraft(prev => ({ ...prev, [key]: { rating: n, note: (prev[key]?.note ?? item.customer_note ?? '') } }))}
                                      readOnly={readOnly}
                                    />
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full text-[11px] ${readOnly ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'}`}>
                                    {readOnly ? 'Évalué' : 'À évaluer'}
                                  </span>
                                </div>
                                <textarea
                                  value={draft.note}
                                  onChange={e => setItemRatingDraft(prev => ({ ...prev, [key]: { rating: draft.rating, note: e.target.value } }))}
                                  placeholder="Commentaire (optionnel)"
                                  className="mt-2 w-full border border-amber-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
                                  rows={2}
                                  disabled={readOnly}
                                />
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </div>

                    {/* Guardar todo */}
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => submitAllRatings(order)}
                        className="bg-white text-dark-green border border-dark-green px-3 py-2 rounded-full font-semibold text-sm hover:bg-dark-green hover:text-pale-yellow shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={orderRated}
                        title={orderRated ? 'Commande déjà évaluée' : 'Enregistrer toutes les évaluations'}
                      >
                        Enregistrer l’évaluation
                      </button>
                    </div>
                  </div>
                )}

                {/* DÉTAILS (sin evaluación) */}
                {isExpanded && (
                  <div className="mt-4 border-t pt-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <ul className="space-y-3">
                          {order.items.map(item => {
                            const firstImg = item.bundle?.items?.[0]?.product?.images?.[0]?.image
                            const companyName = item.bundle?.items?.[0]?.product?.company_data?.name || ''
                            return (
                              <li key={item.id} className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <div className="w-12 h-12 rounded-md bg-gray-50 overflow-hidden">
                                    {firstImg ? (
                                      <a href={firstImg} className="inline-block w-full h-full">
                                        <img
                                          src={firstImg}
                                          alt="miniature"
                                          className="w-full h-full object-cover hover:opacity-90"
                                        />
                                      </a>
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">—</div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-medium text-sm text-gray-900">
                                      <a
                                        href={`/bundle/${item.bundle?.id}`}
                                        className="hover:underline hover:text-dark-green"
                                      >
                                        {item.bundle?.title ?? 'Bundle'}
                                      </a>
                                    </div>
                                    {companyName ? (
                                      <div className="text-xs text-gray-600">{companyName}</div>
                                    ) : null}
                                    <div className="text-xs text-gray-600">
                                      Qté: {item.quantity}
                                      {clamp0(safeNumber(item.order_item_savings)) >= 0 && (
                                        <span className="ml-2">
                                          • Économie: {fmtEuro(clamp0(safeNumber(item.order_item_savings)))}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-sm font-semibold text-dark-green">
                                  {fmtEuro(safeNumber(item.total_price))}
                                </div>
                              </li>
                            )
                          })}
                        </ul>

                        <div className="mt-4 border-t pt-3 text-sm">
                          <div className="flex justify-between text-gray-700">
                            <span>Sous-total</span>
                            <span>{fmtEuro(subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-gray-700">
                            <span>Livraison</span>
                            <span>{fmtEuro(shipping)}</span>
                          </div>
                          <div className="flex justify-between font-semibold text-dark-green mt-1">
                            <span>Total</span>
                            <span>{fmtEuro(total)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Adresse de livraison</div>
                          <div className="text-sm text-gray-800">{formatAddress(order.shipping_address)}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Adresse de facturation</div>
                          <div className="text-sm text-gray-800">{formatAddress(order.billing_address)}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Paiement</div>
                          <div className="text-sm text-gray-800">
                            {order.payment_method_snapshot
                              ? `${order.payment_method_snapshot.provider ?? '—'} ${order.payment_method_snapshot.digits ?? ''}`.trim()
                              : '—'}
                          </div>
                        </div>
                        {generateTrackingFor(order) ? (
                          <div>
                            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Tracking</div>
                            <div className="text-sm text-gray-800">{generateTrackingFor(order)}</div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

