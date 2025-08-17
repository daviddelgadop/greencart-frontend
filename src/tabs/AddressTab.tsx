import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Edit, Trash, Plus } from 'lucide-react'
import PasswordConfirmModal from '../components/PasswordConfirmModal'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import Select, { SingleValue } from 'react-select'
import { http } from '../lib/api'

type Address = {
  id: number
  title: string
  street_number: string
  street_name: string
  complement?: string
  city: {
    id: number
    postal_code: string
    name: string
    country_name: string
    [key: string]: any
  } | null
  is_primary: boolean
}

type PostalOption = { value: number; label: string }

export default function AddressTab() {
  const [showForm, setShowForm] = useState(false)

  const [addresses, setAddresses] = useState<Address[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<'title' | 'city' | 'country_name' | ''>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [addressIdToDelete, setAddressIdToDelete] = useState<number | null>(null)
  const [postalOptions, setPostalOptions] = useState<PostalOption[]>([])

  const [form, setForm] = useState({
    title: '',
    street_number: '',
    street_name: '',
    complement: '',
    postal_code: '',
    city_id: 0,
    city_name: '',
    country_name: 'France',
    is_primary: false
  })

  const PASSWORD_CONFIRM_ADDRESSES =
    import.meta.env.VITE_PASSWORD_CONFIRM_ADDRESSES === 'true'

  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const [password, setPassword] = useState('')

  useEffect(() => {
    fetchAddresses()
    fetchPostalOptions()
  }, [])

  const fetchAddresses = async () => {
    try {
      const data = await http.get<Address[]>('/api/addresses/')
      setAddresses(data)
    } catch {
      toast.error('Erreur lors du chargement des adresses.')
    }
  }

  const fetchPostalOptions = async () => {
    try {
      const data = await http.get<any[]>('/api/postal-codes/')
      const options = data.map(item => ({
        value: item.id,
        label: `${item.postal_code} – ${item.ville}`
      }))
      setPostalOptions(options)
    } catch {
      setPostalOptions([])
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    const required: Record<string, string> = {
      title: 'Titre',
      street_number: 'Numéro',
      street_name: 'Rue',
      postal_code: 'Code postal',
      city_id: 'Ville'
    }
    const missing = Object.entries(required)
      .filter(([k]) => !String((form as any)[k] ?? '').trim())
      .map(([, v]) => v)

    if (missing.length) {
      toast.warning(`Champs manquants : ${missing.join(', ')}`)
      return
    }

    if (PASSWORD_CONFIRM_ADDRESSES) {
      editingId ? confirmAction(updateAddress) : confirmAction(saveAddress)
    } else {
      editingId ? updateAddress() : saveAddress()
    }
  }

  const saveAddress = async () => {
    try {
      await http.post('/api/addresses/', {
        title: form.title,
        street_number: form.street_number,
        street_name: form.street_name,
        complement: form.complement || '',
        city_id: form.city_id,
        is_primary: form.is_primary
      })
      toast.success("Adresse enregistrée.")
      resetForm()
      fetchAddresses()
      setShowForm(false)
    } catch (e: any) {
      showServerErrors(e)
    }
  }

  const updateAddress = async () => {
    if (!editingId) return
    try {
      await http.put(`/api/addresses/${editingId}/`, {
        title: form.title,
        street_number: form.street_number,
        street_name: form.street_name,
        complement: form.complement || '',
        city_id: form.city_id,
        is_primary: form.is_primary
      })
      toast.success("Adresse mise à jour.")
      resetForm()
      fetchAddresses()
      setShowForm(false)
    } catch (e: any) {
      showServerErrors(e)
    }
  }

  const deleteAddress = async (id: number) => {
    try {
      await http.patch(`/api/addresses/${id}/`, { is_active: false })
      toast.success('Adresse supprimée.')
      fetchAddresses()
    } catch {
      toast.error('Erreur lors de la désactivation.')
    }
  }

  const resetForm = () => {
    setForm({
      title: '',
      street_number: '',
      street_name: '',
      complement: '',
      postal_code: '',
      city_id: 0,
      city_name: '',
      country_name: 'France',
      is_primary: false
    })
    setEditingId(null)
  }

  const handleEdit = (addr: Address) => {
    setForm({
      title: addr.title,
      street_number: addr.street_number,
      street_name: addr.street_name,
      complement: addr.complement || '',
      city_id: addr.city?.id || 0,
      city_name: addr.city?.name || '',
      postal_code: addr.city?.postal_code || '',
      country_name: addr.city?.country_name || 'France',
      is_primary: addr.is_primary
    })
    setEditingId(addr.id)
    setShowForm(true)
  }

  const handleDelete = (id: number) => {
    setAddressIdToDelete(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (!addressIdToDelete) return
    if (PASSWORD_CONFIRM_ADDRESSES) {
      confirmAction(() => {
        deleteAddress(addressIdToDelete)
        setShowDeleteModal(false)
        setAddressIdToDelete(null)
      })
    } else {
      deleteAddress(addressIdToDelete)
      setShowDeleteModal(false)
      setAddressIdToDelete(null)
    }
  }

  const handleSort = (field: 'title' | 'city' | 'country_name') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredAndSortedAddresses = [...addresses]
    .filter(addr =>
      addr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (addr.city?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (addr.city?.country_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortField) return 0
      let aVal = ''
      let bVal = ''
      if (sortField === 'title') {
        aVal = a.title.toLowerCase()
        bVal = b.title.toLowerCase()
      } else if (sortField === 'city') {
        aVal = a.city?.name?.toLowerCase() || ''
        bVal = b.city?.name?.toLowerCase() || ''
      } else if (sortField === 'country_name') {
        aVal = a.city?.country_name?.toLowerCase() || ''
        bVal = b.city?.country_name?.toLowerCase() || ''
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

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
              <span>Ajouter une adresse</span>
            </button>
          )}
        </div>
      </div>

      {(showForm || editingId) && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-10">
            {editingId ? "Modifier l'adresse" : "Nouvelle adresse"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleInputChange}
                placeholder="Ex : Domicile, Bureau, Parent"
                className="form-input w-full"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Numéro <span className="text-red-500">*</span>
              </label>
              <input
                name="street_number"
                value={form.street_number}
                onChange={handleInputChange}
                placeholder="Ex : 24B"
                className="form-input w-full"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Rue <span className="text-red-500">*</span>
              </label>
              <input
                name="street_name"
                value={form.street_name}
                onChange={handleInputChange}
                placeholder="Ex : Rue des Lilas"
                className="form-input w-full"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Code Postal <span className="text-red-500">*</span>
              </label>
              <Select
                value={
                  form.city_id
                    ? { value: form.city_id, label: `${form.postal_code} – ${form.city_name}` }
                    : null
                }
                onChange={(selected: SingleValue<PostalOption>) => {
                  if (selected) {
                    const [postal, ville] = selected.label.split(' – ')
                    setForm(prev => ({
                      ...prev,
                      city_id: selected.value,
                      postal_code: postal,
                      city_name: ville
                    }))
                  } else {
                    setForm(prev => ({
                      ...prev,
                      city_id: 0,
                      postal_code: '',
                      city_name: ''
                    }))
                  }
                }}
                options={postalOptions}
                placeholder="Commencez à taper un code postal..."
                className="react-select-container"
                classNamePrefix="react-select"
                isClearable
                filterOption={(option, inputValue) =>
                  option.label.toLowerCase().startsWith(inputValue.toLowerCase())
                }
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Ville <span className="text-red-500">*</span>
              </label>
              <input name="city_name" value={form.city_name} disabled className="form-input w-full" />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Pays <span className="text-red-500">*</span>
              </label>
              <select
                name="country_name"
                value={form.country_name}
                onChange={handleSelectChange}
                className="form-input w-full"
              >
                <option value="France">France</option>
              </select>
            </div>

            <div className="md:col-span-2 mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">Complément</label>
              <input
                name="complement"
                value={form.complement}
                onChange={handleInputChange}
                placeholder="Ex : Bâtiment A, 2e étage, digicode 75B"
                className="form-input w-full"
              />
            </div>

            <div className="md:col-span-2 mb-4">
              <input
                type="checkbox"
                name="is_primary"
                checked={form.is_primary}
                onChange={handleInputChange}
              />
              <span className="text-sm font-semibold text-dark-green ml-2">
                Définir comme adresse principale
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleSave}
              className="bg-dark-green text-pale-yellow px-6 py-2 rounded-full font-semibold hover:bg-dark-green/90 transition-colors"
            >
              {editingId ? "Mettre à jour l'adresse" : "Sauvegarder l'adresse"}
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

        <div className="flex justify-between items-center px-6 pb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher par titre, ville ou pays..."
            className="form-input w-full max-w-sm"
          />
        </div>

        {filteredAndSortedAddresses.length === 0 ? (
          <p className="text-gray-500 px-6 pb-6">Aucune adresse enregistrée.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="max-w-6xl mx-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50 text-xs text-gray-700 uppercase tracking-wider">
                  <tr className="text-center">
                    <th
                      onClick={() => handleSort('title')}
                      title="Cliquer pour trier par titre"
                      className={`px-3 py-2 font-medium cursor-pointer select-none ${
                        sortField === 'title' ? 'text-dark-green' : 'text-gray-700'
                      }`}
                    >
                      Titre {sortField === 'title' ? (sortDirection === 'asc' ? '▲' : '▼') : <span className="text-gray-300">▲▼</span>}
                    </th>
                    <th className="px-3 py-2 font-medium">Adresse</th>
                    <th
                      onClick={() => handleSort('city')}
                      title="Cliquer pour trier par ville"
                      className={`px-3 py-2 font-medium cursor-pointer select-none ${
                        sortField === 'city' ? 'text-dark-green' : 'text-gray-700'
                      }`}
                    >
                      Ville {sortField === 'city' ? (sortDirection === 'asc' ? '▲' : '▼') : <span className="text-gray-300">▲▼</span>}
                    </th>
                    <th
                      onClick={() => handleSort('country_name')}
                      title="Cliquer pour trier par pays"
                      className={`px-3 py-2 font-medium cursor-pointer select-none ${
                        sortField === 'country_name' ? 'text-dark-green' : 'text-gray-700'
                      }`}
                    >
                      Pays {sortField === 'country_name' ? (sortDirection === 'asc' ? '▲' : '▼') : <span className="text-gray-300">▲▼</span>}
                    </th>
                    <th className="px-3 py-2 font-medium">Complément</th>
                    <th className="px-3 py-2 font-medium text-center">Principale</th>
                    <th className="px-3 py-2 font-medium text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200 text-xs">
                  {filteredAndSortedAddresses.map(addr => (
                    <tr key={addr.id} className="hover:bg-gray-50 text-center">
                      <td className="px-2 py-2 font-medium text-gray-900">{addr.title}</td>
                      <td className="px-2 py-2">
                        {addr.street_number} {addr.street_name}
                      </td>
                      <td className="px-2 py-2">
                        {addr.city ? `${addr.city.name} (${addr.city.postal_code})` : 'Ville inconnue'}
                      </td>
                      <td className="px-2 py-2">
                        {addr.city ? `${addr.city.country_name}` : 'Pays inconnu'}
                      </td>
                      <td className="px-2 py-2 text-gray-600">{addr.complement || '—'}</td>
                      <td className="px-2 py-2 text-center">
                        {addr.is_primary ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Oui</span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Non</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <div className="flex justify-center items-center space-x-2">
                          <button
                            onClick={() => handleEdit(addr)}
                            title="Modifier l'adresse"
                            className="text-dark-green hover:text-medium-brown"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(addr.id)}
                            title="Supprimer l'adresse"
                            className="text-red-500 hover:text-red-700"
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
          setAddressIdToDelete(null)
        }}
      />
    </div>
  )
}
