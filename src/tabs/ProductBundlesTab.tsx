import React, { useEffect, useState, useRef, useMemo } from 'react'
import { toast } from 'react-toastify'
import { Eye, Edit, Trash, UploadCloud, Archive, Undo2, Plus } from 'lucide-react'
import PasswordConfirmModal from '../components/PasswordConfirmModal'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import Select, { GroupBase, MultiValue } from 'react-select'
import { http } from '../lib/api'
import { Link } from 'react-router-dom'

const PASSWORD_CONFIRM_PRODUCT_BUNDLES =
  import.meta.env.VITE_PASSWORD_CONFIRM_PRODUCT_BUNDLES === 'true'

interface Company {
  id: number
  name: string
}

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
  company_name: string
  certifications: { code: string }[]
  category?: { label: string }
  images?: { id: number; image: string }[]
  catalog_entry_data?: {
    id: number
    name: string
    category: {
      id: number
      label: string
    }
  }
}

interface ProductBundle {
  id: number
  title: string
  stock: number
  original_price: number
  discounted_price: number
  discounted_percentage: number
  company_id: number
  status: 'draft' | 'published' | 'archived'
  sold_bundles?: number
  items: {
    product: Product
    quantity: number
    best_before_date?: string
  }[]
  avg_rating: number
  ratings_count: number
}

interface ProductBundleForm {
  title: string
  stock: number | string
  discounted_percentage: number | string
  company: number | string
  items: {
    product_id: number
    quantity: number
    best_before_date?: string
  }[]
}

type BundleSortKey = '' | keyof ProductBundle

type Option = { value: number; label: string; meta?: any }

