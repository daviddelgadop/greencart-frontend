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

  const testimonials = [
    { name: 'Marie L.', text: "GreenCart m'a permis de découvrir des producteurs locaux formidables et de réduire mes déchets alimentaires !", rating: 5 },
    { name: 'Pierre D.', text: "En tant que producteur, cette plateforme m'aide à écouler mes invendus et à toucher de nouveaux clients.", rating: 5 }
  ]

  return (
    <div className="min-h-screen">

      {/* HERO */}
      <section className="relative bg-gradient-to-r from-green-900 to-amber-900 text-amber-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="opacity-0 animate-fadeIn">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Sauvons ensemble nos <span className="text-amber-400"> produits locaux</span>
              </h1>
              <p className="text-xl mb-8 text-amber-100">
                Découvrez des produits de qualité à prix réduits, soutenez vos producteurs locaux et participez à la lutte contre le gaspillage alimentaire.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/shop"
                  className="bg-amber-400 text-amber-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-amber-500 transition-colors flex items-center justify-center group shadow-lg"
                >
                  Commander dès maintenant
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/about"
                  className="border-2 border-amber-50 text-amber-50 px-8 py-4 rounded-full font-semibold text-lg hover:bg-amber-50 hover:text-green-900 transition-colors text-center shadow"
                >
                  Découvrir notre mission
                </Link>
              </div>
            </div>

            <div className="relative opacity-0 animate-slideUp">
              <img
                src="/Home.png"
                alt="Produits locaux frais - Panier de fruits et légumes de saison"
                className="rounded-2xl shadow-2xl w-full"
                width={600}
                height={400}
              />
              <div className="absolute -bottom-6 -left-6 bg-amber-50 text-green-900 p-4 rounded-xl shadow-lg">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="w-6 h-6 text-green-900" />
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

      {/* IMPACT */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-green-900">
            Notre impact positif
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="opacity-0 animate-slideUp [animation-delay:100ms]">
              <div className="bg-green-900 text-amber-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Leaf className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold text-green-900 mb-2">1,000+</h3>
              <p className="text-gray-700 font-medium">Tonnes sauvées du gaspillage</p>
            </div>

            <div className="opacity-0 animate-slideUp [animation-delay:200ms]">
              <div className="bg-amber-400 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold text-green-900 mb-2">30+</h3>
              <p className="text-gray-700 font-medium">Producteurs partenaires</p>
            </div>

            <div className="opacity-0 animate-slideUp [animation-delay:300ms]">
              <div className="bg-amber-800 text-amber-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold text-green-900 mb-2">2,000+</h3>
              <p className="text-gray-700 font-medium">Clients satisfaits</p>
            </div>
          </div>
        </div>
      </section>

      {/* OFFRES */}
      <section className="py-20 bg-amber-50/30">
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
              className="bg-green-900 hover:bg-green-800 text-amber-50 px-8 py-4 rounded-full font-semibold text-lg 
                         transition-colors inline-flex items-center group shadow-lg"
            >
              Voir tous les produits
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* TÉMOIGNAGES */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-green-900 mb-12">
            Ce que disent nos clients
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-amber-50/50 rounded-2xl p-6 shadow-lg border border-amber-100"
              >
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className="w-5 h-5 text-amber-400 fill-amber-400" 
                    />
                  ))}
                </div>
                <p className="text-gray-700 text-lg italic mb-4">"{testimonial.text}"</p>
                <p className="font-semibold text-green-900">{testimonial.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="py-20 bg-white">
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
                {[
                  "Produits locaux et de saison",
                  "Prix réduits jusqu'à 50%",
                  "Soutien aux petits producteurs"
                ].map((item, i) => (
                  <li key={i} className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-900 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-amber-50 rounded-full"></div>
                    </div>
                    <span className="text-gray-800 font-medium">{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/about"
                className="bg-amber-400 hover:bg-amber-500 text-amber-900 px-6 py-3 rounded-full font-semibold 
                           transition-colors inline-flex items-center group shadow-md"
              >
                En savoir plus
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div>
              <img
                src="https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Producteur local travaillant dans son champ avec des légumes frais"
                className="rounded-2xl shadow-lg w-full"
                width={600}
                height={400}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 bg-green-900 text-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Rejoignez le mouvement anti-gaspillage
          </h2>

          <p className="text-amber-100 text-lg mb-8 max-w-2xl mx-auto">
            Inscrivez-vous dès aujourd'hui et recevez 10€ de réduction sur votre première commande
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-amber-400 hover:bg-amber-500 text-amber-900 px-8 py-4 rounded-full font-semibold text-lg 
                         transition-colors shadow-lg"
            >
              Créer mon compte client
            </Link>

            <Link
              to="/register?type=producer"
              className="border-2 border-amber-50 text-amber-50 px-8 py-4 rounded-full font-semibold text-lg 
                         hover:bg-amber-50 hover:text-green-900 transition-colors shadow"
            >
              Devenir producteur partenaire
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-amber-50 text-xl font-bold mb-4">GreenCart</h3>
              <p className="text-gray-400">Luttons ensemble contre le gaspillage alimentaire en soutenant les producteurs locaux.</p>
            </div>
            
            <div>
              <h4 className="text-amber-50 font-semibold mb-4">Navigation</h4>
              <ul className="space-y-2">
                <li><Link to="/shop" className="hover:text-amber-400 transition-colors">Boutique</Link></li>
                <li><Link to="/about" className="hover:text-amber-400 transition-colors">À propos</Link></li>
                <li><Link to="/producers" className="hover:text-amber-400 transition-colors">Nos producteurs</Link></li>
                <li><Link to="/blog" className="hover:text-amber-400 transition-colors">Blog</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-amber-50 font-semibold mb-4">Légal</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="hover:text-amber-400 transition-colors">Confidentialité</Link></li>
                <li><Link to="/terms" className="hover:text-amber-400 transition-colors">Conditions d'utilisation</Link></li>
                <li><Link to="/cookies" className="hover:text-amber-400 transition-colors">Cookies</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-amber-50 font-semibold mb-4">Contact</h4>
              <p className="text-gray-400 mb-2">contact@greencart.fr</p>
              <p className="text-gray-400">01 23 45 67 89</p>
              <div className="flex space-x-4 mt-4">
                <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">Facebook</a>
                <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">Instagram</a>
                <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">LinkedIn</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} GreenCart. Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      {/* ANIMATIONS CSS */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
        
        .animate-slideUp {
          animation: slideUp 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
