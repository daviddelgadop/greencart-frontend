import React, { useEffect, useMemo, useState } from 'react'
import { Calendar, User, ArrowRight, Search, Tag, Newspaper, Bookmark } from 'lucide-react'
import { Link } from 'react-router-dom'
import { http } from '../lib/api'

type ApiCategory = {
  id: number
  name: string
  slug: string
  order?: number
  color?: string
  icon?: string
}

type ApiPost = {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  author_name?: string | null
  published_at?: string | null
  status: 'draft' | 'scheduled' | 'published' | 'archived'
  pinned: boolean
  image: string | null
  image_alt?: string
  read_time_min?: number | null
  is_active: boolean
  category: ApiCategory | null
  created_at?: string
  updated_at?: string
}

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=1200&q=60&auto=format&fit=crop'

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tous')
  const [posts, setPosts] = useState<ApiPost[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await http.get<ApiPost[]>('/api/blog/posts/?ordering=-published_at')
        setPosts(data || [])
      } catch {
        setError('Erreur lors du chargement des articles.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const allCategories = useMemo(() => {
    const map = new Map<string, { name: string; order: number }>()
    posts.forEach(p => {
      const name = p.category?.name?.trim()
      if (name) {
        const ord = typeof p.category?.order === 'number' ? p.category!.order! : 9999
        if (!map.has(name)) map.set(name, { name, order: ord })
      }
    })
    const arr = Array.from(map.values()).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
    return ['Tous', ...arr.map(x => x.name)]
  }, [posts])

  const featuredPost = useMemo(() => {
    if (posts.length === 0) return undefined
    const pinned = posts.find(p => p.pinned)
    if (pinned) return pinned
    const sorted = [...posts].sort((a, b) => {
      const da = a.published_at || a.created_at || ''
      const db = b.published_at || b.created_at || ''
      return (db > da ? 1 : db < da ? -1 : 0)
    })
    return sorted[0]
  }, [posts])

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return posts.filter(p => {
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.excerpt || '').toLowerCase().includes(q) ||
        (p.author_name || '').toLowerCase().includes(q)
      const catName = p.category?.name || ''
      const matchesCategory = selectedCategory === 'Tous' || catName === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [posts, searchQuery, selectedCategory])

  const regularPosts = useMemo(() => {
    if (!featuredPost) return filteredPosts
    return filteredPosts.filter(p => p.id !== featuredPost.id)
  }, [filteredPosts, featuredPost])

  const fmtDate = (iso?: string | null) => {
    if (!iso) return '—'
    try { return new Date(iso).toLocaleDateString('fr-FR') } catch { return '—' }
  }

  return (
    <div className="min-h-screen bg-pale-yellow/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <section className="mb-8">
          <div className="rounded-3xl bg-white/90 backdrop-blur px-6 py-7 md:px-8 md:py-9 shadow-sm ring-1 ring-black/5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-dark-green tracking-tight flex items-center gap-4">
                  <Newspaper className="w-8 h-8" />
                  Blog
                </h1>
                <p className="mt-2 text-gray-600 max-w-2xl">
                  Conseils, recettes et histoires pour une alimentation locale, durable et anti-gaspi.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              {/* Categories */}
              <div className="flex flex-wrap gap-2">
                {allCategories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-dark-green text-pale-yellow'
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un article…"
                  aria-label="Recherche d’articles"
                  className="w-full pl-10 pr-3 py-2.5 bg-white rounded-xl border shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green/30"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Loading / Error */}
        {loading && <div className="text-center py-16 text-gray-500">Chargement…</div>}
        {error && !loading && <div className="text-center py-16 text-red-600">{error}</div>}

        {/* Featured */}
        {!loading && !error && featuredPost && searchQuery === '' && selectedCategory === 'Tous' && (
          <div className="mb-16">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="relative h-64 lg:h-auto">
                  <img
                    src={featuredPost.image || PLACEHOLDER_IMG}
                    alt={featuredPost.image_alt || featuredPost.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-orange-beige text-white px-3 py-1 rounded-full text-sm font-medium">
                      Article vedette
                    </span>
                  </div>
                </div>
                <div className="p-8 flex flex-col justify-center">
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <Tag className="w-4 h-4" />
                      <span>{featuredPost.category?.name || '—'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{fmtDate(featuredPost.published_at)}</span>
                    </div>
                    <span>{featuredPost.read_time_min ?? 1} min de lecture</span>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-bold text-dark-green mb-4">
                    {featuredPost.title}
                  </h2>

                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{featuredPost.author_name || '—'}</span>
                    </div>

                    <Link
                      to={`/blog/${featuredPost.slug}`}
                      className="bg-dark-green text-pale-yellow px-6 py-3 rounded-full font-semibold hover:bg-dark-green/90 transition-colors flex items-center space-x-2 group"
                    >
                      <span>Lire l’article</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularPosts.map((post, index) => (
                <article
                  key={post.id}
                  className="relative bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden group animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Overlay link CONFINADO a esta card */}
                  <Link
                    to={`/blog/${post.slug}`}
                    aria-label={`Lire ${post.title}`}
                    className="absolute inset-0 z-10 block"
                  >
                    <span className="sr-only">Ouvrir l’article</span>
                  </Link>

                  <div className="relative">
                    <img
                      src={post.image || PLACEHOLDER_IMG}
                      alt={post.image_alt || post.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="bg-dark-green text-pale-yellow px-3 py-1 rounded-full text-xs font-medium">
                        {post.category?.name || '—'}
                      </span>
                      <span className="bg-white/90 backdrop-blur text-dark-green px-2 py-1 rounded-full text-[11px] font-medium border border-dark-green/10 flex items-center gap-1">
                        <Bookmark className="w-3 h-3" />
                        {post.read_time_min ?? 1} min
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{fmtDate(post.published_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{post.author_name || '—'}</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-dark-green mb-3 group-hover:text-medium-brown transition-colors line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between">
                      <Link
                        to={`/blog/${post.slug}`}
                        className="relative z-20 text-dark-green hover:text-medium-brown transition-colors text-sm font-medium flex items-center space-x-1 group"
                      >
                        <span>Lire plus</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* No Results */}
            {filteredPosts.length === 0 && (
              <div className="text-center py-20">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucun article trouvé</h3>
                <p className="text-gray-500">Essayez de modifier votre recherche ou vos filtres</p>
              </div>
            )}
          </>
        )}

        {/* Newsletter */}
        <div className="mt-20 bg-dark-green rounded-2xl p-8 text-center text-pale-yellow">
          <h2 className="text-2xl font-bold mb-4">Restez informé de nos derniers articles</h2>
          <p className="text-pale-yellow/90 mb-6 max-w-2xl mx-auto">
            Recevez chaque semaine nos conseils, recettes et actualités pour une alimentation plus durable
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Votre adresse email"
              className="flex-1 px-4 py-3 rounded-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-beige"
            />
            <button className="bg-orange-beige text-dark-brown px-6 py-3 rounded-full font-semibold hover:bg-orange-beige/90 transition-colors">
              S’abonner
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
