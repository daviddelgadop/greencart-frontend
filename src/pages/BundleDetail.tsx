import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, ShoppingCart, Heart, Share2, MapPin,
  Calendar, Leaf, Star, Truck, Shield, Recycle, Cloud, Package, ArrowRight, SortAsc
} from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import toast from 'react-hot-toast'
import { http } from '../lib/api'

const FREE_SHIPPING_THRESHOLD = Number(import.meta.env.VITE_FREE_SHIPPING_THRESHOLD)

interface ProductBundleItem {
  product: {
    variety?: string
    company_name?: string
    unit?: string
    title?: string
    description?: string
    storage_instructions_display?: string
    certifications?: { code: string }[]
    images?: { image: string }[]
    company_data?: any
    eco_score?: string
  }
  quantity?: number
  best_before_date?: string
}

function StarsDisplay({ value = 0, size = 16 }: { value?: number; size?: number }) {
  const clamped = Math.max(0, Math.min(5, value))
  const widthPct = (clamped / 5) * 100
  const starStyle: React.CSSProperties = { width: size, height: size }
  return (
    <span className="relative inline-block align-middle" style={{ lineHeight: 0 }}>
      <span className="flex text-gray-300 select-none">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={`o-${i}`} style={starStyle} className="shrink-0" />
        ))}
      </span>
      <span
        className="pointer-events-none absolute top-0 left-0 overflow-hidden text-yellow-500"
        style={{ width: `${widthPct}%` }}
        aria-hidden="true"
      >
        <span className="flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={`f-${i}`} style={starStyle} className="shrink-0" fill="currentColor" />
          ))}
        </span>
      </span>
    </span>
  )
}