export default function ProductBundlesTab() {
  const [productBundles, setProductBundles] = useState<ProductBundle[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const formBoxRef = useRef<HTMLDivElement | null>(null)

  const displayUnit = (u?: string) => (u ?? '').replace(/\bl\b/g, 'L')

  const [form, setForm] = useState<ProductBundleForm & { bundle_images: File[] }>({
    title: '',
    stock: '1',
    discounted_percentage: '0',
    company: '',
    items: [],
    bundle_images: []
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [productBundleIdToDelete, setProductBundleIdToDelete] = useState<number | null>(null)
  const [deleteMessage, setDeleteMessage] = useState<string>('')

  const [sortField, setSortField] = useState<BundleSortKey>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const [password, setPassword] = useState('')

  // New: selected products via multi-select
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])

  useEffect(() => {
    fetchProductBundles()
    fetchCompanies()
  }, [])

  const fetchProductBundles = async () => {
    const data = await http.get<ProductBundle[]>('/api/product-bundles/')
    setProductBundles(data)
  }

  const fetchCompanies = async () => {
    const data = await http.get<Company[]>('/api/companies/')
    setCompanies(data)
  }

  const fetchProducts = async (companyId: number) => {
    try {
      const data = await http.get<Product[]>('/api/products/', { params: { company: companyId } })
      setProducts(data)
    } catch (err) {
      console.error(err)
      toast.error('Impossible de charger les produits.')
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement
    if (target.type === 'checkbox') {
      setForm(prev => ({ ...prev, [target.name]: (target as HTMLInputElement).checked }))
      return
    }
    setForm(prev => ({ ...prev, [target.name]: target.value }))
  }

  const handleDelete = (bundle: ProductBundle) => {
    setProductBundleIdToDelete(bundle.id)
    setDeleteMessage(`Voulez-vous vraiment supprimer le lot « ${bundle.title} » ? Cette action le désactivera.`)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (!productBundleIdToDelete) return
    const doDelete = () => {
      deleteProductBundle(productBundleIdToDelete)
      setShowDeleteModal(false)
      setProductBundleIdToDelete(null)
      setDeleteMessage('')
    }
    if (PASSWORD_CONFIRM_PRODUCT_BUNDLES) {
      setShowDeleteModal(false)
      setPendingAction(() => doDelete)
      setShowPasswordConfirm(true)
    } else {
      doDelete()
    }
  }

  const deleteProductBundle = async (id: number) => {
    try {
      await http.patch(`/api/product-bundles/${id}/`, { is_active: false }, {
        headers: { 'Content-Type': 'application/json' }
      })
      toast.success('Lot de produits désactivé.')
      fetchProductBundles()
    } catch {
      toast.error('Erreur lors de la désactivation.')
    }
  }

  const updateStatus = async (id: number, status: string) => {
    try {
      await http.patch(`/api/product-bundles/${id}/`, { status }, {
        headers: { 'Content-Type': 'application/json' }
      })
      toast.success('Statut mis à jour.')
      fetchProductBundles()
    } catch {
      toast.error('Erreur lors du changement de statut.')
    }
  }

  const resetForm = () => {
    setForm({
      title: '',
      stock: '',
      discounted_percentage: '',
      company: '',
      items: [],
      bundle_images: []
    })
    setProducts([])
    setSelectedProductIds([])
    setEditingId(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleEdit = async (bundle: ProductBundle) => {
    setEditingId(bundle.id)
    setShowForm(true)
    const companyId = bundle.company_id
    if (!companyId) {
      toast.error('Impossible de charger les produits (commerce introuvable).')
      return
    }
    await fetchProducts(companyId)
    const ids = bundle.items.map(i => i.product.id)
    setSelectedProductIds(ids)
    setForm({
      title: bundle.title,
      stock: bundle.stock,
      discounted_percentage: bundle.discounted_percentage,
      company: companyId,
      items: bundle.items.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        best_before_date: item.best_before_date || ''
      })),
      bundle_images: []
    })
    setTimeout(() => formBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  function extractErrorMessages(obj: any): string[] {
    const messages: string[] = []
    if (typeof obj === 'string') return [obj]
    if (Array.isArray(obj)) {
      obj.forEach(item => messages.push(...extractErrorMessages(item)))
    } else if (typeof obj === 'object' && obj !== null) {
      Object.values(obj).forEach(value => messages.push(...extractErrorMessages(value)))
    }
    return messages
  }

  const handleSubmit = async () => {
    const formData = new FormData()
    formData.append('title', String(form.title))
    formData.append('stock', String(form.stock))
    formData.append('discounted_percentage', String(form.discounted_percentage))

    const cleanItems = form.items
      .filter(i => selectedProductIds.includes(i.product_id) && (i.quantity ?? 0) > 0)
      .map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        best_before_date: item.best_before_date || null
      }))

    formData.append('items', JSON.stringify(cleanItems))

    if (form.bundle_images && form.bundle_images.length > 0) {
      form.bundle_images.forEach(file => formData.append('bundle_images', file))
    }

    try {
      if (editingId) {
        await http.patch(`/api/product-bundles/${editingId}/`, formData)
      } else {
        await http.upload('/api/product-bundles/', formData)
      }
      toast.success('Lot enregistré.')
      fetchProductBundles()
      resetForm()
      setShowForm(false)
    } catch (e: any) {
      const err = e?.response?.data
      toast.error(err ? extractErrorMessages(err).join(' | ') : 'Erreur')
    }
  }

  const sortedBundles = useMemo(() => {
    const list = [...productBundles].filter(b =>
      b.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    if (!sortField) return list
    return list.sort((a, b) => {
      const valA = a[sortField] as any
      const valB = b[sortField] as any
      return sortDirection === 'asc' ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1
    })
  }, [productBundles, searchTerm, sortField, sortDirection])

  const baseTh =
    "px-6 py-3 text-[11px] font-semibold tracking-wide uppercase text-gray-700 bg-gray-50 " +
    "border-b border-gray-200 sticky top-0 z-10"

  const sortableTh = `${baseTh} cursor-pointer select-none hover:text-dark-green`

  function SortTh({
    field,
    label,
    align = "left",
  }: {
    field: BundleSortKey
    label: string
    align?: "left" | "center" | "right"
  }) {
    const isActive = sortField === field
    const arrow = isActive ? (sortDirection === "asc" ? "▲" : "▼") : "▲"
    const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
    return (
      <th
        onClick={() => handleSort(field)}
        className={`${sortableTh} ${alignClass}`}
        aria-sort={isActive ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          <span className={`transition-opacity ${isActive ? "opacity-100" : "opacity-30"}`}>
            {arrow}
          </span>
        </span>
      </th>
    )
  }

  const handleSort = (field: BundleSortKey) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Options for the product multi-select (scoped to selected company)
  const productOptions = useMemo<GroupBase<Option>[]>(() => {
    const map = new Map<string, Option[]>()
    products.forEach(p => {
      const cat = p.catalog_entry_data?.category?.label ?? '—'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push({ value: p.id, label: p.title, meta: p })
    })

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0], 'fr', { sensitivity: 'base' }))
      .map(([label, opts]) => ({
        label,
        options: opts.sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }))
      }))
  }, [products])

  // When selection changes, keep form.items in sync
  const onChangeSelectedProducts = (opts: MultiValue<Option>) => {
    const ids = (opts ?? []).map(o => o.value)
    setSelectedProductIds(ids)
    setForm(prev => {
      const existing = prev.items.filter(i => ids.includes(i.product_id))
      const missingIds = ids.filter(id => !existing.some(i => i.product_id === id))
      const added = missingIds.map(id => ({ product_id: id, quantity: 0, best_before_date: '' }))
      return { ...prev, items: [...existing, ...added] }
    })
  }

  const flatOptions = useMemo<Option[]>(
    () => productOptions.flatMap(g => g.options ?? []),
    [productOptions]
  )

  // replace your selectedOptions memo with:
  const selectedOptions = useMemo<readonly Option[]>(
    () => flatOptions.filter(o => selectedProductIds.includes(o.value)),
    [flatOptions, selectedProductIds]
  )

  const selectedProducts = useMemo(
    () => products.filter(p => selectedProductIds.includes(p.id)),
    [products, selectedProductIds]
  )

  // Visual hint: how many items will be saved
  const filledCount = useMemo(
    () => form.items.filter(i => selectedProductIds.includes(i.product_id) && (i.quantity ?? 0) > 0).length,
    [form.items, selectedProductIds]
  )

  return (
    <div className="space-y-6 min-w-0">
      {/* Toolbar */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-dark-green"></h3>
          {!showForm && !editingId && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="w-full sm:w-auto bg-dark-green text-pale-yellow px-4 py-2 rounded-full font-semibold hover:bg-dark-green/90 transition-colors flex items-center justify-center sm:justify-start space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Créer un lot</span>
            </button>
          )}
        </div>
      </div>

      {/* Form (create/edit) */}
      {(showForm || editingId) && (
        <div className="bg-white rounded-lg p-6 shadow-sm" ref={formBoxRef}>
          <h3 className="text-lg font-semibold mb-10">
            {editingId ? 'Modifier le panier de produits' : 'Nouveau panier de produits'}
          </h3>

          {/* Step 1: Basic info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                className="form-input w-full"
                placeholder="Nom du lot"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Nombre de lots <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                className="form-input w-full"
                placeholder="Lots disponibles"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Pourcentage de réduction (%)
              </label>
              <input
                type="number"
                name="discounted_percentage"
                value={form.discounted_percentage}
                onChange={handleChange}
                className="form-input w-full"
                placeholder="Ex : 20"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Commerce <span className="text-red-500">*</span>
              </label>
              <Select
                options={companies.map(c => ({ value: c.id, label: c.name }))}
                value={
                  companies
                    .map(c => ({ value: c.id, label: c.name }))
                    .find(opt => opt.value === Number(form.company)) || null
                }
                onChange={async opt => {
                  const value = opt?.value ?? ''
                  setForm(prev => ({ ...prev, company: value, items: [] }))
                  setSelectedProductIds([])
                  setProducts([])
                  if (value) await fetchProducts(value)
                }}
              />
            </div>
          </div>

          {/* Step 2: Choose products */}
          <div className="mt-10 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-dark-green">Sélectionner des produits du commerce</h4>
              <div className="text-xs text-gray-600">
                {selectedProductIds.length} sélectionné(s) • {filledCount} avec quantité
              </div>
            </div>

            <Select<Option, true, GroupBase<Option>>
              isMulti
              isDisabled={!form.company}
              options={productOptions}
              value={selectedOptions}
              onChange={onChangeSelectedProducts}
              placeholder={form.company ? 'Choisir un ou plusieurs produits…' : 'Sélectionnez d’abord un commerce'}
              classNamePrefix="react-select"
              menuPortalTarget={document.body}
              styles={{
                menuPortal: base => ({ ...base, zIndex: 99999 }),
                menu: base => ({ ...base, zIndex: 99999 }),
              }}
            />

          </div>

          {/* Step 3: Table only for selected products */}
          <div className="mt-6">
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
              Dans ce tableau, les champs modifiables sont <strong>Quantité par lot</strong> et <strong>DLUO</strong>.  
              Saisissez un nombre positif pour la quantité et une date valide pour la DLUO afin d’inclure le produit.
            </div>

            <div className="mt-3 max-h-[60vh] overflow-auto rounded-lg border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full table-auto text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-center">
                      <th className={`${baseTh} text-left`}>Catégorie</th>
                      <th className={`${baseTh} text-left`}>Produit</th>
                      <th className={`${baseTh} text-left`}>Stock total</th>
                      <th className={`${baseTh} text-left w-[240px]`}>Qté par lot <span className="text-red-500">*</span></th>
                      <th className={`${baseTh} text-left`}>DLUO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedProducts.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                          Aucun produit sélectionné. Utilisez le sélecteur ci-dessus.
                        </td>
                      </tr>
                    )}
                    {selectedProducts.map(prod => {
                      const currentItem = form.items.find(i => i.product_id === prod.id)
                      const quantity = currentItem?.quantity ?? ''
                      return (
                        <tr key={prod.id}>
                          <td className="px-4 py-2 text-gray-800">{prod.catalog_entry_data?.category?.label || '—'}</td>
                          <td className="px-4 py-2 text-gray-800">{prod.title}</td>
                          <td className="px-4 py-2 text-gray-800">
                            {prod.stock} {displayUnit(prod.unit)}
                          </td>

                          {/* Quantity is the only editable cell, visually emphasized */}
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                inputMode="numeric"
                                aria-label={`Quantity per bundle for ${prod.title}`}
                                placeholder="Required"
                                className="w-40 rounded-md border-2 border-blue-400 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                value={quantity}
                                onChange={e => {
                                  const v = e.target.value
                                  const qty = v === '' ? NaN : parseInt(v, 10)
                                  setForm(prev => {
                                    const items = [...prev.items]
                                    const idx = items.findIndex(i => i.product_id === prod.id)
                                    if (Number.isNaN(qty)) {
                                      if (idx >= 0) items[idx].quantity = 0
                                    } else if (idx >= 0) {
                                      if (qty > 0) items[idx].quantity = qty
                                      else items.splice(idx, 1)
                                    } else if (qty > 0) {
                                      items.push({ product_id: prod.id, quantity: qty, best_before_date: '' })
                                    }
                                    return { ...prev, items }
                                  })
                                }}
                              />
                              <span className="text-xs text-gray-600">{displayUnit(prod.unit)}</span>
                            </div>
                          </td>

                          <td className="px-4 py-2">
                            <input
                              type="date"
                              className="w-full rounded-md border-2 border-blue-400 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                              value={currentItem?.best_before_date || ''}
                              onChange={e => {
                                const newDate = e.target.value
                                setForm(prev => {
                                  const items = [...prev.items]
                                  const idx = items.findIndex(i => i.product_id === prod.id)
                                  if (idx >= 0) items[idx].best_before_date = newDate
                                  else items.push({ product_id: prod.id, quantity: 0, best_before_date: newDate })
                                  return { ...prev, items }
                                })
                              }}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="mt-10">
            <h4 className="block text-sm font-semibold text-dark-green mb-2">Images du lot :</h4>

            <div className="mb-6">
              <div className="flex gap-2 flex-wrap">
                {products
                  .filter(prod => form.items.find(i => i.product_id === prod.id))
                  .flatMap(prod => prod.images || [])
                  .map((img, idx) => (
                    <div key={`img-${idx}`} className="relative w-20 h-20">
                      <img src={img.image} alt="Produit" className="w-full h-full object-cover rounded border" />
                    </div>
                  ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Ajouter des images spécifiques au lot
              </label>
              <input
                type="file"
                name="bundle_images"
                accept="image/*"
                multiple
                ref={fileInputRef}
                onChange={e => {
                  const files = e.target.files
                  if (files) {
                    setForm(prev => ({
                      ...prev,
                      bundle_images: Array.from(files)
                    }))
                  }
                }}
                className="form-input w-full"
              />
            </div>

            {form.bundle_images && form.bundle_images.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-dark-green mb-2">Images ajoutées au lot</label>
                <div className="flex gap-2 flex-wrap">
                  {form.bundle_images.map((file: File, idx: number) => (
                    <div key={idx} className="relative w-20 h-20">
                      <img src={URL.createObjectURL(file)} alt="Prévisualisation" className="w-full h-full object-cover rounded border" />
                      <button
                        type="button"
                        onClick={() =>
                          setForm(prev => ({
                            ...prev,
                            bundle_images: prev.bundle_images.filter((_, i) => i !== idx)
                          }))
                        }
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

          {/* Actions */}
          <div className="mt-12 pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleSubmit}
              className="w-full sm:w-auto bg-dark-green text-pale-yellow px-6 py-2 rounded-full font-semibold hover:bg-dark-green/90 transition-colors"
            >
              {editingId ? 'Mettre à jour le lot' : 'Créer le lot'}
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

      {/* List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-stretch gap-3 px-6 pb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher par titre..."
            className="form-input w-full sm:max-w-sm"
          />
        </div>

        {/* Mobile cards */}
        <div className="md:hidden px-4 pb-4 space-y-3">
          {sortedBundles.length === 0 ? (
            <p className="text-gray-500 px-2">Aucun lot enregistré.</p>
          ) : (
            sortedBundles.map(bundle => {
              const ui = bundle.stock > 0 ? bundle.status : ('rupture' as const)
              const statusLabel: Record<typeof ui | 'rupture', string> = {
                draft: 'Brouillon',
                published: 'Publié',
                archived: 'Archivé',
                rupture: 'Rupture',
              }
              const statusClass: Record<typeof ui | 'rupture', string> = {
                published: 'bg-green-100 text-green-800',
                archived:  'bg-gray-100 text-gray-600',
                rupture:   'bg-red-100 text-red-800',
                draft:     'bg-yellow-100 text-yellow-800',
              }

              return (
                <div key={bundle.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-dark-green break-words">{bundle.title}</div>
                      <div className="mt-1 text-xs text-gray-600 space-y-1">
                        {bundle.items?.slice(0, 4).map((item, i) => (
                          <div key={i} className="break-words">
                            {item.quantity} {displayUnit(item.product.unit)} × {item.product.title}
                            <span className="text-gray-400"> — {item.product.company_name}</span>
                          </div>
                        ))}
                        {bundle.items.length > 4 && (
                          <div className="text-gray-400">+ {bundle.items.length - 4} autres…</div>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs shrink-0 ${statusClass[ui]}`}>
                      {statusLabel[ui]}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-700">Stock: <span className="font-medium">{bundle.stock}</span></div>
                    <div className="text-gray-700">Vendus: <span className="font-medium">{bundle.sold_bundles ?? 0}</span></div>
                    <div className="text-gray-700">Original: <span className="font-semibold">{bundle.original_price} €</span></div>
                    <div className="text-gray-700">Réduit: <span className="font-semibold">{bundle.discounted_price} €</span></div>
                    <div className="col-span-2 text-gray-700">
                      {bundle.ratings_count === 0 ? (
                        <span>Non noté</span>
                      ) : (
                        <span className="font-medium">{bundle.avg_rating}/5</span>
                      )}{' '}
                      {bundle.ratings_count > 0 && <span className="text-gray-500">({bundle.ratings_count} avis)</span>}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                    <Link
                      to={`/bundle/${bundle.id}`}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-3 py-2 rounded-full border text-dark-green hover:bg-gray-50"
                      title="Voir lot"
                    >
                      <Eye className="w-4 h-4" />
                      Voir
                    </Link>

                    <button
                      onClick={() => handleEdit(bundle)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-3 py-2 rounded-full border text-blue-700 hover:bg-blue-50"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                      Modifier
                    </button>

                    <button
                      onClick={() => handleDelete(bundle)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-3 py-2 rounded-full border text-red-600 hover:bg-red-50"
                      title="Supprimer"
                    >
                      <Trash className="w-4 h-4" />
                      Supprimer
                    </button>

                    {[
                      { target: 'published' as const, title: 'Publier', btnClass: 'text-blue-600 hover:text-blue-800', Icon: UploadCloud },
                      { target: 'archived'  as const, title: 'Archiver', btnClass: 'text-gray-600 hover:text-gray-800', Icon: Archive },
                      { target: 'draft'     as const, title: 'Revenir en brouillon', btnClass: 'text-yellow-600 hover:text-yellow-800', Icon: Undo2 },
                    ]
                      .filter(a => a.target !== bundle.status)
                      .map(a => (
                        <button
                          key={a.target}
                          onClick={() => updateStatus(bundle.id, a.target)}
                          className={`w-full sm:w-auto inline-flex items-center justify-center gap-1 px-3 py-2 rounded-full border ${a.btnClass.replace('text-', 'border-') } ${a.btnClass}`}
                          title={a.title}
                          aria-label={`${a.title} (${a.target})`}
                        >
                          <a.Icon className="w-4 h-4" />
                          {a.title}
                        </button>
                      ))}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Desktop table */}
        {sortedBundles.length === 0 ? (
          <p className="hidden md:block text-gray-500 px-6 pb-6">Aucun lot enregistré.</p>
        ) : (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm border-t border-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <colgroup>
                  <col className="w-[20%]" />
                  <col className="w-[35%]" />
                  <col className="w-15" />
                  <col className="w-15" />
                  <col className="w-24" />
                  <col className="w-24" />
                  <col className="w-24" />
                  <col className="w-24" />
                  <col className="w-28" />
                </colgroup>
                <tr>
                  <SortTh field="title" label="Titre" />
                  <th className={`${baseTh} text-left w-[20%]`}>Contenu</th>
                  <SortTh field="stock" label="Stock lots" />
                  <SortTh field="sold_bundles" label="Lots vendus" />
                  <SortTh field="original_price" label="Prix original" />
                  <SortTh field="discounted_price" label="Prix réduit" />
                  <SortTh field="avg_rating" label="Note Moy." />
                  <SortTh field="status" label="Statut" />
                  <th className={`${baseTh} text-left`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedBundles.map(bundle => {
                  return (
                    <tr key={bundle.id} className="border-t align-top">
                      <td className="p-2 whitespace-normal break-words">{bundle.title}</td>
                      <td className="p-2 whitespace-pre-wrap text-sm">
                        {bundle.items?.map((item, i) => (
                          <div key={i}>
                            {item.quantity} {displayUnit(item.product.unit)} x {item.product.title} <br />
                            <small className="text-gray-500">({item.product.company_name})</small>
                          </div>
                        ))}
                      </td>
                      <td className="p-2 text-right">{bundle.stock}</td>
                      <td className="p-2 text-right">{(bundle.sold_bundles ?? 0)}</td>
                      <td className="p-2 text-right">{bundle.original_price} €</td>
                      <td className="p-2 text-right">{bundle.discounted_price} €</td>
                      <td className="p-2 text-center">
                        {bundle.ratings_count === 0 ? (
                          "Non noté"
                        ) : (
                          <>
                            {bundle.avg_rating}/5
                            <br />
                            ({bundle.ratings_count} avis)
                          </>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {(() => {
                          type UiStatus = ProductBundle['status'] | 'rupture'
                          const ui: UiStatus = (bundle.stock > 0 ? bundle.status : 'rupture')
                          const statusLabel: Record<UiStatus, string> = {
                            draft: 'Brouillon',
                            published: 'Publié',
                            archived: 'Archivé',
                            rupture: 'Rupture',
                          }
                          const statusClass: Record<UiStatus, string> = {
                            published: 'bg-green-100 text-green-800',
                            archived:  'bg-gray-100 text-gray-600',
                            rupture:   'bg-red-100 text-red-800',
                            draft:     'bg-yellow-100 text-yellow-800',
                          }
                          return (
                            <span className={`px-2 py-1 rounded text-xs ${statusClass[ui]}`}>
                              {statusLabel[ui]}
                            </span>
                          )
                        })()}
                      </td>

                      <td className="p-2">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={`/bundle/${bundle.id}`}
                            className="text-dark-green hover:text-medium-brown"
                            title="Voir lot"
                            aria-label={`Voir lot ${bundle.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => handleEdit(bundle)}
                            className="text-dark-green hover:text-blue-800"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(bundle)}
                            className="text-red-500 hover:text-red-700"
                            title="Supprimer"
                          >
                            <Trash className="w-4 h-4" />
                          </button>

                          {[
                            { target: 'published' as const, title: 'Publier', btnClass: 'text-blue-600 hover:text-blue-800', Icon: UploadCloud },
                            { target: 'archived'  as const, title: 'Archiver', btnClass: 'text-gray-600 hover:text-gray-800', Icon: Archive },
                            { target: 'draft'     as const, title: 'Revenir en brouillon', btnClass: 'text-yellow-600 hover:text-yellow-800', Icon: Undo2 },
                          ]
                            .filter(a => a.target !== bundle.status)
                            .map(a => (
                              <button
                                key={a.target}
                                onClick={() => updateStatus(bundle.id, a.target)}
                                className={a.btnClass}
                                title={a.title}
                                aria-label={`${a.title} (${a.target})`}
                              >
                                <a.Icon className="w-4 h-4" />
                              </button>
                            ))}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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
        message={deleteMessage}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false)
          setProductBundleIdToDelete(null)
          setDeleteMessage('')
        }}
      />
    </div>
  )
}
