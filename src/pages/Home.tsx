import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Plus, ArrowRight, Search, Menu, Heart } from 'lucide-react'
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
  const [menuOpen, setMenuOpen] = useState(false)

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

  // Produits statiques pour la maquette
  const staticProducts = [
    { id: 1, name: "Pommes 1kg", price: "3,99€", originalPrice: "5,99€", discount: "-33%" },
    { id: 2, name: "Oranges 1kg", price: "2,49€", originalPrice: "3,99€", discount: "-38%" },
    { id: 3, name: "Légumes de saison", price: "4,99€", originalPrice: "7,99€", discount: "-38%" }
  ]

  return (
    <div className="min-h-screen font-sans">
      {/* HEADER - Comme dans la maquette */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="text-2xl font-bold text-[#508433]">
              GreenCart
            </Link>

            {/* Barre de recherche (mobile hidden) */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher des produits..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#508433] focus:border-transparent"
                />
              </div>
            </div>

            {/* Navigation desktop */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/about" className="text-gray-700 hover:text-[#508433] font-medium">À propos</Link>
              <Link to="/shop" className="text-gray-700 hover:text-[#508433] font-medium">Boutique</Link>
              <Link to="/producers" className="text-gray-700 hover:text-[#508433] font-medium">Producteurs</Link>
              <Link to="/blog" className="text-gray-700 hover:text-[#508433] font-medium">Blog</Link>
              <Link to="/contact" className="text-gray-700 hover:text-[#508433] font-medium">Contact</Link>
              <Link to="/cart" className="relative">
                <ShoppingCart className="w-6 h-6 text-[#508433]" />
                <span className="absolute -top-2 -right-2 bg-[#508433] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </Link>
            </nav>

            {/* Menu mobile */}
            <button 
              className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          {/* Menu mobile déroulant */}
          {menuOpen && (
            <div className="md:hidden bg-white border-t">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link to="/about" className="block px-3 py-2 text-gray-700 hover:bg-gray-50">À propos</Link>
                <Link to="/shop" className="block px-3 py-2 text-gray-700 hover:bg-gray-50">Boutique</Link>
                <Link to="/producers" className="block px-3 py-2 text-gray-700 hover:bg-gray-50">Producteurs</Link>
                <Link to="/blog" className="block px-3 py-2 text-gray-700 hover:bg-gray-50">Blog</Link>
                <Link to="/contact" className="block px-3 py-2 text-gray-700 hover:bg-gray-50">Contact</Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* HERO SECTION - Exactement comme la maquette */}
      <section className="bg-gradient-to-b from-[#FFF0B1]/20 to-white py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Breadcrumb */}
            <nav className="text-sm text-gray-600 mb-6">
              <Link to="/" className="hover:text-[#508433]">Accueil</Link>
            </nav>

            {/* Titre principal */}
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Sauvons ensemble nos produits locaux – GreenCart
            </h1>

            {/* Sous-titre */}
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto mb-10">
              Découvrez des produits locaux de qualité à prix réduits jusqu'à 40%. Soutenez vos producteurs locaux et participez à la lutte contre le gaspillage alimentaire.
            </p>

            {/* Boutons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                to="/shop"
                className="bg-[#508433] hover:bg-[#3f6a29] text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center shadow-md"
              >
                Commander dès maintenant
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/about"
                className="bg-white hover:bg-gray-50 text-[#508433] border-2 border-[#508433] px-8 py-4 rounded-lg font-semibold text-lg transition-colors shadow-sm"
              >
                Découvrir notre mission
              </Link>
            </div>

            {/* Statistique */}
            <div className="inline-flex items-center bg-[#508433] text-[#FFF0B1] px-6 py-3 rounded-full">
              <span className="text-2xl font-bold mr-2">1000+</span>
              <span className="font-medium">Tonnes sauvées du gaspillage</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION OFFRES - Comme la maquette */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Offres du moment
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Découvrez nos meilleures offres sur des produits de qualité à prix réduits.
            </p>
          </div>

          {/* Produits statiques comme dans la maquette */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {staticProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="p-6">
                  {/* Badge de réduction */}
                  <div className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                    {product.discount}
                  </div>
                  
                  {/* Nom du produit */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                  
                  {/* Prix */}
                  <div className="flex items-center mb-6">
                    <span className="text-2xl font-bold text-[#508433]">{product.price}</span>
                    <span className="ml-3 text-gray-400 line-through">{product.originalPrice}</span>
                  </div>
                  
                  {/* Bouton Ajouter au panier */}
                  <button className="w-full bg-[#508433] hover:bg-[#3f6a29] text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center transition-colors">
                    <Plus className="w-5 h-5 mr-2" />
                    Ajouter au panier
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bouton "Voir tous les produits" */}
          <div className="text-center mt-12">
            <Link
              to="/shop"
              className="inline-flex items-center text-[#508433] hover:text-[#3f6a29] font-semibold text-lg"
            >
              Voir tous les produits
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION MISSION - Comme la maquette */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Notre mission : zéro gaspillage
              </h2>
              
              <p className="text-lg text-gray-700 mb-8">
                GreenCart connecte les consommateurs conscients avec les producteurs locaux pour donner une seconde vie aux produits alimentaires de qualité.
              </p>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-[#508433] rounded-full flex-shrink-0 mt-1 mr-3 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-gray-800 font-medium">Produits locaux et de saison</span>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-[#508433] rounded-full flex-shrink-0 mt-1 mr-3 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-gray-800 font-medium">Prix réduits jusqu'à 50%</span>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-[#508433] rounded-full flex-shrink-0 mt-1 mr-3 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-gray-800 font-medium">Soutien aux petits producteurs</span>
                </li>
              </ul>
              
              <Link
                to="/about"
                className="inline-flex items-center text-[#508433] hover:text-[#3f6a29] font-semibold"
              >
                En savoir plus
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
            
            <div>
              <img
                src="https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Producteur local travaillant dans son champ"
                className="rounded-xl shadow-lg w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION CTA - Comme la maquette */}
      <section className="py-16 bg-[#866545] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Rejoignez le mouvement anti-gaspillage
          </h2>
          
          <p className="text-lg text-[#FFF0B1] mb-10 max-w-2xl mx-auto">
            Inscrivez-vous dès aujourd'hui et recevez 10€ de réduction sur votre première commande
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-[#D79B65] hover:bg-[#c58b55] text-[#422A19] px-8 py-4 rounded-lg font-semibold text-lg transition-colors shadow-md"
            >
              Créer mon compte client
            </Link>
            
            <Link
              to="/register?type=producer"
              className="bg-transparent hover:bg-white/10 text-white border-2 border-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Devenir producteur partenaire
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER - EXACTEMENT COMME LA MAQUETTE avec couleurs spécifiques */}
      <footer className="bg-[#422A19] text-[#FFF0B1] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            {/* Colonne 1: Navigation */}
            <div>
              <h4 className="text-white font-bold text-lg mb-6 uppercase tracking-wide">
                Navigation
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link 
                    to="/about" 
                    className="hover:text-white transition-colors duration-200 hover:pl-2 block"
                  >
                    À propos
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/shop" 
                    className="hover:text-white transition-colors duration-200 hover:pl-2 block"
                  >
                    Boutique
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/producers" 
                    className="hover:text-white transition-colors duration-200 hover:pl-2 block"
                  >
                    Producteurs
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/blog" 
                    className="hover:text-white transition-colors duration-200 hover:pl-2 block"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/contact" 
                    className="hover:text-white transition-colors duration-200 hover:pl-2 block"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/faq" 
                    className="hover:text-white transition-colors duration-200 hover:pl-2 block"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Colonne 2: Information légales */}
            <div>
              <h4 className="text-white font-bold text-lg mb-6 uppercase tracking-wide">
                Information légales
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link 
                    to="/legal" 
                    className="hover:text-white transition-colors duration-200 hover:pl-2 block"
                  >
                    Mentions légales
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/terms" 
                    className="hover:text-white transition-colors duration-200 hover:pl-2 block"
                  >
                    CGU & CGV
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/privacy" 
                    className="hover:text-white transition-colors duration-200 hover:pl-2 block"
                  >
                    Politique de confidentialité
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/sitemap" 
                    className="hover:text-white transition-colors duration-200 hover:pl-2 block"
                  >
                    Plan du site
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Colonne 3: Logo et copyright */}
            <div>
              <h3 className="text-3xl font-bold text-white mb-6">
                GreenCart
              </h3>
              <p className="text-[#FFF0B1]/90 mb-8 leading-relaxed">
                Plateforme développée avec <Heart className="inline w-4 h-4 text-red-400 fill-red-400 mx-1" /> pour un avenir plus durable.
              </p>
              
              {/* Copyright */}
              <div className="pt-8 border-t border-[#FFF0B1]/20">
                <p className="text-[#FFF0B1]/80 text-sm">
                  © 2025 GreenCart. Tous droits réservés.
                </p>
              </div>
            </div>
            
          </div>
          
          {/* Ligne de séparation décorative */}
          <div className="mt-12 pt-8 border-t border-[#FFF0B1]/10">
            <div className="text-center text-[#FFF0B1]/60 text-sm">
              <p>GreenCart - Lutte contre le gaspillage alimentaire depuis 2023</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Styles CSS pour les animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
