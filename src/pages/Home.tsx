import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Users, Leaf, TrendingDown, ArrowRight, Cookie } from 'lucide-react'
import BundleCard from '../components/BundleCard'
import { http } from '../lib/api'

// ... vos types restent les mêmes ...

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
    
    // Vérifier si l'utilisateur a déjà fait un choix
    const hasCookieChoice = localStorage.getItem('cookie-choice')
    if (hasCookieChoice) {
      setShowCookieBanner(false)
    }
    
    return () => {
      alive = false
    }
  }, [])

  // ... reste du code pour featured ...

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
      
      {/* ✅ HERO SECTION - COULEURS EXACTES DE LA MAQUETTE */}
      <section className="relative bg-gradient-to-br from-[#1B5E20] to-[#2E7D32] text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            
            {/* ✅ H1 - Vert plus clair pour contraste */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Produits locaux anti-gaspillage – GreenCart
            </h1>
            
            {/* ✅ H2 - Texte blanc/vert très clair */}
            <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold mb-8 text-[#E8F5E9] leading-relaxed">
              Sauvons ensemble les produits locaux et luttons contre le gaspillage alimentaire
            </h2>
            
            {/* ✅ PARAGRAPHE - Vert très clair */}
            <div className="text-lg md:text-xl mb-10 text-[#C8E6C9] max-w-3xl mx-auto leading-relaxed">
              <p className="mb-4">
                Découvrez des produits locaux de qualité à prix réduits jusqu'à 40 %.
              </p>
              <p>
                Soutenez les producteurs locaux et participez activement à la lutte contre le gaspillage alimentaire grâce à GreenCart.
              </p>
            </div>
            
            {/* ✅ BOUTONS - Couleurs de la maquette */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/shop"
                className="bg-[#FF9800] hover:bg-[#F57C00] text-white px-8 py-4 rounded-full font-semibold text-lg flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl"
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
        </div>
      </section>

      {/* ✅ BANNIÈRE COOKIES - COULEURS EXACTES */}
      {showCookieBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl animate-slide-up">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              
              {/* Partie gauche : Texte et liens */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Cookie className="w-5 h-5 text-[#4CAF50]" />
                  <h3 className="text-lg font-bold text-gray-900">Vos préférences de confidentialité</h3>
                </div>
                
                <p className="text-gray-700 mb-4 text-sm">
                  Nous utilisons des cookies nécessaires au fonctionnement du site et des cookies optionnels 
                  pour analyser le trafic et améliorer votre expérience. Vous pouvez personnaliser vos choix.
                </p>
                
                {/* ✅ LIENS - Couleurs de la maquette */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <Link to="/about" className="text-[#4CAF50] hover:text-[#388E3C] font-medium">
                    À propos
                  </Link>
                  <Link to="/shop" className="text-[#4CAF50] hover:text-[#388E3C] font-medium">
                    Boutique
                  </Link>
                  <Link to="/producers" className="text-[#4CAF50] hover:text-[#388E3C] font-medium">
                    Producteurs
                  </Link>
                  <Link to="/blog" className="text-[#4CAF50] hover:text-[#388E3C] font-medium">
                    Blog
                  </Link>
                  <Link to="/contact" className="text-[#4CAF50] hover:text-[#388E3C] font-medium">
                    Contact
                  </Link>
                  <Link to="/cookies" className="text-[#4CAF50] hover:text-[#388E3C] font-medium underline">
                    En savoir plus
                  </Link>
                </div>
              </div>
              
              {/* Partie droite : Pourcentage et boutons */}
              <div className="flex items-center gap-6">
                {/* ✅ BADGE -40% - Couleurs de la maquette */}
                <div className="bg-[#FF9800] text-white px-4 py-3 rounded-lg shadow-md">
                  <div className="text-center">
                    <div className="text-2xl font-bold">-40%</div>
                    <div className="text-xs font-medium">sur vos courses</div>
                  </div>
                </div>
                
                {/* ✅ BOUTONS COOKIES - Couleurs de la maquette */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleRejectCookies}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-semibold text-sm transition-colors border border-gray-300"
                  >
                    Refuser
                  </button>
                  <button
                    onClick={handleAcceptCookies}
                    className="px-5 py-2.5 bg-[#4CAF50] hover:bg-[#388E3C] text-white rounded-lg font-semibold text-sm transition-colors shadow-md"
                  >
                    Accepter
                  </button>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}

      {/* ✅ SECTION COMMENT ÇA MARCHE - COULEURS EXACTES */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comment fonctionne GreenCart
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Un processus simple pour lutter contre le gaspillage alimentaire
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Étape 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
              <div className="bg-[#E8F5E9] text-[#2E7D32] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Sélection</h3>
              <p className="text-gray-600">Nos producteurs sélectionnent leurs produits locaux</p>
            </div>
            
            {/* Étape 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
              <div className="bg-[#E8F5E9] text-[#2E7D32] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Panier</h3>
              <p className="text-gray-600">Nous créons des paniers à -40% en moyenne</p>
            </div>
            
            {/* Étape 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
              <div className="bg-[#E8F5E9] text-[#2E7D32] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Commande</h3>
              <p className="text-gray-600">Vous commandez en ligne simplement</p>
            </div>
            
            {/* Étape 4 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
              <div className="bg-[#E8F5E9] text-[#2E7D32] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                4
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Livraison</h3>
              <p className="text-gray-600">Livraison écologique en circuit court</p>
            </div>
          </div>
        </div>
      </section>

      {/* ... le reste de votre page (sections impact, offres, mission, CTA) ... */}
      {/* UTILISEZ LES MÊMES COULEURS : #2E7D32, #4CAF50, #FF9800, #F57C00 */}
      
    </div>
  )
}
