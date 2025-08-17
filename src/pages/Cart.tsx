import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const FREE_SHIPPING_THRESHOLD = Number(import.meta.env.VITE_FREE_SHIPPING_THRESHOLD)
const BASE_SHIPPING_COST = Number(import.meta.env.VITE_BASE_SHIPPING_COST || 0)

const FALLBACK_IMG =
  'https://via.placeholder.com/200x200.png?text=Image+indisponible'

export default function Cart() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { state, updateQuantity, removeFromCart, clearCart } = useCart()

  useEffect(() => {
    if (!user) {
      //window.dispatchEvent(new CustomEvent('cart:reset'))
      //navigate('/shop', { replace: true })
    }
  }, [user, navigate])

  const handleProceedToCheckout = () => {
    if (!user) {
      toast.custom(
        (t) => (
          <div className="bg-yellow-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-4 border-l-4 border-yellow-500">
            <span className="text-yellow-700 font-medium">Veuillez vous connecter pour continuer.</span>
            <button
              onClick={() => {
                toast.dismiss(t.id)
                navigate('/login')
              }}
              className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
            >
              Se connecter
            </button>
          </div>
        ),
        { duration: Infinity, position: 'top-center' }
      )
      return
    }
    navigate('/checkout')
  }

  const formatDLUO = (dluo?: string | null) => {
    if (!dluo) return 'À consommer de préférence rapidement'
    const d = new Date(dluo)
    return isNaN(d.getTime())
      ? 'À consommer de préférence rapidement'
      : d.toLocaleDateString('fr-FR')
  }
  
  const totalAvoidedWaste = state.items.reduce(
    (sum, item) => sum + (Number(item.total_avoided_waste_kg) || 0) * item.quantity,
    0
  )
  const totalAvoidedCO2 = state.items.reduce(
    (sum, item) => sum + (Number(item.total_avoided_co2_kg) || 0) * item.quantity,
    0
  )

  const isFreeShipping = state.total >= FREE_SHIPPING_THRESHOLD
  const shippingCost = isFreeShipping ? 0 : BASE_SHIPPING_COST

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-pale-yellow/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-dark-green mb-4">Votre panier est vide</h2>
            <p className="text-gray-600 mb-8">
              Découvrez nos produits locaux et anti-gaspillage pour remplir votre panier
            </p>
            <Link
              to="/shop"
              className="bg-dark-green text-pale-yellow px-8 py-4 rounded-full font-semibold text-lg hover:bg-dark-green/90 transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Continuer mes achats
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-pale-yellow/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-dark-green">Mon panier</h1>
          <Link
            to="/shop"
            className="text-dark-green hover:text-medium-brown transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Continuer mes achats
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {state.items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition cursor-pointer"
                onClick={(e) => {
                  const target = e.target as HTMLElement
                  if (target.closest('button')) return
                  navigate(`/bundle/${item.id}`)
                }}
              >
                <div className="flex gap-4">
                  <img
                    src={item.image || FALLBACK_IMG}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG
                    }}
                    alt={item.title}
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-dark-green">{item.title}</h3>
                        <p className="text-gray-600 text-sm">
                          {item.producerName || 'Producteur inconnu'}
                        </p>
                        <p className="text-xs text-gray-500">DLUO: {formatDLUO(item.dluo)}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFromCart(item.id)
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateQuantity(item.id, Math.max(1, item.quantity - 1))
                          }}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-dark-green transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-medium text-lg w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateQuantity(item.id, item.quantity + 1)
                          }}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-dark-green transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-bold text-dark-green">
                          {(Number(item.price) * item.quantity).toFixed(2)}€
                        </div>
                        <div className="text-sm text-gray-500">{Number(item.price).toFixed(2)}€ le lot</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="text-center">
              <button
                onClick={async () => {
                  await clearCart()
                  toast.success('Panier vidé')
                }}
                className="text-red-500 hover:text-red-700 transition-colors text-sm flex items-center gap-2 mx-auto"
              >
                <Trash2 className="w-4 h-4" />
                Vider le panier
              </button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-dark-green mb-6">Récapitulatif</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span>Sous-total ({state.items.reduce((sum, i) => sum + i.quantity, 0)} articles)</span>
                  <span>{state.total.toFixed(2)}€</span>
                </div>

                <div className="flex justify-between">
                  <span>Livraison</span>
                  {isFreeShipping ? (
                    <span className="text-dark-green font-medium">Gratuite</span>
                  ) : (
                    <span className="text-gray-600">{shippingCost.toFixed(2)}€</span>
                  )}
                </div>
                <div className="pt-4 flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{(state.total + shippingCost).toFixed(2)}€</span>
                </div>
              </div>

              <div className="bg-pale-yellow/30 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-dark-green mb-2">🌱 Impact environnemental</h3>
                <p className="text-sm text-gray-600">
                  Vous sauvez environ <strong>{totalAvoidedWaste.toFixed(2)} kg</strong> de gaspillage alimentaire et
                  évitez <strong>{totalAvoidedCO2.toFixed(2)} kg</strong> de CO₂ !
                </p>
              </div>

              <button
                onClick={handleProceedToCheckout}
                className="w-full bg-dark-green text-pale-yellow py-4 rounded-full font-semibold text-lg hover:bg-dark-green/90 transition-colors mb-4 flex items-center justify-center"
              >
                Procéder au paiement
              </button>

              <p className="text-xs text-gray-500 text-center">
                Paiement sécurisé • Livraison gratuite dès {FREE_SHIPPING_THRESHOLD.toFixed(2)} € • Satisfaction garantie
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
