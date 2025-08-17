import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Edit, Trash, Plus } from 'lucide-react'
import PasswordConfirmModal from '../components/PasswordConfirmModal'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import { http } from '../lib/api'

const PASSWORD_CONFIRM_PAYMENT = import.meta.env.VITE_PASSWORD_CONFIRM_PAYMENT === 'true'

type PaymentMethod = {
  id: number
  type: 'card' | 'paypal' | 'rib'
  provider_name: string
  digits?: string
  last4?: string
  paypal_email?: string
  is_default: boolean
}

const bankCodes: Record<string, string> = {
  '10096': 'Lyonnaise de Banque',
  '10107': 'BRED – Banque Populaire',
  '10278': 'Crédit Mutuel / CIC',
  '10548': 'Banque de Savoie',
  '11238': 'SwissLife Banque Privée',
  '11315': 'Caisse d’Épargne CEPAC',
  '11899': 'Banque Européenne du Crédit Mutuel',
  '12240': 'Allianz Banque',
  '12548': 'Oney Bank',
  '12933': 'CaixaBank France',
  '16188': 'Banque Populaire du Sud',
  '18359': 'Bpifrance',
  '18370': 'Orange Bank',
  '18869': 'Banque Française Mutualiste',
  '20041': 'La Banque Postale',
  '30002': 'Crédit Lyonnais (LCL)',
  '30003': 'Société Générale',
  '30004': 'BNP Paribas',
  '39996': 'Crédit Agricole',
  '40618': 'Boursorama',
  '42799': 'My Money Bank',
  '43199': 'Crédit Foncier de France',
  '44729': 'Banco Santander SA',
}

