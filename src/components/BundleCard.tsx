import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Leaf, ShoppingCart, Package, Calendar, Star } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL as string

interface BundleCardProps {
  bundle: any
  viewMode: 'grid' | 'list'
}

function resolveImage(url?: string | null): string {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  let u = url.startsWith('/') ? url : `/${url}`
  u = u.replace(/\/media\/media\//g, '/media/')
  if (!u.startsWith('/media/')) {
    if (u.startsWith('/media')) u = u.replace(/^\/media(?!\/)/, '/media/')
    else u = `/media${u}`
  }
  return `${API_URL}${u}`
}

function StarsDisplay({ value = 0, size = 16 }: { value?: number; size?: number }) {
  const clamped = Math.max(0, Math.min(5, value))
  const widthPct = (clamped / 5) * 100
  const starStyle: React.CSSProperties = { width: size, height: size }
  return (
    <div className="relative inline-block align-middle" style={{ lineHeight: 0 }}>
      <div className="flex text-gray-300 select-none">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={`o-${i}`} style={starStyle} className="shrink-0" />
        ))}
      </div>
      <div
        className="pointer-events-none absolute top-0 left-0 overflow-hidden"
        style={{ width: `${widthPct}%` }}
        aria-hidden="true"
      >
        <div className="flex text-yellow-500">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={`f-${i}`} style={starStyle} className="shrink-0" fill="currentColor" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function BundleCard({ bundle, viewMode }: BundleCardProps) {
  const { addToCart } = useCart()

  const firstProduct = bundle?.items?.[0]?.product
  const rawImage =
    firstProduct?.images?.[0]?.image ||
    bundle?.images?.[0]?.image ||
    bundle?.image ||
    ''
  const image = resolveImage(rawImage)

  const discount = Number(bundle?.discounted_percentage || 0)
  const canBuy = Number(bundle?.stock) > 0

  const producerName: string =
    firstProduct?.company_name ||
    bundle?.company?.name ||
    bundle?.company_name ||
    bundle?.producer_data?.public_display_name ||
    ''

  const bestBefore: Date | null = (() => {
    const dates: Date[] = (bundle?.items || [])
      .map((item: any) => (item?.best_before_date ? new Date(item.best_before_date) : null))
      .filter((d: Date | null): d is Date => !!d && !isNaN(d.getTime()) && d.getFullYear() >= 2000)
    return dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : null
  })()

  const ecoScores = Array.from(new Set(
    (bundle?.items || [])
      .map((i: any) => i?.product?.eco_score)
      .filter((score: string | undefined): score is string => Boolean(score))
  )).sort()

  const addClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!canBuy) return
    try {
      const avoided_waste_kg = Number(bundle?.total_avoided_waste_kg ?? 0) || 0
      const avoided_co2_kg = Number(bundle?.total_avoided_co2_kg ?? 0) || 0
      const price = Number(bundle?.discounted_price ?? bundle?.original_price ?? 0)

      await addToCart(
        {
          id: Number(bundle.id),
          title: String(bundle.title ?? ''),
          image,
          price,
          quantity: 1,
          dluo: bestBefore ? bestBefore.toISOString().slice(0, 10) : null,
          items: bundle?.items || [],
          producerName,
          total_avoided_waste_kg: avoided_waste_kg,
          total_avoided_co2_kg: avoided_co2_kg,
        },
        { avoided_waste_kg, avoided_co2_kg }
      )
      toast.success('Ajouté au panier')
    } catch {
      toast.error('Impossible d’ajouter au panier')
    }
  }

  const formattedDate = bestBefore
    ? bestBefore.toLocaleDateString('fr-FR')
    : 'À consommer rapidement'

  const region =
    firstProduct?.company_data?.address?.city?.name?.toLowerCase() || 'Région inconnue'

  const ratingsCount = Number(bundle?.ratings_count ?? 0)
  const hasRating = ratingsCount > 0
  const avgRating = hasRating ? Number(bundle?.avg_rating) : 0

  const RatingBlock = () => (
    <div className="mb-2 min-h-[1.25rem] flex items-center gap-2">
      <StarsDisplay value={hasRating ? avgRating : 0} />
      {hasRating ? (
        <>
          <span className="text-sm text-gray-700 font-medium">{avgRating.toFixed(2)}/5</span>
          <span className="text-xs text-gray-500">({ratingsCount} {ratingsCount > 1 ? "avis" : "avis"})</span>
        </>
      ) : (
        <span className="text-xs text-gray-500">Non noté</span>
      )}
    </div>
  )

  if (viewMode === 'list') {
    return (
      <Link to={`/bundle/${bundle.id}`} className="block">
        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 relative">
          <div className="flex gap-6">
            <div className="relative w-32 h-32 flex-shrink-0">
              <img src={image} alt={bundle.title} className="w-full h-full object-cover rounded-lg" />
              {!canBuy && (
                <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-semibold">Rupture</div>
              )}
              {discount > 0 && (
                <div className="absolute top-2 left-2 bg-orange-beige text-white px-2 py-1 rounded-full text-xs font-semibold translate-y-7">
                  -{discount}%
                </div>
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-semibold text-dark-green mb-1.5 line-clamp-2">
                {bundle.title}
              </h3>

              <RatingBlock />

              <p className="text-gray-600 mb-2 text-sm line-clamp-1">
                Par {producerName || 'Producteur inconnu'}
              </p>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-600 mb-2">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span className="capitalize">{region}</span>
                </span>
                {bestBefore && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>DLUO: {formattedDate}</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-500 mb-3">
                <span className="inline-flex items-center gap-1">
                  <Leaf className="w-3 h-3 text-dark-green" />
                  <span>{ecoScores.length ? ecoScores.join(', ') : '-'}</span>
                </span>
                {Number(bundle?.stock) > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    <span>Stock: {Number(bundle.stock)}</span>
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-dark-green">
                    {Number(bundle.discounted_price).toFixed(2)}€
                  </span>
                  {discount > 0 && (
                    <span className="text-gray-400 line-through text-sm">
                      {Number(bundle.original_price).toFixed(2)}€
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={addClick}
                  disabled={!canBuy}
                  aria-disabled={!canBuy}
                  title={canBuy ? 'Ajouter au panier' : 'Indisponible – rupture de stock'}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                    canBuy
                      ? 'bg-dark-green text-pale-yellow hover:bg-dark-green/90'
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Ajouter au panier
                </button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link to={`/bundle/${bundle.id}`} className="block group">
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden flex flex-col h-full">
        <div className="relative">
          <img
            src={image}
            alt={bundle.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {!canBuy && (
              <span className="inline-flex w-fit items-center px-2.5 py-1 rounded-full text-[12px] font-semibold bg-red-600 text-white whitespace-nowrap">
                Rupture de stock
              </span>
            )}
            {discount > 0 && (
              <span className="inline-flex w-fit items-center px-2.5 py-1 rounded-full text-[13px] font-semibold bg-orange-beige text-white whitespace-nowrap">
                -{Math.round(discount)}%
              </span>
            )}
          </div>
          {bestBefore && (
            <span className="absolute top-3 right-3 inline-flex w-fit items-center px-2.5 py-1 rounded-full text-[12px] font-semibold bg-dark-green text-pale-yellow whitespace-nowrap">
              DLUO: {formattedDate}
            </span>
          )}
        </div>

        <div className="p-6 flex flex-col flex-1">
          <h3 className="text-xl font-semibold text-dark-green mb-2 group-hover:text-medium-brown transition-colors line-clamp-2 min-h-[3.25rem]">
            {bundle.title}
          </h3>

          {/* Rating promedio + conteo */}
          <RatingBlock />

          <p className="text-gray-600 text-sm mb-2 line-clamp-1 min-h-[1.25rem]">
            Par {producerName || 'Producteur inconnu'}
          </p>

          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
            <div className="flex items-center gap-1 min-h-[1.25rem]">
              <MapPin className="w-3 h-3" />
              <span className="capitalize line-clamp-1">{region}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <Leaf className="w-3 h-3 text-dark-green" />
              <span className="line-clamp-1">{ecoScores.length ? ecoScores.join(', ') : '-'}</span>
            </div>
            {Number(bundle?.stock) > 0 && (
              <div className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                <span>Stock: {Number(bundle.stock)}</span>
              </div>
            )}
          </div>

          <div className="mt-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-dark-green">
                  {Number(bundle.discounted_price).toFixed(2)}€
                </span>
                {discount > 0 && (
                  <span className="text-gray-400 line-through text-sm">
                    {Number(bundle.original_price).toFixed(2)}€
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={addClick}
              disabled={!canBuy}
              aria-disabled={!canBuy}
              title={canBuy ? 'Ajouter au panier' : 'Indisponible – rupture de stock'}
              className={`w-full py-2 rounded-full font-medium flex items-center justify-center gap-2 ${
                canBuy
                  ? 'bg-dark-green text-pale-yellow hover:bg-dark-green/90'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              Ajouter au panier
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
