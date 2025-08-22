import React, { useEffect, useState, useRef } from 'react'
import { toast } from 'react-toastify'
import { Edit, Trash, Plus } from 'lucide-react'
import PasswordConfirmModal from '../components/PasswordConfirmModal'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import Select from 'react-select'
import { http } from '../lib/api'

const PASSWORD_CONFIRM_PRODUCTS = import.meta.env.VITE_PASSWORD_CONFIRM_PRODUCTS === 'true'

interface Product {
  id: number
  title: string
  description: string
  variety: string
  stock: number
  unit: string
  original_price: number
  eco_score: string
  company: number
  storage_instructions: string
  certifications: { code: string }[]
  images?: { id: number; image: string }[]
  catalog_entry_data?: {
    id: number
    name: string
    category: {
      id: number
      label: string
    }
  }
  company_name?: string
  company_data?: {
    id: number
    name: string
    siret_number: string
    description: string
    logo: string
    address?: any
    is_active: boolean
    certifications: any[]
  }
  productCatalogId?: number | string
  sold_units?: number
  avg_rating : number
  ratings_count : number
}

interface Company {
  id: number
  name: string
}

interface ProductCatalogItem {
  id: number
  name: string
  category?: {
    id: number
    label: string
  }
}

interface Category {
  id: number
  label: string
}

