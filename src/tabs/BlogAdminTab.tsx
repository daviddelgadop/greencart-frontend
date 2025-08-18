import React, { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { Edit, Trash, ArrowUpDown, Search, Star, X } from 'lucide-react'
import { http } from '../lib/api'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'

type Category = { id: number; name: string; slug: string }
type Post = {
  id: number
  title: string
  slug: string
  excerpt: string
  content?: string
  status: 'draft' | 'scheduled' | 'published' | 'archived'
  pinned: boolean
  image: string | null
  image_alt?: string
  category: Category | null
  published_at?: string | null
  read_time_min?: number | null
  is_active: boolean
  author_name?: string | null
  created_at?: string
  updated_at?: string
}

type SortField =
  | 'title'
  | 'category__name'
  | 'author__public_display_name'
  | 'published_at'
  | 'read_time_min'
  | 'pinned'
  | 'status'
  | 'created_at'

const STATUS_FR: Record<Post['status'], string> = {
  draft: 'Brouillon',
  scheduled: 'Planifié',
  published: 'Publié',
  archived: 'Archivé',
}

export default function BlogAdminTab() {
  const [showForm, setShowForm] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const imgRef = useRef<HTMLInputElement>(null)
  const formBoxRef = useRef<HTMLDivElement>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [postIdToDelete, setPostIdToDelete] = useState<number | null>(null)

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category_id: '',
    status: 'draft',
    pinned: false,
    image: null as File | null,
    remove_image: false,
    current_image_url: '' as string | null,
  })

  const [qTitle, setQTitle] = useState('')
  const [qCategory, setQCategory] = useState('')
  const [qAuthor, setQAuthor] = useState('')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [sortField, sortDir, qTitle, qCategory, qAuthor])

  const loadCategories = async () => {
    try {
      const c = await http.get<Category[]>('/api/blog/categories/')
      setCategories(c)
    } catch {
      toast.error('Erreur lors du chargement des catégories.')
    }
  }

  const buildSearch = () => {
    const terms: string[] = []
    if (qTitle.trim()) terms.push(qTitle.trim())
    if (qCategory.trim()) terms.push(qCategory.trim())
    if (qAuthor.trim()) terms.push(qAuthor.trim())
    return terms.join(' ')
  }

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const ordering = `${sortDir === 'desc' ? '-' : ''}${sortField}`
      const search = buildSearch()
      const params = new URLSearchParams()
      params.set('ordering', ordering)
      if (search) params.set('search', search)
      const data = await http.get<Post[]>(`/api/blog/admin/posts/?${params.toString()}`)
      setPosts(data)
    } catch {
      toast.error('Erreur de chargement du blog.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked, files } = e.target as any
    if (type === 'file') {
      const file = files?.[0] ?? null
      setForm(f => ({
        ...f,
        image: file,
        remove_image: false,
        current_image_url: file ? URL.createObjectURL(file) : f.current_image_url,
      }))
    } else if (type === 'checkbox') {
      setForm(f => ({ ...f, [name]: checked }))
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
  }

    const buildFD = () => {
    const fd = new FormData()
    fd.append('title', form.title)
    fd.append('slug', form.slug)
    fd.append('excerpt', form.excerpt)
    fd.append('content', form.content)
    fd.append('status', form.status)
    fd.append('pinned', form.pinned ? '1' : '0')
    fd.append('category_id', form.category_id)
    fd.append('remove_image', form.remove_image ? '1' : '0')
    if (form.image) fd.append('image', form.image)
    return fd
    }

  const handleSave = async () => {
    const missing: string[] = []
    if (!form.title.trim()) missing.push('Titre')
    if (!form.slug.trim()) missing.push('Slug')
    if (!form.excerpt.trim()) missing.push('Résumé')
    if (!form.content.trim()) missing.push('Contenu')
    if (!form.category_id) missing.push('Catégorie')
    if (!editingId && !form.image) missing.push('Image')

    if (missing.length > 0) {
      toast.warning(`Champs manquants : ${missing.join(', ')}`)
      return
    }

    try {
    if (editingId) {
        await http.upload(`/api/blog/admin/posts/${editingId}/`, buildFD(), { method: 'PATCH' })
        toast.success('Article mis à jour.')
    } else {
        await http.upload('/api/blog/admin/posts/', buildFD())
        toast.success('Article créé.')
    }
    resetForm()
    setShowForm(false)
    await fetchPosts()
    } catch (e: any) {
        const err = e?.response?.data
        const msg = err ? Object.values(err).flat().join(' | ') : 'Erreur lors de la sauvegarde.'
        toast.error(msg)
    }

  }

  const deactivate = async (id: number) => {
    try {
      await http.patch(`/api/blog/admin/posts/${id}/`, { is_active: false })
      toast.success('Article désactivé.')
      await fetchPosts()
    } catch {
      toast.error('Erreur lors de la désactivation.')
    }
  }

  const handleDelete = (id: number) => {
    setPostIdToDelete(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!postIdToDelete) return
    try {
      await http.patch(`/api/blog/admin/posts/${postIdToDelete}/`, { is_active: false })
      toast.success('Article désactivé.')
      await fetchPosts()
    } catch {
      toast.error('Erreur lors de la désactivation.')
    } finally {
      setShowDeleteModal(false)
      setPostIdToDelete(null)
    }
  }

  const edit = (p: Post) => {
    setForm({
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt || '',
      content: p.content || '',
      category_id: (p.category?.id as any)?.toString() || '',
      status: p.status,
      pinned: p.pinned,
      image: null,
      remove_image: false,
      current_image_url: p.image || '',
    })
    setEditingId(p.id)
    setShowForm(true)
    setTimeout(() => formBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  const resetForm = () => {
    setForm({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category_id: '',
      status: 'draft',
      pinned: false,
      image: null,
      remove_image: false,
      current_image_url: '',
    })
    setEditingId(null)
    if (imgRef.current) imgRef.current.value = ''
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const OrderingIcon = () => <ArrowUpDown className="w-4 h-4 inline ml-1" />

  const rows = useMemo(() => posts, [posts])

  const removeCurrentImage = () => {
    setForm(f => ({
      ...f,
      remove_image: true,
      image: null,
      current_image_url: '',
    }))
    if (imgRef.current) imgRef.current.value = ''
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-semibold text-dark-green">Articles du blog</h3>
          {!showForm && !editingId && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="bg-dark-green text-pale-yellow px-4 py-2 rounded-full font-semibold hover:bg-dark-green/90 transition-colors"
            >
              Nouvel article
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              className="form-input w-full"
              placeholder="Rechercher par titre"
              value={qTitle}
              onChange={e => setQTitle(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              className="form-input w-full"
              placeholder="Rechercher par catégorie"
              value={qCategory}
              onChange={e => setQCategory(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              className="form-input w-full"
              placeholder="Rechercher par auteur"
              value={qAuthor}
              onChange={e => setQAuthor(e.target.value)}
            />
          </div>
        </div>
      </div>

      {(showForm || editingId) && (
        <div ref={formBoxRef} className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-10">
            {editingId ? 'Modifier l’article' : 'Nouvel article'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Titre <span className="text-red-500">*</span>
              </label>
              <input name="title" value={form.title} onChange={handleChange} className="form-input w-full" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Slug <span className="text-red-500">*</span>
              </label>
              <input name="slug" value={form.slug} onChange={handleChange} className="form-input w-full" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Catégorie <span className="text-red-500">*</span>
              </label>
              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                className="form-input w-full"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Statut <span className="text-red-500">*</span>
              </label>
              <select name="status" value={form.status} onChange={handleChange} className="form-input w-full">
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
                <option value="scheduled">Planifié</option>
                <option value="archived">Archivé</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Résumé <span className="text-red-500">*</span>
              </label>
              <textarea name="excerpt" value={form.excerpt} onChange={handleChange} className="form-input w-full" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Contenu <span className="text-red-500">*</span>
              </label>
              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                className="form-input w-full min-h-[160px]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-green mb-2">En vedette</label>
              <input type="checkbox" name="pinned" checked={form.pinned} onChange={handleChange} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Image {editingId ? '' : <span className="text-red-500">*</span>}
              </label>
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleChange}
                ref={imgRef}
                className="form-input w-full"
              />

              {(form.current_image_url || form.image) && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="relative w-24 h-24">
                    <img
                      src={form.current_image_url || (form.image ? URL.createObjectURL(form.image) : '')}
                      alt="Prévisualisation"
                      className="w-full h-full object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={removeCurrentImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      title="Supprimer l’image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {form.remove_image && (
                    <span className="text-xs text-red-600">L’image sera supprimée à l’enregistrement.</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="bg-dark-green text-pale-yellow px-6 py-2 rounded-full font-semibold hover:bg-dark-green/90 transition-colors"
            >
              {editingId ? 'Mettre à jour l’article' : 'Sauvegarder l’article'}
            </button>
            <button
              type="button"
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
        {loading ? (
          <p className="text-gray-500 px-6 py-6">Chargement…</p>
        ) : rows.length === 0 ? (
          <p className="text-gray-500 px-6 py-6">Aucun article enregistré.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase cursor-pointer"
                    onClick={() => toggleSort('title')}
                  >
                    Titre <ArrowUpDown className="w-4 h-4 inline ml-1" />
                  </th>
                  <th
                    className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase cursor-pointer"
                    onClick={() => toggleSort('category__name')}
                  >
                    Catégorie <ArrowUpDown className="w-4 h-4 inline ml-1" />
                  </th>
                  <th
                    className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase cursor-pointer"
                    onClick={() => toggleSort('author__public_display_name')}
                  >
                    Auteur <ArrowUpDown className="w-4 h-4 inline ml-1" />
                  </th>
                  <th
                    className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase cursor-pointer"
                    onClick={() => toggleSort('published_at')}
                  >
                    Date de publication <ArrowUpDown className="w-4 h-4 inline ml-1" />
                  </th>
                  <th
                    className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase cursor-pointer"
                    onClick={() => toggleSort('read_time_min')}
                  >
                    Temps de lecture <ArrowUpDown className="w-4 h-4 inline ml-1" />
                  </th>
                  <th
                    className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase cursor-pointer"
                    onClick={() => toggleSort('pinned')}
                  >
                    En vedette <ArrowUpDown className="w-4 h-4 inline ml-1" />
                  </th>
                  <th
                    className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase cursor-pointer"
                    onClick={() => toggleSort('status')}
                  >
                    Statut <ArrowUpDown className="w-4 h-4 inline ml-1" />
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-sm">
                {rows.map(p => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium text-gray-900 break-words">
                        {(p.title || '—')
                          .split(' ')
                          .reduce((acc, word) => {
                            if ((acc + ' ' + word).trim().length <= 20) {
                              return (acc + ' ' + word).trim()
                            }
                            return acc
                          }, '')}...
                    </td>
                    <td className="px-1 py-3">{p.category?.name || '—'}</td>
                    <td className="px-4 py-3">{p.author_name || '—'}</td>
                    <td className="px-4 py-3">{p.published_at ? new Date(p.published_at).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-center">{p.read_time_min ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      {p.pinned ? <Star className="w-4 h-4 inline" /> : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {p.status === 'draft' ? 'Brouillon' : p.status === 'scheduled' ? 'Planifié' : p.status === 'published' ? 'Publié' : 'Archivé'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center space-x-2">
                        <button onClick={() => edit(p)} className="text-dark-green hover:text-medium-brown">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                        onClick={() => handleDelete(p.id)}
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
        )}
      </div>

      <ConfirmDeleteModal
        visible={showDeleteModal}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false)
          setPostIdToDelete(null)
        }}
      />
    </div>
  )
}