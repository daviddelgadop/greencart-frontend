import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { Edit, Trash, Plus, RefreshCcw, UserCheck, Trash2 } from 'lucide-react'
import PasswordConfirmModal from '../components/PasswordConfirmModal'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import { http } from '../lib/api'

type UserType = 'producer' | 'customer'

type ConfirmDeleteModalProps = {
  visible: boolean
  message?: string
  onConfirm: () => void
  onCancel: () => void
}



type User = {
  id: number
  type: UserType
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  date_of_birth?: string | null
  public_display_name?: string
  years_of_experience?: number | null
  description_utilisateur?: string | null
  avatar?: string | null
  is_active: boolean
  deletion_requested?: boolean
  deletion_requested_at?: string | null
  date_joined?: string
}

type SortField = 'name' | 'email' | 'type' | 'is_active' | ''

export default function AdminUsersTab() {
  const [users, setUsers] = useState<User[]>([])
  const [view, setView] = useState<'all' | 'deletion'>('all')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<UserType | ''>('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all')

  const [sortField, setSortField] = useState<SortField>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmActionKind, setConfirmActionKind] = useState<'deactivate' | 'activate' | 'hard_delete'>('deactivate')
  const [userIdToConfirm, setUserIdToConfirm] = useState<number | null>(null)

  const PASSWORD_CONFIRM_USERS = import.meta.env.VITE_PASSWORD_CONFIRM_USERS === 'true'
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const [form, setForm] = useState<{
    type: UserType | ''
    first_name: string
    last_name: string
    email: string
    password: string
    phone: string
    date_of_birth: string
    public_display_name: string
    years_of_experience: string
    description_utilisateur: string
    avatar: File | null
  }>({
    type: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    date_of_birth: '',
    public_display_name: '',
    years_of_experience: '',
    description_utilisateur: '',
    avatar: null,
  })

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, typeFilter, activeFilter])

  const fetchData = async () => {
    try {
      if (view === 'deletion') {
        const data = await http.get<any>('/api/admin/users/deletion-requests/')
        const items = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])
        setUsers(items)
      } else {
        const params = new URLSearchParams()
        if (typeFilter) params.append('type', typeFilter)
        if (activeFilter !== 'all') params.append('is_active', activeFilter)
        const q = searchTerm.trim()
        if (q) params.append('q', q)
        const url = `/api/admin/users/${params.toString() ? `?${params.toString()}` : ''}`

        const data = await http.get<any>(url)
        const items = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])
        setUsers(items)
      }
    } catch {
      toast.error('Erreur lors du chargement des utilisateurs.')
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

  const confirmWithPasswordIfNeeded = (action: () => void) => {
    if (PASSWORD_CONFIRM_USERS) {
      setPendingAction(() => action)
      setShowPasswordConfirm(true)
    } else {
      action()
    }
  }

  const onConfirmPassword = async (pwd: string) => {
    const ok = await verifyPassword(pwd)
    if (ok && pendingAction) pendingAction()
    else toast.error('Mot de passe incorrect.')
    setShowPasswordConfirm(false)
    setPendingAction(null)
  }

  const resetForm = () => {
    setForm({
      type: '',
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      phone: '',
      date_of_birth: '',
      public_display_name: '',
      years_of_experience: '',
      description_utilisateur: '',
      avatar: null,
    })
    setEditingId(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, files } = e.target as HTMLInputElement
    if (name === 'avatar' && files) {
      setForm(prev => ({ ...prev, avatar: files[0] || null }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSave = () => {
    const missing: string[] = []
    if (!form.type) missing.push('Type')
    if (!form.first_name.trim()) missing.push('Prénom')
    if (!form.last_name.trim()) missing.push('Nom')
    if (!form.email.trim()) missing.push('Email')
    if (!editingId && !form.password.trim()) missing.push('Mot de passe')

    if (missing.length) {
      toast.warning(`Champs manquants : ${missing.join(', ')}`)
      return
    }

    if (editingId) {
      confirmWithPasswordIfNeeded(updateUser)
    } else {
      confirmWithPasswordIfNeeded(createUser)
    }
  }

  const createUser = async () => {
    try {
      const fd = new FormData()
      fd.append('type', form.type as string)
      fd.append('first_name', form.first_name)
      fd.append('last_name', form.last_name)
      fd.append('email', form.email)
      fd.append('password', form.password)
      if (form.phone) fd.append('phone', form.phone)
      if (form.date_of_birth) fd.append('date_of_birth', form.date_of_birth)
      if (form.public_display_name) fd.append('public_display_name', form.public_display_name)
      if (form.years_of_experience) fd.append('years_of_experience', String(parseInt(form.years_of_experience, 10) || 0))
      if (form.description_utilisateur) fd.append('description', form.description_utilisateur)
      if (form.avatar) fd.append('avatar', form.avatar)

      await http.post('/api/admin/users/', fd)
      toast.success('Utilisateur créé.')
      resetForm()
      setShowForm(false)
      fetchData()
    } catch (e: any) {
      showServerErrors(e)
    }
  }

  const updateUser = async () => {
    if (!editingId) return
    try {
      const fd = new FormData()
      if (form.type) fd.append('type', form.type as string)
      if (form.first_name) fd.append('first_name', form.first_name)
      if (form.last_name) fd.append('last_name', form.last_name)
      if (form.email) fd.append('email', form.email)
      if (form.phone) fd.append('phone', form.phone)
      if (form.date_of_birth) fd.append('date_of_birth', form.date_of_birth)
      if (form.public_display_name) fd.append('public_display_name', form.public_display_name)
      if (form.years_of_experience) fd.append('years_of_experience', String(parseInt(form.years_of_experience, 10) || 0))
      if (form.description_utilisateur) fd.append('description_utilisateur', form.description_utilisateur)
      if (form.avatar) fd.append('avatar', form.avatar)

      await http.patch(`/api/admin/users/${editingId}/`, fd)
      toast.success('Utilisateur mis à jour.')
      resetForm()
      setShowForm(false)
      fetchData()
    } catch (e: any) {
      showServerErrors(e)
    }
  }

  const handleEdit = (u: User) => {
    setForm({
      type: u.type || '',
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      email: u.email || '',
      password: '',
      phone: u.phone || '',
      date_of_birth: (u.date_of_birth || '').slice(0, 10),
      public_display_name: u.public_display_name || '',
      years_of_experience: u.years_of_experience != null ? String(u.years_of_experience) : '',
      description_utilisateur: u.description_utilisateur || '',
      avatar: null,
    })
    setEditingId(u.id)
    setShowForm(true)
  }

  const askDeactivate = (id: number) => {
    setUserIdToConfirm(id)
    setConfirmActionKind('deactivate')
    setShowConfirmModal(true)
  }

  const askActivate = (id: number) => {
    setUserIdToConfirm(id)
    setConfirmActionKind('activate')
    setShowConfirmModal(true)
  }

  const askHardDelete = (id: number) => {
    setUserIdToConfirm(id)
    setConfirmActionKind('hard_delete')
    setShowConfirmModal(true)
  }

  const doConfirmAction = () => {
    if (!userIdToConfirm) return
    const action =
      confirmActionKind === 'deactivate'
        ? () => deactivateUser(userIdToConfirm)
        : confirmActionKind === 'activate'
        ? () => activateUser(userIdToConfirm)
        : () => hardDeleteUser(userIdToConfirm)

    confirmWithPasswordIfNeeded(action)
    setShowConfirmModal(false)
    setUserIdToConfirm(null)
  }

  const deactivateUser = async (id: number) => {
    try {
      await http.post(`/api/admin/users/${id}/deactivate/`, {})
      toast.success('Utilisateur désactivé.')
      fetchData()
    } catch {
      toast.error('Erreur lors de la désactivation.')
    }
  }

  const activateUser = async (id: number) => {
    try {
      await http.post(`/api/admin/users/${id}/activate/`, {})
      toast.success('Utilisateur réactivé.')
      fetchData()
    } catch {
      toast.error('Erreur lors de la réactivation.')
    }
  }

  const hardDeleteUser = async (id: number) => {
    try {
      await http.post(`/api/admin/users/${id}/hard-delete/`, {})
      toast.success('Utilisateur supprimé définitivement.')
      fetchData()
    } catch (e: any) {
      const status = e?.status || e?.response?.status
      if (status === 400) {
        toast.error('Suppression refusée.')
      } else if (status === 403) {
        toast.error('Action réservée aux super-administrateurs.')
      } else if (status === 404) {
        toast.error('Utilisateur introuvable.')
      } else {
        toast.error("Échec de la suppression définitive.")
      }
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredSorted = useMemo(() => {
    const list = Array.isArray(users) ? users : []
    const term = searchTerm.trim().toLowerCase()

    const base = list.filter(u => {
      if (!term) return true
      const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase()
      const disp = (u.public_display_name || '').toLowerCase()
      return (
        (u.email || '').toLowerCase().includes(term) ||
        fullName.includes(term) ||
        disp.includes(term)
      )
    })

    const sorted = [...base].sort((a, b) => {
      if (!sortField) return 0
      let aVal = ''
      let bVal = ''

      if (sortField === 'name') {
        aVal = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase()
        bVal = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase()
      } else if (sortField === 'email') {
        aVal = (a.email || '').toLowerCase()
        bVal = (b.email || '').toLowerCase()
      } else if (sortField === 'type') {
        aVal = a.type || ''
        bVal = b.type || ''
      } else if (sortField === 'is_active') {
        aVal = a.is_active ? '1' : '0'
        bVal = b.is_active ? '1' : '0'
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [users, searchTerm, sortField, sortDirection])

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
    <div className="space-y-6 min-w-0">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => { setView('all'); fetchData() }}
                className={`px-4 py-2 rounded-full font-semibold border ${view === 'all'
                  ? 'bg-dark-green text-pale-yellow border-dark-green'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                Tous les utilisateurs
              </button>
              <button
                onClick={() => { setView('deletion'); setTypeFilter(''); setActiveFilter('all'); setSearchTerm('') }}
                className={`px-4 py-2 rounded-full font-semibold border ${view === 'deletion'
                  ? 'bg-dark-green text-pale-yellow border-dark-green'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                Demandes de suppression
              </button>
              <button
                onClick={() => fetchData()}
                title="Actualiser"
                className="p-2 rounded-full border border-gray-300 hover:bg-gray-50"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>

            {!showForm && !editingId && (
              <button
                type="button"
                onClick={() => { resetForm(); setShowForm(true) }}
                className="bg-dark-green text-pale-yellow px-4 py-2 rounded-full font-semibold hover:bg-dark-green/90 transition-colors flex items-center space-x-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un utilisateur</span>
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            {view === 'all' && (
              <>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value as UserType | '')}
                  className="form-input w-full sm:w-auto sm:min-w-[180px]"
                >
                  <option value="">Type: Tous</option>
                  <option value="producer">Producteur</option>
                  <option value="customer">Client</option>
                </select>

                <select
                  value={activeFilter}
                  onChange={e => setActiveFilter(e.target.value as 'all' | 'true' | 'false')}
                  className="form-input w-full sm:w-auto sm:min-w-[180px]"
                >
                  <option value="all">Statut: Tous</option>
                  <option value="true">Actif</option>
                  <option value="false">Inactif</option>
                </select>
              </>
            )}

            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') fetchData() }}
              placeholder="Rechercher par nom, email, nom public…"
              className="form-input w-full min-w-0"
            />
          </div>
        </div>
      </div>

      {(showForm || editingId) && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-8">
            {editingId ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleInputChange}
                className="form-input w-full"
              >
                <option value="">Sélectionnez…</option>
                <option value="producer">Producteur</option>
                <option value="customer">Client</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input name="first_name" value={form.first_name} onChange={handleInputChange} className="form-input w-full" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Nom <span className="text-red-500">*</span>
              </label>
              <input name="last_name" value={form.last_name} onChange={handleInputChange} className="form-input w-full" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input type="email" name="email" value={form.email} onChange={handleInputChange} className="form-input w-full" />
            </div>

            {!editingId && (
              <div>
                <label className="block text-sm font-semibold text-dark-green mb-2">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <input type="password" name="password" value={form.password} onChange={handleInputChange} className="form-input w-full" />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-dark-green mb-2">Téléphone</label>
              <input name="phone" value={form.phone} onChange={handleInputChange} className="form-input w-full" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-green mb-2">Date de naissance</label>
              <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleInputChange} className="form-input w-full" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-green mb-2">Nom affiché publiquement</label>
              <input name="public_display_name" value={form.public_display_name} onChange={handleInputChange} className="form-input w-full" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-green mb-2">Années d'expérience</label>
              <input name="years_of_experience" value={form.years_of_experience} onChange={handleInputChange} className="form-input w-full" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-dark-green mb-2">Description</label>
              <textarea name="description_utilisateur" value={form.description_utilisateur} onChange={handleInputChange} className="form-input w-full" rows={3} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-green mb-2">Avatar</label>
              <input type="file" name="avatar" accept="image/*" onChange={handleInputChange} className="form-input w-full" />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleSave}
              className="bg-dark-green text-pale-yellow px-6 py-2 rounded-full font-semibold hover:bg-dark-green/90 transition-colors"
            >
              {editingId ? "Mettre à jour l'utilisateur" : "Créer l'utilisateur"}
            </button>
            <button
              onClick={() => { resetForm(); setShowForm(false) }}
              className="px-6 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {editingId ? 'Annuler la modification' : 'Annuler'}
            </button>
          </div>
        </div>
      )}

      {/* Cards on mobile */}
      <div className="md:hidden space-y-3">
        {filteredSorted.length === 0 ? (
          <p className="text-gray-500">Aucun utilisateur.</p>
        ) : (
          filteredSorted.map(u => (
            <div key={u.id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">
                  {(u.first_name || '') + ' ' + (u.last_name || '')}
                </div>
                {u.is_active ? (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">Actif</span>
                ) : (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Inactif</span>
                )}
              </div>

              {u.deletion_requested && (
                <div className="mt-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 inline-block">
                  Suppression demandée
                </div>
              )}

              <div className="mt-2 text-sm space-y-1">
                <div className="truncate" title={u.email}>{u.email}</div>
                <div className="capitalize">{u.type}</div>
                <div className="text-gray-600">{u.public_display_name || '—'}</div>
                <div className="text-gray-600 break-words">{u.phone || '—'}</div>
              </div>

              <div className="mt-3 flex items-center gap-4 flex-wrap">
                <button onClick={() => handleEdit(u)} title="Modifier" className="text-dark-green hover:text-medium-brown">
                  <Edit className="w-4 h-4" />
                </button>
                {u.is_active ? (
                  <button onClick={() => askDeactivate(u.id)} title="Désactiver" className="text-red-500 hover:text-red-700">
                    <Trash className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={() => askActivate(u.id)} title="Réactiver" className="text-dark-green hover:text-medium-brown">
                    <UserCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => askHardDelete(u.id)}
                  title="Supprimer définitivement"
                  className="text-red-700 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Table on md+ */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden hidden md:block">
        <div className="flex justify-between items-center px-6 pb-4">
          <div className="text-sm text-gray-600">
            {view === 'all' ? 'Liste des utilisateurs' : 'Clients avec demande de suppression'}
          </div>
        </div>

        {filteredSorted.length === 0 ? (
          <p className="text-gray-500 px-6 pb-6">Aucun utilisateur.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[24%]" />
                <col className="w-[12%]" />
                <col className="w-[16%]" />
                <col className="w-[14%]" />
                <col className="w-[10%]" />
                <col className="w-[6%]" />
              </colgroup>

              <thead className="bg-gray-50 text-xs text-gray-700 uppercase tracking-wider">
                <tr className="text-center">
                  <th
                    onClick={() => handleSort('name')}
                    className={`px-3 py-2 font-medium cursor-pointer select-none ${sortField === 'name' ? 'text-dark-green' : 'text-gray-700'}`}
                    title="Trier par nom"
                  >
                    Nom {sortField === 'name' ? (sortDirection === 'asc' ? '▲' : '▼') : <span className="text-gray-300">▲▼</span>}
                  </th>
                  <th
                    onClick={() => handleSort('email')}
                    className={`px-3 py-2 font-medium cursor-pointer select-none ${sortField === 'email' ? 'text-dark-green' : 'text-gray-700'}`}
                    title="Trier par email"
                  >
                    Email {sortField === 'email' ? (sortDirection === 'asc' ? '▲' : '▼') : <span className="text-gray-300">▲▼</span>}
                  </th>
                  <th
                    onClick={() => handleSort('type')}
                    className={`px-3 py-2 font-medium cursor-pointer select-none ${sortField === 'type' ? 'text-dark-green' : 'text-gray-700'}`}
                    title="Trier par type"
                  >
                    Type {sortField === 'type' ? (sortDirection === 'asc' ? '▲' : '▼') : <span className="text-gray-300">▲▼</span>}
                  </th>
                  <th className="px-3 py-2 font-medium">Nom public</th>
                  <th className="px-3 py-2 font-medium">Téléphone</th>
                  <th
                    onClick={() => handleSort('is_active')}
                    className={`px-3 py-2 font-medium cursor-pointer select-none ${sortField === 'is_active' ? 'text-dark-green' : 'text-gray-700'}`}
                    title="Trier par statut"
                  >
                    Statut {sortField === 'is_active' ? (sortDirection === 'asc' ? '▲' : '▼') : <span className="text-gray-300">▲▼</span>}
                  </th>
                  <th className="px-3 py-2 font-medium text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200 text-xs">
                {filteredSorted.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 text-center">
                    <td className="px-2 py-2 font-medium text-gray-900 truncate" title={`${u.first_name || ''} ${u.last_name || ''}`}>
                      {(u.first_name || '') + ' ' + (u.last_name || '')}
                      {u.deletion_requested && (
                        <span className="ml-2 px-2 py-0.5 text-[10px] rounded-full bg-red-100 text-red-800">
                          Suppression demandée
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 truncate" title={u.email}>{u.email}</td>
                    <td className="px-2 py-2 capitalize truncate" title={u.type}>{u.type}</td>
                    <td className="px-2 py-2 truncate" title={u.public_display_name || '—'}>{u.public_display_name || '—'}</td>
                    <td className="px-2 py-2 break-words">{u.phone || '—'}</td>
                    <td className="px-2 py-2">
                      {u.is_active ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Actif</span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Inactif</span>
                      )}
                    </td>
										
					<td className="px-2 py-2">
					<div className="flex justify-center items-center space-x-2">
						<button
						onClick={() => handleEdit(u)}
						title="Modifier l'utilisateur"
						className="text-dark-green hover:text-medium-brown"
						>
						<Edit className="w-4 h-4" />
						</button>

						{u.is_active ? (
						<button
							onClick={() => askDeactivate(u.id)}
							title="Désactiver"
							className="text-red-500 hover:text-red-700"
						>
							<Trash className="w-4 h-4" />
						</button>
						) : (
						<button
							onClick={() => askActivate(u.id)}
							title="Réactiver"
							className="text-dark-green hover:text-medium-brown"
						>
							<UserCheck className="w-4 h-4" />
						</button>
						)}

						<button
						onClick={() => askHardDelete(u.id)}
						title="Supprimer définitivement"
						className="text-red-700 hover:text-red-800"
						>
						<Trash2 className="w-4 h-4" />
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

      <div className="flex items-center gap-3">
        <button
          onClick={() => fetchData()}
          className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      <PasswordConfirmModal
        visible={showPasswordConfirm}
        onClose={() => setShowPasswordConfirm(false)}
        onConfirm={onConfirmPassword}
      />

	<LocalConfirmModal
	visible={showConfirmModal}
	message={
		confirmActionKind === 'deactivate'
		? "Voulez-vous désactiver cet utilisateur ?"
		: confirmActionKind === 'activate'
		? "Voulez-vous réactiver cet utilisateur ?"
		: "Voulez-vous supprimer définitivement cet utilisateur ?"
	}
	onConfirm={doConfirmAction}
	onCancel={() => {
		setShowConfirmModal(false)
		setUserIdToConfirm(null)
	}}
	/>
    </div>
  )
}

function LocalConfirmModal({
  visible,
  message = "Are you sure?",
  onConfirm,
  onCancel,
}: {
  visible: boolean
  message?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!visible) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Confirmation</h3>
        <p className="mb-6 text-sm text-gray-700">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-full border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="rounded-full bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  )
}