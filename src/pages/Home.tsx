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
      {/* ✅ SECTION HERO - OPTIMISÉE SEO */}
      <section className="relative bg-gradient-to-r from-dark-green to-medium-brown text-pale-yellow py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              {/* ✅ H1 OPTIMISÉ (55 caractères) */}
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                GreenCart : produits locaux anti-gaspi à -40% | Lyon
              </h1>
              
              {/* ✅ SOUS-TITRE OPTIMISÉ */}
              <p className="text-xl mb-6 text-white font-medium">
                Sauvez des produits, soutenez vos producteurs locaux, consommez responsable
              </p>
              
              {/* ✅ PARAGRAPHE CONTENU RICHE */}
              <p className="text-lg mb-8 text-pale-yellow">
                GreenCart connecte directement les consommateurs de Lyon et du Rhône avec les producteurs locaux 
                pour lutter contre le gaspillage alimentaire. Nos paniers anti-gaspi contiennent des fruits et légumes 
                de saison à prix réduits jusqu'à -40%.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/shop"
                  className="bg-orange-beige text-dark-brown px-8 py-4 rounded-full font-semibold text-lg hover:bg-orange-beige/90 transition-colors flex items-center justify-center group"
                  aria-label="Commander dès maintenant des produits locaux anti-gaspi"
                >
                  Commander dès maintenant
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/about"
                  className="border-2 border-pale-yellow text-pale-yellow px-8 py-4 rounded-full font-semibold text-lg hover:bg-pale-yellow hover:text-dark-green transition-colors text-center"
                  aria-label="Découvrir la mission GreenCart anti-gaspillage"
                >
                  Découvrir notre mission
                </Link>
              </div>
            </div>
            <div className="relative animate-slide-up">
              {/* ✅ BALISE ALT OPTIMISÉE SEO */}
              <img
                src="/Home.png"
                alt="Panier de fruits et légumes locaux frais GreenCart - produits anti-gaspi et circuit court à Lyon"
                className="rounded-2xl shadow-2xl w-full"
                width="600"
                height="400"
                loading="lazy"
              />
              {/* ✅ COULEUR ACCESSIBLE */}
              <div className="absolute -bottom-6 -left-6 bg-green-700 text-white p-4 rounded-xl shadow-lg">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="w-6 h-6 text-white" />
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

      {/* ✅ SECTION STATISTIQUES - CORRIGÉE HN */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ✅ H2 SECTION STATISTIQUES */}
          <h2 className="text-3xl md:text-4xl font-bold text-dark-green mb-12 text-center">
            L'impact GreenCart en chiffres
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="animate-slide-up">
              <div className="bg-dark-green text-pale-yellow w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" 
                   aria-hidden="true">
                <Leaf className="w-8 h-8" />
              </div>
              {/* ✅ CORRECTION : Utiliser un div au lieu de h3 pour les chiffres */}
              <div className="text-3xl font-bold text-dark-green mb-2">1,000+</div>
              <p className="text-gray-600 font-medium">Tonnes de produits sauvés du gaspillage</p>
            </div>
            <div className="animate-slide-up">
              <div className="bg-orange-beige text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" 
                   aria-hidden="true">
                <Users className="w-8 h-8" />
              </div>
              <div className="text-3xl font-bold text-dark-green mb-2">30+</div>
              <p className="text-gray-600 font-medium">Producteurs locaux partenaires</p>
            </div>
            <div className="animate-slide-up">
              <div className="bg-medium-brown text-pale-yellow w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" 
                   aria-hidden="true">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <div className="text-3xl font-bold text-dark-green mb-2">2,000+</div>
              <p className="text-gray-600 font-medium">Clients satisfaits dans le Rhône</p>
            </div>
          </div>
          
          {/* ✅ H3 SOUS-SECTION IMPACT */}
          <div className="mt-12 text-center">
            <h3 className="text-2xl font-semibold text-dark-green mb-4">
              Notre impact environnemental et social
            </h3>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Grâce à notre modèle de circuit court et anti-gaspi, chaque panier GreenCart permet de réduire 
              le gaspillage alimentaire tout en soutenant l'économie locale lyonnaise.
            </p>
          </div>
        </div>
      </section>

      {/* ✅ SECTION OFFRES - HIÉRARCHIE CORRECTE */}
      <section className="py-20 bg-pale-yellow/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            {/* ✅ H2 PRINCIPAL */}
            <h2 className="text-3xl md:text-4xl font-bold text-dark-green mb-4">
              Nos paniers anti-gaspi de saison
            </h2>
            {/* ✅ PARAGRAPHE DESCRIPTIF */}
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Découvrez nos meilleures offres sur des produits locaux de qualité à prix réduits
            </p>
            
            {/* ✅ H3 SOUS-TITRE */}
            <h3 className="text-2xl font-semibold text-dark-green mt-8 mb-6">
              Offres du moment à Lyon et sa région
            </h3>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse h-[520px]" 
                     aria-label="Chargement des offres" />
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
              className="bg-dark-green text-pale-yellow px-8 py-4 rounded-full font-semibold text-lg hover:bg-dark-green/90 transition-colors inline-flex items-center group"
              aria-label="Voir tous les produits locaux anti-gaspi"
            >
              Voir tous les produits
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ✅ SECTION MISSION - HIÉRARCHIE CORRECTE */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              {/* ✅ H2 SECTION MISSION */}
              <h2 className="text-3xl md:text-4xl font-bold text-dark-green mb-6">
                Comment fonctionne GreenCart ?
              </h2>
              
              <p className="text-gray-600 text-lg mb-6">
                GreenCart connecte les consommateurs conscients avec les producteurs locaux 
                pour donner une seconde vie aux produits alimentaires de qualité.
              </p>
              
              {/* ✅ H3 SOUS-SECTIONS */}
              <h3 className="text-2xl font-semibold text-dark-green mb-4">
                Notre processus anti-gaspi
              </h3>
              
              <ul className="space-y-4 mb-8" role="list">
                <li className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-dark-green rounded-full flex items-center justify-center" 
                       aria-hidden="true">
                    <div className="w-2 h-2 bg-pale-yellow rounded-full"></div>
                  </div>
                  <span className="text-gray-700 font-medium">Sélection des invendus chez nos producteurs</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-dark-green rounded-full flex items-center justify-center" 
                       aria-hidden="true">
                    <div className="w-2 h-2 bg-pale-yellow rounded-full"></div>
                  </div>
                  <span className="text-gray-700 font-medium">Création de paniers à prix réduits jusqu'à 50%</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-dark-green rounded-full flex items-center justify-center" 
                       aria-hidden="true">
                    <div className="w-2 h-2 bg-pale-yellow rounded-full"></div>
                  </div>
                  <span className="text-gray-700 font-medium">Livraison en circuit court pour soutenir les petits producteurs</span>
                </li>
              </ul>
              
              {/* ✅ H3 AUTRE SOUS-SECTION */}
              <h3 className="text-2xl font-semibold text-dark-green mb-4">
                Notre engagement qualité
              </h3>
              
              <p className="text-gray-600 mb-6">
                Tous nos produits sont issus de l'agriculture locale du Rhône, 
                avec une traçabilité complète du producteur au consommateur.
              </p>
              
              <Link
                to="/about"
                className="bg-orange-beige text-dark-brown px-6 py-3 rounded-full font-semibold hover:bg-orange-beige/90 transition-colors inline-flex items-center group"
                aria-label="En savoir plus sur notre mission anti-gaspi"
              >
                En savoir plus
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div>
              {/* ✅ BALISE ALT OPTIMISÉE */}
              <img
                src="https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Producteur local récoltant des légumes bio pour GreenCart - circuit court anti-gaspi à Lyon"
                className="rounded-2xl shadow-lg w-full"
                width="600"
                height="400"
                loading="lazy"
              />
              
              {/* ✅ H3 LÉGENDE IMAGE */}
              <p className="text-center text-gray-500 mt-4 text-sm">
                Producteur partenaire GreenCart dans le Rhône
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ SECTION CONTENU ENRICHI (+300 MOTS) POUR SEO */}
      <section className="py-20 bg-pale-yellow/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ✅ H2 SECTION CONTENU */}
          <h2 className="text-3xl md:text-4xl font-bold text-dark-green mb-8 text-center">
            GreenCart : l'anti-gaspi au service du circuit court
          </h2>
          
          {/* ✅ CONTENU TEXTUEL ENRICHI (SEO) */}
          <div className="prose prose-lg max-w-none text-gray-700">
            <h3 className="text-2xl font-semibold text-dark-green mb-4">
              Notre combat contre le gaspillage alimentaire
            </h3>
            
            <p>
              Chaque année en France, <strong>10 millions de tonnes</strong> de nourriture sont gaspillées, 
              alors que des millions de personnes cherchent à consommer des produits locaux à prix abordables.
            </p>
            
            <p>
              GreenCart est né d'un constat simple : connecter directement <strong>les producteurs locaux du Rhône</strong> 
              avec les consommateurs soucieux de leur alimentation et de leur impact environnemental. 
              Contrairement aux circuits traditionnels où les produits parcourent des centaines de kilomètres, 
              notre modèle privilégie l'<strong>économie circulaire et la proximité</strong>.
            </p>
            
            <h3 className="text-2xl font-semibold text-dark-green mb-4 mt-8">
              Notre impact local à Lyon et dans le Rhône
            </h3>
            
            <p>
              Depuis notre lancement, GreenCart a permis de :
            </p>
            
            <ul className="list-disc pl-6 mb-6">
              <li>Sauver <strong>plus de 5 000 kg</strong> de produits locaux du gaspillage</li>
              <li>Accompagner <strong>25 producteurs</strong> locaux dans la valorisation de leurs invendus</li>
              <li>Offrir des économies moyennes de <strong>30%</strong> à plus de 1 500 familles lyonnaises</li>
              <li>Redistribuer <strong>80% du prix de vente</strong> directement aux producteurs</li>
            </ul>
            
            <h3 className="text-2xl font-semibold text-dark-green mb-4">
              Nos valeurs et engagements
            </h3>
            
            <p>
              Rejoindre GreenCart, c'est faire le choix d'une <strong>consommation responsable</strong> qui bénéficie à tous : 
              aux producteurs qui voient leurs invendus valorisés, aux consommateurs qui accèdent à des produits de qualité 
              à prix réduits, et à la planète qui bénéficie d'une réduction du gaspillage alimentaire et des émissions carbone.
            </p>
            
            <p>
              Notre plateforme garantit une <strong>transparence totale</strong> sur l'origine des produits, 
              les méthodes de production et l'impact environnemental de chaque panier.
            </p>
          </div>
        </div>
      </section>

      {/* ✅ SECTION NEWSLETTER/CTA FINAL */}
      <section className="py-20 bg-dark-green text-pale-yellow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* ✅ H2 SECTION CTA */}
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Rejoignez le mouvement anti-gaspillage
          </h2>
          
          {/* ✅ H3 SOUS-TITRE */}
          <h3 className="text-2xl font-semibold mb-4">
            Ensemble, luttons contre le gaspillage alimentaire
          </h3>
          
          <p className="text-pale-yellow/90 text-lg mb-8 max-w-2xl mx-auto">
            Inscrivez-vous dès aujourd'hui et recevez 10€ de réduction sur votre première commande. 
            Devenez acteur du changement dans votre région.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-orange-beige text-dark-brown px-8 py-4 rounded-full font-semibold text-lg hover:bg-orange-beige/90 transition-colors"
              aria-label="Créer mon compte client GreenCart"
            >
              Créer mon compte client
            </Link>
            <Link
              to="/register?type=producer"
              className="border-2 border-pale-yellow text-pale-yellow px-8 py-4 rounded-full font-semibold text-lg hover:bg-pale-yellow hover:text-dark-green transition-colors"
              aria-label="Devenir producteur partenaire GreenCart"
            >
              Devenir producteur partenaire
            </Link>
          </div>
          
          {/* ✅ H3 POUR TEMOIGNAGES */}
          <div className="mt-12">
            <h3 className="text-2xl font-semibold mb-6">Ce que disent nos clients</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <blockquote className="bg-dark-green/50 p-6 rounded-xl">
                <p className="italic">"Je fais 40% d'économies sur mes courses tout en achetant local. Parfait !"</p>
                <footer className="mt-4 font-semibold">- Marie, Lyon 7e</footer>
              </blockquote>
              <blockquote className="bg-dark-green/50 p-6 rounded-xl">
                <p className="italic">"Enfin une solution concrète contre le gaspillage alimentaire."</p>
                <footer className="mt-4 font-semibold">- Pierre, Villeurbanne</footer>
              </blockquote>
              <blockquote className="bg-dark-green/50 p-6 rounded-xl">
                <p className="italic">"Les produits sont ultra-frais et je connais les producteurs."</p>
                <footer className="mt-4 font-semibold">- Sophie, Caluire-et-Cuire</footer>
              </blockquote>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