function formatDate(d: Date) {
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}
function formatDateTimeISO(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${formatDate(d)} ${hh}:${mm}`
}

export default function BundleDetail() {
  const { id } = useParams()
  const { addToCart } = useCart()

  const [bundle, setBundle] = useState<any>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteId, setFavoriteId] = useState<number | null>(null)
  const [favLoading, setFavLoading] = useState(false)
  const accessToken = useMemo(() => localStorage.getItem('access') || '', [])

  const [evalSort, setEvalSort] =
    useState<'rated_desc' | 'rated_asc' | 'rating_desc' | 'rating_asc'>('rated_desc')

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) return
        const data = await http.get(`/api/public-bundles/${id}/`)
        setBundle(data)
      } catch (err) {
        console.error('Erreur lors du chargement du produit:', err)
      }
    }
    load()
  }, [id])

  useEffect(() => {
    if (!accessToken || !id || !bundle) return

    const loadFavoriteStatus = async () => {
      try {
        const data = await http.get<any[]>('/api/favorites/', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })

        const found = (Array.isArray(data) ? data : []).find(
          (f: any) => f?.bundle?.id === Number(bundle.id)
        )

        if (found) {
          setIsFavorite(true)
          setFavoriteId(found.id)
        } else {
          setIsFavorite(false)
          setFavoriteId(null)
        }
      } catch (e) {
        console.error('Erreur lors de la récupération des favoris:', e)
      }
    }

    loadFavoriteStatus()
  }, [accessToken, id, bundle])


  useEffect(() => {
    if (bundle) setQuantity(q => Math.min(q, Number(bundle.stock) || 0) || 1)
  }, [bundle])

  // --- Todos los hooks antes de cualquier return condicional ---
  const avgRatingNum = useMemo(() => Number(bundle?.avg_rating), [bundle])
  const ratingsCount = useMemo(() => Number(bundle?.ratings_count ?? 0), [bundle])
  const hasRating = Number.isFinite(avgRatingNum) && ratingsCount > 0

  const sortedEvaluations = useMemo(() => {
    const list = Array.isArray(bundle?.evaluations) ? [...bundle.evaluations] : []
    const key = (e: any) => {
      switch (evalSort) {
        case 'rating_desc':
        case 'rating_asc':
          return Number(e.rating) || 0
        case 'rated_asc':
        case 'rated_desc':
        default:
          return new Date(e.rated_at || e.ordered_at || 0).getTime()
      }
    }
    const dir = evalSort.endsWith('_asc') ? 1 : -1
    return list.sort((a, b) => {
      const A = key(a), B = key(b)
      if (A === B) return 0
      return (A < B ? -1 : 1) * dir
    })
  }, [bundle, evalSort])
  // -------------------------------------------------------------

  if (!bundle) {
    return <div className="text-center py-20 text-gray-500">Chargement du produit...</div>
  }

  const canBuy = Number(bundle?.stock) > 0
  const discountPct = Number(bundle.discounted_percentage ?? 0)
  const hasDiscount = discountPct > 0

  const firstProduct = bundle.items?.[0]?.product
  const images = bundle.items?.flatMap((item: ProductBundleItem) => item.product.images || []) || []

  const bestBeforeDate: Date | null = (() => {
    const dates = bundle.items
      .map((item: ProductBundleItem) => item.best_before_date)
      .filter(Boolean)
      .map((d: string) => new Date(d))
    if (dates.length === 0) return null
    if (dates.length === 1) return dates[0]
    return new Date(Math.max(...dates.map((d: Date) => d.getTime())))
  })()

  const commerceName: string =
    firstProduct?.company_data?.name ||
    firstProduct?.company_name ||
    ''

  const producerId: number | undefined = bundle?.producer_data?.id

  const dluoIso = bestBeforeDate
    ? `${bestBeforeDate.getFullYear()}-${String(bestBeforeDate.getMonth() + 1).padStart(2, '0')}-${String(bestBeforeDate.getDate()).padStart(2, '0')}`
    : null

  const handleAddToCart = async () => {
    const stock = Number(bundle?.stock) || 0
    if (stock <= 0) { toast.error('Ce produit est en rupture de stock.'); return }
    if (quantity > stock) { toast.error(`Quantité indisponible. Stock: ${stock}.`); return }

    await addToCart({
      id: Number(bundle.id),
      title: String(bundle.title),
      price: Number(hasDiscount ? bundle.discounted_price : bundle.original_price),
      image: images[0]?.image || '',
      dluo: dluoIso,
      producerName: firstProduct?.company_name || undefined,
      quantity,
      items: bundle.items,
      total_avoided_waste_kg: Number(bundle.total_avoided_waste_kg || 0),
      total_avoided_co2_kg: Number(bundle.total_avoided_co2_kg || 0)
    })
    toast.success(`${bundle.title} ajouté au panier !`)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: bundle.title, text: `Découvrez ${bundle.title} sur GreenCart`, url: window.location.href })
      } catch (err) { console.error('Erreur lors du partage:', err) }
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Lien copié dans le presse-papiers !')
    }
  }

  const handleToggleFavorite = async () => {
    if (!accessToken || favLoading) return
    setFavLoading(true)
    try {
      if (isFavorite && favoriteId) {
        try {
          await http.delete(`/api/favorites/${favoriteId}/`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          setIsFavorite(false)
          setFavoriteId(null)
          toast.success('Retiré de vos favoris')
        } catch (err: any) {
          if (err?.response?.status === 403) {
            toast.error("Vous n'avez pas l'autorisation pour supprimer ce favori.")
          } else {
            toast.error('Impossible de retirer des favoris.')
          }
        }
      } else {
        try {
          const data = await http.post(
            '/api/favorites/',
            { bundle_id: bundle.id },
            { headers: { Authorization: `Bearer ${accessToken}` } }
          )
          setIsFavorite(true)
          setFavoriteId(data?.id ?? null)
          toast.success('Ajouté à vos favoris')
        } catch (err: any) {
          if (err?.response?.status === 400) {
            setIsFavorite(true)
            toast('Déjà dans vos favoris', { icon: '❤️' })
          } else {
            toast.error("Impossible d'ajouter aux favoris.")
          }
        }
      }
    } catch (e) {
      console.error('Erreur favori:', e)
      toast.error('Erreur réseau pendant la mise à jour des favoris')
    } finally {
      setFavLoading(false)
    }
  }


  const producerAvgRaw = Number(bundle?.producer_data?.avg_rating)
  const producerCountRaw = Number(bundle?.producer_data?.ratings_count ?? 0)

  const companyAvgRaw = Number(firstProduct?.company_data?.avg_rating)
  const companyCountRaw = Number(firstProduct?.company_data?.ratings_count ?? 0)

  const producerRatingToShow = Number.isFinite(producerAvgRaw) ? producerAvgRaw : companyAvgRaw
  const producerCountToShow  = Number.isFinite(producerAvgRaw) ? producerCountRaw : companyCountRaw
  const hasProducerRating    = Number.isFinite(producerRatingToShow) && producerCountToShow > 0

  return (
    <div className="min-h-screen bg-pale-yellow/20 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link to="/" className="hover:text-dark-green">Accueil</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-dark-green">Boutique</Link>
          <span>/</span>
          <span className="text-dark-green">{bundle.title}</span>
        </div>

        <Link to="/shop" className="inline-flex items-center space-x-2 text-dark-green mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la boutique</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#fffdf8] rounded-2xl shadow-sm p-6 md:p-8 flex flex-col h-full">
            <div className="relative mb-4">
              <img
                src={images[selectedImage]?.image}
                alt={bundle.title}
                className="w-full h-96 object-cover rounded-xl"
              />
              {!canBuy && (
                <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Rupture de stock
                </div>
              )}
              {Number(bundle?.discounted_percentage) > 0 && (
                <div className="absolute top-4 left-4 bg-orange-beige text-white px-3 py-1 rounded-full text-sm font-semibold translate-y-7">
                  -{Number(bundle.discounted_percentage)}%
                </div>
              )}
            </div>

            <div className="mt-auto">
              <div className="flex flex-wrap gap-2">
                {images.map((img: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${selectedImage === index ? 'border-dark-green' : 'border-gray-200'}`}
                  >
                    <img src={img.image} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#fffdf8] rounded-2xl shadow-sm p-6 md:p-8 flex flex-col h-full">
            <div className="space-y-1 mb-3">
              <h1 className="text-2xl font-bold text-dark-green leading-tight">{bundle.title}</h1>
              <p className="text-base text-gray-600">Par {firstProduct?.company_name}</p>

              <div className="flex items-center gap-2">
                {hasRating ? (
                  <>
                    <StarsDisplay value={avgRatingNum} />
                    <span className="text-sm text-gray-700 font-medium">{avgRatingNum.toFixed(2)}/5</span>
                    <span className="text-xs text-gray-500">
                      ({ratingsCount} {ratingsCount > 1 ? "avis" : "avis"})
                    </span>                    
                  </>
                ) : (
                  <>
                    <StarsDisplay value={0} />
                    <span className="text-xs text-gray-500">Non noté</span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {bundle.discounted_percentage && Number(bundle.discounted_percentage) > 0 ? (
                  <>
                    <span className="text-2xl font-bold text-dark-green">
                      {Number(bundle.discounted_price).toFixed(2)}€
                    </span>
                    <span className="text-base text-gray-400 line-through">
                      {Number(bundle.original_price).toFixed(2)}€
                    </span>
                    <span className="bg-orange-beige/90 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                      Économisez {(Number(bundle.original_price) - Number(bundle.discounted_price)).toFixed(2)}€
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-dark-green">
                    {Number(bundle.original_price).toFixed(2)}€
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-[#fffdf8] p-5 shadow-sm">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-base leading-relaxed">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-0.5 text-orange-beige" />
                  <div className="min-w-0">
                    <dt className="text-gray-500">Origine</dt>
                    <dd className="text-gray-700 capitalize">
                      {firstProduct?.company_data?.address?.city?.name?.toLowerCase() || '—'}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 mt-0.5 text-orange-beige" />
                  <div className="min-w-0">
                    <dt className="text-gray-500">DLUO</dt>
                    <dd className="text-gray-700">
                      {bestBeforeDate ? formatDate(bestBeforeDate) : 'À consommer de préférence rapidement'}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Leaf className="w-5 h-5 mt-0.5 text-dark-green" />
                  <div className="min-w-0">
                    <dt className="text-gray-500">Éco-score</dt>
                    <dd>
                      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-gray-700">
                        {firstProduct?.eco_score || '—'}
                      </span>
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 mt-0.5 text-gray-400" />
                  <div className="min-w-0">
                    <dt className="text-gray-500">Stock</dt>
                    <dd className="text-gray-700">{bundle.stock}</dd>
                  </div>
                </div>

                {bundle.total_avoided_waste_kg && (
                  <div className="flex items-start gap-3">
                    <Recycle className="w-5 h-5 mt-0.5 text-green-600" />
                    <div className="min-w-0">
                      <dt className="text-gray-500">Gaspillage évité</dt>
                      <dd className="text-gray-700">{bundle.total_avoided_waste_kg} kg</dd>
                    </div>
                  </div>
                )}

                {bundle.total_avoided_co2_kg && (
                  <div className="flex items-start gap-3">
                    <Cloud className="w-5 h-5 mt-0.5 text-green-600" />
                    <div className="min-w-0">
                      <dt className="text-gray-500">CO₂ évité</dt>
                      <dd className="text-gray-700">{bundle.total_avoided_co2_kg} kg</dd>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 mt-0.5 text-gray-400" />
                  <div className="min-w-0">
                    <dt className="text-gray-700">
                      Livraison gratuite
                      {FREE_SHIPPING_THRESHOLD >= 0 && <> dès {FREE_SHIPPING_THRESHOLD}€</>}
                    </dt>
                    <dd className="text-gray-700"></dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 mt-0.5 text-gray-400" />
                  <div className="min-w-0">
                    <dt className="text-gray-700">Qualité garantie</dt>
                    <dd className="text-gray-700"></dd>
                  </div>
                </div>
              </dl>

              <div className="h-px bg-gray-100 my-5" />

              <div className="flex items-start gap-3">
                <span className="text-gray-500 shrink-0 pt-0.5">Contenu : </span>
                <p className="text-gray-700 text-base leading-relaxed">
                  {bundle.items
                    .map((item: any) => {
                      let unit = item.product.unit || ''
                      if (unit.toLowerCase() === 'l') unit = 'L'
                      const qty = item.quantity ?? 1
                      return `${qty} ${unit} ${item.product.title}`.replace(/\s+/g, ' ').trim()
                    })
                    .join(', ')}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <label className="text-base font-medium text-gray-700">Quantité :</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={!canBuy}
                    className="w-9 h-9 border border-gray-300 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-base">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(Number(bundle.stock) || 0, q + 1))}
                    disabled={!canBuy}
                    className="w-9 h-9 border border-gray-300 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!canBuy}
                  aria-disabled={!canBuy}
                  title={canBuy ? 'Ajouter au panier' : 'Indisponible – rupture de stock'}
                  className={`flex items-center space-x-2 rounded-full font-semibold text-sm px-2.5 py-1.5 shadow-sm transition-colors ${
                    canBuy
                      ? 'bg-dark-green text-pale-yellow hover:bg-dark-green/90'
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Ajouter au panier</span>
                </button>


                {accessToken && (
                  <button
                    onClick={handleToggleFavorite}
                    disabled={favLoading}
                    className={`p-3 rounded-full border ${favLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : ''}`} />
                  </button>
                )}

                <button onClick={handleShare} className="p-3 rounded-full border">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#fffdf8] rounded-2xl shadow-sm p-6 md:p-8 flex flex-col h-full">
            <h2 className="text-2xl font-bold text-dark-green mb-6">Caractéristiques</h2>
            <div className="space-y-4 text-base">
              <div className="flex justify-between items-start gap-6">
                <span className="font-medium text-gray-700 shrink-0">Description:</span>
                <div className="text-gray-600 text-justify space-y-1 w-full">
                  {bundle.items.map((item: any, idx: number) => (
                    <div key={idx}>
                      <span className="font-medium">{item.product.title}</span>
                      {` : ${item.product.description || 'Pas de description disponible'}`}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Origine:</span>
                <span className="text-gray-600">
                  {bundle.department_data?.name ? ` ${bundle.department_data.name}` : ''}
                  {bundle.region_data?.name ? `, ${bundle.region_data.name}` : ''}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Variété:</span>
                <span className="text-gray-600">
                  {(bundle.items as ProductBundleItem[]).map(i => i.product.variety).filter(Boolean).join(', ')}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Conservation:</span>
                <span className="text-gray-600">{firstProduct?.storage_instructions_display}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Certifications:</span>
                <div className="flex flex-wrap gap-2">
                  {firstProduct?.certifications?.map((cert: any, index: number) => (
                    <span key={index} className="bg-dark-green text-pale-yellow px-2 py-1 rounded-full text-xs">
                      {cert.code}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#fffdf8] rounded-2xl shadow-sm p-6 md:p-8 flex flex-col h-full">
            <h2 className="text-2xl font-bold text-dark-green mb-6">Producteur</h2>
            <div className="space-y-4">
              <div>
                <img
                  src={bundle?.producer_data?.avatar}
                  alt="Logo producteur"
                  className="h-24 w-24 object-contain rounded-full border mb-2"
                />
                <h3 className="font-semibold text-dark-green">
                  {bundle.producer_data?.public_display_name || `${bundle.producer_data?.first_name} ${bundle.producer_data?.last_name}`}
                </h3>
                {bundle.producer_data?.years_of_experience > 0 && (
                  <p className="text-sm text-gray-600">
                    {bundle.producer_data.years_of_experience}{' '}
                    {bundle.producer_data.years_of_experience === 1 ? 'an' : 'ans'} d’expérience
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {hasProducerRating ? (
                  <>
                    <StarsDisplay value={producerRatingToShow} />
                    <span className="text-gray-600">
                      {producerRatingToShow.toFixed(2)}/5 ({producerCountToShow} {producerCountToShow > 1 ? "avis" : "avis"})
                    </span>
                  </>
                ) : (
                  <>
                    <StarsDisplay value={0} />
                    <span className="text-gray-600">Non noté (0)</span>
                  </>
                )}
              </div>


              {bundle.producer_data?.description_utilisateur && (
                <p className="text-gray-600 leading-relaxed">
                  {bundle.producer_data.description_utilisateur}
                </p>
              )}

              <div className="flex gap-3">
                {producerId ? (
                  <Link
                    to={`/producers/${producerId}`}
                    className="inline-flex items-center gap-2 bg-dark-green text-pale-yellow px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-dark-green/90 shadow-sm"
                  >
                    Voir la fiche de {bundle.producer_data?.public_display_name || `${bundle.producer_data?.first_name} ${bundle.producer_data?.last_name}`} <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <span className="text-gray-500 text-sm">Profil producteur indisponible</span>
                )}
                {firstProduct?.company_name ? (
                  <Link
                    to={`/shop?commerce=${encodeURIComponent(firstProduct.company_name)}`}
                    className="inline-flex items-center gap-2 border border-dark-green text-dark-green px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-dark-green hover:text-white"
                  >
                    Voir les produits de {firstProduct?.company_name}<ArrowRight className="w-4 h-4" />
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-[#fffdf8] rounded-2xl shadow-sm p-6 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-dark-green">Avis</h2>
            <div className="flex items-center gap-2">
              <SortAsc className="w-4 h-4 text-gray-500" />
              <select
                value={evalSort}
                onChange={(e) => setEvalSort(e.target.value as any)}
                className="border rounded px-2 py-1 bg-white text-sm"
                aria-label="Trier les avis"
              >
                <option value="rated_desc">Date d’avis (récent → ancien)</option>
                <option value="rated_asc">Date d’avis (ancien → récent)</option>
                <option value="rating_desc">Note (haute → basse)</option>
                <option value="rating_asc">Note (basse → haute)</option>
              </select>
            </div>
          </div>

          {Array.isArray(sortedEvaluations) && sortedEvaluations.length > 0 ? (
            <ul className="space-y-4">
              {sortedEvaluations.map((ev: any, idx: number) => (
                <li key={`${ev.order_id}-${idx}`} className="rounded-xl border bg-white p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <StarsDisplay value={Number(ev.rating || 0)} />
                      <span className="text-sm text-gray-700 font-medium">
                        {Math.round(Number(ev.rating) || 0)}/5
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-500">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{ev.user_display_name || 'Client'}</span>
                      {' · '}
                      <span>Commande : <span className="font-mono">{ev.order_code}</span></span>
                    </div>
                    <div>Date de commande : <span className="text-gray-700">{formatDateTimeISO(ev.ordered_at)}</span></div>
                    <div>Date d’avis : <span className="text-gray-700">{formatDateTimeISO(ev.rated_at)}</span></div>
                  </div>

                  <div className="mt-2 text-gray-700">
                    {ev.note && ev.note.trim().length > 0 ? ev.note : 'Aucun commentaire'}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500">Aucun avis pour ce produit.</div>
          )}
        </div>
      </div>
    </div>
  )
}
