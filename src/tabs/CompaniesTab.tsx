import React, { useEffect, useState, useRef } from 'react'
import { toast } from 'react-toastify'
import { Edit, Trash } from 'lucide-react'
import PasswordConfirmModal from '../components/PasswordConfirmModal'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import { http } from '../lib/api'

type Company = {
  id: number
  name: string
  siret_number: string
  description: string
  logo: string | null
  address: {
    id?: number
    street_number: string
    street_name: string
    city: { name: string; postal_code: string } | null
  } | null
  avg_rating: number
  ratings_count: number
}

export default function CompaniesTab() {
  const [showForm, setShowForm] = useState(false)
  const formBoxRef = useRef<HTMLDivElement>(null)

  const [companies, setCompanies] = useState<Company[]>([])
  const [addresses, setAddresses] = useState<any[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<'name' | 'city' | 'siret_number' | 'avg_rating' | ''>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [companyIdToDelete, setCompanyIdToDelete] = useState<number | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '',
    siret_number: '',
    description: '',
    address_id: '',
    logo: null as File | null
  })

  const PASSWORD_CONFIRM_COMPANIES = import.meta.env.VITE_PASSWORD_CONFIRM_COMPANIES === 'true'
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const [password, setPassword] = useState('')

  useEffect(() => {
    fetchCompanies()
    fetchAddresses()
  }, [])

  function extractErrorMessages(obj: any): string[] {
    const messages: string[] = []
    if (typeof obj === 'string') return [obj]
    if (Array.isArray(obj)) obj.forEach(i => messages.push(...extractErrorMessages(i)))
    else if (obj && typeof obj === 'object') Object.values(obj).forEach(v => messages.push(...extractErrorMessages(v)))
    return messages
  }

  const fetchCompanies = async () => {
    try {
      const data = await http.get<Company[]>('/api/companies/')
      setCompanies(data)
    } catch {
      toast.error('Erreur lors du chargement des commerces.')
    }
  }

  const fetchAddresses = async () => {
    try {
      const data = await http.get<any[]>('/api/addresses/')
    setAddresses(data)
    } catch {
      toast.error('Erreur lors du chargement des adresses.')
    }
  }

  const verifyPassword = async (pwd: string) => {
    try {
      await http.post('/api/auth/verify-password/', { password: pwd }, {
        headers: { 'Content-Type': 'application/json' }
      })
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, files } = e.target as HTMLInputElement
    if (name === 'logo' && files) {
      setForm(prev => ({ ...prev, logo: files[0] }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSave = () => {
    const missing: string[] = []
    if (!form.name.trim()) missing.push('Nom')
    if (!form.siret_number.trim()) missing.push('SIRET')
    if (!form.address_id) missing.push('Adresse')
    if (!form.description.trim()) missing.push('Description')
    if (!editingId && !form.logo) missing.push('Logo')

    if (missing.length > 0) {
      toast.warning(`Champs manquants : ${missing.join(', ')}`)
      return
    }

    if (PASSWORD_CONFIRM_COMPANIES) {
      editingId ? confirmAction(updateCompany) : confirmAction(saveCompany)
    } else {
      editingId ? updateCompany() : saveCompany()
    }
  }

  const buildFormData = () => {
    const fd = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== '') fd.append(key, value as any)
    })
    return fd
  }

  const saveCompany = async () => {
    try {
      await http.upload('/api/companies/', buildFormData())
      toast.success('Commerce enregistré.')
      resetForm()
      setShowForm(false)
      fetchCompanies()
    } catch (e: any) {
      const err = e?.response?.data
      toast.error(err ? extractErrorMessages(err).join(' | ') : 'Erreur')
    }
  }

  const updateCompany = async () => {
    try {
      await http.patch(`/api/companies/${editingId}/`, buildFormData())
      toast.success('Commerce mis à jour.')
      resetForm()
      setShowForm(false)
      fetchCompanies()
    } catch (e: any) {
      const err = e?.response?.data
      toast.error(err ? extractErrorMessages(err).join(' | ') : 'Erreur')
    }
  }

  const deleteCompany = async (id: number) => {
    try {
      await http.patch(
        `/api/companies/${id}/`,
        { is_active: false },
        { headers: { 'Content-Type': 'application/json' } }
      )
      toast.success('Commerce désactivé.')
      fetchCompanies()
    } catch {
      toast.error('Erreur lors de la désactivation.')
    }
  }

  const resetForm = () => {
    setForm({ name: '', siret_number: '', description: '', address_id: '', logo: null })
    setEditingId(null)
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  const handleEdit = (company: Company) => {
    setForm({
      name: company.name,
      siret_number: company.siret_number,
      description: company.description,
      address_id: (company.address as any)?.id || '',
      logo: null
    })
    setEditingId(company.id)
    setShowForm(true)
  }

  const handleDelete = (id: number) => {
    setCompanyIdToDelete(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (!companyIdToDelete) return
    if (PASSWORD_CONFIRM_COMPANIES) {
      confirmAction(() => {
        deleteCompany(companyIdToDelete)
        setShowDeleteModal(false)
        setCompanyIdToDelete(null)
      })
    } else {
      deleteCompany(companyIdToDelete)
      setShowDeleteModal(false)
      setCompanyIdToDelete(null)
    }
  }

  const handleSort = (field: 'name' | 'city' | 'siret_number' | 'avg_rating') => {
    if (sortField === field) setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredCompanies = [...companies]
    .filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address?.city?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.siret_number.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortField) return 0

      if (sortField === 'avg_rating') {
        const aVal = Number(a.avg_rating) || 0
        const bVal = Number(b.avg_rating) || 0
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }

      const aVal =
        sortField === 'city'
          ? a.address?.city?.name?.toLowerCase() || ''
          : sortField === 'siret_number'
          ? a.siret_number.toLowerCase()
          : a.name.toLowerCase()
      const bVal =
        sortField === 'city'
          ? b.address?.city?.name?.toLowerCase() || ''
          : sortField === 'siret_number'
          ? b.siret_number.toLowerCase()
          : b.name.toLowerCase()

      return sortDirection === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    })

  const displayAddress = (c: Company) =>
    c.address && c.address.city
      ? `${c.address.street_number} ${c.address.street_name}, ${c.address.city.name} (${c.address.city.postal_code})`
      : '—'

  return (
    <div className="space-y-6 min-w-0">
      {/* Toolbar */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-dark-green"></h3>
          {!showForm && !editingId && (
            <button
              type="button"
              onClick={() => {
                setShowForm(true)
                setTimeout(() => formBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
              }}
              className="w-full sm:w-auto bg-dark-green text-pale-yellow px-4 py-2 rounded-full font-semibold hover:bg-dark-green/90 transition-colors"
            >
              Ajouter un commerce
            </button>
          )}
        </div>
      </div>

      {/* Form card */}
      {(showForm || editingId) && (
        <div className="bg-white rounded-lg p-6 shadow-sm" ref={formBoxRef}>
          <h3 className="text-lg font-semibold mb-10">
            {editingId ? 'Modifier le commerce' : 'Nouveau commerce'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Nom du commerce <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ex : La Ferme du Coin"
                className="form-input w-full"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Numéro SIRET <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="siret_number"
                value={form.siret_number}
                onChange={handleChange}
                maxLength={14}
                placeholder="Ex : 12345678900010"
                className="form-input w-full"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Adresse <span className="text-red-500">*</span>
              </label>
              <select
                name="address_id"
                value={form.address_id}
                onChange={handleChange}
                className="form-input w-full"
              >
                <option value="">Sélectionner une adresse</option>
                {[...addresses]
                  .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
                  .map(addr => (
                    <option key={addr.id} value={addr.id}>
                      {addr.title} – {addr.city?.name || 'Ville inconnue'} ({addr.city?.postal_code})
                    </option>
                  ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Logo {editingId ? '' : <span className="text-red-500">*</span>}
              </label>
              <input
                type="file"
                name="logo"
                accept="image/*"
                onChange={handleChange}
                ref={logoInputRef}
                className="form-input w-full"
              />
            </div>

            <div className="md:col-span-2 mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Ex : Producteur local de fruits et légumes bio..."
                rows={3}
                className="form-input w-full"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="w-full sm:w-auto bg-dark-green text-pale-yellow px-6 py-2 rounded-full font-semibold hover:bg-dark-green/90 transition-colors"
            >
              {editingId ? 'Mettre à jour le commerce' : 'Sauvegarder le commerce'}
            </button>

            <button
              type="button"
              onClick={() => {
                resetForm()
                setShowForm(false)
              }}
              className="w-full sm:w-auto px-6 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {editingId ? 'Annuler la modification' : 'Annuler'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between px-6 pb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, SIRET, ou ville..."
            className="form-input w-full sm:max-w-sm"
          />
        </div>

        {filteredCompanies.length === 0 ? (
          <p className="text-gray-500 px-6 pb-6">Aucun commerce enregistré.</p>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden px-4 pb-4 space-y-3">
              {filteredCompanies.map(company => (
                <div key={company.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 shrink-0 rounded bg-gray-50 border overflow-hidden flex items-center justify-center">
                      {company.logo ? (
                        <img
                          src={company.logo}
                          alt={company.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-dark-green truncate">{company.name}</div>
                        <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-100 text-emerald-800">
                          {company.ratings_count === 0 ? 'Non noté' : `${company.avg_rating}/5`}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 break-words">
                        SIRET: {company.siret_number}
                      </div>
                      <div className="text-sm text-gray-700 mt-1 line-clamp-2">
                        {company.description}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {displayAddress(company)}
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col gap-2">
                      <button
                        onClick={() => handleEdit(company)}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-full border text-dark-green hover:bg-gray-50"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(company.id)}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-full border text-red-600 hover:bg-red-50"
                        title="Supprimer"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <div className="max-w-6xl mx-auto">
                <table className="w-full table-fixed">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Logo</th>
                      <th
                        onClick={() => handleSort('name')}
                        className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase cursor-pointer select-none hover:text-dark-green"
                        title="Cliquer pour trier par nom"
                      >
                        Nom {sortField === 'name' ? (sortDirection === 'asc' ? '▲' : '▼') : <span className="text-gray-300">▲</span>}
                      </th>
                      <th
                        onClick={() => handleSort('siret_number')}
                        className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase cursor-pointer select-none hover:text-dark-green"
                        title="Cliquer pour trier par SIRET"
                      >
                        SIRET {sortField === 'siret_number' ? (sortDirection === 'asc' ? '▲' : '▼') : <span className="text-gray-300">▲</span>}
                      </th>
                      <th
                        onClick={() => handleSort('city')}
                        className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase cursor-pointer select-none hover:text-dark-green"
                        title="Cliquer pour trier par ville"
                      >
                        Adresse {sortField === 'city' ? (sortDirection === 'asc' ? '▲' : '▼') : <span className="text-gray-300">▲</span>}
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Description</th>
                      <th
                        onClick={() => handleSort('avg_rating')}
                        className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase cursor-pointer select-none hover:text-dark-green"
                        title="Cliquer pour trier par note"
                      >
                        Note Moy. {sortField === 'avg_rating' ? (sortDirection === 'asc' ? '▲' : '▼') : <span className="text-gray-300">▲</span>}
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200 text-xs">
                    {filteredCompanies.map(company => (
                      <tr key={company.id}>
                        <td className="px-4 py-3 text-center">
                          {company.logo ? (
                            <img
                              src={company.logo}
                              alt={`Logo de ${company.name}`}
                              className="w-10 h-10 object-contain rounded bg-white border mx-auto"
                            />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{company.name}</td>
                        <td className="px-4 py-3">{company.siret_number}</td>
                        <td className="px-4 py-3">
                          {displayAddress(company)}
                        </td>
                        <td className="px-4 py-3 whitespace-normal break-words max-w-xs">{company.description}</td>
                        <td className="px-4 py-3">
                          {company.ratings_count === 0
                            ? 'Non noté'
                            : `${company.avg_rating}/5 (${company.ratings_count} avis)`}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center space-x-2">
                            <button onClick={() => handleEdit(company)} className="text-dark-green hover:text-medium-brown" title="Modifier">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(company.id)} className="text-red-500 hover:text-red-700" title="Supprimer">
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
          </>
        )}
      </div>

      {/* Modals */}
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
          setCompanyIdToDelete(null)
        }}
      />
    </div>
  )
}
