import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag, Leaf, Users, Truck } from "lucide-react";
import BundleCard from "../components/BundleCard";
import CookieBanner from "../components/CookieBanner";
import { http } from "../lib/api";

// Types (gardez vos types existants)
type City = { name: string; postal_code: string };
type CompanyAddress = { city: City };
type CompanyData = { name: string; address: CompanyAddress; certifications?: { code: string }[] };
type Product = { title: string; eco_score?: string; company_data: CompanyData; certifications?: { code: string }[] };
type ProductItem = { product: Product; best_before_date?: string | null };
type ProducerData = { public_display_name: string };
type Region = { name: string; code: string };
type Department = { name: string; code: string };

type Bundle = {
  id: number;
  title: string;
  items: ProductItem[];
  discounted_price: string;
  original_price: string;
  discounted_percentage?: number;
  created_at?: string;
  producer_data?: ProducerData;
  region_data?: Region;
  department_data?: Department;
  stock?: number;
  total_avoided_waste_kg?: string;
  total_avoided_co2_kg?: string;
};

export default function Home() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch API
  useEffect(() => {
    async function fetchBundles() {
      try {
        const response = await http.get("/bundles");
        setBundles(response.data);
      } catch (error) {
        console.error("Erreur API :", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBundles();
  }, []);

  // Trier par date (nouveaux d'abord)
  const sortedBundles = useMemo(() => {
    return [...bundles].sort((a, b) => {
      const dateA = new Date(a.created_at || "").getTime();
      const dateB = new Date(b.created_at || "").getTime();
      return dateB - dateA;
    });
  }, [bundles]);

  return (
    <main className="min-h-screen">
      {/* HERO SECTION - STRUCTURE HN CORRECTE */}
      <section className="bg-gradient-to-r from-green-800 to-green-700 text-white pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          
          {/* ✅ H1 CONSEILLÉ - Court et percutant */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            Produits locaux anti-gaspillage – GreenCart
          </h1>
          
          {/* ✅ SOUS-TITRE MARKETING H2 */}
          <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-green-100">
            Sauvons ensemble les produits locaux et luttons contre le gaspillage alimentaire
          </h2>
          
          {/* ✅ PARAGRAPHE D'INTRODUCTION */}
          <p className="text-lg md:text-xl mb-10 max-w-3xl leading-relaxed">
            Découvrez des produits locaux de qualité à prix réduits jusqu'à 40 %.
            Soutenez les producteurs locaux et participez à la lutte contre le gaspillage
            alimentaire grâce à GreenCart.
          </p>
          
          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/shop"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <ShoppingBag size={20} />
              Commander dès maintenant
              <ArrowRight size={20} />
            </Link>
            
            <Link
              to="/about"
              className="bg-transparent border-2 border-white hover:bg-white/10 text-white px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300"
            >
              Découvrir notre mission
              <ArrowRight size={20} />
            </Link>
          </div>
          
          {/* Badge -40% */}
          <div className="mt-12 inline-block bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-orange-300">-40%</span>
              <span className="text-green-100">en moyenne sur tous nos produits</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION VALEURS */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Pourquoi choisir GreenCart ?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Carte 1 */}
            <div className="bg-green-50 p-8 rounded-2xl border border-green-100">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <Leaf className="text-green-700" size={28} />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Lutte anti-gaspi</h3>
              <p className="text-gray-600">
                Nous sauvons des tonnes d'invendus chaque mois grâce à notre circuit court.
              </p>
            </div>
            
            {/* Carte 2 */}
            <div className="bg-green-50 p-8 rounded-2xl border border-green-100">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <Users className="text-green-700" size={28} />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Soutien aux producteurs</h3>
              <p className="text-gray-600">
                Nous reversons 80% du prix aux producteurs locaux de votre région.
              </p>
            </div>
            
            {/* Carte 3 */}
            <div className="bg-green-50 p-8 rounded-2xl border border-green-100">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <Truck className="text-green-700" size={28} />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Livraison écologique</h3>
              <p className="text-gray-600">
                Livraison en vélo-cargo électrique dans un rayon de 30km autour de Lyon.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION PANIERS - H2 */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-2 text-gray-800">Nos paniers anti-gaspi</h2>
          <p className="text-gray-600 mb-8">Des produits frais de producteurs locaux à -40% en moyenne</p>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : sortedBundles.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
              <p className="text-gray-500 text-lg">Aucun panier disponible pour le moment.</p>
              <p className="text-gray-400 mt-2">Revenez plus tard pour découvrir nos nouvelles offres !</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedBundles.slice(0, 6).map((bundle) => (
                <BundleCard key={bundle.id} bundle={bundle} />
              ))}
            </div>
          )}
          
          {sortedBundles.length > 6 && (
            <div className="text-center mt-10">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 font-semibold text-lg"
              >
                Voir tous les paniers ({sortedBundles.length})
                <ArrowRight size={18} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* SECTION PRODUCTEURS - H2 */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl p-8 md:p-12 border border-green-100">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">Producteurs locaux, rejoignez-nous</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-xl font-semibold mb-6 text-gray-700">
                  Valorisez vos invendus avec notre réseau
                </h3>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-full mt-1">
                      <span className="text-green-700 font-bold">✓</span>
                    </div>
                    <span className="text-gray-700">Nouveau débouché pour vos produits</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-full mt-1">
                      <span className="text-green-700 font-bold">✓</span>
                    </div>
                    <span className="text-gray-700">Réduction de votre gaspillage alimentaire</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-full mt-1">
                      <span className="text-green-700 font-bold">✓</span>
                    </div>
                    <span className="text-gray-700">Communauté de consommateurs engagés</span>
                  </li>
                </ul>
                
                <Link
                  to="/producteurs/inscription"
                  className="inline-flex items-center gap-3 bg-green-700 hover:bg-green-800 text-white px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Devenir producteur partenaire
                  <ArrowRight size={20} />
                </Link>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-green-100">
                <h3 className="font-bold text-lg mb-4 text-gray-800">Témoignage d'un producteur</h3>
                <p className="text-gray-600 italic mb-4">
                  "Grâce à GreenCart, je valorise mes invendus et je touche une nouvelle clientèle engagée. 
                  C'est un vrai plus pour mon exploitation !"
                </p>
                <p className="font-semibold text-gray-800">— Pierre, maraîcher à Villeurbanne</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION FONCTIONNEMENT - H2 */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-10 text-center text-gray-800">Comment ça marche ?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Étape 1 */}
            <div className="text-center">
              <div className="bg-green-100 text-green-800 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                1
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-800">Sélection</h3>
              <p className="text-gray-600 text-sm">Nos producteurs sélectionnent leurs invendus</p>
            </div>
            
            {/* Étape 2 */}
            <div className="text-center">
              <div className="bg-green-100 text-green-800 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                2
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-800">Mise en panier</h3>
              <p className="text-gray-600 text-sm">Nous créons des paniers variés à -40%</p>
            </div>
            
            {/* Étape 3 */}
            <div className="text-center">
              <div className="bg-green-100 text-green-800 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                3
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-800">Commande</h3>
              <p className="text-gray-600 text-sm">Vous commandez en ligne en 2 minutes</p>
            </div>
            
            {/* Étape 4 */}
            <div className="text-center">
              <div className="bg-green-100 text-green-800 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                4
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-800">Livraison</h3>
              <p className="text-gray-600 text-sm">Livraison écologique à domicile ou point relais</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bannière cookies (fixée en bas) */}
      <CookieBanner />
    </main>
  );
}