export default function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [productCatalog, setProductCatalog] = useState<ProductCatalogItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)

  const [certifications, setCertifications] = useState<any[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [filteredCertifications, setFilteredCertifications] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [availableUnits, setAvailableUnits] = useState<{ value: string; label: string }[]>([])

  const [sortField, setSortField] = useState<
    'title' | 'variety' | 'stock' | 'sold_units' | 'unit' | 'original_price' | 'avg_rating' | 'company' | 'catalog_entry_data' | ''
  >('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [productIdToDelete, setProductIdToDelete] = useState<number | null>(null)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const [password, setPassword] = useState('')

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const certificationsRef = useRef<HTMLSelectElement | null>(null)
  const formBoxRef = useRef<HTMLDivElement | null>(null)

  const productToEdit: Product | undefined = products.find(p => p.id === editingId)
  const [existingImages, setExistingImages] = useState<{ id: number; image: string }[]>([])

  const STORAGE_OPTIONS: { value: string; label: string }[] = [
    { value: 'surgelé', label: 'Surgelé (-18°C)' },
    { value: 'frais', label: 'Frais (0-4°C)' },
    { value: 'réfrigéré', label: 'Réfrigéré (4-8°C)' },
    { value: 'temp_ambiante', label: 'Température ambiante' },
    { value: 'sec', label: 'Sec' },
    { value: 'cave', label: 'Stockage en cave' },
    { value: 'other', label: 'Selon le produit' },
  ]
  const UNIT_OPTIONS: { value: string; label: string }[] = [
    { value: 'pièce', label: 'Pièce' },
    { value: 'kg', label: 'Kilogramme' },
    { value: 'g', label: 'Gramme' },
    { value: 'l', label: 'Litre' },
    { value: 'cl', label: 'Centilitre' },
    { value: 'boîte', label: 'Boîte' },
    { value: 'botte', label: 'Botte' },
    { value: 'tête', label: 'Tête' },
    { value: 'gobelet', label: 'Gobelet' },
    { value: 'bouteille 75 cl', label: 'Bouteille 75 cl' },
    { value: 'bouteille 50 cl', label: 'Bouteille 50 cl' },
    { value: 'bouteille 25 cl', label: 'Bouteille 25 cl' },
    { value: 'bouteille 1 l', label: 'Bouteille 1 l' },
  ]

  const ECO_SCORE_OPTIONS: { value: string; label: string }[] = [
    { value: 'A', label: 'A (Très faible impact)' },
    { value: 'B', label: 'B (Faible impact)' },
    { value: 'C', label: 'C (Impact modéré)' },
    { value: 'D', label: 'D (Impact élevé)' },
    { value: 'E', label: 'E (Très fort impact)' },
  ]

  interface Props {
    products: Product[]
    companies: Company[]
    filteredProducts: Product[]
    sortField: string
    sortDirection: string
    searchTerm: string
    handleSort: (field: string) => void
    handleEdit: (product: Product) => void
    handleDelete: (id: number) => void
    showDeleteModal: boolean
    showPasswordConfirm: boolean
    onConfirmPassword: (password: string) => void
    confirmDelete: () => void
    setShowDeleteModal: (val: boolean) => void
    setProductIdToDelete: (id: number | null) => void
    setShowPasswordConfirm: (val: boolean) => void
  }

  const fetchProductCatalog = async () => {
    const data = await http.get<ProductCatalogItem[]>('/api/product-catalogs/')
    const sorted = data.sort((a, b) => a.name.localeCompare(b.name))
    setProductCatalog(sorted)
  }

  useEffect(() => {
    if (!selectedCompanyId) {
      setFilteredCertifications([])
      return
    }
    loadCertificationsByCompany(selectedCompanyId)
  }, [selectedCompanyId])

  const [form, setForm] = useState({
    title: '',
    description: '',
    variety: '',
    stock: '',
    unit: '',
    storage_instructions: '',
    certifications: [] as string[],
    category: '',
    original_price: '',
    eco_score: 'A',
    company: '',
    images: [] as File[],
    productCatalogId: '',
    productName: '',
    productCategory: ''
  })

  useEffect(() => {
    fetchProducts()
    fetchCompanies()
    fetchCategories()
    fetchCertifications()
    fetchProductCatalog()
  }, [])

  const fetchCertifications = async () => {
    const data = await http.get<any[]>('/api/certifications/')
    setCertifications(data)
  }

  const fetchCategories = async () => {
    const data = await http.get<Category[]>('/api/product-categories/')
    setCategories(data)
  }

  const fetchProducts = async () => {
    const data = await http.get<Product[]>('/api/products/')
    setProducts(data)
  }

  const fetchCompanies = async () => {
    const data = await http.get<Company[]>('/api/companies/')
    setCompanies(data)
  }

  const verifyPassword = async (pwd: string) => {
    try {
      await http.post('/api/auth/verify-password/', { password: pwd }, { headers: { 'Content-Type': 'application/json' } })
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target

    if (target instanceof HTMLSelectElement && target.multiple) {
      const selected = Array.from(target.options)
        .filter(option => option.selected)
        .map(option => String(option.value))
      setForm(prev => ({ ...prev, [target.name]: selected }))
      return
    }

    if (target instanceof HTMLInputElement && target.type === 'file') {
      const files = target.files
      if (files !== null) {
        setForm(prev => ({ ...prev, images: Array.from(files) }))
      }
      return
    }

    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      setForm(prev => ({ ...prev, [target.name]: target.checked }))
      return
    }

    setForm(prev => ({ ...prev, [target.name]: target.value }))
  }

  const handleSave = () => {
    const fieldLabels: Record<string, string> = {
      title: 'Produit',
      unit: 'Unité',
      stock: 'Stock',
      original_price: "Prix d'origine",
      company: 'Commerce associé',
      images: 'Images',
    }

    const missing: string[] = []

    if (!form.title.trim()) missing.push(fieldLabels.title)
    if (!form.unit) missing.push(fieldLabels.unit)
    if (!String(form.stock).trim()) missing.push(fieldLabels.stock)
    if (!String(form.original_price).trim()) missing.push(fieldLabels.original_price)
    if (!form.company) missing.push(fieldLabels.company)
    if (!editingId && (!form.images || form.images.length === 0)) {
      missing.push(fieldLabels.images)
    }

    if (missing.length > 0) {
      const first = missing[0]

      toast.warning(`Veuillez remplir les champs obligatoires : ${missing.join(', ')}`)

      const focusMap: Record<string, string> = {
        [fieldLabels.title]: 'title',
        [fieldLabels.unit]: 'unit',
        [fieldLabels.stock]: 'stock',
        [fieldLabels.original_price]: 'original_price',
        [fieldLabels.company]: 'company',
        [fieldLabels.images]: 'images',
      }
      const firstKey = focusMap[first]
      if (firstKey) {
        const el = document.querySelector(`[name="${firstKey}"]`) as HTMLElement | null
        el?.focus()
      }
      return
    }

    if (PASSWORD_CONFIRM_PRODUCTS) {
      confirmAction(() => (editingId ? updateProduct() : saveProduct()))
    } else {
      editingId ? updateProduct() : saveProduct()
    }
  }

  const saveProduct = async () => {
    const formData = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      if (key === 'images') {
        ;(value as File[]).forEach((file) => {
          formData.append('images', file)
        })
      } else if (key === 'certifications') {
        ;(value as string[]).forEach((val) => {
          formData.append('certification_ids', val)
        })
      } else if (key === 'category') {
        formData.append('category_id', value as string)
      } else if (key === 'productCatalogId') {
        formData.append('catalog_entry', value as string)
      } else if (value !== null && value !== '') {
        formData.append(key, value as any)
      }
    })

    try {
      await http.upload('/api/products/', formData)
      toast.success('Produit enregistré.')
      resetForm()
      setAvailableUnits([])
      fetchProducts()
      setShowForm(false)
    } catch (e: any) {
      const err = e?.response?.data
      toast.error(err ? Object.values(err).join(' | ') : 'Erreur')
    }
  }

  const updateProduct = async () => {
    const formData = new FormData()

    Object.entries(form).forEach(([key, value]) => {
      if (key === 'images') {
        ;(value as File[]).forEach((file) => {
          formData.append('images', file)
        })
      } else if (key === 'certifications') {
        ;(value as string[]).forEach((val) => {
          formData.append('certification_ids', val)
        })
      } else if (key === 'category') {
        formData.append('category_id', value as string)
      } else if (key === 'productCatalogId') {
        formData.append('catalog_entry', value as string)
      } else if (value !== null && value !== '') {
        formData.append(key, value as any)
      }
    })

    formData.append('keep_image_ids', existingImages.map(img => img.id).join(','))

    try {
      await http.patch(`/api/products/${editingId}/`, formData)
      toast.success('Produit mis à jour.')
      resetForm()
      setAvailableUnits([])
      fetchProducts()
      setShowForm(false)
    } catch (e: any) {
      const err = e?.response?.data
      toast.error(err ? Object.values(err).join(' | ') : 'Erreur')
    }
  }

  const loadCertificationsByCompany = async (companyId: string) => {
    try {
      const data = await http.get<any[]>(`/api/companies/${companyId}/certifications/`)
      setFilteredCertifications(data)
    } catch (err) {
      console.error('Erreur lors du chargement des certifications:', err)
      setFilteredCertifications([])
    }
  }

  const deleteProduct = async (id: number) => {
    try {
      await http.patch(`/api/products/${id}/`, { is_active: false }, { headers: { 'Content-Type': 'application/json' } })
      toast.success('Produit désactivé.')
      fetchProducts()
    } catch {
      toast.error('Erreur lors de la désactivation.')
    }
  }

  const handleEdit = async (product: Product) => {
    const matchedCatalog = productCatalog.find(
      p => p.id?.toString() === product.productCatalogId?.toString() || p.name === product.title
    )

    setExistingImages(product.images || [])

    const companyId = String(product.company || product.company_data?.id || '')

    setSelectedCompanyId(companyId)
    await loadCertificationsByCompany(companyId)

    setForm({
      title: matchedCatalog?.name || product.title || '',
      productName: matchedCatalog?.name || product.title || '',
      productCatalogId: matchedCatalog?.id?.toString() || '',
      category: matchedCatalog?.category?.id?.toString() || product.catalog_entry_data?.category.id?.toString() || '',
      productCategory: matchedCatalog?.category?.label || '',
      variety: product.variety || '',
      description: product.description || '',
      stock: String(product.stock || ''),
      unit: product.unit || 'kg',
      storage_instructions: product.storage_instructions || '',
      certifications: (product as any).certifications?.map((c: any) => String(c.id)) || [],
      original_price: String(product.original_price || ''),
      eco_score: product.eco_score || 'A',
      company: companyId,
      images: []
    })

    setEditingId(product.id)
    setShowForm(true)
    setTimeout(() => formBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  const handleDelete = (id: number) => {
    setProductIdToDelete(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (!productIdToDelete) return
    if (PASSWORD_CONFIRM_PRODUCTS) {
      confirmAction(() => {
        deleteProduct(productIdToDelete)
        setShowDeleteModal(false)
        setProductIdToDelete(null)
      })
    } else {
      deleteProduct(productIdToDelete)
      setShowDeleteModal(false)
      setProductIdToDelete(null)
    }
  }

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      variety: '',
      unit: '',
      storage_instructions: '',
      certifications: [],
      category: '',
      stock: '',
      original_price: '',
      eco_score: 'A',
      company: '',
      images: [],
      productCatalogId: '',
      productName: '',
      productCategory: ''
    })
    setEditingId(null)
    setSelectedCompanyId(null)
    setFilteredCertifications([])
    setAvailableUnits([])
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (certificationsRef.current) {
      Array.from(certificationsRef.current.options).forEach(option => {
        option.selected = false
      })
    }
  }

  const filteredProducts = [...products]
    .filter(prod =>
      prod.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.variety?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      companies.find(c => c.id === prod.company)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortField) return 0

      const getValue = (prod: Product) => {
        switch (sortField) {
          case 'company':
            return companies.find(c => c.id === prod.company)?.name?.toLowerCase() || ''
          case 'catalog_entry_data':
            return prod.catalog_entry_data?.category?.label?.toLowerCase() || ''
          case 'stock':
            return prod.stock ?? 0
          case 'sold_units':
            return prod.sold_units ?? 0
          case 'original_price':
            return prod.original_price ?? 0
          default:
            return (prod as any)[sortField]?.toString().toLowerCase?.() || ''
        }
      }

      const aValue = getValue(a) as any
      const bValue = getValue(b) as any

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

  const uniqueCertificationOptions = Array.from(
    new Map(filteredCertifications.map(cert => [cert.code, cert])).values()
  ).sort((a, b) => a.code.localeCompare(b.code))

  const groupedOptions = categories.map(cat => ({
    label: cat.label,
    options: productCatalog
      .filter(p => p.category?.id === cat.id)
      .map(p => ({ value: p.id, label: p.name }))
  }))

  const displayUnit = (u?: string) => (u ?? '').replace(/\bl\b/g, 'L')

  return (
    <div className="space-y-6 min-w-0">
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
              className="w-full sm:w-auto bg-dark-green text-pale-yellow px-4 py-2 rounded-full font-semibold hover:bg-dark-green/90 transition-colors flex items-center justify-center sm:justify-start space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau produit</span>
            </button>
          )}
        </div>
      </div>

      {(showForm || editingId) && (
        <div className="bg-white rounded-lg p-6 shadow-sm" ref={formBoxRef}>
          <h3 className="text-lg font-semibold mb-10">
            {editingId ? 'Modifier le produit' : 'Nouveau produit'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Catégorie du produit <span className="text-red-500">*</span>
              </label>
              <Select
                options={groupedOptions}
                placeholder="Commencer à taper un produit..."
                value={
                  form.productCatalogId
                    ? groupedOptions
                        .flatMap(group => group.options)
                        .find(opt => opt.value === Number(form.productCatalogId))
                    : null
                }
                onChange={async (option: any) => {
                  const matched = productCatalog.find(p => p.id === option.value)
                  if (matched) {
                    setForm({
                      ...form,
                      productName: matched.name,
                      productCatalogId: matched.id.toString(),
                      category: matched.category?.id.toString() || '',
                      title: matched.name
                    })

                    try {
                      const units = await http.get<{ value: string; label: string }[]>(
                        `/api/product-catalogs/${matched.id}/units/`
                      )
                      const sortedUnits = units.slice().sort(
                        (a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' })
                      )
                      setAvailableUnits(sortedUnits)
                      if (sortedUnits.length) setForm(prev => ({ ...prev, unit: sortedUnits[0].value }))
                    } catch {
                      setAvailableUnits([])
                    }
                  }
                }}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Catégorie du produit <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={form.category}
                disabled
                className="form-input w-full bg-gray-100 cursor-not-allowed"
              >
                <option value="">-- Sélectionné automatiquement --</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Variété
              </label>
              <input
                name="variety"
                value={form.variety}
                onChange={handleChange}
                className="form-input w-full"
                placeholder="Ex : Cœur de bœuf"
              />
            </div>

            <div className="md:col-span-2 mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Détails
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="form-input w-full h-[42px]"
                placeholder="Produit cultivé sans pesticides, idéal pour vos salades."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Stock <span className="text-red-500">*</span>
              </label>
              <input
                name="stock"
                value={form.stock}
                onChange={handleChange}
                className="form-input w-full"
                placeholder="Ex : 50"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Unité de mesure
              </label>
              <select name="unit" value={form.unit} onChange={handleChange} className="form-input w-full">
                <option value="">-- Sélectionnez une unité --</option>
                {(availableUnits.length ? availableUnits : [...UNIT_OPTIONS].sort(
                  (a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' })
                )).map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Prix d'origine (€) <span className="text-red-500">*</span>
              </label>
              <input
                name="original_price"
                value={form.original_price}
                onChange={handleChange}
                className="form-input w-full"
                placeholder="Ex : 2.50"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Éco-score
              </label>
              <select
                name="eco_score"
                value={form.eco_score}
                onChange={handleChange}
                className="form-input w-full"
              >
                <option value="">-- Sélectionnez un score --</option>
                {ECO_SCORE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Commerce associé <span className="text-red-500">*</span>
              </label>
              <select
                name="company"
                value={form.company}
                onChange={(e) => {
                  const companyId = e.target.value
                  setForm(prev => ({
                    ...prev,
                    company: companyId,
                    certifications: [],
                  }))
                  setSelectedCompanyId(companyId || null)
                  setFilteredCertifications([])
                }}
                className="form-input w-full"
              >
                <option value="">-- Choisissez un commerce --</option>
                {[...companies]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((company: any) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="certifications" className="text-sm font-semibold text-green-800">
                Certification
              </label>

              <Select
                inputId="certifications"
                isMulti
                closeMenuOnSelect={false}
                isDisabled={!selectedCompanyId}
                options={uniqueCertificationOptions.map(cert => ({
                  value: String(cert.id),
                  label: cert.code,
                }))}
                value={uniqueCertificationOptions
                  .filter(cert => form.certifications.includes(String(cert.id)))
                  .map(cert => ({ value: String(cert.id), label: cert.code }))}
                onChange={(selected) =>
                  setForm(prev => ({
                    ...prev,
                    certifications: (selected as { value: string; label: string }[] | null)?.map(o => o.value) ?? [],
                  }))
                }
                placeholder={selectedCompanyId ? "Sélectionner une ou plusieurs certifications..." : "Choisissez d'abord un commerce"}
                className="react-select-container"
                classNamePrefix="react-select"
                menuPortalTarget={document.body}
                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
              />
            </div>


            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Image {editingId ? '' : <span className="text-red-500">*</span>}
              </label>
              <input
                type="file"
                name="images"
                accept="image/*"
                multiple
                ref={fileInputRef}
                onChange={(e) => {
                  const files = e.target.files
                  if (files) {
                    setForm(prev => ({ ...prev, images: Array.from(files) }))
                  }
                }}
                className="form-input w-full"
              />

              {editingId && existingImages.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-dark-green mb-2">
                    Images actuelles
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {existingImages.map((img) => (
                      <div key={img.id} className="relative w-20 h-20">
                        <img
                          src={img.image}
                          alt="Produit"
                          className="w-full h-full object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => setExistingImages(prev => prev.filter(i => i.id !== img.id))}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mb-4 md:col-span-2">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Instructions de conservation
              </label>
              <select
                name="storage_instructions"
                value={form.storage_instructions}
                onChange={handleChange}
                className="form-input w-full"
              >
                <option value="">-- Choisissez une option --</option>
                {STORAGE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleSave}
              className="w-full sm:w-auto bg-dark-green text-pale-yellow px-6 py-2 rounded-full font-semibold hover:bg-dark-green/90 transition-colors"
            >
              {editingId ? 'Mettre à jour le produit' : 'Sauvegarder le produit'}
            </button>

            <button
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

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-stretch gap-3 px-6 pb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, variété ou commerce..."
            className="form-input w-full sm:max-w-sm"
          />
        </div>

        {/* Mobile cards */}
        <div className="md:hidden px-4 pb-4 space-y-3">
          {filteredProducts.length === 0 ? (
            <p className="text-gray-500 px-2">Aucun produit enregistré.</p>
          ) : (
            filteredProducts.map(prod => {
              const statusActive = (prod.stock ?? 0) > 0
              return (
                <div key={prod.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-md bg-gray-50 overflow-hidden shrink-0">
                      {prod.images?.[0]?.image ? (
                        <img
                          src={prod.images[0].image}
                          alt="Produit"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">—</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-dark-green truncate">{prod.title}</div>
                          <div className="text-xs text-gray-600 truncate">
                            {prod.company_data?.name || prod.company_name || '—'}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {prod.catalog_entry_data?.category?.label || '—'}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-[11px] shrink-0 ${statusActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                        >
                          {statusActive ? 'Actif' : 'Rupture'}
                        </span>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div className="text-gray-700">
                          Stock: <span className="font-medium">{prod.stock} {displayUnit(prod.unit)}</span>
                        </div>
                        <div className="text-gray-700">
                          Vendus: <span className="font-medium">{prod.sold_units ?? 0} {displayUnit(prod.unit)}</span>
                        </div>
                        <div className="text-gray-700">
                          Prix: <span className="font-semibold">{prod.original_price} €</span>
                        </div>
                        <div className="text-gray-700">
                          {prod.ratings_count === 0 ? (
                            <span>Non noté</span>
                          ) : (
                            <span className="font-medium">{prod.avg_rating}/5</span>
                          )}{' '}
                          {prod.ratings_count > 0 && <span className="text-gray-500">({prod.ratings_count} avis)</span>}
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                        <button
                          onClick={() => handleEdit(prod)}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-3 py-2 rounded-full border text-dark-green hover:bg-gray-50"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(prod.id)}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-3 py-2 rounded-full border text-red-600 hover:bg-red-50"
                          title="Supprimer"
                        >
                          <Trash className="w-4 h-4" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Desktop table */}
        {filteredProducts.length === 0 ? (
          <p className="hidden md:block text-gray-500 px-6 pb-6">Aucun produit enregistré.</p>
        ) : (
          <div className="hidden md:block overflow-x-auto">
            <div className="max-w-6xl mx-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      onClick={() => handleSort('company')}
                      className="px-6 py-3 text-xs font-medium text-gray-700 uppercase cursor-pointer select-none hover:text-dark-green"
                    >
                      Commerce
                      {sortField === 'company' ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : <span className="text-gray-300">▲</span>}
                    </th>

                    <th
                      onClick={() => handleSort('catalog_entry_data')}
                      className="px-6 py-3 text-xs font-medium text-gray-700 uppercase cursor-pointer select-none hover:text-dark-green"
                    >
                      Catégorie
                      {sortField === 'catalog_entry_data' ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : <span className="text-gray-300">▲</span>}
                    </th>

                    <th className="px-6 py-3 text-xs font-medium text-gray-700 uppercase">Image</th>

                    <th
                      onClick={() => handleSort('title')}
                      className="px-6 py-3 text-xs font-medium text-gray-700 uppercase cursor-pointer select-none hover:text-dark-green"
                    >
                      Nom
                      {sortField === 'title' ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : <span className="text-gray-300">▲</span>}
                    </th>

                    <th
                      onClick={() => handleSort('stock')}
                      className="px-6 py-3 text-xs font-medium text-gray-700 uppercase cursor-pointer select-none hover:text-dark-green"
                    >
                      Stock Produit
                      {sortField === 'stock' ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : <span className="text-gray-300">▲</span>}
                    </th>

                    <th
                      onClick={() => handleSort('sold_units')}
                      className="px-6 py-3 text-xs font-medium text-gray-700 uppercase cursor-pointer select-none hover:text-dark-green"
                    >
                      Produits Vendus
                      {sortField === 'sold_units' ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : <span className="text-gray-300">▲</span>}
                    </th>

                    <th
                      onClick={() => handleSort('original_price')}
                      className="px-6 py-3 text-xs font-medium text-gray-700 uppercase cursor-pointer select-none hover:text-dark-green"
                    >
                      Prix (€)
                      {sortField === 'original_price' ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : <span className="text-gray-300">▲</span>}
                    </th>

                    <th
                      onClick={() => handleSort('avg_rating')}
                      className="px-6 py-3 text-xs font-medium text-gray-700 uppercase cursor-pointer select-none hover:text-dark-green"
                    >
                      Note Moy.
                      {sortField === 'avg_rating' ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : <span className="text-gray-300">▲</span>}
                    </th>

                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                      Statut
                    </th>

                    <th className="px-6 py-3 text-xs font-medium text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200 text-xs">
                  {filteredProducts.map(prod => (
                    <tr key={prod.id}>
                      <td className="px-4 py-3">{prod.company_data?.name || prod.company_name || '—'}</td>
                      <td className="px-4 py-3">{prod.catalog_entry_data?.category?.label || '—'}</td>

                      <td className="px-4 py-3 text-center">
                        {prod.images?.[0]?.image ? (
                          <img
                            src={prod.images[0].image}
                            alt="Produit"
                            className="w-10 h-10 object-cover rounded bg-white border mx-auto"
                          />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{prod.title}</td>
                      <td className="px-4 py-3 text-right">
                        {prod.stock} {displayUnit(prod.unit)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {prod.sold_units ?? 0} {displayUnit(prod.unit)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {prod.original_price}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {prod.ratings_count === 0 ? (
                          "Non noté"
                        ) : (
                          <>
                            {prod.avg_rating}/5
                            <br />
                            ({prod.ratings_count} avis)
                          </>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            (prod.stock ?? 0) > 0
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {(prod.stock ?? 0) > 0 ? 'Actif' : 'Rupture'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex justify-center space-x-2">
                            <button onClick={() => handleEdit(prod)} className="text-dark-green hover:text-medium-brown" title="Modifier">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(prod.id)} className="text-red-500 hover:text-red-700" title="Supprimer">
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
            setProductIdToDelete(null)
          }}
        />
      </div>
    </div>
  )
}
