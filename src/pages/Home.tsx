import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Users, Leaf, TrendingDown, ArrowRight, Star } from 'lucide-react'
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
    return () => {
      alive = false
    }
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
    <div className="min-h-screen">
      {/* ✅ H1 CORRECT - SEO optimisé */}
      <section className="relative bg-gradient-to-r from-green-800 to-amber-800 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              {/* ✅ H1 avec mot-clé principal */}
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Produits locaux anti-gaspillage – GreenCart
              </h1>
              
              {/* ✅ H2 marketing */}
              <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold mb-8 text-amber-100 leading-relaxed">
                Sauvons ensemble les produits locaux et luttons contre le gaspillage alimentaire
              </h2>
              
              {/* ✅ Paragraphe d'introduction SEO */}
              <div className="text-lg md:text-xl mb-10 text-amber-50 max-w-3xl leading-relaxed">
                <p className="mb-4">
                  Découvrez des produits locaux de qualité à prix réduits jusqu'à 40 %.
                </p>
                <p>
                  Soutenez les producteurs locaux et participez activement à la lutte contre le gaspillage alimentaire grâce à GreenCart.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/shop"
                  className="bg-amber-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-amber-600 transition-colors flex items-center justify-center group shadow-lg"
                >
                  Commander dès maintenant
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/producers"
                  className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-green-900 transition-colors text-center shadow"
                >
                  Devenir producteur
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <img
                src="/Home.png"
                alt="Panier de produits locaux frais - Fruits et légumes de saison anti-gaspillage"
                className="rounded-2xl shadow-2xl w-full"
              />
              <div className="absolute -bottom-6 -left-6 bg-white text-green-800 p-4 rounded-xl shadow-lg">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="w-6 h-6 text-green-800" />
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

      {/* ✅ H2 CORRECT - Hiérarchie respectée */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-green-900">
            Notre impact positif
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="bg-green-800 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Leaf className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold text-green-800 mb-2">1,000+</h3>
              <p className="text-gray-700 font-medium">Tonnes sauvées du gaspillage</p>
            </div>
            
            <div>
              <div className="bg-amber-500 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold text-green-800 mb-2">30+</h3>
              <p className="text-gray-700 font-medium">Producteurs partenaires</p>
            </div>
            
            <div>
              <div className="bg-amber-700 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold text-green-800 mb-2">2,000+</h3>
              <p className="text-gray-700 font-medium">Clients satisfaits</p>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ H2 CORRECT */}
      <section className="py-16 md:py-20 bg-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-green-900 mb-4">
              Offres du moment
            </h2>
            <p className="text-gray-700 text-lg max-w-2xl mx-auto">
              Découvrez nos meilleures offres sur des produits de qualité à prix réduits
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse h-[520px]" />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center text-gray-600 py-16 bg-white rounded-2xl shadow-sm">
              <p className="text-lg font-medium">Aucune offre disponible pour le moment</p>
            </div>
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
              className="bg-green-800 hover:bg-green-900 text-white px-8 py-4 rounded-full font-semibold text-lg transition-colors inline-flex items-center group shadow-lg"
            >
              Voir tous les produits
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ✅ H2 CORRECT */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-green-900 mb-6">
                Notre mission : zéro gaspillage
              </h2>

              <p className="text-gray-700 text-lg mb-6">
                GreenCart connecte les consommateurs conscients avec les producteurs locaux pour donner une seconde vie aux produits alimentaires de qualité.
              </p>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-800 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-gray-800 font-medium">Produits locaux et de saison</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-800 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-gray-800 font-medium">Prix réduits jusqu'à 50%</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-800 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-gray-800 font-medium">Soutien aux petits producteurs</span>
                </li>
              </ul>

              <Link
                to="/about"
                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-full font-semibold transition-colors inline-flex items-center group shadow-md"
              >
                En savoir plus
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div>
              <img
                src="https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Producteur local travaillant dans son champ avec des légumes frais"
                width={600}
                height={400}
                loading="lazy"
                className="rounded-2xl shadow-lg w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ✅ H2 CORRECT */}
      <section className="py-16 md:py-20 bg-green-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Rejoignez le mouvement anti-gaspillage
          </h2>

          <p className="text-gray-200 text-lg mb-8 max-w-2xl mx-auto">
            Inscrivez-vous dès aujourd'hui et recevez 10€ de réduction sur votre première commande
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition-colors shadow-lg"
            >
              Créer mon compte client
            </Link>

            <Link
              to="/register?type=producer"
              className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-green-900 transition-colors shadow"
            >
              Devenir producteur partenaire
            </Link>
          </div>
        </div>
      </section>

      {/* ✅ FOOTER pour SEO */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-xl font-bold mb-4">GreenCart</h3>
              <p className="text-gray-400">Luttons ensemble contre le gaspillage alimentaire en soutenant les producteurs locaux.</p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Navigation</h4>
              <ul className="space-y-2">
                <li><Link to="/shop" className="hover:text-amber-400 transition-colors">Boutique</Link></li>
                <li><Link to="/about" className="hover:text-amber-400 transition-colors">À propos</Link></li>
                <li><Link to="/producers" className="hover:text-amber-400 transition-colors">Nos producteurs</Link></li>
                <li><Link to="/blog" className="hover:text-amber-400 transition-colors">Blog</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Légal</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="hover:text-amber-400 transition-colors">Confidentialité</Link></li>
                <li><Link to="/terms" className="hover:text-amber-400 transition-colors">Conditions d'utilisation</Link></li>
                <li><Link to="/cookies" className="hover:text-amber-400 transition-colors">Cookies</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <p className="text-gray-400 mb-2">contact@greencart.fr</p>
              <p className="text-gray-400">01 23 45 67 89</p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} GreenCart. Tous droits réservés.</p>
            <p className="mt-2">
              <Link to="/sitemap.xml" className="hover:text-amber-400 transition-colors">Plan du site</Link> | 
              <Link to="/robots.txt" className="hover:text-amber-400 transition-colors ml-2">Robots.txt</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
