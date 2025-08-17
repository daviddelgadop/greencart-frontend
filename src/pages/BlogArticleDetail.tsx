// src/pages/BlogArticleDetail.tsx
import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, User, Bookmark, ArrowLeft, Tag } from 'lucide-react'
import { http } from '../lib/api'

type ApiCategory = {
  id: number
  name: string
  slug: string
  color?: string
  order?: number
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

export default function BlogArticleDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<ApiPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!slug) return
      setLoading(true)
      setError(null)
      try {
        const data = await http.get<ApiPost>(`/api/blog/posts/${slug}/`)
        if (mounted) setPost(data)
      } catch {
        if (mounted) setError('Article introuvable.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [slug])

  const fmtDate = (iso?: string | null) => {
    if (!iso) return '—'
    try { return new Date(iso).toLocaleDateString('fr-FR') } catch { return '—' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-pale-yellow/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-white/90 backdrop-blur px-6 py-7 md:px-8 md:py-9 shadow-sm ring-1 ring-black/5">
            <p className="text-gray-500">Chargement…</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-pale-yellow/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="rounded-3xl bg-white/90 backdrop-blur px-6 py-7 md:px-8 md:py-9 shadow-sm ring-1 ring-black/5">
            <p className="text-red-600">{error || 'Article introuvable.'}</p>
            <div className="mt-4">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-dark-green hover:text-medium-brown"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour au blog
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-pale-yellow/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Toolbar */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-dark-green hover:text-medium-brown"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au blog
            </Link>
            {post.category?.name && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-gray-200 text-sm">
                <Tag className="w-4 h-4 text-dark-green" />
                {post.category.name}
              </span>
            )}
          </div>
        </div>

        {/* Hero */}
        <section className="rounded-3xl bg-white/90 backdrop-blur px-6 py-7 md:px-8 md:py-9 shadow-sm ring-1 ring-black/5">
          <header className="mb-6">
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
              <div className="inline-flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                {fmtDate(post.published_at)}
              </div>
              <div className="inline-flex items-center gap-1">
                <User className="w-4 h-4 text-gray-400" />
                {post.author_name || '—'}
              </div>
              <div className="inline-flex items-center gap-1">
                <Bookmark className="w-4 h-4 text-gray-400" />
                {post.read_time_min ?? 1} min
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-dark-green tracking-tight">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="mt-3 text-gray-600">{post.excerpt}</p>
            )}
          </header>

          <div className="rounded-2xl overflow-hidden shadow-sm mb-2 bg-white">
            <img
              src={post.image || PLACEHOLDER_IMG}
              alt={post.image_alt || post.title}
              className="w-full h-[360px] md:h-[420px] object-cover"
            />
          </div>
        </section>

        <section className="mt-8 rounded-3xl bg-white/90 backdrop-blur px-6 py-7 md:px-8 md:py-9 shadow-sm ring-1 ring-black/5">
          <article
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content || '' }}
          />
        </section>

        {/* Footer  */}
        <div className="mt-8">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-dark-green hover:text-medium-brown"
          >
            <ArrowLeft className="w-4 h-4" />
            Tous les articles
          </Link>
        </div>

      </div>
    </div>
  )
}
