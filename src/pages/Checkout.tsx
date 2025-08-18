import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, CreditCard, FileText } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { http } from '../lib/api'

const FREE_SHIPPING_THRESHOLD = Number(import.meta.env.VITE_FREE_SHIPPING_THRESHOLD)
const BASE_SHIPPING_COST = Number(import.meta.env.VITE_BASE_SHIPPING_COST || 0)

type Address = {
  id: number
  street_number: string
  street_name: string
  city: {
    name: string
    postal_code: string
  } | null
}

export default function Checkout() {
  const { state, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const isFreeShipping = state.total >= FREE_SHIPPING_THRESHOLD

  const [addresses, setAddresses] = useState<Address[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])

  const [selectedShippingId, setSelectedShippingId] = useState<number | null>(null)
  const [selectedBillingId, setSelectedBillingId] = useState<number | null>(null)
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null)

  const totalAvoidedWaste = state.items.reduce(
    (sum, item) => sum + (Number(item.total_avoided_waste_kg) || 0) * item.quantity,
    0
  )
  const totalAvoidedCO2 = state.items.reduce(
    (sum, item) => sum + (Number(item.total_avoided_co2_kg) || 0) * item.quantity,
    0
  )

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (state.items.length === 0) {
      navigate('/cart', { replace: true })
      return
    }
  }, [user, state.items.length, navigate])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const data = await http.get<any[]>('/api/addresses/')
        if (!alive) return
        setAddresses(data || [])
        const def = (data || []).find((a: any) => a.is_primary)
        if (def) {
          setSelectedShippingId(def.id)
          setSelectedBillingId(def.id)
        }
      } catch {
        setAddresses([])
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const data = await http.get<any[]>('/api/payment-methods/')
        if (!alive) return
        setPaymentMethods(data || [])
        const def = (data || []).find((pm: any) => pm.is_default)
        if (def) setSelectedPaymentId(def.id)
      } catch {
        setPaymentMethods([])
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const labelPaymentMethod = (pm: any) => {
    const type = pm?.type ?? pm?.payment_method_type
    const provider = pm?.provider_name ?? pm?.provider ?? pm?.fournisseur ?? '—'
    const last4 = pm?.last4 ?? pm?.last_digits
    if (type === 'card') return `Carte ${provider}${last4 ? ` •••• ${last4}` : ''}`
    if (type === 'rib') return `IBAN ${provider}${last4 ? ` •••• ${last4}` : ''}`
    if (type === 'paypal') return `PayPal: ${pm?.paypal_email ?? '—'}`
    return 'Méthode inconnue'
  }

  const getProducerName = (item: any) =>
    item?.producerName ||
    item?.items?.[0]?.product?.company_name ||
    item?.items?.[0]?.product?.company_data?.name ||
    'Producteur inconnu'

  const canSubmit =
    addresses.length > 0 &&
    paymentMethods.length > 0 &&
    !!selectedShippingId &&
    !!selectedBillingId &&
    !!selectedPaymentId

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    const orderPayload = {
      shipping_address_id: selectedShippingId,
      billing_address_id: selectedBillingId,
      payment_method_id: selectedPaymentId,
      shipping_cost: isFreeShipping ? 0 : BASE_SHIPPING_COST,
      order_total_avoided_waste_kg: Number(totalAvoidedWaste || 0),
      order_total_avoided_co2_kg: Number(totalAvoidedCO2 || 0),
      items: state.items.map(item => ({
        bundle_id: item.id,
        quantity: item.quantity,
        order_item_total_avoided_waste_kg: Number(item.total_avoided_waste_kg || 0) * item.quantity,
        order_item_total_avoided_co2_kg: Number(item.total_avoided_co2_kg || 0) * item.quantity,
      })),
    }

    try {
      await http.post('/api/orders/', orderPayload, { headers: { 'Content-Type': 'application/json' } })
      await clearCart()
      navigate('/confirmation')
    } catch (err) {
      console.error('Order error:', err)
      alert('Une erreur est survenue lors de la création de la commande.')
    }
  }

  return (
    <div className="min-h-screen bg-pale-yellow/20 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-dark-green mb-8">Finaliser ma commande</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-dark-green mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" /> Adresse de livraison
              </h2>
              {addresses.length === 0 ? (
                <div className="flex items-center justify-between gap-4 bg-pale-yellow/30 border border-dark-green/10 rounded-lg p-4">
                  <p className="text-sm text-gray-700">Aucune adresse enregistrée.</p>
                  <Link
                    to="/account/address"
                    className="bg-dark-green text-pale-yellow px-6 py-2 rounded-full font-semibold hover:bg-dark-green/90 transition-colors"
                  >
                    Ajouter une adresse
                  </Link>
                </div>
              ) : (
                <select
                  required
                  value={selectedShippingId ?? ''}
                  onChange={(e) => setSelectedShippingId(Number(e.target.value))}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="" disabled>Sélectionnez une adresse de livraison</option>
                  {addresses.map(addr => (
                    <option key={addr.id} value={addr.id}>
                      {addr.street_number} {addr.street_name}, {addr.city?.name} {addr.city?.postal_code}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-dark-green mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" /> Adresse de facturation
              </h2>
              {addresses.length === 0 ? (
                <div className="flex items-center justify-between gap-4 bg-pale-yellow/30 border border-dark-green/10 rounded-lg p-4">
                  <p className="text-sm text-gray-700">Aucune adresse enregistrée.</p>
                  <Link
                    to="/account/address"
                    className="bg-dark-green text-pale-yellow px-6 py-2 rounded-full font-semibold hover:bg-dark-green/90 transition-colors"
                  >
                    Ajouter une adresse
                  </Link>
                </div>
              ) : (
                <select
                  required
                  value={selectedBillingId ?? ''}
                  onChange={(e) => setSelectedBillingId(Number(e.target.value))}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="" disabled>Sélectionnez une adresse de facturation</option>
                  {addresses.map(addr => (
                    <option key={addr.id} value={addr.id}>
                      {addr.street_number} {addr.street_name}, {addr.city?.name} {addr.city?.postal_code}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-dark-green mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> Méthode de paiement
              </h2>
              {paymentMethods.length === 0 ? (
                <div className="flex items-center justify-between gap-4 bg-pale-yellow/30 border border-dark-green/10 rounded-lg p-4">
                  <p className="text-sm text-gray-700">Aucun moyen de paiement enregistré.</p>
                  <Link
                    to="/account/payment"
                    className="bg-dark-green text-pale-yellow px-6 py-2 rounded-full font-semibold hover:bg-dark-green/90 transition-colors"
                  >
                    Ajouter un moyen de paiement
                  </Link>
                </div>
              ) : (
                <select
                  required
                  value={selectedPaymentId ?? ''}
                  onChange={(e) => setSelectedPaymentId(Number(e.target.value))}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="" disabled>Sélectionnez un moyen de paiement</option>
                  {paymentMethods.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {labelPaymentMethod(pm)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-dark-green">Récapitulatif</h3>
              <div className="space-y-4">
                {state.items.map(item => (
                  <div key={item.id} className="flex gap-4 border-b pb-4">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-dark-green">{item.title}</h4>
                      <p className="text-sm text-gray-600">
                        {getProducerName(item)}
                      </p>
                      <p className="text-xs text-gray-500">
                        DLUO: {item.dluo ? new Date(item.dluo).toLocaleDateString('fr-FR') : '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-700">x{item.quantity}</p>
                      <p className="text-sm font-medium text-dark-green">
                        {(item.price * item.quantity).toFixed(2)}€
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold border-t pt-4 mt-4 text-lg">
                <span>Total</span>
                <span>{state.total.toFixed(2)}€</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 h-fit sticky top-24 flex flex-col justify-between">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-dark-green">Résumé</h2>
              <div className="flex justify-between">
                <span>Sous-total ({state.items.reduce((s, i) => s + i.quantity, 0)} articles)</span>
                <span>{state.total.toFixed(2)}€</span>
              </div>

              <div className="flex justify-between">
                <span>Livraison</span>
                {isFreeShipping ? (
                  <span className="text-dark-green font-medium">Gratuite</span>
                ) : (
                  <span className="text-gray-600">{BASE_SHIPPING_COST.toFixed(2)}€</span>
                )}
              </div>
              <div className="pt-4 flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{(state.total + (isFreeShipping ? 0 : BASE_SHIPPING_COST)).toFixed(2)}€</span>
              </div>

              <div className="bg-pale-yellow/30 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-dark-green mb-2">🌱 Impact environnemental</h3>
                <p className="text-sm text-gray-600">
                  Vous sauvez environ <strong>{totalAvoidedWaste.toFixed(2)} kg</strong> de gaspillage alimentaire
                  et évitez <strong>{totalAvoidedCO2.toFixed(2)} kg</strong> de CO₂ !
                </p>
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className={`w-full py-4 rounded-full font-semibold text-lg transition-colors ${
                  canSubmit
                    ? 'bg-dark-green text-pale-yellow hover:bg-dark-green/90'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
              >
                Confirmer et payer
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-6">
              Paiement sécurisé • Livraison gratuite
              {FREE_SHIPPING_THRESHOLD >= 0 && <> dès {FREE_SHIPPING_THRESHOLD}€</>} • Satisfaction garantie
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
