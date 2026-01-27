import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { ShoppingCart, Users, Leaf, TrendingDown, ArrowRight } from 'lucide-react'
import BundleCard from '../components/BundleCard'
import { http } from '../lib/api'

type City = { name: string; postal_code: string }
type CompanyAddress = { city: City }
type CompanyData = { name: string; address: CompanyAddress; certifications?: { code: string }[] }
type Product = { title: string; eco_score?: string; company_data: CompanyData; certifications?: { code: string }[] }
type ProductItem = { product: Product; best_before_date?: string | null }
type ProducerData = { public_display_name: string }
type Region = { name: string; code: string }
type Department = { name: string; code: string }

type Bundle = {
  id: number
  title: string
  items: ProductItem[]
  discounted_price: string
  original_price: string
  discounted_percentage?: number
  created_at?: string
  producer_data?: ProducerData
  region_data?: Region
  department_data?: Department
  stock?: number
  total_avoided_waste_kg?: string
  total_avoided_co2_kg?: string
}

export default function Home() {
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [loading, setLoading] = useState(true)
  const [showCookieBanner, setShowCookieBanner] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const data = await http.get<Bundle[]>('/api/public-bundles/')
        if (!alive) return
        setBundles(Array.isArray(data) ? data : [])
      } catch {
        setBundles([])
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const featured = useMemo(() => {
    const hasDiscount = (b: Bundle) => {
      const dp = Number(b.discounted_percentage || 0)
      const d = Number(b.discounted_price)
      const o = Number(b.original_price)
      return (Number.isFinite(dp) && dp > 0) || (Number.isFinite(d) && Number.isFinite(o) && d < o)
    }
    const hasStock = (b: Bundle) => (Number(b.stock) || 0) > 0
    const byCreatedDesc = (a?: string, b?: string) =>
      (Date.parse(b || '') || 0) - (Date.parse(a || '') || 0)

    return bundles
      .filter(b => hasDiscount(b) && hasStock(b))
      .sort((a, b) => byCreatedDesc(a.created_at, b.created_at))
      .slice(0, 3)
  }, [bundles])

  return (
    <div className="min-h-screen font-poppins">

      {/* SEO */}
      <Helmet>
        <title>GreenCart - Produits locaux anti-gaspillage</title>
        <meta name="description" content="Découvrez des produits locaux à prix réduits et réduisez le gaspillage alimentaire." />
      </Helmet>

      {/* Bandeau cookies RGPD */}
      {showCookieBanner && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-dark-green text-pale-yellow p-4 rounded-lg shadow-lg flex flex-col sm:flex-row items-center gap-4 z-50">
          <span>Nous utilisons des cookies pour améliorer votre expérience.</span>
          <div className="flex gap-2">
            <button
              className="bg-orange-beige text-dark-brown px-4 py-2 rounded hover:bg-orange-beige/90 focus:outline-none focus:ring-2 focus:ring-pale-yellow"
              onClick={() => setShowCookieBanner(false)}
            >
              Accepter
            </button>
            <button
              className="border-2 border-pale-yellow text-pale-yellow px-4 py-2 rounded hover:bg-pale-yellow hover:text-dark-green focus:outline-none focus:ring-2 focus:ring-pale-yellow"
              onClick={() => setShowCookieBanner(false)}
            >
              Refuser
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-dark-green to-medium-brown text-pale-yellow py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Texte Hero */}
            <div className="animate-fade-in">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Produits locaux anti-gaspillage – GreenCart
              </h1>
              <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-orange-beige">
                Sauvons ensemble les produits locaux et luttons contre le gaspillage alimentaire
              </h2>
              <p className="text-xl mb-8 text-pale-yellow/90">
                Découvrez des produits locaux de qualité à prix réduits jusqu’à 40 %. 
                Soutenez les producteurs locaux et participez à la lutte contre le gaspillage alimentaire grâce à GreenCart.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/shop"
                  className="bg-orange-beige text-dark-brown px-8 py-4 rounded-full font-semibold text-lg hover:bg-orange-beige/90 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-pale-yellow"
                >
                  Commander dès maintenant
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/about"
                  className="border-2 border-pale-yellow text-pale-yellow px-8 py-4 rounded-full font-semibold text-lg hover:bg-pale-yellow hover:text-dark-green transition-colors text-center focus:outline-none focus:ring-2 focus:ring-orange-beige"
                >
                  Découvrir notre mission
                </Link>
              </div>
            </div>

            {/* Image Hero */}
            <div className="relative animate-slide-up">
              <img
                src="/Home.png"
                alt="Assortiment de produits locaux frais"
                className="rounded-2xl shadow-2xl w-full"
              />
              <div className="absolute -bottom-6 -left-6 bg-pale-yellow text-dark-green p-4 rounded-xl shadow-lg">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="w-6 h-6 text-dark-green" />
                  <div>
                    <p className="font-bold text-lg">-40%</p>
                    <p className="text-sm">en moyenne</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Statistiques */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="animate-slide-up">
              <div className="bg-dark-green text-pale-yellow w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold text-dark-green mb-2">1,000+</h3>
              <p className="text-gray-700">Tonnes sauvées du gaspillage</p>
            </div>
            <div className="animate-slide-up">
              <div className="bg-orange-beige text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold text-dark-green mb-2">30+</h3>
              <p className="text-gray-700">Producteurs partenaires</p>
            </div>
            <div className="animate-slide-up">
              <div className="bg-medium-brown text-pale-yellow w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold text-dark-green mb-2">2,000+</h3>
              <p className="text-gray-700">Clients satisfaits</p>
            </div>
          </div>
        </div>
      </section>

      {/* Offres du moment */}
      <section className="py-20 bg-pale-yellow/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-dark-green mb-4">Offres du moment</h2>
            <p className="text-gray-700 text-lg max-w-2xl mx-auto">Découvrez nos meilleures offres sur des produits de qualité à prix réduits</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse h-[520px]" />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center text-gray-500 py-16">Aucune offre disponible pour le moment</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featured.map(b => (
                <BundleCard key={b.id} bundle={b} viewMode="grid" />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/shop"
              className="bg-dark-green text-pale-yellow px-8 py-4 rounded-full font-semibold text-lg hover:bg-dark-green/90 transition-colors inline-flex items-center focus:outline-none focus:ring-2 focus:ring-pale-yellow"
            >
              Voir tous les produits
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-dark-green mb-6">Notre mission : zéro gaspillage</h2>
              <p className="text-gray-700 text-lg mb-6">
                GreenCart connecte les consommateurs conscients avec les producteurs locaux pour donner une seconde vie aux produits alimentaires de qualité.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-dark-green rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-pale-yellow rounded-full"></div>
                  </div>
                  <span className="text-gray-700">Produits locaux et de saison</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-dark-green rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-pale-yellow rounded-full"></div>
                  </div>
                  <span className="text-gray-700">Prix réduits jusqu'à 50%</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-dark-green rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-pale-yellow rounded-full"></div>
                  </div>
                  <span className="text-gray-700">Soutien aux petits producteurs</span>
                </li>
              </ul>
              <Link
                to="/about"
                className="bg-orange-beige text-dark-brown px-6 py-3 rounded-full font-semibold hover:bg-orange-beige/90 transition-colors inline-flex items-center focus:outline-none focus:ring-2 focus:ring-pale-yellow"
              >
                En savoir plus
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div>
              <img
                src="https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Producteur local travaillant sur ses produits"
                className="rounded-2xl shadow-lg w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Inscription */}
      <section className="py-20 bg-dark-green text-pale-yellow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Rejoignez le mouvement anti-gaspillage</h2>
          <p className="text-pale-yellow/90 text-lg mb-8 max-w-2xl mx-auto">
            Inscrivez-vous dès aujourd'hui et recevez 10€ de réduction sur votre première commande
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-orange-beige text-dark-brown px-8 py-4 rounded-full font-semibold text-lg hover:bg-orange-beige/90 transition-colors focus:outline-none focus:ring-2 focus:ring-pale-yellow"
            >
              Créer mon compte client
            </Link>
            <Link
              to="/register?type=producer"
              className="border-2 border-pale-yellow text-pale-yellow px-8 py-4 rounded-full font-semibold text-lg hover:bg-pale-yellow hover:text-dark-green transition-colors focus:outline-none focus:ring-2 focus:ring-orange-beige"
            >
              Devenir producteur partenaire
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
