import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Users, Leaf, TrendingDown, ArrowRight, Cookie } from 'lucide-react'
import BundleCard from '../components/BundleCard'
import { http } from '../lib/api'

// ... (vos types TypeScript restent les mêmes) ...

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
    
    // Vérifier les cookies
    const hasCookieChoice = localStorage.getItem('cookie-choice')
    if (hasCookieChoice) {
      setShowCookieBanner(false)
    }
    
    return () => { alive = false }
  }, [])

  const featured = useMemo(() => {
    // ... (votre logique pour featured reste la même) ...
  }, [bundles])

  const handleAcceptCookies = () => {
    localStorage.setItem('cookie-choice', 'accepted')
    setShowCookieBanner(false)
  }

  const handleRejectCookies = () => {
    localStorage.setItem('cookie-choice', 'rejected')
    setShowCookieBanner(false)
  }

  return (
    <div className="min-h-screen font-poppins">
      
      {/* ✅ SECTION HERO - UTILISE TAILWIND PERSONNALISÉ */}
     <section className="relative bg-gc-green-dark text-white py-20">
  <div className="max-w-7xl mx-auto px-6">
    
    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
      Produits locaux anti-gaspillage – GreenCart
    </h1>

    <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold mb-8 text-gc-green-light leading-relaxed">
      Sauvons ensemble les produits locaux et luttons contre le gaspillage alimentaire
    </h2>

    <div className="text-lg md:text-xl mb-10 text-gc-text-light max-w-3xl leading-relaxed">
      <p className="mb-4">
        Découvrez des produits locaux de qualité à prix réduits jusqu'à 40 %.
      </p>
      <p>
        Soutenez les producteurs locaux et participez activement à la lutte contre le gaspillage alimentaire grâce à GreenCart.
      </p>
    </div>

          
          {/* ✅ BOUTONS - AVEC VOTRE PALETTE */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/shop"
              className="bg-gc-orange-dark hover:bg-gc-orange text-white px-8 py-4 rounded-full font-semibold text-lg flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl"
            >
              Commander dès maintenant
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <Link
              to="/about"
              className="bg-transparent border-2 border-white hover:bg-white/10 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all"
            >
              Découvrir notre mission
            </Link>
          </div>
          
        </div>
      </section>

      {/* ✅ BANNIÈRE COOKIES - AVEC VOTRE PALETTE */}
      {showCookieBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl animate-slide-up">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              
              {/* Texte et liens */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Cookie className="w-5 h-5 text-gc-green" />
                  <h3 className="text-lg font-bold text-gc-text-dark">
                    Vos préférences de confidentialité
                  </h3>
                </div>
                
                <p className="text-gray-700 mb-4 text-sm">
                  Nous utilisons des cookies nécessaires au fonctionnement du site et des cookies optionnels 
                  pour analyser le trafic et améliorer votre expérience. Vous pouvez personnaliser vos choix.
                </p>
                
                {/* Liens */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <Link to="/about" className="text-gc-green hover:text-gc-green-dark font-medium">
                    À propos
                  </Link>
                  <Link to="/shop" className="text-gc-green hover:text-gc-green-dark font-medium">
                    Boutique
                  </Link>
                  <Link to="/producers" className="text-gc-green hover:text-gc-green-dark font-medium">
                    Producteurs
                  </Link>
                  <Link to="/blog" className="text-gc-green hover:text-gc-green-dark font-medium">
                    Blog
                  </Link>
                  <Link to="/contact" className="text-gc-green hover:text-gc-green-dark font-medium">
                    Contact
                  </Link>
                  <Link to="/cookies" className="text-gc-green hover:text-gc-green-dark font-medium underline">
                    En savoir plus
                  </Link>
                </div>
              </div>
              
              {/* Pourcentage et boutons */}
              <div className="flex items-center gap-6">
                {/* Badge -40% */}
                <div className="bg-gc-orange-dark text-white px-4 py-3 rounded-lg shadow-md">
                  <div className="text-center">
                    <div className="text-2xl font-bold">-40%</div>
                    <div className="text-xs font-medium">sur vos courses</div>
                  </div>
                </div>
                
                {/* Boutons cookies */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleRejectCookies}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-semibold text-sm transition-colors border border-gray-300"
                  >
                    Refuser
                  </button>
                  <button
                    onClick={handleAcceptCookies}
                    className="px-5 py-2.5 bg-gc-green hover:bg-gc-green-dark text-white rounded-lg font-semibold text-sm transition-colors shadow-md"
                  >
                    Accepter
                  </button>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}

      {/* ✅ SECTION COMMENT ÇA MARCHE */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gc-text-dark mb-4">
              Comment fonctionne GreenCart
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Un processus simple pour lutter contre le gaspillage alimentaire
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Étape 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
              <div className="bg-green-50 text-gc-green w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Sélection</h3>
              <p className="text-gray-600">Nos producteurs sélectionnent leurs produits locaux</p>
            </div>
            
            {/* Étape 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
              <div className="bg-green-50 text-gc-green w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Panier</h3>
              <p className="text-gray-600">Nous créons des paniers à -40% en moyenne</p>
            </div>
            
            {/* Étape 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
              <div className="bg-green-50 text-gc-green w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Commande</h3>
              <p className="text-gray-600">Vous commandez en ligne simplement</p>
            </div>
            
            {/* Étape 4 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
              <div className="bg-green-50 text-gc-green w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                4
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Livraison</h3>
              <p className="text-gray-600">Livraison écologique en circuit court</p>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ SECTION IMPACT */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gc-text-dark">
            Notre impact positif
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="bg-gc-green-dark text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Leaf className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">1,000+</h3>
              <p className="text-gray-700 font-medium">Tonnes sauvées du gaspillage</p>
            </div>
            
            <div>
              <div className="bg-gc-orange-dark text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">30+</h3>
              <p className="text-gray-700 font-medium">Producteurs partenaires</p>
            </div>
            
            <div>
              <div className="bg-gc-green text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">2,000+</h3>
              <p className="text-gray-700 font-medium">Clients satisfaits</p>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ SECTION OFFRES */}
      <section className="py-20 bg-gc-beige">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gc-text-dark mb-4">
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
              className="bg-gc-green-dark hover:bg-gc-green text-white px-8 py-4 rounded-full font-semibold text-lg transition-colors inline-flex items-center group shadow-lg"
            >
              Voir tous les produits
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ✅ SECTION CTA FINAL */}
      <section className="py-20 bg-gc-green-dark text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Rejoignez le mouvement anti-gaspillage
          </h2>
          
          <p className="text-green-100 text-lg mb-8 max-w-2xl mx-auto">
            Inscrivez-vous dès aujourd'hui et recevez 10€ de réduction sur votre première commande
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-gc-orange-dark hover:bg-gc-orange text-white px-8 py-4 rounded-full font-semibold text-lg transition-colors shadow-lg"
            >
              Créer mon compte client
            </Link>
            
            <Link
              to="/register?type=producer"
              className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-gc-green-dark transition-colors shadow"
            >
              Devenir producteur partenaire
            </Link>
          </div>
        </div>
      </section>
      
    </div>
  )
}