export default function PaymentTab() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [methodIdToDelete, setMethodIdToDelete] = useState<number | null>(null)

  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const [password, setPassword] = useState('')

  const [form, setForm] = useState({
    type: '' as '' | 'card' | 'paypal' | 'rib',
    provider_name: '',
    digits: '',
    paypal_email: '',
    is_default: false,
  })

  useEffect(() => {
    fetchMethods()
  }, [])

  const fetchMethods = async () => {
    try {
      const data = await http.get<PaymentMethod[]>('/api/payment-methods/')
      setMethods(data)
    } catch {
      toast.error('Erreur lors du chargement des méthodes.')
    }
  }

  const verifyPassword = async (pwd: string) => {
    try {
      await http.post('/api/auth/verify-password/', { password: pwd })
      return true
    } catch {
      return false
    }
  }

  const confirmAction = (action: () => void) => {
    setPendingAction(() => action)
    setShowPasswordConfirm(true)
  }

  const onConfirmPassword = async (pwd: string) => {
    const ok = await verifyPassword(pwd)
    if (ok && pendingAction) pendingAction()
    else toast.error('Mot de passe incorrect.')
    setShowPasswordConfirm(false)
    setPassword('')
    setPendingAction(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const isCheckbox = type === 'checkbox'

    if (name === 'digits' && form.type === 'rib') {
      const detectedBank = getFrenchBankNameFromIBAN(value)
      setForm(prev => ({
        ...prev,
        digits: value,
        provider_name: detectedBank || prev.provider_name,
      }))
      return
    }

    setForm(prev => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSave = () => {
    const required = ['provider_name']
    if (form.type === 'card') {
      const onlyDigits = (form.digits || '').replace(/\D+/g, '')
      if (onlyDigits.length !== 4) {
        toast.warning('Entrez exactement 4 chiffres pour la carte.')
        return
      }
    }

    if (form.type === 'paypal') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(form.paypal_email.trim())) {
        toast.warning("L'adresse email PayPal est invalide.")
        return
      }
    }

    if (form.type === 'rib') {
      const iban = (form.digits || '').trim().replace(/\s+/g, '').toUpperCase()
      if (!/^FR\d{25}$/.test(iban)) {
        toast.warning('IBAN FR invalide (format attendu FR + 25 caractères).')
        return
      }
    }
    
    const missing = required.filter(k => !String(form[k as keyof typeof form] ?? '').trim())
    if (missing.length) {
      toast.warning(`Champs manquants : ${missing.join(', ')}`)
      return
    }

    if (PASSWORD_CONFIRM_PAYMENT) {
      editingId ? confirmAction(updateMethod) : confirmAction(saveMethod)
    } else {
      editingId ? updateMethod() : saveMethod()
    }
  }

  const saveMethod = async () => {
    try {
      await http.post('/api/payment-methods/', form)
      toast.success('Méthode de paiement enregistrée.')
      resetForm()
      fetchMethods()
      setShowForm(false)
    } catch (e: any) {
      showServerErrors(e)
    }
  }

  const updateMethod = async () => {
    if (!editingId) return
    try {
      await http.put(`/api/payment-methods/${editingId}/`, form)
      toast.success('Méthode mise à jour.')
      resetForm()
      fetchMethods()
      setShowForm(false)
    } catch (e: any) {
      showServerErrors(e)
    }
  }

  const deleteMethod = async (id: number) => {
    try {
      await http.delete(`/api/payment-methods/${id}/`)
      toast.success('Méthode supprimée.')
      fetchMethods()
    } catch {
      toast.error('Erreur lors de la suppression.')
    }
  }

  const resetForm = () => {
    setForm({
      type: '',
      provider_name: '',
      digits: '',
      paypal_email: '',
      is_default: false,
    })
    setEditingId(null)
  }

  const handleEdit = (m: PaymentMethod) => {
    setForm({
      type: m.type,
      provider_name: m.provider_name,
      digits: m.digits || '',
      paypal_email: m.paypal_email || '',
      is_default: m.is_default,
    })
    setEditingId(m.id)
    setShowForm(true)
  }

  const handleDelete = (id: number) => {
    setMethodIdToDelete(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (!methodIdToDelete) return
    if (PASSWORD_CONFIRM_PAYMENT) {
      confirmAction(() => {
        deleteMethod(methodIdToDelete)
        setShowDeleteModal(false)
        setMethodIdToDelete(null)
      })
    } else {
      deleteMethod(methodIdToDelete)
      setShowDeleteModal(false)
      setMethodIdToDelete(null)
    }
  }

  const getFrenchBankNameFromIBAN = (iban: string): string | null => {
    const sanitized = iban.replace(/\s+/g, '').toUpperCase()
    if (!sanitized.startsWith('FR') || sanitized.length !== 27) return null
    const bankCode = sanitized.slice(4, 9)
    return bankCodes[bankCode] || null
  }

  function showServerErrors(err: any) {
    try {
      const data = err?.data || err
      const messages = Object.entries(data || {}).map(
        ([field, messages]) => `${field} : ${(messages as string[]).join(', ')}`
      )
      toast.error(messages.length ? messages.join(' | ') : 'Erreur')
    } catch {
      toast.error('Erreur')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-dark-green"></h3>
          {!showForm && !editingId && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="bg-dark-green text-pale-yellow px-4 py-2 rounded-full font-semibold hover:bg-dark-green/90 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter une méthode</span>
            </button>
          )}
        </div>
      </div>

      {(showForm || editingId) && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-10">
            {editingId ? 'Modifier la méthode' : 'Nouvelle méthode de paiement'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={form.type}
                onChange={e => {
                  const nextType = e.target.value as '' | 'card' | 'paypal' | 'rib'
                  setForm(prev => ({
                    ...prev,
                    type: nextType,
                    provider_name: nextType === 'paypal' ? 'PayPal' : nextType === 'rib' ? '' : prev.provider_name,
                    paypal_email: nextType === 'paypal' ? prev.paypal_email : '',
                    digits: '',
                  }))
                }}
                className="form-input w-full"
              >
                <option value="">Sélectionnez</option>
                <option value="card">Carte bancaire</option>
                <option value="paypal">PayPal</option>
                <option value="rib">RIB</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Fournisseur <span className="text-red-500">*</span>
              </label>
              <select
                name="provider_name"
                value={form.provider_name}
                onChange={handleInputChange}
                className="form-input w-full"
                disabled={form.type === 'rib'}
              >
                <option value="">Sélectionnez</option>

                {form.type === 'card' && (
                  <>
                    <option value="Visa">Visa</option>
                    <option value="MasterCard">MasterCard</option>
                    <option value="American Express">American Express</option>
                  </>
                )}

                {form.type === 'paypal' && <option value="PayPal">PayPal</option>}

                {form.type === 'rib' &&
                  Object.entries(bankCodes).map(([code, name]) => (
                    <option key={code} value={name}>
                      {name}
                    </option>
                  ))}
              </select>
            </div>

            {form.type === 'card' && (
              <div>
                <label className="block text-sm font-semibold text-dark-green mb-2">
                  4 derniers chiffres <span className="text-red-500">*</span>
                </label>
                <input
                  name="digits"
                  value={form.digits}
                  onChange={handleInputChange}
                  placeholder="Ex : 1234"
                  className="form-input w-full"
                />
              </div>
            )}

            {form.type === 'paypal' && (
              <div>
                <label className="block text-sm font-semibold text-dark-green mb-2">
                  Email PayPal <span className="text-red-500">*</span>
                </label>
                <input
                  name="paypal_email"
                  value={form.paypal_email}
                  onChange={handleInputChange}
                  placeholder="email@paypal.com"
                  className="form-input w-full"
                />
              </div>
            )}

            {form.type === 'rib' && (
              <div>
                <label className="block text-sm font-semibold text-dark-green mb-2">
                  IBAN <span className="text-red-500">*</span>
                </label>
                <input
                  name="digits"
                  value={form.digits}
                  onChange={handleInputChange}
                  onBlur={e => {
                    const detectedBank = getFrenchBankNameFromIBAN(e.target.value)
                    if (detectedBank) {
                      setForm(prev => ({ ...prev, provider_name: detectedBank }))
                    }
                  }}
                  placeholder="FR76 3000 1007 9412 3456 7890 185"
                  className="form-input w-full"
                />
              </div>
            )}

            <div className="md:col-span-2">
              <input
                type="checkbox"
                name="is_default"
                checked={form.is_default}
                onChange={handleInputChange}
              />
              <span className="text-sm font-semibold text-dark-green ml-2">
                Définir comme méthode par défaut
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleSave}
              className="bg-dark-green text-pale-yellow px-6 py-2 rounded-full font-semibold hover:bg-dark-green/90 transition-colors"
            >
              {editingId ? 'Mettre à jour' : 'Ajouter la méthode'}
            </button>
            <button
              onClick={() => {
                resetForm()
                setShowForm(false)
              }}
              className="px-6 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {editingId ? 'Annuler la modification' : 'Annuler'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">

        {methods.length === 0 ? (
          <p className="text-gray-500 px-6 pb-6">Aucune méthode enregistrée.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50 text-xs text-gray-700 uppercase tracking-wider">
                <tr className="text-center">
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Fournisseur</th>
                  <th className="px-3 py-2 font-medium">Détails</th>
                  <th className="px-3 py-2 font-medium">Défaut</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-xs">
                {methods.map(m => (
                  <tr key={m.id} className="text-center hover:bg-gray-50">
                    <td className="px-2 py-2">
                      {m.type === 'card' && 'Carte bancaire'}
                      {m.type === 'paypal' && 'PayPal'}
                      {m.type === 'rib' && 'RIB (virement)'}
                    </td>
                    <td className="px-2 py-2">{m.provider_name}</td>
                    <td className="px-2 py-2">
                      {m.type === 'card' && `•••• ${m.last4}`}
                      {m.type === 'paypal' && m.paypal_email}
                      {m.type === 'rib' &&
                        `${m.provider_name || 'Banque inconnue'} •••• ${m.last4 || 'XXXX'}`}
                    </td>
                    <td className="px-2 py-2">
                      {m.is_default ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Oui
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          Non
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex justify-center items-center space-x-2">
                        <button
                          onClick={() => handleEdit(m)}
                          className="text-dark-green hover:text-medium-brown"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Supprimer"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PasswordConfirmModal
        visible={showPasswordConfirm}
        onClose={() => setShowPasswordConfirm(false)}
        onConfirm={onConfirmPassword}
      />
      <ConfirmDeleteModal
        visible={showDeleteModal}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false)
          setMethodIdToDelete(null)
        }}
      />
    </div>
  )
}
