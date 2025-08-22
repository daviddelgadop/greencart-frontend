import React, { useEffect, useState, useRef } from 'react'
import { toast } from 'react-toastify'
import { Edit, Trash } from 'lucide-react'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import PasswordConfirmModal from '../components/PasswordConfirmModal'
import { http } from '../lib/api'

interface Certification {
  id: number
  company: { id: number; name: string }
  company_name: string
  code: string
  certification_number: string
  valid_until: string | null
  file: string
  is_active?: boolean
}

interface Company {
  id: number
  name: string
}

export default function CertificationsTab() {
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)

  const [showForm, setShowForm] = useState(false)
  const formBoxRef = useRef<HTMLDivElement>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<
    'company' | 'company_name' | 'code' | 'certification_number' | 'valid_until' | ''
  >('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const [password, setPassword] = useState('')
  const [certificationIdToDelete, setCertificationIdToDelete] = useState<number | null>(null)

  const [form, setForm] = useState({
    company: '',
    code: '',
    certification_number: '',
    valid_until: '',
    file: null as File | null
  })

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const PASSWORD_CONFIRM_CERTIFICATIONS =
    import.meta.env.VITE_PASSWORD_CONFIRM_CERTIFICATIONS === 'true'

  useEffect(() => {
    fetchCertifications()
    fetchCompanies()
  }, [])

  const fetchCertifications = async () => {
    try {
      const data = await http.get<Certification[]>('/api/certifications/')
      const active = data.filter(c => (c as any).is_active !== false)
      setCertifications(active)
    } catch {
      toast.error('Erreur lors du chargement des certifications.')
    }
  }

  const fetchCompanies = async () => {
    try {
      const data = await http.get<Company[]>('/api/companies/')
      setCompanies(data)
    } catch {
      toast.error('Erreur lors du chargement des commerces.')
    }
  }

  const sortedCertifications = [...certifications]
    .filter(cert =>
      (cert.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cert.certification_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortField) return 0
      const aVal = (sortField === 'company' ? a.company_name : (a as any)[sortField])?.toLowerCase() || ''
      const bVal = (sortField === 'company' ? b.company_name : (b as any)[sortField])?.toLowerCase() || ''
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })

  const handleSort = (
    field: 'company' | 'company_name' | 'code' | 'certification_number' | 'valid_until'
  ) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, files } = e.target as HTMLInputElement
    if (name === 'file' && files) {
      setForm(prev => ({ ...prev, file: files[0] }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSave = () => {
    const missing: string[] = []
    if (!form.company) missing.push('Commerce')
    if (!form.code) missing.push('Certification')
    if (!form.certification_number) missing.push('Numéro de certification')
    if (!form.file && !editingId) missing.push('Fichier')

    if (missing.length > 0) {
      toast.warning(`Veuillez remplir les champs obligatoires : ${missing.join(', ')}`)
      return
    }

    editingId ? updateCertification() : createCertification()
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

  const confirmDelete = () => {
    if (!certificationIdToDelete) return
    if (PASSWORD_CONFIRM_CERTIFICATIONS) {
      confirmAction(() => {
        deleteCertification(certificationIdToDelete)
        setShowDeleteModal(false)
        setCertificationIdToDelete(null)
      })
    } else {
      deleteCertification(certificationIdToDelete)
      setShowDeleteModal(false)
      setCertificationIdToDelete(null)
    }
  }

  const resetForm = () => {
    setForm({
      company: '',
      code: '',
      certification_number: '',
      valid_until: '',
      file: null
    })
    setEditingId(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function extractErrorMessages(obj: any): string[] {
    const messages: string[] = []
    if (typeof obj === 'string') return [obj]
    if (Array.isArray(obj)) obj.forEach(item => messages.push(...extractErrorMessages(item)))
    else if (obj && typeof obj === 'object') Object.values(obj).forEach(v => messages.push(...extractErrorMessages(v)))
    return messages
  }

  const createCertification = async () => {
    const formData = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      if (key === 'company') {
        formData.append('company', String(value))
      } else if (value !== null && value !== '') {
        formData.append(key, value as any)
      }
    })

    try {
      await http.upload('/api/certifications/', formData)
      toast.success('Certification enregistrée.')
      resetForm()
      setShowForm(false)
      fetchCertifications()
    } catch (e: any) {
      const err = e?.response?.data
      toast.error(err ? extractErrorMessages(err).join(' | ') : 'Erreur')
    }
  }

  const updateCertification = async () => {
    const formData = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      if (key === 'company') {
        formData.append('company', String(value))
      } else if (value !== null && value !== '') {
        formData.append(key, value as any)
      }
    })

    try {
      await http.patch(`/api/certifications/${editingId}/`, formData)
      toast.success('Certification mise à jour.')
      resetForm()
      setShowForm(false)
      fetchCertifications()
    } catch (e: any) {
      const err = e?.response?.data
      toast.error(err ? extractErrorMessages(err).join(' | ') : 'Erreur')
    }
  }

  const deleteCertification = async (id: number) => {
    try {
      await http.patch(`/api/certifications/${id}/`, { is_active: false }, {
        headers: { 'Content-Type': 'application/json' }
      })
      toast.success('Certification désactivée.')
      fetchCertifications()
    } catch {
      toast.error('Erreur lors de la désactivation.')
    }
  }

  const handleEdit = (cert: Certification) => {
    const matchingCompany = companies.find(c => c.name === cert.company_name)
    setForm({
      company: matchingCompany?.id.toString() || '',
      code: cert.code,
      certification_number: cert.certification_number || '',
      valid_until: cert.valid_until || '',
      file: null
    })
    setEditingId(cert.id)
    setShowForm(true)
  }

  const handleDelete = (id: number) => {
    setCertificationIdToDelete(id)
    setShowDeleteModal(true)
  }

  const onConfirmPassword = async (pwd: string) => {
    const ok = await verifyPassword(pwd)
    if (ok && pendingAction) pendingAction()
    else toast.error('Mot de passe incorrect.')
    setShowPasswordConfirm(false)
    setPassword('')
    setPendingAction(null)
  }

  return (
    <div className="space-y-6 min-w-0">
      {/* Toolbar */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-col md:flex-row">
          <h3 className="text-lg font-semibold text-dark-green"></h3>
          {!showForm && !editingId && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="w-full md:w-auto bg-dark-green text-pale-yellow px-4 py-2 rounded-full font-semibold hover:bg-dark-green/90 transition-colors"
            >
              Ajouter une certification
            </button>
          )}
        </div>
      </div>

      {/* Form card */}
      {(showForm || editingId) && (
        <div className="bg-white rounded-lg p-6 shadow-sm" ref={formBoxRef}>
          <h3 className="text-lg font-semibold mb-10">
            {editingId ? 'Modifier la certification' : 'Nouvelle certification'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Commerce <span className="text-red-500">*</span>
              </label>
              <select
                name="company"
                value={form.company}
                onChange={handleChange}
                required
                className="form-input w-full"
              >
                <option value="">Sélectionner un commerce</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id.toString()}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Certification <span className="text-red-500">*</span>
              </label>
              <select
                name="code"
                value={form.code}
                onChange={handleChange}
                className="form-input w-full"
              >
                <option value="">Sélectionner</option>
                <option value="AB">Agriculture Biologique</option>
                <option value="Demeter">Demeter</option>
                <option value="Label Rouge">Label Rouge</option>
                <option value="HVE">Haute Valeur Environnementale</option>
                <option value="IGP">Indication géographique protégée</option>
                <option value="AOP">Appellation d'origine protégée</option>
                <option value="Sans OGM">Sans OGM</option>
                <option value="Commerce Équitable">Commerce équitable</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                N° de certification <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="certification_number"
                value={form.certification_number}
                onChange={handleChange}
                className="form-input w-full"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Valide jusqu’au
              </label>
              <input
                type="date"
                name="valid_until"
                value={form.valid_until}
                onChange={handleChange}
                className="form-input w-full"
              />
            </div>

            <div className="md:col-span-2 mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Fichier PDF ou image {!editingId && <span className="text-red-500">*</span>}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                name="file"
                accept=".pdf,image/*"
                onChange={handleChange}
                className="form-input w-full"
              />
              {editingId && !form.file && certifications.find(c => c.id === editingId)?.file && (
                <p className="text-sm text-gray-500 mt-1">
                  Document actuel :
                  <a
                    href={certifications.find(c => c.id === editingId)?.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline ml-1"
                  >
                    Voir
                  </a>
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSave}
              className="w-full sm:w-auto bg-dark-green text-pale-yellow px-6 py-2 rounded-full font-semibold hover:bg-dark-green/90 transition-colors"
            >
              {editingId ? 'Mettre à jour la certification' : 'Sauvegarder la certification'}
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
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center px-0 md:px-2 pb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher par commerce, type ou numéro..."
            className="form-input w-full md:max-w-sm"
          />
        </div>

        {sortedCertifications.length === 0 ? (
          <p className="text-gray-500">Aucune certification enregistrée.</p>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {sortedCertifications.map(cert => (
                <div key={cert.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-dark-green truncate">{cert.company_name || '—'}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        <span className="font-medium">Type:</span> {cert.code || '—'}
                      </div>
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">N°:</span> {cert.certification_number || '—'}
                      </div>
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Valide jusqu’au:</span> {cert.valid_until || '—'}
                      </div>
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Document:</span>{' '}
                        {cert.file ? (
                          <a href={cert.file} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                            Voir
                          </a>
                        ) : (
                          '—'
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col gap-2">
                      <button
                        onClick={() => handleEdit(cert)}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-full border text-dark-green hover:bg-gray-50"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cert.id)}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-full border text-red-600 hover:bg-gray-50"
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
                      <th
                        onClick={() => handleSort('company_name')}
                        title="Cliquer pour trier par commerce"
                        className="cursor-pointer px-6 py-3 text-xs font-medium text-gray-700 uppercase text-center select-none hover:text-dark-green"
                      >
                        Commerce {sortField === 'company_name' ? (sortDirection === 'asc' ? '▲' : '▼') : <span className="text-gray-300">▲</span>}
                      </th>
                      <th
                        onClick={() => handleSort('code')}
                        title="Cliquer pour trier par type"
                        className="cursor-pointer px-6 py-3 text-xs font-medium text-gray-700 uppercase text-center select-none hover:text-dark-green"
                      >
                        Type Certification {sortField === 'code' ? (sortDirection === 'asc' ? '▲' : '▼') : <span className="text-gray-300">▲</span>}
                      </th>
                      <th
                        onClick={() => handleSort('certification_number')}
                        title="Cliquer pour trier par numéro"
                        className="cursor-pointer px-6 py-3 text-xs font-medium text-gray-700 uppercase text-center select-none hover:text-dark-green"
                      >
                        N° de certification {sortField === 'certification_number' ? (sortDirection === 'asc' ? '▲' : '▼') : <span className="text-gray-300">▲</span>}
                      </th>
                      <th
                        onClick={() => handleSort('valid_until')}
                        title="Cliquer pour trier par date de validité"
                        className="cursor-pointer px-6 py-3 text-xs font-medium text-gray-700 uppercase text-center select-none hover:text-dark-green"
                      >
                        Valide jusqu’au {sortField === 'valid_until' ? (sortDirection === 'asc' ? '▲' : '▼') : <span className="text-gray-300">▲</span>}
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-700 uppercase text-center">Documents</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-700 uppercase text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 text-xs">
                    {sortedCertifications.map(cert => (
                      <tr key={cert.id}>
                        <td className="text-center py-2">{cert.company_name || '—'}</td>
                        <td className="text-center py-2">{cert.code}</td>
                        <td className="text-center py-2">{cert.certification_number}</td>
                        <td className="text-center py-2">{cert.valid_until || '—'}</td>
                        <td className="text-center py-2">
                          {cert.file ? (
                            <a
                              href={cert.file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline"
                            >
                              Voir
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="text-center py-2">
                          <div className="flex justify-center space-x-4">
                            <button
                              onClick={() => handleEdit(cert)}
                              className="text-dark-green hover:text-medium-brown"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(cert.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash size={16} />
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
          setCertificationIdToDelete(null)
        }}
      />
    </div>
  )
}
